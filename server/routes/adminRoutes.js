import express from 'express';
import {
  getDashboardStats,
  getDonationsChartData,
  getCategoryChartData,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllDonations,
  adminDeleteDonation,
  getSettings,
  updateSettings,
  getNotifications,
  markAllNotificationsRead,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard Stats
router.get('/stats', getDashboardStats);
router.get('/stats/donations-chart', getDonationsChartData);
router.get('/stats/categories-chart', getCategoryChartData);

// User Management
router.route('/users').get(getAllUsers);
router.route('/users/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

// Donation Management
router.route('/donations').get(getAllDonations);
router.route('/donations/:id').delete(adminDeleteDonation);

// System Settings
router.route('/settings').get(getSettings).put(updateSettings);

// Notifications
router.get('/notifications', getNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);

export default router;
