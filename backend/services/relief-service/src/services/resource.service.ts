import { getSupabaseClient, ReliefResource, ResourceAllocateDTO } from '@civicguard/shared';

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
    return data;
  }

  /**
   * Allocates relief resource to an emergency SOS request.
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
    return data;
  }
}
