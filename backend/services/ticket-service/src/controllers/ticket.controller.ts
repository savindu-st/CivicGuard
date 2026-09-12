import { Request, Response } from 'express';
import { getSupabaseClient, sendSuccess, sendError, createLogger } from '@civicguard/shared';
import { TicketService } from '../services/ticket.service';
import { CrewService } from '../services/crew.service';
import { config } from '../config';

const logger = createLogger('TicketController');

export class TicketController {
  private ticketService = new TicketService();
  private crewService = new CrewService();
  private supabase = getSupabaseClient();

  createTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticket = await this.ticketService.createTicket(req.body);
      sendSuccess(res, ticket, 'Ticket created successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  getTickets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, priority, crew_id, officer_id, incident_id, limit, offset } = req.query;
      const result = await this.ticketService.getTickets({
        status: status as any,
        priority: priority as any,
        crew_id: crew_id as any,
        officer_id: officer_id as any,
        incident_id: incident_id as any,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  getTicketById = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticket = await this.ticketService.getTicketById(req.params.id);
      sendSuccess(res, ticket);
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  assignCrew = async (req: Request, res: Response): Promise<void> => {
    try {
      const { crew_id, emergency_override, justification } = req.body;
      if (!crew_id) {
        sendError(res, 'crew_id is required', 400);
        return;
      }
      const ticket = await this.ticketService.assignTicketToCrew(req.params.id, crew_id, {
        emergency_override: Boolean(emergency_override),
        justification,
      });
      sendSuccess(res, ticket, 'Ticket assigned to field crew successfully');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.body;
      if (!status) {
        sendError(res, 'status is required', 400);
        return;
      }
      const ticket = await this.ticketService.updateTicketStatus(req.params.id, status);
      sendSuccess(res, ticket, `Ticket status updated to ${status}`);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  returnTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reason, crew_id } = req.body;
      if (!reason) {
        sendError(res, 'Mandatory reason notes are required to return ticket', 400);
        return;
      }

      // Resolve crew ID from body or from logged in user
      let targetCrewId = crew_id;
      if (!targetCrewId) {
        const userId = (req as any).user?.userId;
        if (userId) {
          const crew = await this.crewService.getCrewByUserId(userId);
          targetCrewId = crew?.id;
        }
      }

      if (!targetCrewId) {
        sendError(res, 'Could not determine crew identity for ticket return', 400);
        return;
      }

      const ticket = await this.ticketService.returnTicket(req.params.id, targetCrewId, reason);
      sendSuccess(res, ticket, 'Ticket returned to council dispatch queue');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  /**
   * Photo-Verified Resolution Closure.
   */
  completeTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const { notes, photo_url } = req.body;
      const file = req.file;

      let finalPhotoUrl = photo_url || '';

      // Upload completion proof photo if uploaded as multipart file
      if (file) {
        const fileExt = file.originalname.split('.').pop() || 'jpg';
        const fileName = `res_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadErr } = await this.supabase.storage
          .from(config.storageResolutionBucket)
          .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = this.supabase.storage
            .from(config.storageResolutionBucket)
            .getPublicUrl(fileName);
          finalPhotoUrl = publicUrlData.publicUrl;
        }
      }

      if (!finalPhotoUrl) {
        sendError(res, 'Resolution photo is mandatory to close ticket and reopen road (ADR-005)', 400);
        return;
      }

      const userId = (req as any).user?.userId;
      const completedTicket = await this.ticketService.completeTicketWithPhoto(
        req.params.id,
        finalPhotoUrl,
        notes,
        userId
      );

      sendSuccess(res, completedTicket, 'Ticket resolved and road reopened on public map');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  // --- Field Crew Endpoints ---
  getMyCrewProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const crew = await this.crewService.getCrewByUserId(userId);
      if (!crew) {
        sendError(res, 'No field crew profile associated with this user account', 404);
        return;
      }

      const tasks = await this.crewService.getCrewTasks(crew.id);
      sendSuccess(res, { crew, tasks });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  getAllCrews = async (req: Request, res: Response): Promise<void> => {
    try {
      const crews = await this.crewService.getAllCrews();
      sendSuccess(res, { crews });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  setAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const { availability } = req.body;
      if (!availability || !['AVAILABLE', 'BUSY', 'OFF_DUTY'].includes(availability)) {
        sendError(res, 'Valid availability (AVAILABLE, BUSY, OFF_DUTY) is required', 400);
        return;
      }
      const crew = await this.crewService.setCrewAvailability(req.params.id, availability);
      sendSuccess(res, crew, `Crew availability updated to ${availability}`);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  updateCrewLocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { latitude, longitude } = req.body;
      if (latitude === undefined || longitude === undefined) {
        sendError(res, 'latitude and longitude are required', 400);
        return;
      }
      const crew = await this.crewService.updateCrewLocation(req.params.id, Number(latitude), Number(longitude));
      sendSuccess(res, crew, 'Crew location updated and broadcasted');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  triggerSos = async (req: Request, res: Response): Promise<void> => {
    try {
      const { latitude, longitude, message } = req.body;
      if (latitude === undefined || longitude === undefined) {
        sendError(res, 'latitude and longitude are required for SOS beacon', 400);
        return;
      }
      const sos = await this.crewService.triggerCrewSos(
        req.params.id,
        Number(latitude),
        Number(longitude),
        message || 'EMERGENCY: Field crew requested backup'
      );
      sendSuccess(res, sos, '🚨 SOS emergency beacon broadcasted to command officers', 201);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  getCrewTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      const tasks = await this.crewService.getCrewTasks(req.params.id);
      sendSuccess(res, { tasks });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };
}
