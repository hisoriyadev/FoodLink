/**
 * AI Priority Calculation Service for FoodLink
 * Computes priority index (0-100+) using expiry urgency, quantity, people served, and food type weights.
 */

import { calculateFreshness } from './aiFreshnessService.js';

const CATEGORY_WEIGHTS = {
  Cooked: 1.4,     // High urgency
  Baked: 1.2,
  Raw: 1.1,
  Beverages: 1.0,
  Packaged: 0.8,
  Other: 0.9,
};

/**
 * Calculates priority score & rank for a donation.
 * @param {Object} donation 
 * @param {Object} [donorLocation] { lat, lng }
 * @returns {Object} { priorityScore, level, color, badgeClass }
 */
export const calculatePriority = (donation, donorLocation = null) => {
  const freshness = calculateFreshness(donation.preparationDate, donation.expiryDate);

  // 1. Expiry Urgency Score (0-50 pts): standard inverse of remaining time
  let urgencyScore = 0;
  if (freshness.remainingHours <= 2) {
    urgencyScore = 50;
  } else if (freshness.remainingHours <= 6) {
    urgencyScore = 40;
  } else if (freshness.remainingHours <= 12) {
    urgencyScore = 30;
  } else if (freshness.remainingHours <= 24) {
    urgencyScore = 20;
  } else {
    urgencyScore = 10;
  }

  // 2. Quantity & Impact Score (0-30 pts): Higher volume/people served gets higher priority
  const people = donation.peopleServed || donation.quantity * 2 || 1;
  const quantityScore = Math.min(30, Math.round(Math.log2(people + 1) * 5));

  // 3. Category Urgency Multiplier
  const categoryMultiplier = CATEGORY_WEIGHTS[donation.category] || 1.0;

  // 4. Raw Priority Calculation
  let rawScore = Math.round((urgencyScore + quantityScore) * categoryMultiplier);

  // Adjust for expired items
  if (freshness.label === 'Expired') {
    rawScore = 0;
  }

  const priorityScore = Math.max(0, Math.min(100, rawScore));

  let level = 'Low';
  let color = '#64748b'; // Slate
  let badgeClass = 'bg-slate-100 text-slate-700 border-slate-300';

  if (priorityScore >= 75) {
    level = 'Critical';
    color = '#dc2626'; // Red
    badgeClass = 'bg-red-500 text-white font-bold animate-pulse shadow-sm';
  } else if (priorityScore >= 50) {
    level = 'High';
    color = '#f97316'; // Orange
    badgeClass = 'bg-orange-100 text-orange-800 border-orange-300 font-semibold';
  } else if (priorityScore >= 30) {
    level = 'Medium';
    color = '#3b82f6'; // Blue
    badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
  }

  return {
    priorityScore,
    level,
    color,
    badgeClass,
  };
};
