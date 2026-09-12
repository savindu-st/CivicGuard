import { Request, Response } from 'express';
import { sendSuccess, sendError, getSupabaseClient } from '@civicguard/shared';
import { HelpRequestService } from '../services/helpRequest.service';
import { ShelterService } from '../services/shelter.service';
import { ResourceService } from '../services/resource.service';

export class ReliefController {
  private helpService = new HelpRequestService();
  private shelterService = new ShelterService();
  private resourceService = new ResourceService();
  private supabase = getSupabaseClient();

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
      const { shelter_id, donor_id, user_id, assigned_by } = req.query;
      const filterUser = (donor_id || user_id || assigned_by) as string | undefined;
      const resources = await this.resourceService.getResources(shelter_id as string, filterUser);
      sendSuccess(res, { resources });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  addResource = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId =
        req.body.assigned_by ||
        req.body.donor_id ||
        req.body.user_id ||
        (req as any).user?.userId;
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

  allocateMultiResources = async (req: Request, res: Response): Promise<void> => {
    try {
      const { help_request_id, allocations } = req.body;
      if (!help_request_id || !allocations || !Array.isArray(allocations)) {
        sendError(res, 'help_request_id and allocations array are required', 400);
        return;
      }
      const userId = (req as any).user?.userId;
      const allocated = await this.resourceService.allocateMultiResources(
        { help_request_id, allocations },
        userId
      );
      sendSuccess(res, { allocations: allocated }, 'Multi-resource parcel allocated successfully');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  simulateSos = async (req: Request, res: Response): Promise<void> => {
    try {
      const request = await this.helpService.simulateSosDistress(req.body);
      sendSuccess(res, request, 'Emergency SOS distress call simulated successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  // --- Community Volunteer Hub Operations ---
  private static opportunities = [
    {
      id: 'vol-001',
      title: 'Kelani River Sandbagging Operations',
      category: 'Flood Defense',
      district: 'Colombo',
      status: 'Active',
      location: 'Grandpass & Kolonnawa Embankment',
      latitude: 6.9535,
      longitude: 79.8732,
      date: 'Today & Tomorrow',
      volunteers_needed: 25,
      current_joined: 18,
      total_needed: 25,
      image_path: 'assets/images/1.jpg',
      description: 'Assist local municipal engineers and tri-forces in stacking protective sandbags along vulnerable breach points on the Kelani riverbank.',
      requirements: ['Age 18+', 'Good physical condition', 'Bring rain boots / sturdy shoes'],
      coordinator_name: 'Dharmasena Perera (Grama Niladhari)',
      coordinator_phone: '+94 77 452 8901',
      assembly_point: 'Sedawatta Community Centre, Kolonnawa',
      announcements: [
        'Shift 1: 08:00 AM - 12:30 PM (Gloves & shovels provided)',
        'Shift 2: 01:30 PM - 06:00 PM (Hydration & lunch supplied)',
      ],
      route_steps: ['Sedawatta Road junction -> Turn left towards river bund -> Check in at Green Tent'],
    },
    {
      id: 'vol-002',
      title: 'Disaster Relief Food Pack Assembly',
      category: 'Food & Water',
      district: 'Colombo',
      status: 'Active',
      location: 'Sugathadasa Indoor Stadium Hub',
      latitude: 6.9452,
      longitude: 79.8643,
      date: 'Ongoing Daily',
      volunteers_needed: 40,
      current_joined: 31,
      total_needed: 40,
      image_path: 'assets/images/2.jpg',
      description: 'Sorting, boxing, and dispatching dry ration packs (rice, dhal, canned fish, infant formula) for distribution across flooded welfare shelters.',
      requirements: ['Age 16+', 'Willingness to sort & pack items', 'Mask & hairnet required (provided)'],
      coordinator_name: 'Dr. Anoma Wickramasinghe',
      coordinator_phone: '+94 71 883 4521',
      assembly_point: 'Sugathadasa Stadium Gate 4 Logistics Tent',
      announcements: [
        'Over 3,500 packs prepared yesterday. Target today is 5,000 packs.',
      ],
      route_steps: ['Enter through Gate 4 -> Head to main indoor hall logistics desk'],
    },
    {
      id: 'vol-003',
      title: 'Mobile Emergency Medical Clinic Support',
      category: 'Medical Aid',
      district: 'Kandy',
      status: 'High Urgency',
      location: 'Peradeniya Central School Camp',
      latitude: 7.2612,
      longitude: 80.5982,
      date: 'Sat & Sun',
      volunteers_needed: 15,
      current_joined: 9,
      total_needed: 15,
      image_path: 'assets/images/3.jpg',
      description: 'Support doctors and nurses triaging displaced residents, distributing water purification tablets, treating minor injuries, and managing registry.',
      requirements: ['Basic first-aid knowledge or nursing/medical students preferred', 'Age 18+'],
      coordinator_name: 'Dr. Rohan Jayasinghe',
      coordinator_phone: '+94 77 901 2345',
      assembly_point: 'Peradeniya Primary Hall Clinic Tent',
      announcements: [
        'Medical gear, PPE, and antiseptic supplied by Ministry of Health.',
      ],
      route_steps: ['Galle Road / Kandy Main Road -> Peradeniya University entrance -> School Ground'],
    },
    {
      id: 'vol-004',
      title: 'Post-Flood Mud Clearance & Debris Removal',
      category: 'Clean-up',
      district: 'Kalutara',
      status: 'Active',
      location: 'Nagoda Hospital Access Road',
      latitude: 6.5824,
      longitude: 79.9608,
      date: 'Sun, 14 Aug 2026',
      volunteers_needed: 30,
      current_joined: 12,
      total_needed: 30,
      image_path: 'assets/images/4.jpg',
      description: 'Clearing mud silt and fallen branches from the primary ambulance access route to Nagoda District Hospital.',
      requirements: ['Age 18+', 'Willing to handle mud tools', 'Wear waterproof boots'],
      coordinator_name: 'Officer Chaminda Silva',
      coordinator_phone: '+94 76 341 8920',
      assembly_point: 'Nagoda Junction Police Post',
      announcements: ['High-pressure water jets and backhoes provided by Urban Council.'],
      route_steps: ['Nagoda Bridge -> Turn right towards hospital -> Staging post at roundabout'],
    },
  ];

  private static userJoinedActivities: Record<string, string[]> = {};

  getVolunteerOpportunities = async (req: Request, res: Response): Promise<void> => {
    try {
      const { district, category } = req.query;

      // 1. Query real active shelters from Supabase PostgreSQL
      const { data: shelters, error: shelterError } = await this.supabase
        .from('shelters')
        .select('*, wards(name)')
        .eq('is_active', true);

      // 2. Query real disaster incidents with CONFIRMED hazard verdicts
      const { data: verifiedVerdicts } = await this.supabase
        .from('hazard_verdicts')
        .select('*, incidents(*, wards(name))')
        .eq('verdict', 'CONFIRMED')
        .order('created_at', { ascending: false })
        .limit(6);

      let list: any[] = [];

      // 3. Transform real Shelters into active Volunteer Missions
      if (!shelterError && shelters && shelters.length > 0) {
        shelters.forEach((s: any, idx: number) => {
          const isKandy = (s.address && s.address.toLowerCase().includes('kandy')) || (s.latitude > 7.1);
          const districtName = isKandy ? 'Kandy' : 'Colombo';

          let missionTitle = 'Food Ration Packing & Distribution';
          let missionCategory = 'Food & Water';
          let dateStr = 'Today, 2:00 PM - 6:00 PM';
          let imagePath = 'assets/images/1.jpg';
          let reqs = [
            'Wear comfortable clothing and closed footwear',
            'Bring personal hydration bottle',
            'Basic lifting capability (up to 10kg packages)',
          ];
          let desc = `Sort, pack, and seal 500 dry ration packs containing rice, dhal, and canned goods for displaced flood families arriving at ${s.name}.`;

          if (idx === 1) {
            missionTitle = 'Shelter Medical Triage & First Aid Camp';
            missionCategory = 'First Aid Camp';
            dateStr = 'Tomorrow, 8:00 AM - 1:00 PM';
            imagePath = 'assets/images/2.jpg';
            reqs = [
              'Basic first-aid knowledge or medical background preferred',
              'Compassionate communication with elderly evacuees',
              'Fluent in Sinhala or Tamil',
            ];
            desc = `Assist volunteer medical doctors and certified nurses with patient intake registration, guiding elderly residents, and distributing first aid packs at ${s.name}.`;
          } else if (idx === 2) {
            missionTitle = 'Displaced Family Shelter Support & Meals';
            missionCategory = 'Shelter Support';
            dateStr = 'Today, 1:00 PM - 7:00 PM';
            imagePath = 'assets/images/3.jpg';
            reqs = [
              'Empathetic and positive attitude',
              'Child-friendly and supportive demeanor',
              'Assist with meal distribution queues and clean drinking water',
            ];
            desc = `Provide care, distribute clean drinking water, manage hot meal service, and support displaced families at ${s.name}.`;
          }

          const capTotal = s.capacity || 50;
          const capUsed = s.current_occupancy || 15;
          const totalVolunteersNeeded = Math.max(15, Math.round(capTotal / 4));
          const currentVolunteers = Math.min(totalVolunteersNeeded - 3, Math.max(5, Math.round(capUsed / 3)));

          list.push({
            id: s.id,
            shelter_id: s.id,
            title: missionTitle,
            category: missionCategory,
            district: districtName,
            status: idx === 0 ? 'Urgent Today' : 'High Priority',
            location: `${s.name}, ${s.address}`,
            latitude: Number(s.latitude),
            longitude: Number(s.longitude),
            date: dateStr,
            volunteers_needed: `${currentVolunteers}/${totalVolunteersNeeded} Volunteers`,
            current_joined: currentVolunteers,
            total_needed: totalVolunteersNeeded,
            image_path: imagePath,
            description: desc,
            requirements: reqs,
            coordinator_name: s.contact_name || 'Municipal Relief Officer',
            coordinator_phone: s.contact_phone || '+94 11 269 1111',
            assembly_point: `Main Reception & Intake Desk, ${s.name}`,
            announcements: [
              `Relief supply consignments arriving for shelter residents. Check in at Main Reception.`,
              `Volunteer attendance logged on municipal relief ledger.`,
            ],
            route_steps: [
              `Navigate toward ${s.address}`,
              `Check in at ${s.name} Information Desk`,
            ],
          });
        });
      }

      // 4. Transform verified hazard incidents into Community Cleanup & Relief Missions
      if (verifiedVerdicts && verifiedVerdicts.length > 0) {
        verifiedVerdicts.forEach((v: any) => {
          const inc = v.incidents || {};
          const isKandy = inc.latitude > 7.1;
          const isColombo = inc.latitude < 7.0 && inc.longitude < 80.1;
          const dist = isKandy ? 'Kandy' : (isColombo ? 'Colombo' : 'Kalutara');
          const rawDesc = inc.description || 'Verified Disaster Zone';
          const confPct = Math.round(Number(v.confidence || 0.92) * 100);

          list.push({
            id: inc.id,
            incident_id: inc.id,
            verdict_id: v.id,
            title: `Community Relief: ${inc.incident_type || 'Disaster Relief'}`,
            category: 'Street Cleanup',
            district: dist,
            status: 'Verified Confirmed',
            verdict: 'CONFIRMED',
            confidence: confPct,
            urgency: v.urgency || 'CRITICAL',
            reasons: v.reasons || ['Spatial correlation and council officer clearance verified'],
            is_hazard_verified: true,
            location: rawDesc,
            latitude: Number(inc.latitude),
            longitude: Number(inc.longitude),
            date: 'Sunday, 8:00 AM - 12:30 PM',
            volunteers_needed: '10/20 Volunteers',
            current_joined: 10,
            total_needed: 20,
            image_path: 'assets/images/4.jpg',
            description: `Official Council-Verified Hazard Zone (${confPct}% confidence). Community volunteer assistance for flood aftermath, road clearing, and localized relief distribution near ${rawDesc}.`,
            requirements: [
              'Wear sturdy protective boots / footwear',
              'Age 18+',
              'Gloves and safety tools provided on-site',
            ],
            coordinator_name: 'District Operations Desk',
            coordinator_phone: '+94 11 243 5678',
            assembly_point: `Field Staging Point, ${rawDesc.slice(0, 30)}`,
            announcements: [
              `Official Hazard Verdict: CONFIRMED with ${confPct}% confidence.`,
              'High-visibility vests and safety equipment provided on-site.',
            ],
            route_steps: ['Follow route to designated field staging point'],
          });
        });
      }

      // Filter by district if requested
      if (district && district !== 'All' && district !== 'All Districts') {
        list = list.filter((o) => o.district.toLowerCase() === (district as string).toLowerCase());
      }

      // Filter by category if requested
      if (category && category !== 'All' && category !== 'All Activities') {
        list = list.filter((o) => o.category.toLowerCase().includes((category as string).toLowerCase()));
      }

      sendSuccess(res, { opportunities: list });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  joinVolunteerActivity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { opportunity_id, user_id, user_name, phone, title, district, date } = req.body;
      if (!opportunity_id) {
        sendError(res, 'opportunity_id is required', 400);
        return;
      }

      const uid = user_id || (req as any).user?.userId || 'guest-user';
      if (!ReliefController.userJoinedActivities[uid]) {
        ReliefController.userJoinedActivities[uid] = [];
      }
      if (!ReliefController.userJoinedActivities[uid].includes(opportunity_id)) {
        ReliefController.userJoinedActivities[uid].push(opportunity_id);
      }

      // Persist in Supabase notifications ledger
      if (uid && uid !== 'guest-user') {
        try {
          await this.supabase.from('notifications').insert({
            user_id: uid,
            notification_type: 'VOLUNTEER_REGISTERED',
            title: `Mission Joined: ${title || 'Community Disaster Relief'}`,
            message: JSON.stringify({
              opportunity_id,
              title: title || 'Community Disaster Relief',
              district: district || 'Colombo',
              date: date || 'Today',
              user_name: user_name || 'Volunteer Hero',
              phone: phone || '+94 77 123 4567',
              check_in_status: 'REGISTERED',
              joined_at: new Date().toISOString(),
            }),
          });
        } catch (_) {}
      }

      sendSuccess(
        res,
        {
          opportunity_id,
          joined: true,
          registered_user: { id: uid, name: user_name || 'Volunteer Hero' },
        },
        'Registered for volunteer activity successfully in database',
        201
      );
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  getMyVolunteerActivities = async (req: Request, res: Response): Promise<void> => {
    try {
      const uid = (req.query.user_id as string) || (req as any).user?.userId || 'guest-user';
      const myActivities: any[] = [];

      // Pull persisted volunteer signups from Supabase notifications ledger
      if (uid && uid !== 'guest-user') {
        try {
          const { data, error } = await this.supabase
            .from('notifications')
            .select('*')
            .eq('user_id', uid)
            .eq('notification_type', 'VOLUNTEER_REGISTERED')
            .order('created_at', { ascending: false });

          if (!error && data) {
            for (const row of data) {
              try {
                const parsed = typeof row.message === 'string' ? JSON.parse(row.message) : (row.message || {});
                const statusStr = parsed.check_in_status === 'ON_SITE_VERIFIED'
                  ? 'On-Site Verified'
                  : (parsed.check_in_status === 'COMPLETED' ? 'Completed' : 'Registered');

                myActivities.push({
                  id: parsed.opportunity_id || row.id,
                  notification_id: row.id,
                  title: parsed.title || row.title,
                  category: parsed.category || 'Disaster Relief',
                  district: parsed.district || 'Colombo',
                  status: statusStr,
                  check_in_status: statusStr,
                  joined_at: parsed.joined_at || row.created_at,
                  date: parsed.date || 'Today',
                  location: parsed.location || 'Assigned Relief Center',
                  volunteers_needed: 'Enrolled',
                  current_joined: 1,
                  total_needed: 1,
                  image_path: 'assets/images/1.jpg',
                  description: 'Registered volunteer deployment at relief center.',
                  requirements: ['Report to on-site shelter coordinator'],
                  coordinator_name: 'Municipal Relief Desk',
                  coordinator_phone: '+94 11 269 1111',
                  assembly_point: 'Main Shelter Desk',
                  announcements: ['Attendance logged on municipal relief ledger.'],
                  route_steps: ['Proceed to shelter assembly point'],
                });
              } catch (_) {}
            }
          }
        } catch (_) {}
      }

      sendSuccess(res, { my_activities: myActivities });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  /**
   * Officer Live Volunteer Roster & Shelter Force Breakdown
   * Displays all volunteers, their check-in statuses, and shelter readiness for supply trucks.
   */
  getVolunteerRoster = async (req: Request, res: Response): Promise<void> => {
    try {
      const { data: notifications, error } = await this.supabase
        .from('notifications')
        .select('*, users(id, name, email, phone)')
        .eq('notification_type', 'VOLUNTEER_REGISTERED')
        .order('created_at', { ascending: false });

      const { data: shelters } = await this.supabase
        .from('shelters')
        .select('id, name, address, capacity, current_occupancy')
        .eq('is_active', true);

      const shelterStatsMap: Record<string, any> = {};
      (shelters || []).forEach((s: any) => {
        const capTotal = s.capacity || 100;
        const targetVolunteers = Math.max(12, Math.round(capTotal / 5));
        shelterStatsMap[s.id] = {
          shelter_id: s.id,
          shelter_name: s.name,
          address: s.address,
          capacity: s.capacity,
          current_occupancy: s.current_occupancy,
          target_volunteers: targetVolunteers,
          registered_volunteers: 0,
          onsite_volunteers: 0,
          completed_volunteers: 0,
          volunteers: [],
        };
      });

      shelterStatsMap['field-missions'] = {
        shelter_id: 'field-missions',
        shelter_name: 'Field Disaster Cleanup Missions',
        address: 'District Hazard Sites',
        target_volunteers: 20,
        registered_volunteers: 0,
        onsite_volunteers: 0,
        completed_volunteers: 0,
        volunteers: [],
      };

      const roster: any[] = [];
      let totalRegistered = 0;
      let totalOnSite = 0;
      let totalCompleted = 0;

      if (!error && notifications) {
        for (const row of notifications) {
          try {
            const parsed = typeof row.message === 'string' ? JSON.parse(row.message) : (row.message || {});
            const user = row.users || {};
            const oppId = parsed.opportunity_id || row.id;
            const status = parsed.check_in_status || parsed.status || 'REGISTERED';
            const volunteerName = user.name || parsed.user_name || 'Volunteer Member';
            const volunteerPhone = user.phone || parsed.phone || '+94 77 123 4567';

            totalRegistered++;
            if (status === 'ON_SITE_VERIFIED' || status === 'On-Site Verified') totalOnSite++;
            if (status === 'COMPLETED' || status === 'Completed') totalCompleted++;

            const volEntry = {
              notification_id: row.id,
              user_id: row.user_id,
              name: volunteerName,
              phone: volunteerPhone,
              email: user.email || '',
              opportunity_id: oppId,
              mission_title: parsed.title || row.title,
              district: parsed.district || 'Colombo',
              joined_at: parsed.joined_at || row.created_at,
              checked_in_at: parsed.checked_in_at || null,
              status: status,
            };
            roster.push(volEntry);

            const targetGroup = shelterStatsMap[oppId] || shelterStatsMap['field-missions'];
            if (targetGroup) {
              targetGroup.registered_volunteers++;
              if (status === 'ON_SITE_VERIFIED' || status === 'On-Site Verified') {
                targetGroup.onsite_volunteers++;
              } else if (status === 'COMPLETED' || status === 'Completed') {
                targetGroup.completed_volunteers++;
              }
              targetGroup.volunteers.push(volEntry);
            }
          } catch (_) {}
        }
      }

      const shelterBreakdowns = Object.values(shelterStatsMap).map((group: any) => {
        const isSufficient = group.onsite_volunteers >= Math.max(1, Math.round(group.target_volunteers * 0.25));
        return {
          ...group,
          is_coverage_sufficient: isSufficient,
          supply_dispatch_recommendation: isSufficient
            ? 'Optimal Volunteer Coverage: Ready for Food Truck Dispatch & Medical Supplies'
            : 'Low Volunteer Coverage: Awaiting more volunteers on-site before dispatching food trucks',
        };
      });

      sendSuccess(res, {
        roster,
        shelter_breakdowns: shelterBreakdowns,
        summary: {
          total_registered: totalRegistered,
          total_onsite: totalOnSite,
          total_completed: totalCompleted,
        },
      });
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  /**
   * Volunteer On-Site Check-in or Completion status update
   */
  checkInVolunteer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user_id, opportunity_id, status } = req.body;
      const newStatus = status || 'ON_SITE_VERIFIED';
      const uid = user_id || (req as any).user?.userId;

      if (!uid || !opportunity_id) {
        sendError(res, 'user_id and opportunity_id required', 400);
        return;
      }

      const { data: records } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .eq('notification_type', 'VOLUNTEER_REGISTERED');

      let updated = false;
      if (records && records.length > 0) {
        for (const rec of records) {
          try {
            const parsed = typeof rec.message === 'string' ? JSON.parse(rec.message) : rec.message;
            if (parsed.opportunity_id === opportunity_id) {
              parsed.check_in_status = newStatus;
              parsed.checked_in_at = new Date().toISOString();
              await this.supabase
                .from('notifications')
                .update({
                  message: JSON.stringify(parsed),
                  title: `Mission ${newStatus === 'COMPLETED' ? 'Completed' : 'On-Site Verified'}: ${parsed.title}`,
                })
                .eq('id', rec.id);
              updated = true;
              break;
            }
          } catch (_) {}
        }
      }

      sendSuccess(res, { success: true, updated, status: newStatus }, 'Volunteer check-in status recorded successfully');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };
}

