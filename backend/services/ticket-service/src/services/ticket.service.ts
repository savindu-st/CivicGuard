import axios from 'axios';
import {
  getSupabaseClient,
  createLogger,
  CouncilTicket,
  TicketCreateDTO,
  TicketPriority,
  TicketStatus,
  calculateHaversineDistance,
} from '@civicguard/shared';
import { CrewService } from './crew.service';
import { config } from '../config';

const logger = createLogger('TicketService');

export class TicketService {
  private supabase = getSupabaseClient();
  private crewService = new CrewService();

  /**
   * Creates a municipal council dispatch ticket for a verified incident.
   */
  async createTicket(dto: TicketCreateDTO): Promise<CouncilTicket> {
    const { data, error } = await this.supabase
      .from('council_tickets')
      .insert({
        incident_id: dto.incident_id,
        priority: dto.priority || 'MEDIUM',
        status: 'OPEN',
        description: dto.description || 'Emergency field response ticket',
        assigned_officer_id: dto.assigned_officer_id || null,
        assigned_crew_id: dto.assigned_crew_id || null,
      })
      .select('*, incidents(*)')
      .single();

    if (error) {
      logger.error(`Failed to create ticket: ${error.message}`);
      throw error;
    }

    // Broadcast new ticket to council officers
    try {
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['officers'],
          event: 'ticket:new',
          payload: {
            ticket_id: data.id,
            incident_id: data.incident_id,
            priority: data.priority,
            description: data.description,
          },
        },
        { timeout: 3000 }
      );
    } catch {}

    return data;
  }

  /**
   * Query tickets with optional filters.
   */
  async getTickets(filters: {
    status?: TicketStatus;
    priority?: TicketPriority;
    crew_id?: string;
    officer_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tickets: CouncilTicket[]; total: number }> {
    let query = this.supabase
      .from('council_tickets')
      .select('*, incidents(*, wards(name), roads(name, is_closed)), field_crews(crew_name, availability)', {
        count: 'exact',
      })
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.crew_id) query = query.eq('assigned_crew_id', filters.crew_id);
    if (filters.officer_id) query = query.eq('assigned_officer_id', filters.officer_id);

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return { tickets: data || [], total: count || 0 };
  }

  /**
   * Get single ticket by ID.
   */
  async getTicketById(ticketId: string): Promise<CouncilTicket> {
    const { data, error } = await this.supabase
      .from('council_tickets')
      .select('*, incidents(*, wards(name), roads(name, is_closed), incident_evidence(*)), field_crews(*)')
      .eq('id', ticketId)
      .single();

    if (error || !data) throw new Error('Ticket not found');
    return data;
  }

  /**
   * Assigns ticket to field crew with soft 2 km proximity rule.
   */
  async assignTicketToCrew(
    ticketId: string,
    crewId: string,
    options?: { emergency_override?: boolean; justification?: string }
  ): Promise<CouncilTicket> {
    // 1. Proximity Check for Multi-Ticket Co-Assignment (Soft 2 km Rule)
    const existingTasks = await this.crewService.getCrewTasks(crewId);
    const activeTasks = existingTasks.filter(
      (t) => ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(t.status) && t.id !== ticketId
    );

    if (activeTasks.length > 0) {
      const targetTicket = await this.getTicketById(ticketId);
      const targetLat = targetTicket.incident?.latitude;
      const targetLon = targetTicket.incident?.longitude;

      if (targetLat && targetLon) {
        for (const task of activeTasks) {
          const activeLat = task.incidents?.latitude;
          const activeLon = task.incidents?.longitude;
          if (activeLat && activeLon) {
            const distanceKm = calculateHaversineDistance(
              Number(activeLat),
              Number(activeLon),
              Number(targetLat),
              Number(targetLon)
            );

            if (distanceKm > 2.0 && !options?.emergency_override) {
              throw new Error(
                `Proximity warning: Target incident is ${distanceKm.toFixed(
                  1
                )} km away from crew's active assignment (exceeds 2.0 km soft limit). Emergency override required to assign.`
              );
            }
          }
        }
      }
    }

    // 2. Update ticket status
    const { data: ticket, error: ticketErr } = await this.supabase
      .from('council_tickets')
      .update({
        assigned_crew_id: crewId,
        status: 'ASSIGNED',
        description: options?.justification
          ? `[OVERRIDE: ${options.justification}]`
          : undefined,
      })
      .eq('id', ticketId)
      .select('*, incidents(*)')
      .single();

    if (ticketErr || !ticket) throw ticketErr || new Error('Ticket update failed');

    // 3. Mark crew as BUSY
    await this.crewService.setCrewAvailability(crewId, 'BUSY');

    // 4. Trigger push notification to crew channel & officer room
    try {
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: [`crew:${crewId}`, 'crews', 'officers'],
          event: 'ticket:assigned',
          payload: {
            ticket_id: ticket.id,
            incident_id: ticket.incident_id,
            priority: ticket.priority,
            description: ticket.description,
            crew_id: crewId,
            override: options?.emergency_override || false,
          },
        },
        { timeout: 3000 }
      );
    } catch (e: any) {
      logger.warn(`Could not emit ticket:assigned: ${e.message}`);
    }

    return ticket;
  }

  /**
   * Field crew returns a ticket they cannot complete (e.g. equipment failure, impassable road).
   */
  async returnTicket(ticketId: string, crewId: string, reason: string): Promise<CouncilTicket> {
    const ticket = await this.getTicketById(ticketId);
    if (ticket.assigned_crew_id !== crewId) {
      throw new Error('This ticket is not assigned to your crew');
    }

    const updatedDesc = ticket.description
      ? `${ticket.description} | [RETURNED BY CREW]: ${reason}`
      : `[RETURNED BY CREW]: ${reason}`;

    const { data, error } = await this.supabase
      .from('council_tickets')
      .update({
        assigned_crew_id: null,
        status: 'OPEN',
        description: updatedDesc,
      })
      .eq('id', ticketId)
      .select('*, incidents(*)')
      .single();

    if (error || !data) throw error || new Error('Ticket return failed');

    // Check remaining tasks before freeing crew availability
    const remainingTasks = await this.crewService.getCrewTasks(crewId);
    const stillActive = remainingTasks.some(
      (t) => t.id !== ticketId && ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(t.status)
    );
    if (!stillActive) {
      await this.crewService.setCrewAvailability(crewId, 'AVAILABLE');
    }

    // Broadcast alert to officers command desk
    try {
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['officers'],
          event: 'ticket:returned',
          payload: {
            ticket_id: ticketId,
            crew_id: crewId,
            reason,
            priority: ticket.priority,
          },
        },
        { timeout: 3000 }
      );
    } catch (e: any) {
      logger.warn(`Could not broadcast ticket:returned: ${e.message}`);
    }

    return data;
  }

  /**
   * Update lifecycle status (e.g. ACCEPTED, IN_PROGRESS).
   */
  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<CouncilTicket> {
    const { data, error } = await this.supabase
      .from('council_tickets')
      .update({ status })
      .eq('id', ticketId)
      .select()
      .single();

    if (error || !data) throw error || new Error('Status update failed');


    try {
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['officers', 'crews'],
          event: 'ticket:status_changed',
          payload: { ticket_id: ticketId, status },
        },
        { timeout: 3000 }
      );
    } catch {}

    return data;
  }

  /**
   * Photo-Verified Resolution Closed Loop (ADR-005 & Acceptance Criterion 5).
   */
  async completeTicketWithPhoto(
    ticketId: string,
    photoUrl: string,
    notes?: string,
    userId?: string
  ): Promise<CouncilTicket> {
    if (!photoUrl || photoUrl.length < 5) {
      throw new Error('Mandatory resolution proof photo is required to close ticket (ADR-005)');
    }

    // 1. Fetch ticket to get incident_id and assigned_crew_id
    const ticket = await this.getTicketById(ticketId);

    // 2. Save completion photo to incident_evidence
    await this.supabase.from('incident_evidence').insert({
      incident_id: ticket.incident_id,
      uploaded_by: userId || null,
      file_url: photoUrl,
      evidence_type: 'COMPLETION_PHOTO',
    });

    // 3. Mark ticket COMPLETED
    const { data: updatedTicket, error: updateErr } = await this.supabase
      .from('council_tickets')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        description: notes ? `${ticket.description || ''} | Resolution Notes: ${notes}` : ticket.description,
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 4. Free field crew availability back to AVAILABLE only if no other active tasks remain
    if (ticket.assigned_crew_id) {
      const remainingTasks = await this.crewService.getCrewTasks(ticket.assigned_crew_id);
      const stillActive = remainingTasks.some(
        (t) => t.id !== ticketId && ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(t.status)
      );
      if (!stillActive) {
        await this.crewService.setCrewAvailability(ticket.assigned_crew_id, 'AVAILABLE');
      }
    }

    // 5. Call incident-service RPC to set incident status to RESOLVED (which automatically reopens road)
    try {
      await axios.patch(
        `${config.incidentServiceUrl}/api/incidents/${ticket.incident_id}/status`,
        { status: 'RESOLVED' },
        { timeout: 3000 }
      );
      logger.info(`Incident ${ticket.incident_id} marked RESOLVED via RPC. Road reopened.`);
    } catch (rpcErr: any) {
      logger.error(`Failed RPC to mark incident resolved: ${rpcErr.message}`);
      // Direct fallback to DB
      await this.supabase.from('incidents').update({ status: 'RESOLVED' }).eq('id', ticket.incident_id);
      const inc = ticket.incident as any;
      if (inc?.road_id) {
        await this.supabase.from('roads').update({ is_closed: false }).eq('id', inc.road_id);
      }
    }

    // 6. Broadcast hazard:resolved event to public map and officers
    try {
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['public', 'officers'],
          event: 'hazard:resolved',
          payload: {
            incident_id: ticket.incident_id,
            ticket_id: ticketId,
            status: 'RESOLVED',
            road_reopened: true,
            resolution_photo: photoUrl,
          },
        },
        { timeout: 3000 }
      );
    } catch {}

    return updatedTicket;
  }
}
