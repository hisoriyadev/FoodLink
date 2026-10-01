/**
 * Google Maps & Geocoding Service for FoodLink
 * Provides address geocoding, reverse geocoding, and distance calculations.
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

/**
 * Calculates distance in km and estimated transit time in minutes between two coordinates.
 */
export const getDistanceAndEta = async (origin, destination) => {
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        return {
          distanceKm: parseFloat((element.distance.value / 1000).toFixed(1)),
          etaMinutes: Math.round(element.duration.value / 60),
        };
      }
    } catch (error) {
      console.error('Google Maps API Error, using fallback:', error.message);
    }
  }

  // Fallback Haversine Calculation
  const R = 6371;
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLon = ((destination.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = parseFloat((R * c).toFixed(1));
  const etaMinutes = Math.max(5, Math.round(distanceKm * 3.5 + 5));

  return { distanceKm, etaMinutes };
};

/**
 * Geocodes an address string to lat/lng coordinates.
 */
export const geocodeAddress = async (address) => {
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results[0]) {
        const loc = data.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
      }
    } catch (error) {
      console.error('Geocoding Error:', error.message);
    }
  }

  // Fallback default coordinates
  return { lat: 28.6139, lng: 77.2090 };
};

/**
 * Reverse geocodes lat/lng coordinates to a human readable address.
 */
export const reverseGeocode = async (lat, lng) => {
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results[0]) {
        return data.results[0].formatted_address;
      }
    } catch (error) {
      console.error('Reverse Geocoding Error:', error.message);
    }
  }

  return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
};
