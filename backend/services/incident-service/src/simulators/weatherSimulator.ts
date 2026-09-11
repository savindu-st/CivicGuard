import { getSupabaseClient, createLogger } from '@civicguard/shared';
import { TelemetryService } from '../services/telemetry.service';

const logger = createLogger('WeatherSimulator');

export class WeatherSimulator {
  private telemetryService = new TelemetryService();
  private supabase = getSupabaseClient();

  /**
   * Replays simulated rainfall burst across Sri Lanka demonstration wards.
   */
  async simulateStormBurst(intensity: 'MODERATE' | 'HEAVY' | 'TORRENTIAL' = 'TORRENTIAL'): Promise<any[]> {
    logger.info(`Starting simulated ${intensity} storm replay across wards...`);

    const { data: wards } = await this.supabase.from('wards').select('*');
    if (!wards || wards.length === 0) {
      logger.warn('No wards available to simulate telemetry');
      return [];
    }

    const multiplier = intensity === 'TORRENTIAL' ? 1.8 : intensity === 'HEAVY' ? 1.3 : 0.9;
    const results = [];

    for (const ward of wards) {
      // Base readings
      const baseRainfall = (45 + Math.random() * 40) * multiplier;
      const baseRiver = (2.2 + Math.random() * 2.5) * multiplier;

      // Ingest rainfall
      const rainfallResult = await this.telemetryService.ingestReading({
        ward_id: ward.id,
        reading_type: 'RAINFALL',
        value: parseFloat(baseRainfall.toFixed(2)),
        unit: 'mm',
        danger_threshold: 50.0,
        source: 'MET_DEPT_SIMULATOR',
      });

      // Ingest river level
      const riverResult = await this.telemetryService.ingestReading({
        ward_id: ward.id,
        reading_type: 'RIVER_LEVEL',
        value: parseFloat(baseRiver.toFixed(2)),
        unit: 'm',
        danger_threshold: 3.2,
        source: 'HYDROLOGY_GAUGE_SIMULATOR',
      });

      results.push({
        ward: ward.name,
        rainfall: rainfallResult,
        riverLevel: riverResult,
      });
    }

    logger.info(`Simulated storm burst completed. Updated ${results.length} wards.`);
    return results;
  }
}
