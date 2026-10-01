import express from 'express';
import {
  getVolunteerDashboard,
  getAssignments,
  getAssignmentById,
  getPendingTasks,
  claimTask,
  startPickup,
  markPickedUp,
  startDelivery,
  markDelivered,
  getVolunteerHistory,
  updateVolunteerProfile,
  submitFeedback,
  getMyRatings,
  updateAvailability,
} from '../controllers/volunteerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All volunteer routes require authentication + volunteer role
router.use(protect);
router.use(authorize('volunteer'));

// ── Dashboard ──────────────────────────────────────────────────────────────────
router.get('/dashboard', getVolunteerDashboard);

// ── Assignments (my active deliveries) ────────────────────────────────────────
router.get('/assignments', getAssignments);
router.get('/assignments/:id', getAssignmentById);

// ── Delivery workflow step-by-step ────────────────────────────────────────────
router.patch('/start-pickup', startPickup);
router.patch('/picked-up', markPickedUp);
router.patch('/on-way-to-ngo', startDelivery);
router.patch('/delivered', markDelivered);

const handleUpdateStatusRoute = (req, res) => {
  const { status } = req.body;
  if (status === 'picked_up') return markPickedUp(req, res);
  if (status === 'delivered') return markDelivered(req, res);
  if (status === 'on_way_to_pickup') return startPickup(req, res);
  if (status === 'on_way_to_ngo') return startDelivery(req, res);
  return res.status(400).json({ message: 'Invalid delivery status transition' });
};
router.post('/update-status', handleUpdateStatusRoute);
router.patch('/update-status', handleUpdateStatusRoute);

// ── Discover & claim tasks ────────────────────────────────────────────────────
router.get('/tasks', getPendingTasks);
router.post('/accept-task', claimTask);

// ── Delivery History ──────────────────────────────────────────────────────────
router.get('/history', getVolunteerHistory);

// ── Profile ───────────────────────────────────────────────────────────────────
router.put('/profile', updateVolunteerProfile);
router.patch('/availability', updateAvailability);

// ── Ratings & Feedback ────────────────────────────────────────────────────────
router.get('/ratings', getMyRatings);
router.post('/feedback', submitFeedback);

export default router;
