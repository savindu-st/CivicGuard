import { Router } from 'express';
import multer from 'multer';
import { IncidentController } from '../controllers/incident.controller';
import { generateDemoToken, RoleName, sendSuccess, sendError, authMiddleware } from '@civicguard/shared';

const router = Router();
const controller = new IncidentController();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// --- Citizen & Public Reporting ---
router.post('/reports', upload.single('photo'), controller.createReport);
router.post('/scan-photo', upload.single('photo'), controller.scanPhoto);
router.get('/', controller.getIncidents);
router.get('/map/hazards', controller.getHazardMap);
router.post('/routes/safe-path', controller.getSafePath);

// --- Ward & Road Infrastructure Management ---
router.get('/wards', controller.getWards);
router.get('/roads', controller.getRoads);
router.patch('/roads/:id/closure', controller.toggleRoadClosure);

// --- Telemetry & Simulation ---
router.post('/telemetry', controller.ingestTelemetry);
router.post('/telemetry/simulate', controller.simulateTelemetry);

// --- Corroboration & Details ---
router.get('/:id', controller.getIncidentById);
router.post('/:id/corroborate', controller.corroborateIncident);
router.post('/:id/verify', controller.manualVerify);
router.patch('/:id/status', controller.updateStatus);

// --- User Authentication & Session Endpoints ---
router.post('/auth/register', controller.registerUser);
router.post('/auth/login', controller.loginUser);
router.get('/auth/me', authMiddleware, controller.getCurrentUser);

// --- Demo Token Generator Endpoint (ADR-010) ---
router.post('/auth/demo-token', (req, res) => {
  try {
    const { role = 'CITIZEN', userId, name } = req.body;
    const token = generateDemoToken(role as RoleName, userId, name);
    sendSuccess(res, { token, role, user_id: userId || 'auto-assigned' }, 'Demo token generated successfully');
  } catch (err: any) {
    sendError(res, err.message, 400);
  }
});

export default router;
