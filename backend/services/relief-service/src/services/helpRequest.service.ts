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
   * Queries help requests with filtering and P1-P4 urgency prioritization.
   */
  async getHelpRequests(filters: {
    status?: HelpStatus;
    urgency?: UrgencyLevel;
    help_type?: string;
    sortByUrgency?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ requests: HelpRequest[]; total: number }> {
    let query = this.supabase
      .from('help_requests')
      .select('*, users(name, phone)', { count: 'exact' });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.urgency) query = query.eq('urgency', filters.urgency);
    if (filters.help_type) query = query.eq('help_type', filters.help_type);

    query = query.order('created_at', { ascending: false });

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    let requests: HelpRequest[] = (data || []).map((r: any) => ({
      ...r,
      user_name: r.users?.name,
      user_phone: r.users?.phone,
    }));

    // Prioritize by operational urgency tier (P1 > P2 > P3 > P4), then FIFO timestamp
    if (filters.sortByUrgency !== false) {
      const urgencyRank: Record<string, number> = {
        CRITICAL: 1,
        P1: 1,
        HIGH: 2,
        P2: 2,
        MEDIUM: 3,
        P3: 3,
        LOW: 4,
        P4: 4,
      };

      requests.sort((a, b) => {
        const rankA = urgencyRank[a.urgency?.toUpperCase()] || 5;
        const rankB = urgencyRank[b.urgency?.toUpperCase()] || 5;
        if (rankA !== rankB) return rankA - rankB;
        // Secondary: oldest first for pending requests, newest first for others
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return a.status === 'PENDING' ? timeA - timeB : timeB - timeA;
      });
    }

    return { requests, total: count || 0 };
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
    return {
      ...data,
      user_name: data.users?.name,
      user_phone: data.users?.phone,
    };
  }

  /**
   * Updates help request status.
   */
  async updateStatus(id: string, status: HelpStatus, notes?: string): Promise<HelpRequest> {
    const updatePayload: any = { status, updated_at: new Date().toISOString() };
    if (notes) {
      updatePayload.description = notes;
    }

    const { data, error } = await this.supabase
      .from('help_requests')
      .update(updatePayload)
      .eq('id', id)
      .select('*, users(name, phone)')
      .single();

    if (error || !data) throw error;

    try {
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['relief', 'officers'],
          event: 'relief:updated',
          payload: { request_id: id, status, notes },
        },
        { timeout: 3000 }
      );
    } catch {}

    return {
      ...data,
      user_name: data.users?.name,
      user_phone: data.users?.phone,
    };
  }

  /**
   * Simulates an emergency citizen SOS distress call (ADR-020) for live testing.
   */
  async simulateSosDistress(dto?: any): Promise<HelpRequest> {
    const SCENARIOS = [
      {
        help_type: 'EVACUATION' as const,
        urgency: 'CRITICAL' as const,
        people_count: 4,
        description: '🚨 FLASH FLOOD EMERGENCY: Family trapped on 2nd floor roof near Havelock canal bridge. Water level rising fast, 1 infant and 1 elderly grandmother onboard.',
        latitude: 6.8792,
        longitude: 79.8665,
      },
      {
        help_type: 'MEDICAL' as const,
        urgency: 'CRITICAL' as const,
        people_count: 2,
        description: '🚨 URGENT MEDICAL EVAC: Ground floor flooded with 3.5ft water on Bauddhaloka corridor. Diabetic patient requires urgent insulin refrigeration and oxygen support.',
        latitude: 6.9025,
        longitude: 79.8715,
      },
      {
        help_type: 'SHELTER' as const,
        urgency: 'HIGH' as const,
        people_count: 5,
        description: '⚠️ Stranded household with 3 young children. Roof leak and retaining wall cracked near Kelani bridge flyover. Urgent dry shelter requested.',
        latitude: 6.9475,
        longitude: 79.8765,
      },
      {
        help_type: 'FOOD' as const,
        urgency: 'MEDIUM' as const,
        people_count: 3,
        description: '📦 Displaced shopkeepers cut off by Getambe road flooding. Safe on higher ground but out of clean drinking water and food rations for 18 hours.',
        latitude: 7.2725,
        longitude: 80.6025,
      },
    ];

    const randomPick = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    const chosen = {
      help_type: dto?.help_type || randomPick.help_type,
      urgency: dto?.urgency || randomPick.urgency,
      people_count: dto?.people_count || randomPick.people_count,
      description: dto?.description || randomPick.description,
      latitude: dto?.latitude || randomPick.latitude,
      longitude: dto?.longitude || randomPick.longitude,
      user_id: '55555555-5555-5555-5555-555555555555', // Demo Citizen Nimal Silva
    };

    return this.createHelpRequest(chosen as any);
  }
}
