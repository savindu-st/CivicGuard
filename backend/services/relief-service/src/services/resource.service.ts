import axios from 'axios';
import {
  getSupabaseClient,
  createLogger,
  ReliefResource,
  ResourceAllocateDTO,
  MultiResourceAllocateDTO,
} from '@civicguard/shared';
import { config } from '../config';

const logger = createLogger('ResourceService');

export class ResourceService {
  private supabase = getSupabaseClient();

  /**
   * Lists inventory supplies across shelters.
   */
  async getResources(shelterId?: string): Promise<ReliefResource[]> {
    let query = this.supabase
      .from('relief_resources')
      .select('*, shelters(name)')
      .order('created_at', { ascending: false });

    if (shelterId) query = query.eq('shelter_id', shelterId);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((r: any) => ({
      ...r,
      shelter_name: r.shelters?.name,
    }));
  }

  /**
   * Adds supplies to a relief shelter.
   */
  async addResource(dto: ResourceAllocateDTO, userId?: string): Promise<ReliefResource> {
    const { data, error } = await this.supabase
      .from('relief_resources')
      .insert({
        shelter_id: dto.shelter_id,
        help_request_id: dto.help_request_id || null,
        resource_type: dto.resource_type,
        resource_name: dto.resource_name,
        quantity: dto.quantity,
        unit: dto.unit || 'PACK',
        status: 'AVAILABLE',
        assigned_by: userId || null,
      })
      .select()
      .single();

    if (error || !data) throw error;

    try {
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['relief'],
          event: 'relief:shelter_updated',
          payload: { shelter_id: dto.shelter_id, action: 'STOCK_ADDED' },
        },
        { timeout: 3000 }
      );
    } catch {}

    return data;
  }

  /**
   * Allocates single relief resource to an emergency SOS request.
   */
  async allocateToRequest(resourceId: string, helpRequestId: string): Promise<ReliefResource> {
    const { data, error } = await this.supabase
      .from('relief_resources')
      .update({
        help_request_id: helpRequestId,
        status: 'ASSIGNED',
      })
      .eq('id', resourceId)
      .select()
      .single();

    if (error || !data) throw error;

    // Update help request status if pending
    try {
      await this.supabase
        .from('help_requests')
        .update({ status: 'ASSIGNED' })
        .eq('id', helpRequestId)
        .eq('status', 'PENDING');

      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['relief', 'officers'],
          event: 'relief:resource_allocated',
          payload: { help_request_id: helpRequestId, resource: data },
        },
        { timeout: 3000 }
      );
    } catch {}

    return data;
  }

  /**
   * Multi-resource parcel allocation (ADR-020):
   * Allocates specified quantities across multiple warehouse items in a single transaction,
   * decrements available shelter warehouse stock, creates allocated child records,
   * advances help request status to ASSIGNED, and broadcasts real-time socket events.
   */
  async allocateMultiResources(dto: MultiResourceAllocateDTO, userId?: string): Promise<ReliefResource[]> {
    const { help_request_id, allocations } = dto;
    if (!allocations || allocations.length === 0) {
      throw new Error('At least one resource allocation is required');
    }

    const createdAllocations: ReliefResource[] = [];

    for (const alloc of allocations) {
      if (alloc.quantity <= 0) continue;

      // 1. Fetch current resource
      const { data: sourceResource, error: fetchErr } = await this.supabase
        .from('relief_resources')
        .select('*')
        .eq('id', alloc.resource_id)
        .single();

      if (fetchErr || !sourceResource) {
        throw new Error(`Resource ${alloc.resource_id} not found`);
      }

      if (sourceResource.quantity < alloc.quantity) {
        throw new Error(
          `Insufficient stock for ${sourceResource.resource_name}. Requested: ${alloc.quantity}, Available: ${sourceResource.quantity}`
        );
      }

      const remainingQty = sourceResource.quantity - alloc.quantity;

      // 2. Decrement source warehouse inventory
      await this.supabase
        .from('relief_resources')
        .update({
          quantity: remainingQty,
          status: remainingQty === 0 ? 'DEPLETED' : 'AVAILABLE',
        })
        .eq('id', alloc.resource_id);

      // 3. Insert allocated parcel record linked to the help request
      const { data: allocatedRecord, error: insertErr } = await this.supabase
        .from('relief_resources')
        .insert({
          shelter_id: sourceResource.shelter_id,
          help_request_id: help_request_id,
          resource_type: sourceResource.resource_type,
          resource_name: sourceResource.resource_name,
          quantity: alloc.quantity,
          unit: sourceResource.unit,
          status: 'ASSIGNED',
          assigned_by: userId || null,
        })
        .select()
        .single();

      if (insertErr || !allocatedRecord) {
        logger.error(`Error recording allocated resource: ${insertErr?.message}`);
      } else {
        createdAllocations.push(allocatedRecord);
      }
    }

    // 4. Advance help request status to ASSIGNED
    try {
      await this.supabase
        .from('help_requests')
        .update({ status: 'ASSIGNED' })
        .eq('id', help_request_id);

      // 5. Broadcast real-time notifications
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['relief', 'officers'],
          event: 'relief:resource_allocated',
          payload: {
            help_request_id,
            allocated_count: createdAllocations.length,
            items: createdAllocations,
          },
        },
        { timeout: 3000 }
      );

      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['relief', 'officers'],
          event: 'relief:updated',
          payload: { request_id: help_request_id, status: 'ASSIGNED' },
        },
        { timeout: 3000 }
      );
    } catch (e: any) {
      logger.warn(`Could not broadcast parcel allocation: ${e.message}`);
    }

    return createdAllocations;
  }
}
