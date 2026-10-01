/**
 * Live Tracking Controller for FoodLink
 * Exposes endpoints to post live volunteer GPS updates and fetch active delivery tracking.
 */

import { updateLiveLocation, getTrackingDetails } from '../services/trackingService.js';

// @desc    Update live volunteer coordinates and broadcast socket event
// @route   POST /api/tracking/update-location
// @access  Private (Volunteer)
export const postLocationUpdate = async (req, res) => {
  try {
    const { donationId, lat, lng, status } = req.body;
    if (!donationId || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'Please provide donationId, lat, and lng' });
    }

    const tracking = await updateLiveLocation(req.user._id, donationId, Number(lat), Number(lng), status);
    res.json({ success: true, tracking });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update tracking location', error: error.message });
  }
};

// @desc    Get tracking state & route details for a delivery
// @route   GET /api/tracking/:deliveryId
// @access  Private
export const getTrackingInfo = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const tracking = await getTrackingDetails(deliveryId);
    res.json({ success: true, tracking });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving tracking details', error: error.message });
  }
};
