import { Request, Response } from 'express';
import axios from 'axios';
import {
  getSupabaseClient,
  sendSuccess,
  sendError,
  createLogger,
  IncidentCreateDTO,
  CorroborateDTO,
  CORROBORATION_WEIGHTS,
  VERIFICATION_THRESHOLDS,
  HazardMapItem,
} from '@civicguard/shared';
import { CaseBuilderService } from '../services/caseBuilder.service';
import { VerificationService } from '../services/verification.service';
import { RoutingService } from '../services/routing.service';
import { TelemetryService } from '../services/telemetry.service';
import { WeatherSimulator } from '../simulators/weatherSimulator';
import { config } from '../config';

const logger = createLogger('IncidentController');

export class IncidentController {
  private supabase = getSupabaseClient();
  private caseBuilder = new CaseBuilderService();
  private verificationService = new VerificationService();
  private routingService = new RoutingService();
  private telemetryService = new TelemetryService();
  private weatherSimulator = new WeatherSimulator();

  /**
   * Citizen Incident Ingestion with 5-signal verification and automated downstream triggers.
   */
  createReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const body: IncidentCreateDTO = req.body;
      const file = req.file;

      if (!body.latitude || !body.longitude || !body.incident_type) {
        sendError(res, 'latitude, longitude, and incident_type are required', 400);
        return;
      }

      const lat = parseFloat(body.latitude as any);
      const lon = parseFloat(body.longitude as any);

      // 1. Upload photo to Supabase storage if file is uploaded via multipart
      let photoUrl = body.photo_url || '';
      if (file) {
        const fileExt = file.originalname.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadErr } = await this.supabase.storage
          .from(config.storageIncidentBucket)
          .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = this.supabase.storage
            .from(config.storageIncidentBucket)
            .getPublicUrl(fileName);
          photoUrl = publicUrlData.publicUrl;
        } else {
          logger.warn(`Storage upload note: ${uploadErr?.message || 'Using fallback URL'}`);
        }
      }

      // 2. Case Builder: Enrich context with Ward, Road, Clusters, Telemetry
      const context = await this.caseBuilder.buildCaseContext(lat, lon);

      // 3. Create initial incident record
      const { data: incident, error: incError } = await this.supabase
        .from('incidents')
        .insert({
          reported_by: body.reported_by || (req as any).user?.userId || null,
          incident_type: body.incident_type,
          description: body.description || null,
          latitude: lat,
          longitude: lon,
          ward_id: context.matchedWard?.id || null,
          road_id: context.matchedRoad?.id || null,
          source: 'CITIZEN',
          status: 'ANALYZING',
          severity: body.severity || 'MEDIUM',
        })
        .select()
        .single();

      if (incError || !incident) {
        sendError(res, `Failed to create incident: ${incError?.message}`, 500);
        return;
      }

      // 4. Attach photo to incident_evidence if available
      if (photoUrl) {
        await this.supabase.from('incident_evidence').insert({
          incident_id: incident.id,
          uploaded_by: incident.reported_by,
          file_url: photoUrl,
          evidence_type: 'REPORT_PHOTO',
        });
      }

      // 5. Execute 5-Signal Hybrid Verification Engine
      const outcome = await this.verificationService.verifyIncident(
        incident.id,
        incident.incident_type,
        lat,
        lon,
        photoUrl,
        context
      );

      const verdict = outcome.verdict.verdict;
      const updatedStatus = verdict === 'CONFIRMED' ? 'CONFIRMED' : verdict === 'REJECTED' ? 'REJECTED' : 'NEEDS_VERIFICATION';

      // 6. Update incident status and severity
      await this.supabase
        .from('incidents')
        .update({
          status: updatedStatus,
          severity: outcome.verdict.urgency,
        })
        .eq('id', incident.id);

      // 7. Automated Downstream Actions upon CONFIRMED (Stage 4 in Workflow)
      if (verdict === 'CONFIRMED') {
        // A. Close road if associated
        if (context.matchedRoad) {
          await this.supabase.from('roads').update({ is_closed: true }).eq('id', context.matchedRoad.id);
          logger.info(`Road closed automatically: ${context.matchedRoad.name}`);
        }

        // B. Auto-create Council Ticket via RPC to ticket-service
        try {
          await axios.post(
            `${config.ticketServiceUrl}/api/tickets`,
            {
              incident_id: incident.id,
              priority: outcome.verdict.urgency,
              description: `AUTOMATED DISPATCH: Confirmed ${incident.incident_type} on ${context.matchedRoad?.name || 'Road'}. Confidence: ${(outcome.verdict.confidence * 100).toFixed(1)}%`,
            },
            { timeout: 3000 }
          );
          logger.info(`Council ticket auto-spawned for incident ${incident.id}`);
        } catch (ticketErr: any) {
          logger.error(`Ticket service auto-creation error: ${ticketErr.message}`);
        }

        // C. Broadcast Area Alert and New Hazard to notification-service
        try {
          await axios.post(
            `${config.notificationServiceUrl}/api/notifications/broadcast`,
            {
              rooms: ['public', 'officers', ...(context.matchedWard ? [`ward:${context.matchedWard.id}`] : [])],
              event: 'hazard:new',
              payload: {
                incident_id: incident.id,
                incident_type: incident.incident_type,
                latitude: lat,
                longitude: lon,
                road_name: context.matchedRoad?.name,
                ward_name: context.matchedWard?.name,
                severity: outcome.verdict.urgency,
                is_road_closed: true,
                photo_url: photoUrl,
              },
            },
            { timeout: 3000 }
          );
        } catch (notifErr: any) {
          logger.error(`Notification service broadcast error: ${notifErr.message}`);
        }
      } else if (verdict === 'NEEDS_VERIFICATION') {
        // Trigger "Need More Info" loop: prompt citizens within 300m
        try {
          await axios.post(
            `${config.notificationServiceUrl}/api/notifications/broadcast`,
            {
              rooms: [context.matchedWard ? `ward:${context.matchedWard.id}` : 'public'],
              event: 'need_more_info',
              payload: {
                incident_id: incident.id,
                message: `A nearby ${incident.incident_type} was reported near ${context.matchedRoad?.name || 'your area'}. Can you confirm if the road is passable?`,
                latitude: lat,
                longitude: lon,
              },
            },
            { timeout: 3000 }
          );
        } catch (notifErr: any) {
          logger.warn(`Could not emit need_more_info: ${notifErr.message}`);
        }
      }

      sendSuccess(
        res,
        {
          incident: { ...incident, status: updatedStatus, severity: outcome.verdict.urgency },
          verdict: outcome.verdict,
          evidence_photo: photoUrl,
          context: {
            ward: context.matchedWard?.name,
            road: context.matchedRoad?.name,
            road_closed: verdict === 'CONFIRMED' && Boolean(context.matchedRoad),
            clusterCount: context.clusterCount,
          },
        },
        'Incident report submitted and verified successfully',
        201
      );
    } catch (err: any) {
      logger.error(`Error in createReport: ${err.message}`);
      sendError(res, `Server error processing report: ${err.message}`, 500);
    }
  };

  /**
   * Query incidents with filtering.
   */
  getIncidents = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ward_id, status, severity, limit = 50, offset = 0 } = req.query;

      let query = this.supabase
        .from('incidents')
        .select('*, wards(name), roads(name, is_closed), incident_evidence(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1);

      if (ward_id) query = query.eq('ward_id', ward_id);
      if (status) query = query.eq('status', status);
      if (severity) query = query.eq('severity', severity);

      const { data, error, count } = await query;

      if (error) {
        sendError(res, error.message, 500);
        return;
      }

      sendSuccess(res, { incidents: data, total: count });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  /**
   * Detailed incident view by ID with 5-signal scorecard and evidence.
   */
  getIncidentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const [incRes, evidenceRes, analysisRes, verdictRes] = await Promise.all([
        this.supabase.from('incidents').select('*, wards(name), roads(name, is_closed)').eq('id', id).single(),
        this.supabase.from('incident_evidence').select('*').eq('incident_id', id),
        this.supabase.from('analysis_results').select('*').eq('incident_id', id),
        this.supabase.from('hazard_verdicts').select('*').eq('incident_id', id).maybeSingle(),
      ]);

      if (incRes.error || !incRes.data) {
        sendError(res, 'Incident not found', 404);
        return;
      }

      sendSuccess(res, {
        incident: incRes.data,
        evidence: evidenceRes.data || [],
        analysis_scorecard: analysisRes.data || [],
        verdict: verdictRes.data || null,
      });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  /**
   * Crowdsourced citizen corroboration endpoint (ADR-012).
   */
  corroborateIncident = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const body: CorroborateDTO = req.body;

      if (!body.vote || !['CONFIRM', 'REFUTE'].includes(body.vote)) {
        sendError(res, 'vote must be CONFIRM or REFUTE', 400);
        return;
      }

      // 1. Get current verdict
      const { data: verdict } = await this.supabase.from('hazard_verdicts').select('*').eq('incident_id', id).maybeSingle();
      const currentConfidence = verdict?.confidence ? Number(verdict.confidence) : 0.60;

      // 2. Adjust score based on vote
      const delta = body.vote === 'CONFIRM' ? CORROBORATION_WEIGHTS.CONFIRM : CORROBORATION_WEIGHTS.REFUTE;
      const newConfidence = Math.max(0.1, Math.min(0.99, currentConfidence + delta));

      let newVerdict = verdict?.verdict || 'NEEDS_VERIFICATION';
      let promotedToConfirmed = false;

      if (newConfidence >= VERIFICATION_THRESHOLDS.CONFIRMATION_SCORE && newVerdict !== 'CONFIRMED') {
        newVerdict = 'CONFIRMED';
        promotedToConfirmed = true;
      } else if (newConfidence < VERIFICATION_THRESHOLDS.NEEDS_VERIFICATION_SCORE) {
        newVerdict = 'REJECTED';
      }

      // 3. Update verdict
      await this.supabase
        .from('hazard_verdicts')
        .update({
          confidence: parseFloat(newConfidence.toFixed(4)),
          verdict: newVerdict,
        })
        .eq('incident_id', id);

      // 4. Update incident status
      await this.supabase
        .from('incidents')
        .update({
          status: newVerdict === 'CONFIRMED' ? 'CONFIRMED' : newVerdict === 'REJECTED' ? 'REJECTED' : 'NEEDS_VERIFICATION',
        })
        .eq('id', id);

      // 5. If promoted to CONFIRMED, close road & spawn ticket
      if (promotedToConfirmed) {
        const { data: inc } = await this.supabase.from('incidents').select('*, roads(*)').eq('id', id).single();
        if (inc?.road_id) {
          await this.supabase.from('roads').update({ is_closed: true }).eq('id', inc.road_id);
        }

        try {
          await axios.post(`${config.ticketServiceUrl}/api/tickets`, {
            incident_id: id,
            priority: inc?.severity || 'HIGH',
            description: `PROMOTED BY CROWD CORROBORATION: Confirmed ${inc?.incident_type}`,
          });
        } catch {}
      }

      sendSuccess(res, {
        incident_id: id,
        vote: body.vote,
        new_confidence: parseFloat(newConfidence.toFixed(4)),
        verdict: newVerdict,
        promoted_to_confirmed: promotedToConfirmed,
      }, 'Corroboration recorded successfully');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  /**
   * Manual Officer verification override.
   */
  manualVerify = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { decision, urgency } = req.body; // 'CONFIRM' or 'REJECT'

      if (!decision || !['CONFIRM', 'REJECT'].includes(decision)) {
        sendError(res, 'decision must be CONFIRM or REJECT', 400);
        return;
      }

      const status = decision === 'CONFIRM' ? 'CONFIRMED' : 'REJECTED';
      const severity = urgency || 'HIGH';

      await this.supabase.from('incidents').update({ status, severity }).eq('id', id);

      const { data: inc } = await this.supabase.from('incidents').select('*, roads(*)').eq('id', id).single();

      if (decision === 'CONFIRM' && inc?.road_id) {
        await this.supabase.from('roads').update({ is_closed: true }).eq('id', inc.road_id);
      }

      sendSuccess(res, { incident_id: id, status, severity }, 'Manual verification applied');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  /**
   * Update incident status (called by ticket-service on resolution).
   */
  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const { data: inc, error } = await this.supabase
        .from('incidents')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error || !inc) {
        sendError(res, 'Failed to update incident status', 400);
        return;
      }

      // If status is RESOLVED, reopen road
      if (status === 'RESOLVED' && inc.road_id) {
        await this.supabase.from('roads').update({ is_closed: false }).eq('id', inc.road_id);
        logger.info(`Road reopened for incident ${id}: road_id ${inc.road_id}`);
      }

      sendSuccess(res, inc, `Status updated to ${status}`);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  /**
   * Public Hazard Map Feed (Active hazards, closed roads, alert zones).
   */
  getHazardMap = async (req: Request, res: Response): Promise<void> => {
    try {
      // 1. Fetch active confirmed incidents
      const { data: incidents } = await this.supabase
        .from('incidents')
        .select('*, wards(name), roads(name, is_closed), incident_evidence(file_url)')
        .in('status', ['CONFIRMED', 'IN_PROGRESS']);

      // 2. Fetch all closed roads
      const { data: closedRoads } = await this.supabase.from('roads').select('*, wards(name)').eq('is_closed', true);

      // 3. Format hazard items
      const hazardItems: HazardMapItem[] = (incidents || []).map((inc: any) => ({
        id: inc.id,
        incident_type: inc.incident_type,
        latitude: inc.latitude,
        longitude: inc.longitude,
        status: inc.status,
        severity: inc.severity,
        ward_id: inc.ward_id,
        ward_name: inc.wards?.name,
        road_id: inc.road_id,
        road_name: inc.roads?.name,
        is_road_closed: inc.roads?.is_closed || false,
        evidence_url: inc.incident_evidence?.[0]?.file_url || null,
        created_at: inc.created_at,
      }));

      sendSuccess(res, {
        hazards: hazardItems,
        closed_roads: closedRoads || [],
        total_active_hazards: hazardItems.length,
        total_closed_roads: (closedRoads || []).length,
      });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  /**
   * Safe Evacuation & Detour Routing endpoint (ADR-014 / Acceptance Criterion 4).
   */
  getSafePath = async (req: Request, res: Response): Promise<void> => {
    try {
      const { origin, destination } = req.body;
      if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
        sendError(res, 'origin and destination coordinates required', 400);
        return;
      }

      const safePath = await this.routingService.calculateSafePath(origin, destination);
      sendSuccess(res, safePath, 'Safe path calculated avoiding closed hazard roads');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  /**
   * Ingest weather / river sensor telemetry.
   */
  ingestTelemetry = async (req: Request, res: Response): Promise<void> => {
    try {
      const reading = await this.telemetryService.ingestReading(req.body);
      sendSuccess(res, reading, 'Telemetry reading ingested successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  /**
   * Replay simulated rainstorm across Colombo and Kandy wards.
   */
  simulateTelemetry = async (req: Request, res: Response): Promise<void> => {
    try {
      const { intensity = 'TORRENTIAL' } = req.body;
      const results = await this.weatherSimulator.simulateStormBurst(intensity);
      sendSuccess(res, { simulated_wards: results }, 'Simulated storm burst executed successfully');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };
}
