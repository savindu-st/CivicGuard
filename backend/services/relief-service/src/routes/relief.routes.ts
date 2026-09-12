import { Router } from 'express';
import { ReliefController } from '../controllers/relief.controller';

const router = Router();
const controller = new ReliefController();

// SOS Help Requests
router.post('/help-requests', controller.createHelpRequest);
router.get('/help-requests', controller.getHelpRequests);
router.get('/help-requests/:id', controller.getHelpRequestById);
router.patch('/help-requests/:id/status', controller.updateRequestStatus);
router.post('/simulate-sos', controller.simulateSos);

// Shelter Management & Matching
router.get('/shelters', controller.getShelters);
router.post('/shelters', controller.createShelter);
router.patch('/shelters/:id/occupancy', controller.updateOccupancy);
router.post('/match-shelter', controller.matchShelter);

// Relief Supplies & Inventory
router.get('/resources', controller.getResources);
router.post('/resources', controller.addResource);
router.post('/resources/allocate', controller.allocateResource);
router.post('/resources/allocate-parcel', controller.allocateMultiResources);

// Community Volunteer Hub
router.get('/volunteers/opportunities', controller.getVolunteerOpportunities);
router.post('/volunteers/join', controller.joinVolunteerActivity);
router.get('/volunteers/my-activities', controller.getMyVolunteerActivities);
router.get('/volunteers/roster', controller.getVolunteerRoster);
router.post('/volunteers/check-in', controller.checkInVolunteer);

export default router;
