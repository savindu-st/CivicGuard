import { getSupabaseClient, FieldCrew, CrewAvailability } from '@civicguard/shared';

export class CrewService {
  private supabase = getSupabaseClient();

  /**
   * Returns all field crews with user profile info.
   */
  async getAllCrews(): Promise<FieldCrew[]> {
    const { data, error } = await this.supabase
      .from('field_crews')
      .select('*, users(name, phone)');

    if (error) throw error;

    return (data || []).map((c: any) => ({
      ...c,
      user_name: c.users?.name,
      user_phone: c.users?.phone,
    }));
  }

  /**
   * Updates field crew's live GPS coordinates (mobile tracking).
   */
  async updateCrewLocation(crewId: string, latitude: number, longitude: number): Promise<FieldCrew> {
    const { data, error } = await this.supabase
      .from('field_crews')
      .update({ latitude, longitude })
      .eq('id', crewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Updates field crew's availability status.
   */
  async setCrewAvailability(crewId: string, availability: CrewAvailability): Promise<FieldCrew> {
    const { data, error } = await this.supabase
      .from('field_crews')
      .update({ availability })
      .eq('id', crewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Retrieves active tickets assigned to a specific crew.
   */
  async getCrewTasks(crewId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('council_tickets')
      .select('*, incidents(*, wards(name), roads(name, is_closed))')
      .eq('assigned_crew_id', crewId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
