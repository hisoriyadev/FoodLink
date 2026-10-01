/**
 * Real-Time Delivery Tracking Service for FoodLink
 * Manages live location updates, ETA calculations, status progression, and socket broadcasting.
 */

import Tracking from '../models/Tracking.js';
import Donation from '../models/Donation.js';
import { getDistanceAndEta } from './googleMapsService.js';
import { getIO } from '../utils/socketService.js';

/**
 * Updates volunteer live location and broadcasts real-time tracking update.
 */
export const updateLiveLocation = async (volunteerId, donationId, lat, lng, status) => {
  let tracking = await Tracking.findOne({ donation: donationId });

  const donation = await Donation.findById(donationId).populate('donor assignedTo.ngo').lean();
  if (!donation) throw new Error('Donation not found');

  const destinationCoords =
    status === 'travelling_to_pickup' || status === 'assigned'
      ? {
          lat: donation.location?.coordinates?.lat || 28.6139,
          lng: donation.location?.coordinates?.lng || 77.2090,
        }
      : {
          lat: donation.assignedTo?.ngo?.location?.coordinates?.lat || 28.6250,
          lng: donation.assignedTo?.ngo?.location?.coordinates?.lng || 77.2150,
        };

  const { distanceKm, etaMinutes } = await getDistanceAndEta({ lat, lng }, destinationCoords);

  if (!tracking) {
    tracking = new Tracking({
      donation: donationId,
      volunteer: volunteerId,
      currentLocation: { lat, lng },
      status: status || 'assigned',
      etaMinutes,
      distanceRemainingKm: distanceKm,
      routeHistory: [{ lat, lng, timestamp: new Date() }],
    });
  } else {
    tracking.currentLocation = { lat, lng };
    if (status) tracking.status = status;
    tracking.etaMinutes = etaMinutes;
    tracking.distanceRemainingKm = distanceKm;
    tracking.lastUpdated = new Date();
    tracking.routeHistory.push({ lat, lng, timestamp: new Date() });
  }

  await tracking.save();

  // Also update Donation status if tracking status updated
  if (status && status !== donation.status) {
    const statusMap = {
      food_picked_up: 'picked_up',
      delivered: 'delivered',
      completed: 'delivered',
    };
    if (statusMap[status]) {
      await Donation.findByIdAndUpdate(donationId, { status: statusMap[status] });
    }
  }

  // Broadcast real-time Socket event to tracking room
  try {
    const io = getIO();
    const payload = {
      donationId,
      volunteerId,
      currentLocation: { lat, lng },
      status: tracking.status,
      etaMinutes,
      distanceRemainingKm: distanceKm,
      lastUpdated: tracking.lastUpdated,
    };

    io.to(`donation:${donationId}`).emit('tracking:update', payload);

    // Notify donor & NGO rooms specifically
    if (donation.donor) {
      io.to(`user:${donation.donor._id || donation.donor}`).emit('tracking:update', payload);
    }
    if (donation.assignedTo?.ngo) {
      io.to(`user:${donation.assignedTo.ngo._id || donation.assignedTo.ngo}`).emit('tracking:update', payload);
    }
  } catch (err) {
    console.error('Socket Broadcast Error in tracking update:', err.message);
  }

  return tracking;
};

/**
 * Gets current tracking state for a donation.
 */
export const getTrackingDetails = async (donationId) => {
  let tracking = await Tracking.findOne({ donation: donationId })
    .populate('volunteer', 'name phone')
    .populate({
      path: 'donation',
      populate: [
        { path: 'donor', select: 'name organizationName phone location address' },
        { path: 'assignedTo.ngo', select: 'name organizationName phone location address' },
      ],
    })
    .lean();

  if (!tracking) {
    // Return mock initial tracking state if not created yet
    const donation = await Donation.findById(donationId)
      .populate('donor', 'name organizationName phone location address')
      .populate('assignedTo.ngo', 'name organizationName phone location address')
      .populate('assignedTo.volunteer', 'name phone')
      .lean();

    if (!donation) throw new Error('Donation not found');

    return {
      donation: donationId,
      volunteer: donation.assignedTo?.volunteer || null,
      currentLocation: {
        lat: donation.location?.coordinates?.lat || 28.6139,
        lng: donation.location?.coordinates?.lng || 77.2090,
      },
      status: donation.status === 'delivered' ? 'delivered' : donation.status === 'picked_up' ? 'travelling_to_ngo' : 'assigned',
      etaMinutes: 20,
      distanceRemainingKm: 4.2,
      routeHistory: [],
      donationDetails: donation,
    };
  }

  return tracking;
};
