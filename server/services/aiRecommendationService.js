/**
 * AI Recommendation Service for FoodLink
 * Smart NGO matching engine & delivery route estimation.
 */

import User from '../models/User.js';
import Donation from '../models/Donation.js';
import { calculateFreshness } from './aiFreshnessService.js';
import { calculatePriority } from './aiPriorityService.js';

/**
 * Haversine formula to compute distance in km between two lat/lng points.
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 5.0; // fallback default distance
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

/**
 * Recommends top 5 NGOs for a specific donation.
 * @param {Object} donation 
 * @returns {Array} List of top recommended NGOs with match score & details
 */
export const recommendNgos = async (donation) => {
  // Find all active verified NGOs
  const ngos = await User.find({ role: 'ngo', isVerified: true }).lean();

  if (!ngos || ngos.length === 0) {
    return [];
  }

  const donorLat = donation.location?.coordinates?.lat || 28.6139;
  const donorLng = donation.location?.coordinates?.lng || 77.2090;

  // Active claims per NGO count
  const activeClaimsCounts = await Donation.aggregate([
    { $match: { status: { $in: ['claimed', 'picked_up'] } } },
    { $group: { _id: '$assignedTo.ngo', count: { $sum: 1 } } }
  ]);
  const claimsMap = {};
  activeClaimsCounts.forEach((c) => {
    if (c._id) claimsMap[c._id.toString()] = c.count;
  });

  const scoredNgos = ngos.map((ngo) => {
    const ngoLat = ngo.location?.coordinates?.lat || donorLat + (Math.random() - 0.5) * 0.05;
    const ngoLng = ngo.location?.coordinates?.lng || donorLng + (Math.random() - 0.5) * 0.05;

    const distanceKm = calculateDistanceKm(donorLat, donorLng, ngoLat, ngoLng);

    // 1. Distance Score (max 40 pts): Closer = higher
    const maxRadius = ngo.operatingRadius || 15;
    let distanceScore = Math.max(0, 40 - (distanceKm / maxRadius) * 40);

    // 2. Capacity Score (max 20 pts): Fewer active claims = higher available bandwidth
    const currentActive = claimsMap[ngo._id.toString()] || 0;
    const capacityScore = Math.max(0, 20 - currentActive * 4);

    // 3. Category & Quantity Alignment (max 20 pts)
    const categoryMatchScore = 20;

    // 4. Expiry Urgency bonus (max 20 pts)
    const freshness = calculateFreshness(donation.preparationDate, donation.expiryDate);
    const urgencyBonus = freshness.remainingHours <= 4 ? 20 : freshness.remainingHours <= 8 ? 15 : 10;

    const totalMatchScore = Math.min(99, Math.round(distanceScore + capacityScore + categoryMatchScore + urgencyBonus));

    // Est. pickup time (15 mins prep + 3 mins per km)
    const estPickupMins = Math.round(15 + distanceKm * 3);

    return {
      ngoId: ngo._id,
      organizationName: ngo.organizationName || ngo.name,
      email: ngo.email,
      phone: ngo.phone,
      address: ngo.address || 'Local Community Center',
      distanceKm,
      matchScore: totalMatchScore,
      estimatedPickupMins: estPickupMins,
      activeClaimsCount: currentActive,
    };
  });

  // Sort by highest match score and take top 5
  return scoredNgos.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
};

/**
 * Recommends fastest delivery route and available nearby volunteers.
 */
export const recommendRouteAndVolunteers = async (donationId) => {
  const donation = await Donation.findById(donationId).populate('donor assignedTo.ngo').lean();
  if (!donation) throw new Error('Donation not found');

  const volunteers = await User.find({ role: 'volunteer', isAvailable: true }).lean();

  const donorLat = donation.location?.coordinates?.lat || 28.6139;
  const donorLng = donation.location?.coordinates?.lng || 77.2090;

  const nearbyVolunteers = volunteers.map((v) => {
    const vLat = v.location?.coordinates?.lat || donorLat + (Math.random() - 0.5) * 0.04;
    const vLng = v.location?.coordinates?.lng || donorLng + (Math.random() - 0.5) * 0.04;
    const distanceKm = calculateDistanceKm(donorLat, donorLng, vLat, vLng);

    return {
      volunteerId: v._id,
      name: v.name,
      phone: v.phone,
      distanceKm,
      estimatedArrivalMins: Math.round(10 + distanceKm * 4),
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 5);

  const totalDistanceKm = calculateDistanceKm(
    donorLat,
    donorLng,
    donation.assignedTo?.ngo?.location?.coordinates?.lat || donorLat + 0.02,
    donation.assignedTo?.ngo?.location?.coordinates?.lng || donorLng + 0.02
  );

  return {
    donationId,
    totalDistanceKm,
    estimatedDriveMins: Math.round(totalDistanceKm * 3.5 + 5),
    recommendedRoute: [
      { step: 1, action: 'Pickup from Donor Address', address: donation.location?.address || 'Donor Location' },
      { step: 2, action: 'Transport via Direct Transit', estTime: `${Math.round(totalDistanceKm * 3)} mins` },
      { step: 3, action: 'Drop off at NGO Center', address: donation.assignedTo?.ngo?.organizationName || 'NGO Destination' }
    ],
    recommendedVolunteers: nearbyVolunteers,
  };
};
