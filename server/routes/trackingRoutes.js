import express from 'express';
import { postLocationUpdate, getTrackingInfo } from '../controllers/trackingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/update-location', protect, postLocationUpdate);
router.get('/:deliveryId', protect, getTrackingInfo);

export default router;
