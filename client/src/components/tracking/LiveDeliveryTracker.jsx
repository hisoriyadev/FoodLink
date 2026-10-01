import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Truck, MapPin, Building, Clock, CheckCircle2, Navigation, Phone, ShieldAlert, Zap
} from 'lucide-react';
import GoogleMapPicker from '../maps/GoogleMapPicker';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_STEPS = [
  { id: 'assigned', label: 'Assigned' },
  { id: 'travelling_to_pickup', label: 'To Pickup' },
  { id: 'food_picked_up', label: 'Food Picked Up' },
  { id: 'travelling_to_ngo', label: 'To NGO' },
  { id: 'delivered', label: 'Delivered' },
];

const LiveDeliveryTracker = ({ donationId }) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useNotifications();

  const fetchTracking = async () => {
    try {
      const res = await api.get(`/tracking/${donationId}`);
      setTracking(res.data.tracking);
    } catch {
      toast.error('Failed to load live tracking details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();

    if (socket && donationId) {
      socket.emit('join:donation', donationId);

      const handleTrackingUpdate = (update) => {
        if (update.donationId === donationId) {
          setTracking((prev) => ({
            ...prev,
            ...update,
          }));
          toast.success(`Live GPS Update: ${update.status.replace(/_/g, ' ')}`);
        }
      };

      socket.on('tracking:update', handleTrackingUpdate);

      return () => {
        socket.emit('leave:donation', donationId);
        socket.off('tracking:update', handleTrackingUpdate);
      };
    }
  }, [donationId, socket]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  const currentStatus = tracking?.status || 'assigned';
  const currentStepIndex = Math.max(0, STATUS_STEPS.findIndex((s) => s.id === currentStatus));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="text-lg font-bold text-slate-900">Live Transport & GPS Tracking</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Real-time volunteer location and estimated time of arrival.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>ETA: ~{tracking?.etaMinutes || 15} Mins</span>
          </div>
          <div className="bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>{tracking?.distanceRemainingKm || 3.8} km remaining</span>
          </div>
        </div>
      </div>

      {/* Progress Status Bar Flow */}
      <div className="py-2">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 -z-0"
            style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
          />

          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div key={step.id} className="flex flex-col items-center z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-[11px] mt-2 font-bold whitespace-nowrap ${isCurrent ? 'text-emerald-600 font-extrabold' : 'text-slate-500'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map Tracker Canvas */}
      <GoogleMapPicker
        height="360px"
        center={tracking?.currentLocation || { lat: 28.6139, lng: 77.2090 }}
        volunteerLocation={tracking?.currentLocation}
        pickupLocation={{ lat: 28.6139, lng: 77.2090 }}
        deliveryLocation={{ lat: 28.6250, lng: 77.2150 }}
      />
    </div>
  );
};

export default LiveDeliveryTracker;
