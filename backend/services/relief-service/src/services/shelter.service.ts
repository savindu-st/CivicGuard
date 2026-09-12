import axios from 'axios';
import {
  getSupabaseClient,
  createLogger,
  calculateHaversineDistance,
  Shelter,
  ShelterCreateDTO,
  ShelterMatchDTO,
  ShelterMatchResult,
} from '@civicguard/shared';
import { config } from '../config';

const logger = createLogger('ShelterService');

export class ShelterService {
  private supabase = getSupabaseClient();

  /**
   * Lists all disaster relief shelters with computed available beds.
   */
  async getShelters(wardId?: string): Promise<Shelter[]> {
    let query = this.supabase
      .from('shelters')
      .select('*, wards(name)')
      .eq('is_active', true)
      .order('name');

    if (wardId) query = query.eq('ward_id', wardId);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((s: any) => ({
      ...s,
      available_beds: Math.max(0, s.capacity - s.current_occupancy),
      ward_name: s.wards?.name,
    }));
  }

  /**
   * Registers a new emergency shelter.
   */
  async createShelter(dto: ShelterCreateDTO): Promise<Shelter> {
    const { data, error } = await this.supabase
      .from('shelters')
      .insert({
        ward_id: dto.ward_id || null,
        name: dto.name,
        address: dto.address || null,
        latitude: dto.latitude,
        longitude: dto.longitude,
        capacity: dto.capacity || 100,
        current_occupancy: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) throw error;
    return { ...data, available_beds: data.capacity };
  }

  /**
   * Updates shelter occupancy headcount.
   */
  async updateOccupancy(shelterId: string, currentOccupancy: number): Promise<Shelter> {
    const { data, error } = await this.supabase
      .from('shelters')
      .update({ current_occupancy: currentOccupancy })
      .eq('id', shelterId)
      .select('*, wards(name)')
      .single();

    if (error || !data) throw error;

    const availableBeds = Math.max(0, data.capacity - data.current_occupancy);

    // Broadcast shelter updated event to connected operators and public maps
    try {
      await axios.post(
        `${config.notificationServiceUrl}/api/notifications/broadcast`,
        {
          rooms: ['relief', 'officers', 'public'],
          event: 'relief:shelter_updated',
          payload: {
            shelter_id: shelterId,
            current_occupancy: data.current_occupancy,
            capacity: data.capacity,
            available_beds: availableBeds,
            ward_name: data.wards?.name,
          },
        },
        { timeout: 3000 }
      );
    } catch (e: any) {
      logger.warn(`Could not broadcast shelter occupancy update: ${e.message}`);
    }

    return { ...data, available_beds: availableBeds, ward_name: data.wards?.name };
  }

  /**
   * Automated Nearest Shelter Matching with Atomic Bed Reservation (ADR-008 & ADR-011).
   */
  async matchShelter(dto: ShelterMatchDTO, autoReserve: boolean = false): Promise<ShelterMatchResult | null> {
    const { latitude, longitude, people_count, help_request_id } = dto;
    const count = people_count || 1;

    // 1. Fetch all active shelters
    const { data: shelters, error } = await this.supabase
      .from('shelters')
      .select('*, wards(name)')
      .eq('is_active', true);

    if (error || !shelters || shelters.length === 0) {
      logger.warn('No active shelters available in database');
      return null;
    }

    // 2. Filter candidate shelters with enough beds
    const candidates = shelters
      .map((s: any) => {
        const availableBeds = s.capacity - s.current_occupancy;
        const dist = s.latitude && s.longitude
          ? calculateHaversineDistance(latitude, longitude, s.latitude, s.longitude)
          : 9999;
        return {
          shelter: { ...s, available_beds: availableBeds, ward_name: s.wards?.name },
          distanceKm: parseFloat(dist.toFixed(2)),
          availableBeds,
          estimatedTravelTimeMinutes: Math.round((dist / 30) * 60) + 5, // ~30km/h travel time + 5min overhead
        };
      })
      .filter((c) => c.availableBeds >= count)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    if (candidates.length === 0) {
      logger.warn(`No shelter found with ${count} available beds`);
      return null;
    }

    // Pick top candidate
    const bestMatch = candidates[0];

    // 3. If autoReserve requested, perform atomic reservation (ADR-011)
    if (autoReserve) {
      const { data: updated, error: resErr } = await this.supabase
        .from('shelters')
        .update({ current_occupancy: bestMatch.shelter.current_occupancy + count })
        .eq('id', bestMatch.shelter.id)
        .lte('current_occupancy', bestMatch.shelter.capacity - count) // Concurrency guard
        .select()
        .single();

      if (resErr || !updated) {
        logger.warn('Concurrency race detected in shelter reservation. Re-evaluating next candidate...');
        // Try second candidate if available
        if (candidates.length > 1) {
          return candidates[1];
        }
      } else {
        bestMatch.availableBeds = updated.capacity - updated.current_occupancy;
        bestMatch.shelter.current_occupancy = updated.current_occupancy;
        bestMatch.shelter.available_beds = bestMatch.availableBeds;

        // If a help request ID is attached, transition it to ASSIGNED and link shelter
        if (help_request_id) {
          try {
            await this.supabase
              .from('help_requests')
              .update({
                status: 'ASSIGNED',
                description: bestMatch.shelter.name ? `[Assigned Shelter: ${bestMatch.shelter.name}]` : undefined,
              })
              .eq('id', help_request_id);

            // Broadcast request assignment
            await axios.post(
              `${config.notificationServiceUrl}/api/notifications/broadcast`,
              {
                rooms: ['relief', 'officers'],
                event: 'relief:updated',
                payload: {
                  request_id: help_request_id,
                  status: 'ASSIGNED',
                  matched_shelter_id: bestMatch.shelter.id,
                  matched_shelter_name: bestMatch.shelter.name,
                },
              },
              { timeout: 3000 }
            );
          } catch (e: any) {
            logger.warn(`Could not link help request to shelter assignment: ${e.message}`);
          }
        }

        // Broadcast shelter updated event
        try {
          await axios.post(
            `${config.notificationServiceUrl}/api/notifications/broadcast`,
            {
              rooms: ['relief', 'officers', 'public'],
              event: 'relief:shelter_updated',
              payload: {
                shelter_id: bestMatch.shelter.id,
                current_occupancy: bestMatch.shelter.current_occupancy,
                capacity: bestMatch.shelter.capacity,
                available_beds: bestMatch.availableBeds,
                ward_name: bestMatch.shelter.ward_name,
              },
            },
            { timeout: 3000 }
          );
        } catch {}
      }
    }

    return bestMatch;
  }
}
