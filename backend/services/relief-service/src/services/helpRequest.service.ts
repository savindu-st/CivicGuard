import axios from 'axios';
import {
  getSupabaseClient,
  createLogger,
  HelpRequest,
  HelpRequestCreateDTO,
  HelpStatus,
  UrgencyLevel,
} from '@civicguard/shared';
import { config } from '../config';

const logger = createLogger('HelpRequestService');

export class HelpRequestService {
  private supabase = getSupabaseClient();

  /**
   * Ingests citizen emergency SOS request and alerts relief desk.
   */
  async createHelpRequest(dto: HelpRequestCreateDTO): Promise<HelpRequest> {
    const { data, error } = await this.supabase
      .from('help_requests')
      .insert({
        user_id: dto.user_id || null,
        help_type: dto.help_type,
        description: dto.description || null,
        people_count: dto.people_count || 1,
        latitude: dto.latitude,
        longitude: dto.longitude,
        urgency: dto.urgency || 'HIGH',
        status: 'PENDING',
      })
      .select('*, users(name, phone)')
      .single();

    if (error || !data) {
      logger.error(`Error creating help request: ${error?.message}`);
      throw error;
    }

    // Broadcast urgent SOS alert to relief coordinators
    try {
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['relief', 'officers'],
          event: 'relief:sos_new',
          payload: {
            request_id: data.id,
            help_type: data.help_type,
            people_count: data.people_count,
            urgency: data.urgency,
            description: data.description,
            latitude: data.latitude,
            longitude: data.longitude,
          },
        },
        { timeout: 3000 }
      );
    } catch (e: any) {
      logger.warn(`Could not broadcast relief SOS event: ${e.message}`);
    }

    return data;
  }

  /**
   * Queries help requests with filtering.
   */
  async getHelpRequests(filters: {
    status?: HelpStatus;
    urgency?: UrgencyLevel;
    help_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ requests: HelpRequest[]; total: number }> {
    let query = this.supabase
      .from('help_requests')
      .select('*, users(name, phone)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.urgency) query = query.eq('urgency', filters.urgency);
    if (filters.help_type) query = query.eq('help_type', filters.help_type);

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return { requests: data || [], total: count || 0 };
  }

  /**
   * Get single help request by ID.
   */
  async getHelpRequestById(id: string): Promise<HelpRequest> {
    const { data, error } = await this.supabase
      .from('help_requests')
      .select('*, users(name, phone)')
      .eq('id', id)
      .single();

    if (error || !data) throw new Error('Help request not found');
    return data;
  }

  /**
   * Updates help request status.
   */
  async updateStatus(id: string, status: HelpStatus): Promise<HelpRequest> {
    const { data, error } = await this.supabase
      .from('help_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw error;

    try {
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['relief'],
          event: 'relief:updated',
          payload: { request_id: id, status },
        },
        { timeout: 3000 }
      );
    } catch {}

    return data;
  }
}
