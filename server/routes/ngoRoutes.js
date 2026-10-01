import express from 'express';
import {
  getNgoDashboard,
  getNgoDonations,
  getNgoDonationById,
  acceptDonation,
  requestVolunteer,
  getNgoHistory,
  updateNgoProfile,
  getVolunteers,
  getNgoReports,
  getNgoClaims,
} from '../controllers/ngoController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All NGO routes require authentication and ngo role
router.use(protect);
router.use(authorize('ngo'));

// Dashboard
router.get('/dashboard', getNgoDashboard);

// Active NGO claims
router.get('/claims', getNgoClaims);

// Donations marketplace
router.get('/donations', getNgoDonations);
router.get('/donations/:id', getNgoDonationById);

// Accept donation
router.post('/accept', acceptDonation);

// Request volunteer
router.post('/request-volunteer', requestVolunteer);

// Volunteers list
router.get('/volunteers', getVolunteers);

// Reports stats
router.get('/reports', getNgoReports);

// History
router.get('/history', getNgoHistory);

// Profile
router.put('/profile', updateNgoProfile);

export default router;
