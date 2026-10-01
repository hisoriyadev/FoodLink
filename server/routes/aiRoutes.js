/**
 * AI API Routes for FoodLink
 * Express router mounting all AI, smart recommendation, analytics, and freshness endpoints.
 */

import express from 'express';
import {
  getRecommendedNgos,
  getFreshnessScore,
  getPriorityScore,
  getAnalyticsData,
  getInsightsData,
  smartSearchDonations,
  getRouteRecommendations,
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.all('/recommend-ngos', protect, getRecommendedNgos);
router.post('/freshness', getFreshnessScore);
router.post('/priority', getPriorityScore);
router.get('/analytics', protect, getAnalyticsData);
router.get('/insights', protect, getInsightsData);
router.get('/search', protect, smartSearchDonations);
router.get('/recommend-route/:donationId', protect, getRouteRecommendations);

export default router;
