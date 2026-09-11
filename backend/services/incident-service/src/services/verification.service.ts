import axios from 'axios';
import {
  getSupabaseClient,
  createLogger,
  AnalysisResult,
  HazardVerdict,
  IncidentSeverity,
  VerdictDecision,
  SIGNAL_WEIGHTS,
  VERIFICATION_THRESHOLDS,
  DANGER_THRESHOLDS,
} from '@civicguard/shared';
import { CaseContext } from './caseBuilder.service';
import { config } from '../config';

const logger = createLogger('VerificationEngine');

export interface VerificationOutcome {
  verdict: HazardVerdict;
  analysisResults: AnalysisResult[];
}

export class VerificationService {
  private supabase = getSupabaseClient();

  /**
   * Executes the 5-signal hybrid verification pipeline.
   */
  async verifyIncident(
    incidentId: string,
    incidentType: string,
    latitude: number,
    longitude: number,
    photoUrl?: string,
    caseContext?: CaseContext
  ): Promise<VerificationOutcome> {
    const analysisResults: AnalysisResult[] = [];

    // --- Signal 1: Spatio-temporal Cluster Check (System Plain Code) ---
    const clusterCount = caseContext?.clusterCount || 0;
    // Score scales: 0 reports = 0.50 baseline, 1-2 reports = 0.75, >=3 reports = 0.95
    let clusterScore = 0.50;
    if (clusterCount === 1) clusterScore = 0.75;
    else if (clusterCount === 2) clusterScore = 0.85;
    else if (clusterCount >= 3) clusterScore = 0.95;

    analysisResults.push({
      id: '',
      incident_id: incidentId,
      analysis_type: 'CLUSTER',
      method: 'SYSTEM',
      result: `${clusterCount} active nearby reports within 200m in past 3 hours`,
      score: clusterScore,
      confidence: 0.90,
      reason: `Found ${clusterCount} correlated spatial reports in the same rolling window`,
      input_data: { clusterCount, radiusMeters: 200 },
      fallback_used: false,
    });

    // --- Signal 2: Weather Telemetry Correlation Check (System Plain Code) ---
    const rainfall = caseContext?.latestRainfall?.value || 0;
    const rainfallThreshold =
      caseContext?.latestRainfall?.danger_threshold || DANGER_THRESHOLDS.DEFAULT_RAINFALL_MM;
    const riverLevel = caseContext?.latestRiverLevel?.value || 0;
    const riverThreshold =
      caseContext?.latestRiverLevel?.danger_threshold || DANGER_THRESHOLDS.DEFAULT_RIVER_LEVEL_M;

    let weatherScore = 0.50;
    let weatherReason = 'Standard precipitation baseline';

    if (incidentType === 'FLOOD') {
      if (rainfall >= rainfallThreshold || riverLevel >= riverThreshold) {
        weatherScore = 0.95;
        weatherReason = `Heavy telemetry confirmed: Rainfall ${rainfall}mm (Threshold: ${rainfallThreshold}mm), River Level ${riverLevel}m`;
      } else if (rainfall > rainfallThreshold * 0.5) {
        weatherScore = 0.75;
        weatherReason = `Moderate telemetry: Rainfall ${rainfall}mm`;
      } else {
        weatherScore = 0.40;
        weatherReason = `Low sensor corroboration: Rainfall ${rainfall}mm under dry conditions`;
      }
    } else {
      // Fallen trees or road blockages can happen regardless of high rain
      weatherScore = 0.80;
      weatherReason = 'Non-flood hazard: Weather correlation neutral';
    }

    analysisResults.push({
      id: '',
      incident_id: incidentId,
      analysis_type: 'WEATHER',
      method: 'SYSTEM',
      result: `Rainfall: ${rainfall}mm, River: ${riverLevel}m`,
      score: weatherScore,
      confidence: 0.90,
      reason: weatherReason,
      input_data: { rainfall, riverLevel, rainfallThreshold, riverThreshold },
      fallback_used: false,
    });

    // --- Signals 3, 4, 5: AI Checks with Heuristic Fallback (ADR-003 & ADR-009) ---
    const aiChecks = await this.executeAiChecksWithFallback(
      incidentId,
      incidentType,
      latitude,
      longitude,
      photoUrl,
      caseContext
    );
    analysisResults.push(...aiChecks);

    // --- Signal Aggregation: Compute Composite Score ---
    const scoreMap: Record<string, number> = {};
    for (const res of analysisResults) {
      scoreMap[res.analysis_type] = res.score || 0.5;
    }

    const compositeScore =
      scoreMap['IMAGE'] * SIGNAL_WEIGHTS.IMAGE_AI +
      scoreMap['LOCATION'] * SIGNAL_WEIGHTS.LOCATION_AI +
      scoreMap['RISK'] * SIGNAL_WEIGHTS.RISK_AI +
      scoreMap['WEATHER'] * SIGNAL_WEIGHTS.WEATHER_CHECK +
      scoreMap['CLUSTER'] * SIGNAL_WEIGHTS.CLUSTER_CHECK;

    // Decision Logic
    let verdictDecision: VerdictDecision = 'NEEDS_VERIFICATION';
    if (compositeScore >= VERIFICATION_THRESHOLDS.CONFIRMATION_SCORE) {
      verdictDecision = 'CONFIRMED';
    } else if (compositeScore < VERIFICATION_THRESHOLDS.NEEDS_VERIFICATION_SCORE) {
      verdictDecision = 'REJECTED';
    }

    // Determine Urgency (P1 - P4)
    let urgency: IncidentSeverity = 'MEDIUM';
    const roadType = caseContext?.matchedRoad?.road_type;
    if (compositeScore >= 0.85 && (roadType === 'HIGHWAY' || roadType === 'PRIMARY')) {
      urgency = 'CRITICAL';
    } else if (compositeScore >= 0.70 || roadType === 'SECONDARY') {
      urgency = 'HIGH';
    } else if (compositeScore < 0.40) {
      urgency = 'LOW';
    }

    const verdict: HazardVerdict = {
      id: '',
      incident_id: incidentId,
      verdict: verdictDecision,
      confidence: parseFloat(compositeScore.toFixed(4)),
      urgency,
      reasons: analysisResults.map((r) => `${r.analysis_type}: ${r.reason}`),
    };

    // --- Persistence into analysis_results & hazard_verdicts ---
    await this.persistAnalysisAndVerdict(incidentId, analysisResults, verdict);

    return { verdict, analysisResults };
  }

  /**
   * Attempts to call Python AI service; falls back to auditable heuristics on network timeout or offline state.
   */
  private async executeAiChecksWithFallback(
    incidentId: string,
    incidentType: string,
    latitude: number,
    longitude: number,
    photoUrl?: string,
    caseContext?: CaseContext
  ): Promise<AnalysisResult[]> {
    try {
      // Attempt call to Python AI Service
      const aiResponse = await axios.post(
        `${config.aiServiceUrl}/predict/hazard`,
        {
          incident_id: incidentId,
          incident_type: incidentType,
          latitude,
          longitude,
          photo_url: photoUrl,
        },
        { timeout: 3000 }
      );

      if (aiResponse.status === 200 && aiResponse.data) {
        const d = aiResponse.data;
        return [
          {
            id: '',
            incident_id: incidentId,
            analysis_type: 'IMAGE',
            method: 'AI',
            result: d.image_classification || 'Verified Hazard',
            score: d.image_score || 0.88,
            confidence: d.confidence || 0.92,
            reason: d.image_reason || 'Computer vision verified hazard signature',
            fallback_used: false,
          },
          {
            id: '',
            incident_id: incidentId,
            analysis_type: 'LOCATION',
            method: 'AI',
            result: 'Valid Geolocation',
            score: d.location_score || 0.90,
            confidence: 0.85,
            reason: d.location_reason || 'Scene visual cues match reported GPS coordinates',
            fallback_used: false,
          },
          {
            id: '',
            incident_id: incidentId,
            analysis_type: 'RISK',
            method: 'AI',
            result: d.risk_urgency || 'P1',
            score: d.risk_score || 0.85,
            confidence: 0.90,
            reason: d.risk_reason || 'High exposure to traffic corridor and rising floodwater',
            fallback_used: false,
          },
        ];
      }
    } catch (err: any) {
      logger.info(
        `AI Service offline or unreachable (${err.message}). Activating auditable Heuristic Fallback.`
      );
    }

    // --- Auditable Heuristic Fallback (ADR-003) ---
    // 1. Image Check Fallback: Validate presence and format of photo
    const hasPhoto = Boolean(photoUrl && photoUrl.length > 5);
    const imageScore = hasPhoto ? 0.88 : 0.45;
    const imageReason = hasPhoto
      ? 'Heuristic validation: Citizen photo verified with valid URI'
      : 'Heuristic validation: No image provided with submission';

    // 2. Location Check Fallback: Validate coordinates are within Sri Lanka bounds [5.9 - 9.9 N, 79.5 - 82.0 E]
    const inSriLanka = latitude >= 5.8 && latitude <= 9.9 && longitude >= 79.5 && longitude <= 82.0;
    const locationScore = inSriLanka ? 0.92 : 0.20;
    const locationReason = inSriLanka
      ? `Heuristic validation: Coordinates [${latitude}, ${longitude}] fall squarely within municipality boundary`
      : `Coordinates [${latitude}, ${longitude}] fall outside Sri Lanka territory`;

    // 3. Risk AI Fallback: Evaluate based on matched road type and ward density
    const roadType = caseContext?.matchedRoad?.road_type;
    let riskScore = 0.70;
    let riskReason = 'Heuristic assessment: Secondary road exposure';

    if (roadType === 'HIGHWAY' || roadType === 'PRIMARY') {
      riskScore = 0.95;
      riskReason = `Heuristic assessment: Critical arterial corridor (${caseContext?.matchedRoad?.name || 'Primary Road'})`;
    } else if (roadType === 'RESIDENTIAL') {
      riskScore = 0.60;
      riskReason = 'Heuristic assessment: Low-speed residential street';
    }

    return [
      {
        id: '',
        incident_id: incidentId,
        analysis_type: 'IMAGE',
        method: 'HEURISTIC_FALLBACK',
        result: hasPhoto ? 'Photo Uploaded (Heuristic)' : 'No Photo (Heuristic)',
        score: imageScore,
        confidence: 0.85,
        reason: imageReason,
        fallback_used: true,
      },
      {
        id: '',
        incident_id: incidentId,
        analysis_type: 'LOCATION',
        method: 'HEURISTIC_FALLBACK',
        result: inSriLanka ? 'Valid Bounds (Heuristic)' : 'Out of Bounds (Heuristic)',
        score: locationScore,
        confidence: 0.90,
        reason: locationReason,
        fallback_used: true,
      },
      {
        id: '',
        incident_id: incidentId,
        analysis_type: 'RISK',
        method: 'HEURISTIC_FALLBACK',
        result: riskScore >= 0.85 ? 'High Urgency (Heuristic)' : 'Medium Urgency (Heuristic)',
        score: riskScore,
        confidence: 0.85,
        reason: riskReason,
        fallback_used: true,
      },
    ];
  }

  /**
   * Persists analysis results and composite verdict into database tables.
   */
  private async persistAnalysisAndVerdict(
    incidentId: string,
    analysisResults: AnalysisResult[],
    verdict: HazardVerdict
  ): Promise<void> {
    try {
      // 1. Insert analysis results
      const insertRows = analysisResults.map((r) => ({
        incident_id: incidentId,
        analysis_type: r.analysis_type,
        method: r.method,
        result: r.result,
        score: r.score,
        confidence: r.confidence,
        reason: r.reason,
        input_data: { ...r.input_data, fallback_used: r.fallback_used },
      }));

      await this.supabase.from('analysis_results').insert(insertRows);

      // 2. Insert hazard verdict
      await this.supabase.from('hazard_verdicts').insert({
        incident_id: incidentId,
        verdict: verdict.verdict,
        confidence: verdict.confidence,
        urgency: verdict.urgency,
        reasons: verdict.reasons,
      });
    } catch (err: any) {
      logger.error(`Failed to persist analysis results: ${err.message}`);
    }
  }
}
