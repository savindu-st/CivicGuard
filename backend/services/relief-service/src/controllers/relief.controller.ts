import { Request, Response } from 'express';
import { sendSuccess, sendError } from '@civicguard/shared';
import { HelpRequestService } from '../services/helpRequest.service';
import { ShelterService } from '../services/shelter.service';
import { ResourceService } from '../services/resource.service';

export class ReliefController {
  private helpService = new HelpRequestService();
  private shelterService = new ShelterService();
  private resourceService = new ResourceService();

  // --- SOS Help Requests ---
  createHelpRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { help_type, latitude, longitude, people_count, description, urgency } = req.body;
      if (!help_type || latitude === undefined || longitude === undefined) {
        sendError(res, 'help_type, latitude, and longitude are required', 400);
        return;
      }

      const request = await this.helpService.createHelpRequest({
        user_id: (req as any).user?.userId,
        help_type,
        latitude: Number(latitude),
        longitude: Number(longitude),
        people_count: people_count ? Number(people_count) : 1,
        description,
        urgency,
      });

      sendSuccess(res, request, 'SOS Help Request submitted. Relief dispatch alerted.', 201);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  getHelpRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, urgency, help_type, limit, offset } = req.query;
      const result = await this.helpService.getHelpRequests({
        status: status as any,
        urgency: urgency as any,
        help_type: help_type as any,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });
      sendSuccess(res, result);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  getHelpRequestById = async (req: Request, res: Response): Promise<void> => {
    try {
      const request = await this.helpService.getHelpRequestById(req.params.id);
      sendSuccess(res, request);
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  updateRequestStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.body;
      if (!status) {
        sendError(res, 'status is required', 400);
        return;
      }
      const request = await this.helpService.updateStatus(req.params.id, status);
      sendSuccess(res, request, `Help request status updated to ${status}`);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  // --- Shelters & Capacities ---
  getShelters = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ward_id } = req.query;
      const shelters = await this.shelterService.getShelters(ward_id as string);
      sendSuccess(res, { shelters });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  createShelter = async (req: Request, res: Response): Promise<void> => {
    try {
      const shelter = await this.shelterService.createShelter(req.body);
      sendSuccess(res, shelter, 'Shelter registered successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  updateOccupancy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { current_occupancy } = req.body;
      if (current_occupancy === undefined) {
        sendError(res, 'current_occupancy is required', 400);
        return;
      }
      const shelter = await this.shelterService.updateOccupancy(req.params.id, Number(current_occupancy));
      sendSuccess(res, shelter, 'Shelter occupancy updated');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  /**
   * Automated Nearest Shelter Matching (ADR-008 & ADR-011).
   */
  matchShelter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { latitude, longitude, people_count = 1, auto_reserve = false } = req.body;
      if (latitude === undefined || longitude === undefined) {
        sendError(res, 'latitude and longitude are required', 400);
        return;
      }

      const match = await this.shelterService.matchShelter(
        {
          latitude: Number(latitude),
          longitude: Number(longitude),
          people_count: Number(people_count),
        },
        Boolean(auto_reserve)
      );

      if (!match) {
        sendError(res, 'No shelters with sufficient capacity found within search radius', 404);
        return;
      }

      sendSuccess(res, match, 'Nearest shelter matched successfully');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  // --- Relief Inventory ---
  getResources = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shelter_id } = req.query;
      const resources = await this.resourceService.getResources(shelter_id as string);
      sendSuccess(res, { resources });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  addResource = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const resource = await this.resourceService.addResource(req.body, userId);
      sendSuccess(res, resource, 'Resource added successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  allocateResource = async (req: Request, res: Response): Promise<void> => {
    try {
      const { resource_id, help_request_id } = req.body;
      if (!resource_id || !help_request_id) {
        sendError(res, 'resource_id and help_request_id are required', 400);
        return;
      }
      const resource = await this.resourceService.allocateToRequest(resource_id, help_request_id);
      sendSuccess(res, resource, 'Resource allocated to help request');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };
}
