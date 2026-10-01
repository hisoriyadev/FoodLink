/**
 * AI Controller for FoodLink
 * Exposes API endpoints for Smart NGO recommendations, Freshness & Priority scoring, Analytics, and Smart Search.
 */

import Donation from '../models/Donation.js';
import { calculateFreshness } from '../services/aiFreshnessService.js';
import { calculatePriority } from '../services/aiPriorityService.js';
import { recommendNgos, recommendRouteAndVolunteers } from '../services/aiRecommendationService.js';
import { getAdminAnalytics, getSmartInsights } from '../services/aiAnalyticsService.js';

// @desc    Get top recommended NGOs for a specific donation or draft parameters
// @route   GET /api/ai/recommend-ngos?donationId=... OR POST /api/ai/recommend-ngos
// @access  Private
export const getRecommendedNgos = async (req, res) => {
  try {
    let donation;
    const { donationId } = req.query;

    if (donationId) {
      donation = await Donation.findById(donationId).lean();
      if (!donation) {
        return res.status(404).json({ message: 'Donation not found' });
      }
    } else {
      // Draft payload provided in request body or query params
      const { category, quantity, peopleServed, preparationDate, expiryDate, lat, lng } = req.body || req.query;
      donation = {
        category: category || 'Cooked',
        quantity: Number(quantity) || 10,
        peopleServed: Number(peopleServed) || 20,
        preparationDate: preparationDate || new Date(),
        expiryDate: expiryDate || new Date(Date.now() + 6 * 3600 * 1000),
        location: {
          coordinates: {
            lat: Number(lat) || 28.6139,
            lng: Number(lng) || 77.2090,
          }
        }
      };
    }

    const recommendations = await recommendNgos(donation);
    res.json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error('AI Recommend NGOs Error:', error);
    res.status(500).json({ message: 'Failed to calculate NGO recommendations', error: error.message });
  }
};

// @desc    Calculate Freshness Score & Indicators for a donation
// @route   POST /api/ai/freshness
// @access  Public/Private
export const getFreshnessScore = async (req, res) => {
  try {
    const { preparationDate, expiryDate } = req.body;
    if (!preparationDate || !expiryDate) {
      return res.status(400).json({ message: 'Please provide preparationDate and expiryDate' });
    }

    const freshness = calculateFreshness(preparationDate, expiryDate);
    res.json({ success: true, ...freshness });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating freshness score', error: error.message });
  }
};

// @desc    Calculate Priority Score & Rank for a donation
// @route   POST /api/ai/priority
// @access  Public/Private
export const getPriorityScore = async (req, res) => {
  try {
    const donationData = req.body;
    const priority = calculatePriority(donationData);
    res.json({ success: true, ...priority });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating priority score', error: error.message });
  }
};

// @desc    Get Admin AI Dashboard Analytics (charts, trends, category metrics)
// @route   GET /api/ai/analytics
// @access  Private/Admin
export const getAnalyticsData = async (req, res) => {
  try {
    const analytics = await getAdminAnalytics();
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('AI Analytics Error:', error);
    res.status(500).json({ message: 'Failed to load AI analytics', error: error.message });
  }
};

// @desc    Get AI Insights (Hotspots, peak hours, top active donors)
// @route   GET /api/ai/insights
// @access  Private
export const getInsightsData = async (req, res) => {
  try {
    const insights = await getSmartInsights();
    res.json({ success: true, insights });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate smart insights', error: error.message });
  }
};

// @desc    Smart AI Search donations by multi-criteria (food name, category, location, freshness, priority)
// @route   GET /api/ai/search
// @access  Private
export const smartSearchDonations = async (req, res) => {
  try {
    const { q, category, freshness, minPriority, status = 'available' } = req.query;

    const filter = { status };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'location.city': { $regex: q, $options: 'i' } },
        { 'location.address': { $regex: q, $options: 'i' } },
      ];
    }

    let donations = await Donation.find(filter).populate('donor', 'name organizationName phone').lean();

    // Enrich with dynamic AI scores & filter by AI criteria
    donations = donations.map((d) => {
      const freshnessData = calculateFreshness(d.preparationDate, d.expiryDate);
      const priorityData = calculatePriority(d);
      return {
        ...d,
        freshness: freshnessData,
        priority: priorityData,
        freshnessScore: freshnessData.score,
        priorityScore: priorityData.priorityScore,
      };
    });

    if (freshness) {
      donations = donations.filter((d) => d.freshness.label.toLowerCase() === freshness.toLowerCase());
    }

    if (minPriority) {
      donations = donations.filter((d) => d.priorityScore >= Number(minPriority));
    }

    // Sort by priority score descending by default
    donations.sort((a, b) => b.priorityScore - a.priorityScore);

    res.json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (error) {
    res.status(500).json({ message: 'Smart search failed', error: error.message });
  }
};

// @desc    Get recommended route and nearby volunteers for a donation
// @route   GET /api/ai/recommend-route/:donationId
// @access  Private
export const getRouteRecommendations = async (req, res) => {
  try {
    const { donationId } = req.params;
    const routeData = await recommendRouteAndVolunteers(donationId);
    res.json({ success: true, routeData });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate route recommendations', error: error.message });
  }
};
