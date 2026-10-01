import express from 'express';
import {
  createDonation,
  getMyDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
  updateDonationStatus,
  getDonorStats,
  getDonations,
  getDonationsHistory,
  updateDonationStatusBody,
} from '../controllers/donationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

router.route('/')
  .get(getDonations)
  .post(authorize('donor'), upload.array('images', 5), createDonation);

router.get('/my', authorize('donor'), getMyDonations);
router.get('/history', getDonationsHistory);
router.get('/stats/donor', authorize('donor'), getDonorStats);
router.patch('/status', updateDonationStatusBody);

router.route('/:id')
  .get(getDonationById)
  .put(authorize('donor'), upload.array('images', 5), updateDonation)
  .delete(authorize('donor'), deleteDonation);

router.patch('/:id/status', updateDonationStatus);

export default router;
