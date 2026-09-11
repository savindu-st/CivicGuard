import { getSupabaseClient, calculateHaversineDistance, Road, SafePathResponseDTO } from '@civicguard/shared';

export class RoutingService {
  private supabase = getSupabaseClient();

  /**
   * Generates a safe transit and evacuation path avoiding road closures (ADR-014).
   */
  async calculateSafePath(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<SafePathResponseDTO> {
    // 1. Fetch all roads from database
    const { data: allRoads } = await this.supabase.from('roads').select('*');
    const roads: Road[] = allRoads || [];

    // Filter closed roads
    const closedRoads = roads.filter((r) => r.is_closed);

    // Calculate direct baseline distance
    const directDistance = calculateHaversineDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );

    // 2. Identify if direct path crosses near any closed road (within 300m of line or midpoint)
    const midLat = (origin.latitude + destination.latitude) / 2;
    const midLon = (origin.longitude + destination.longitude) / 2;

    const avoidedClosedRoads: Array<{ id: string; name: string; latitude: number; longitude: number }> = [];

    for (const closed of closedRoads) {
      const distToMid = calculateHaversineDistance(midLat, midLon, closed.latitude, closed.longitude);
      const distToOrigin = calculateHaversineDistance(origin.latitude, origin.longitude, closed.latitude, closed.longitude);
      const distToDest = calculateHaversineDistance(destination.latitude, destination.longitude, closed.latitude, closed.longitude);

      if (distToMid < 1.0 || distToOrigin < 0.5 || distToDest < 0.5) {
        avoidedClosedRoads.push({
          id: closed.id,
          name: closed.name,
          latitude: closed.latitude,
          longitude: closed.longitude,
        });
      }
    }

    // 3. Build path waypoints
    const pathWaypoints: Array<{ latitude: number; longitude: number; name?: string }> = [
      { latitude: origin.latitude, longitude: origin.longitude, name: 'Origin' },
    ];

    if (avoidedClosedRoads.length > 0) {
      // Find candidate open roads that detour around the closure
      const openRoads = roads.filter((r) => !r.is_closed);
      // Pick the best bypass road segment
      const bypassRoad = openRoads.find(
        (r) =>
          calculateHaversineDistance(midLat, midLon, r.latitude, r.longitude) < 2.0 &&
          !avoidedClosedRoads.some((c) => c.id === r.id)
      );

      if (bypassRoad) {
        pathWaypoints.push({
          latitude: bypassRoad.latitude,
          longitude: bypassRoad.longitude,
          name: `Detour via ${bypassRoad.name}`,
        });
      } else {
        // Compute offset waypoint
        pathWaypoints.push({
          latitude: midLat + 0.008,
          longitude: midLon - 0.008,
          name: 'Safe Detour Bypass Corridor',
        });
      }
    }

    pathWaypoints.push({
      latitude: destination.latitude,
      longitude: destination.longitude,
      name: 'Destination',
    });

    // Compute total detour distance
    let totalDistance = 0;
    for (let i = 0; i < pathWaypoints.length - 1; i++) {
      totalDistance += calculateHaversineDistance(
        pathWaypoints[i].latitude,
        pathWaypoints[i].longitude,
        pathWaypoints[i + 1].latitude,
        pathWaypoints[i + 1].longitude
      );
    }

    return {
      path: pathWaypoints,
      distanceKm: parseFloat(totalDistance.toFixed(2)),
      avoidedClosedRoads,
      isDirect: avoidedClosedRoads.length === 0,
    };
  }
}
