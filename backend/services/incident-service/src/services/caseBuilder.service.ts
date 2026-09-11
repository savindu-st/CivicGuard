import { getSupabaseClient, getBoundingBox, isPointInPolygon, findNearestRoad, calculateDistanceInMeters } from '@civicguard/shared';
import { Road, Ward, Incident, EnvironmentalReading } from '@civicguard/shared';
import { CLUSTER_SETTINGS } from '@civicguard/shared';

export interface CaseContext {
  matchedWard: Ward | null;
  matchedRoad: Road | null;
  nearbyIncidents: Incident[];
  clusterCount: number;
  latestRainfall: EnvironmentalReading | null;
  latestRiverLevel: EnvironmentalReading | null;
}

export class CaseBuilderService {
  private supabase = getSupabaseClient();

  /**
   * Enriches raw coordinates with municipal ward, nearest road, cluster count, and weather telemetry.
   */
  async buildCaseContext(latitude: number, longitude: number): Promise<CaseContext> {
    // 1. Fetch all wards and roads from DB
    const [wardsRes, roadsRes] = await Promise.all([
      this.supabase.from('wards').select('*'),
      this.supabase.from('roads').select('*'),
    ]);

    const wards: Ward[] = wardsRes.data || [];
    const roads: Road[] = roadsRes.data || [];

    // 2. Spatial resolution: Point-in-Polygon for wards with GeoJSON, or nearest road anchor
    let matchedWard: Ward | null = null;
    for (const ward of wards) {
      if (ward.boundary && ward.boundary.coordinates) {
        if (isPointInPolygon([longitude, latitude], ward.boundary.coordinates as any)) {
          matchedWard = ward;
          break;
        }
      }
    }

    // Find nearest road
    const nearest = findNearestRoad(latitude, longitude, roads);
    const matchedRoad = nearest ? nearest.road : null;

    // If ward wasn't matched via polygon, fall back to nearest road's ward
    if (!matchedWard && matchedRoad && matchedRoad.ward_id) {
      matchedWard = wards.find((w) => w.id === matchedRoad.ward_id) || null;
    }

    // 3. Spatio-temporal cluster retrieval using indexed bounding box (ADR-013)
    const bbox = getBoundingBox(latitude, longitude, CLUSTER_SETTINGS.BOUNDING_BOX_DELTA_METERS);
    const rollingWindowCutoff = new Date(
      Date.now() - CLUSTER_SETTINGS.TIME_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: candidateIncidents } = await this.supabase
      .from('incidents')
      .select('*')
      .gte('latitude', bbox.minLat)
      .lte('latitude', bbox.maxLat)
      .gte('longitude', bbox.minLon)
      .lte('longitude', bbox.maxLon)
      .gte('created_at', rollingWindowCutoff)
      .in('status', ['REPORTED', 'ANALYZING', 'NEEDS_VERIFICATION', 'CONFIRMED', 'IN_PROGRESS']);

    // Exact Haversine distance filter within 200m
    const nearbyIncidents: Incident[] = (candidateIncidents || []).filter((inc: Incident) => {
      const dist = calculateDistanceInMeters(latitude, longitude, inc.latitude, inc.longitude);
      return dist <= CLUSTER_SETTINGS.RADIUS_METERS;
    });

    // 4. Retrieve latest environmental readings for the ward
    let latestRainfall: EnvironmentalReading | null = null;
    let latestRiverLevel: EnvironmentalReading | null = null;

    if (matchedWard) {
      const { data: readings } = await this.supabase
        .from('environmental_readings')
        .select('*')
        .eq('ward_id', matchedWard.id)
        .order('recorded_at', { ascending: false })
        .limit(10);

      if (readings) {
        latestRainfall = readings.find((r) => r.reading_type === 'RAINFALL') || null;
        latestRiverLevel = readings.find((r) => r.reading_type === 'RIVER_LEVEL') || null;
      }
    }

    return {
      matchedWard,
      matchedRoad,
      nearbyIncidents,
      clusterCount: nearbyIncidents.length,
      latestRainfall,
      latestRiverLevel,
    };
  }
}
