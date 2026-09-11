import axios from 'axios';
import { getSupabaseClient, createLogger, TelemetryIngestDTO, EnvironmentalReading } from '@civicguard/shared';
import { config } from '../config';

const logger = createLogger('TelemetryEngine');

export class TelemetryService {
  private supabase = getSupabaseClient();

  /**
   * Ingests sensor reading and triggers threshold alerts if danger level breached.
   */
  async ingestReading(dto: TelemetryIngestDTO): Promise<EnvironmentalReading> {
    const readingType = dto.reading_type;
    const value = dto.value;
    const threshold = dto.danger_threshold || (readingType === 'RAINFALL' ? 50.0 : 3.0);
    const unit = dto.unit || (readingType === 'RAINFALL' ? 'mm' : 'm');

    // 1. Insert into database
    const { data, error } = await this.supabase
      .from('environmental_readings')
      .insert({
        ward_id: dto.ward_id,
        reading_type: readingType,
        value,
        unit,
        danger_threshold: threshold,
        recorded_at: dto.recorded_at || new Date().toISOString(),
        source: dto.source || 'SIMULATED_SENSOR',
      })
      .select()
      .single();

    if (error) {
      logger.error(`Error storing environmental reading: ${error.message}`);
      throw error;
    }

    // 2. Check if reading breached threshold -> Autonomous Warning Engine (Acceptance Criterion 2)
    if (value >= threshold) {
      logger.warn(
        `DANGER THRESHOLD BREACHED in ward ${dto.ward_id}: ${readingType} = ${value}${unit} (Threshold: ${threshold}${unit})`
      );
      await this.handleThresholdBreach(dto.ward_id, readingType, value, unit, threshold);
    }

    return data;
  }

  /**
   * Autonomous flood warning trigger when telemetry reaches critical stage.
   */
  private async handleThresholdBreach(
    wardId: string,
    readingType: string,
    value: number,
    unit: string,
    threshold: number
  ): Promise<void> {
    try {
      // 1. Fetch ward coordinates
      const { data: ward } = await this.supabase.from('wards').select('*').eq('id', wardId).single();
      const wardName = ward ? ward.name : 'Unknown Ward';

      // 2. Create automated system incident
      const { data: newIncident } = await this.supabase
        .from('incidents')
        .insert({
          ward_id: wardId,
          incident_type: 'FLOOD',
          description: `AUTONOMOUS SENSOR WARNING: ${readingType} reached ${value}${unit}, exceeding danger threshold (${threshold}${unit}). Low-lying flood basin alert.`,
          latitude: 6.8785, // Representative anchor coordinate
          longitude: 79.8655,
          source: readingType === 'RAINFALL' ? 'WEATHER_FEED' : 'RIVER_FEED',
          status: 'CONFIRMED',
          severity: 'CRITICAL',
        })
        .select()
        .single();

      // 3. Dispatch area warning to notification-service via HTTP RPC
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: [`ward:${wardId}`, 'public', 'officers'],
          event: 'area:alert',
          payload: {
            title: `CRITICAL FLOOD WARNING: ${wardName}`,
            message: `Automated sensor telemetry reports ${readingType} at ${value}${unit} (Danger limit: ${threshold}${unit}). Low-lying roads at severe risk of flooding.`,
            incident_id: newIncident?.id,
            ward_id: wardId,
            severity: 'CRITICAL',
          },
        },
        { timeout: 3000 }
      );

      logger.info(`Autonomous warning broadcasted for ward: ${wardName}`);
    } catch (err: any) {
      logger.error(`Failed to broadcast autonomous warning: ${err.message}`);
    }
  }
}
