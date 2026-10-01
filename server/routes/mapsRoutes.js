import express from 'express';
import { getNearbyNgos, getNearbyVolunteers, geocode } from '../controllers/mapsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/nearby-ngos', protect, getNearbyNgos);
router.get('/nearby-volunteers', protect, getNearbyVolunteers);
router.get('/geocode', protect, geocode);

export default router;
