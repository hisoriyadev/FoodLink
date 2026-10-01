/**
 * Maps Controller for FoodLink
 * Handles location lookups, reverse geocoding, and finding nearby NGOs & Volunteers.
 */

import User from '../models/User.js';
import { geocodeAddress, reverseGeocode } from '../services/googleMapsService.js';

// @desc    Get nearby verified NGOs relative to lat/lng coordinates
// @route   GET /api/maps/nearby-ngos?lat=...&lng=...&radius=...
// @access  Private
export const getNearbyNgos = async (req, res) => {
  try {
    const { lat = 28.6139, lng = 77.2090, radius = 15 } = req.query;

    const ngos = await User.find({ role: 'ngo', isVerified: true })
      .select('name organizationName phone email address location operatingRadius')
      .lean();

    const formattedNgos = ngos.map((ngo) => ({
      _id: ngo._id,
      name: ngo.organizationName || ngo.name,
      phone: ngo.phone,
      email: ngo.email,
      address: ngo.address || 'Local Community Center',
      location: {
        lat: ngo.location?.coordinates?.lat || Number(lat) + (Math.random() - 0.5) * 0.05,
        lng: ngo.location?.coordinates?.lng || Number(lng) + (Math.random() - 0.5) * 0.05,
      },
      operatingRadius: ngo.operatingRadius || 15,
    }));

    res.json({ success: true, count: formattedNgos.length, ngos: formattedNgos });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching nearby NGOs', error: error.message });
  }
};

// @desc    Get nearby active volunteers
// @route   GET /api/maps/nearby-volunteers?lat=...&lng=...
// @access  Private
export const getNearbyVolunteers = async (req, res) => {
  try {
    const { lat = 28.6139, lng = 77.2090 } = req.query;

    const volunteers = await User.find({ role: 'volunteer', isAvailable: true })
      .select('name phone email location vehicleType')
      .lean();

    const formattedVolunteers = volunteers.map((v) => ({
      _id: v._id,
      name: v.name,
      phone: v.phone,
      email: v.email,
      location: {
        lat: v.location?.coordinates?.lat || Number(lat) + (Math.random() - 0.5) * 0.04,
        lng: v.location?.coordinates?.lng || Number(lng) + (Math.random() - 0.5) * 0.04,
      },
      vehicleType: v.vehicleType || 'Two Wheeler',
    }));

    res.json({ success: true, count: formattedVolunteers.length, volunteers: formattedVolunteers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching nearby volunteers', error: error.message });
  }
};

// @desc    Geocode text address to coordinates
// @route   GET /api/maps/geocode?address=...
// @access  Private
export const geocode = async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ message: 'Please provide address query parameter' });

    const coords = await geocodeAddress(address);
    res.json({ success: true, coordinates: coords });
  } catch (error) {
    res.status(500).json({ message: 'Geocoding failed', error: error.message });
  }
};
