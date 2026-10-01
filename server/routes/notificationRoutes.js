import express from 'express';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notificationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotifications)
  .post(admin, createNotification);

router.patch('/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

router.delete('/clear-all', clearAllNotifications);
router.delete('/:id', deleteNotification);

export default router;
