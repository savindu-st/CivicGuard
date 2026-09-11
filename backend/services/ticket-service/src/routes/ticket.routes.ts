import { Router } from 'express';
import multer from 'multer';
import { TicketController } from '../controllers/ticket.controller';

const router = Router();
const controller = new TicketController();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Ticket CRUD & Lifecycle
router.get('/', controller.getTickets);
router.post('/', controller.createTicket);

// Crew endpoints
router.get('/crews', controller.getAllCrews);
router.patch('/crews/:id/location', controller.updateCrewLocation);
router.get('/crews/:id/tasks', controller.getCrewTasks);

// Ticket details & actions
router.get('/:id', controller.getTicketById);
router.patch('/:id/assign', controller.assignCrew);
router.patch('/:id/status', controller.updateStatus);
router.post('/:id/complete', upload.single('photo'), controller.completeTicket);

export default router;
