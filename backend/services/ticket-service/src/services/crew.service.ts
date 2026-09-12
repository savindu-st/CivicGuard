import axios from 'axios';
import {
  getSupabaseClient,
  FieldCrew,
  CrewAvailability,
  CrewLocationBroadcastPayload,
  CrewSosPayload,
  createLogger,
} from '@civicguard/shared';
import { config } from '../config';

const logger = createLogger('CrewService');

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
   * Look up crew profile by authenticated user UUID.
   */
  async getCrewByUserId(userId: string): Promise<FieldCrew | null> {
    const { data, error } = await this.supabase
      .from('field_crews')
      .select('*, users(name, phone)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      logger.error(`Error finding crew for user ${userId}: ${error.message}`);
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      user_name: data.users?.name,
      user_phone: data.users?.phone,
    };
  }

  /**
   * Updates field crew's live GPS coordinates (mobile tracking)
   * and fans out real-time position to officer command desk.
   */
  async updateCrewLocation(crewId: string, latitude: number, longitude: number): Promise<FieldCrew> {
    const { data, error } = await this.supabase
      .from('field_crews')
      .update({ latitude, longitude })
      .eq('id', crewId)
      .select('*, users(name, phone)')
      .single();

    if (error) throw error;

    const crewPayload: CrewLocationBroadcastPayload = {
      crew_id: data.id,
      crew_name: data.crew_name,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      availability: data.availability,
      timestamp: new Date().toISOString(),
    };

    // Broadcast location update to officers room and crew's own room
    try {
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['officers', `crew:${crewId}`],
          event: 'crew:location_updated',
          payload: crewPayload,
        },
        { timeout: 3000 }
      );
    } catch (e: any) {
      logger.warn(`Could not broadcast crew:location_updated: ${e.message}`);
    }

    return {
      ...data,
      user_name: data.users?.name,
      user_phone: data.users?.phone,
    };
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

    try {
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['officers', 'crews', `crew:${crewId}`],
          event: 'crew:availability_changed',
          payload: { crew_id: crewId, availability },
        },
        { timeout: 3000 }
      );
    } catch (e: any) {
      logger.warn(`Could not broadcast crew:availability_changed: ${e.message}`);
    }

    return data;
  }

  /**
   * Triggers an emergency SOS panic beacon from field crew in danger.
   */
  async triggerCrewSos(
    crewId: string,
    latitude: number,
    longitude: number,
    message: string
  ): Promise<CrewSosPayload> {
    // Update crew's latest coordinates in DB
    const { data: crew } = await this.supabase
      .from('field_crews')
      .update({ latitude, longitude })
      .eq('id', crewId)
      .select('id, crew_name')
      .single();

    const sosPayload: CrewSosPayload = {
      crew_id: crewId,
      crew_name: crew?.crew_name || 'Field Rescue Crew',
      latitude,
      longitude,
      message: message || 'EMERGENCY: Field crew requested immediate rescue/backup assistance!',
      timestamp: new Date().toISOString(),
    };

    logger.warn(`🚨 CREW SOS TRIGGERED by ${crewId}: ${sosPayload.message}`);

    // High-priority broadcast to council officers and public emergency channel
    try {
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['officers', 'public'],
          event: 'crew:sos',
          payload: sosPayload,
        },
        { timeout: 3000 }
      );
    } catch (e: any) {
      logger.error(`Failed to broadcast crew:sos: ${e.message}`);
    }

    return sosPayload;
  }

  /**
   * Retrieves active tickets assigned to a specific crew.
   */
  async getCrewTasks(crewId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('council_tickets')
      .select('*, incidents(*, wards(name), roads(name, is_closed), incident_evidence(*))')
      .eq('assigned_crew_id', crewId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

