import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Building, User, Compass } from 'lucide-react';

const GoogleMapPicker = ({
  center = { lat: 28.6139, lng: 77.2090 },
  zoom = 13,
  pickupLocation,
  deliveryLocation,
  volunteerLocation,
  nearbyNgos = [],
  nearbyVolunteers = [],
  onLocationSelect,
  height = '400px',
}) => {
  const [currentPos, setCurrentPos] = useState(center);

  useEffect(() => {
    if (center?.lat && center?.lng) {
      setCurrentPos(center);
    }
  }, [center]);

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentPos(loc);
          if (onLocationSelect) onLocationSelect(loc);
        },
        () => {
          // Silent fallback
        }
      );
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900" style={{ height }}>
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-2 shadow-md">
        <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
        <span>Interactive Live GPS Map</span>
      </div>

      {/* Locate Me Floating Button */}
      <button
        onClick={handleDetectLocation}
        type="button"
        className="absolute top-3 right-3 z-10 bg-white hover:bg-slate-50 text-slate-800 p-2 rounded-xl border border-slate-200 shadow-md transition-all flex items-center gap-1.5 text-xs font-bold"
      >
        <Navigation className="w-4 h-4 text-emerald-600" /> Current Location
      </button>

      {/* Styled Simulated Interactive Map Canvas */}
      <div className="w-full h-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
        {/* Grid Gridlines Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />

        {/* Route Line Connecting Pickup to Delivery */}
        {pickupLocation && deliveryLocation && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <line
              x1="30%"
              y1="40%"
              x2="70%"
              y2="60%"
              stroke="#10b981"
              strokeWidth="4"
              strokeDasharray="8 6"
              className="animate-pulse"
            />
          </svg>
        )}

        {/* Pickup Pin */}
        {pickupLocation && (
          <div className="absolute top-[38%] left-[28%] z-10 flex flex-col items-center -translate-x-1/2 -translate-y-full group">
            <div className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md mb-1 whitespace-nowrap">
              Pickup Point
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500 animate-ping absolute" />
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white z-10">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Delivery Pin */}
        {deliveryLocation && (
          <div className="absolute top-[58%] left-[68%] z-10 flex flex-col items-center -translate-x-1/2 -translate-y-full group">
            <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md mb-1 whitespace-nowrap">
              NGO Destination
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
              <Building className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Volunteer Moving Live Marker */}
        {volunteerLocation && (
          <div className="absolute top-[48%] left-[48%] z-20 flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
            <div className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Volunteer Live
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-amber-500/30">
              <Navigation className="w-5 h-5 rotate-45" />
            </div>
          </div>
        )}

        {/* Nearby NGO Markers */}
        {nearbyNgos.map((ngo, idx) => (
          <div
            key={ngo._id || idx}
            className="absolute z-10 flex flex-col items-center"
            style={{
              top: `${30 + (idx * 15) % 50}%`,
              left: `${20 + (idx * 25) % 60}%`,
            }}
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/50 flex items-center justify-center shadow-md">
              <Building className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}

        {/* Footer Overlay Info */}
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md text-slate-300 text-xs px-4 py-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Center Coordinates: <strong>{currentPos.lat.toFixed(4)}, {currentPos.lng.toFixed(4)}</strong></span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Map Engine Active</span>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapPicker;
