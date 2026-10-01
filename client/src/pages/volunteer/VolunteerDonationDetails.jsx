import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Clock, PackageOpen, Info, AlertTriangle,
  Truck, CheckCircle2, Phone, Mail, User, Shield, Compass,
  Map, MessageSquare, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotifications } from '../../context/NotificationContext';

const VolunteerDonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);

  const { socket } = useNotifications();

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/ngo/donations/${id}`);
      setDonation(res.data);
    } catch {
      toast.error('Failed to load delivery details');
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchDetails();
      setLoading(false);
    };
    init();

    if (socket) {
      socket.emit('join:donation', id);
      const handleUpdate = (updatedDonation) => {
        if (updatedDonation._id === id) {
          setDonation(updatedDonation);
          toast.success('Live update: Status changed!');
        }
      };
      socket.on('donation:updated', handleUpdate);
      return () => {
        socket.emit('leave:donation', id);
        socket.off('donation:updated', handleUpdate);
      };
    }
  }, [id, socket]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading route & details...</p>
      </div>
    );
  }

  if (!donation) return null;

  const getExpiryText = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d left`;
    }
    return `${hours}h ${mins}m left`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  };

  const handleUpdateStatus = async (targetStatus, note) => {
    try {
      if (targetStatus === 'picked_up') {
        await api.patch('/volunteer/picked-up', { donationId: donation._id, note });
      } else if (targetStatus === 'delivered') {
        await api.patch('/volunteer/delivered', { donationId: donation._id, note });
      } else if (targetStatus === 'on_way_to_pickup') {
        await api.patch('/volunteer/start-pickup', { donationId: donation._id, note });
      } else if (targetStatus === 'on_way_to_ngo') {
        await api.patch('/volunteer/on-way-to-ngo', { donationId: donation._id, note });
      } else {
        await api.post('/volunteer/update-status', { donationId: donation._id, status: targetStatus, note });
      }
      toast.success(`Delivery status updated to: ${targetStatus.replace('_', ' ')}`);
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update delivery progress');
    }
  };

  const isDelivered = donation.status === 'delivered';
  const statusColors = {
    claimed: 'bg-blue-500 text-white',
    picked_up: 'bg-indigo-500 text-white',
    delivered: 'bg-green-500 text-white',
    expired: 'bg-red-500 text-white',
    cancelled: 'bg-slate-500 text-white',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </button>

        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[donation.status] || 'bg-slate-100'}`}>
          {donation.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Route Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {/* Header info */}
            <div className="p-6 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">
                {donation.category}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-3">{donation.title}</h1>
              <p className="text-slate-500 text-xs mt-1">Quantity: {donation.quantity} {donation.unit} • Serves {donation.peopleServed} people</p>
            </div>

            {/* Step-by-Step Delivery Action Console */}
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-500" /> Transit Dashboard
              </h3>

              {isDelivered ? (
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Delivery successfully completed! Excellent work.
                </div>
              ) : (
                <div className="space-y-4">
                  {donation.status === 'claimed' && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-white border p-4 rounded-xl">
                      <div className="text-xs font-semibold text-slate-600">
                        <p className="font-bold text-slate-800 text-sm">Step 1: Pick up food from Donor</p>
                        <p className="text-slate-400 mt-1">Arrive at the donor location, verify the items, and click button below.</p>
                      </div>
                      <button
                        onClick={() => handleUpdateStatus('picked_up', 'Surplus food items picked up by volunteer and in-transit.')}
                        className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                      >
                        Mark Picked Up
                      </button>
                    </div>
                  )}

                  {donation.status === 'picked_up' && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-white border p-4 rounded-xl">
                      <div className="text-xs font-semibold text-slate-600">
                        <p className="font-bold text-slate-800 text-sm">Step 2: Deliver food to NGO</p>
                        <p className="text-slate-400 mt-1">Arrive at the NGO office, handover the package, and mark delivery completed.</p>
                      </div>
                      <button
                        onClick={() => handleUpdateStatus('delivered', 'Surplus food packages safely delivered to NGO facility.')}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                      >
                        Mark Delivered
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Address Block */}
            <div className="p-6 space-y-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Map className="w-4 h-4 text-emerald-600" /> Route Addresses
              </h3>
              
              <div className="relative border-l-2 border-dashed border-slate-200 pl-6 ml-3 space-y-6 text-xs font-semibold text-slate-600">
                {/* Pickup Address */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 w-4.5 h-4.5 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm">A</span>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Pickup Location (Donor)</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{donation.donor?.organizationDetails?.name || donation.donor?.name}</p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">{donation.location?.address}</p>
                    <p className="text-slate-500 mt-0.5">{donation.location?.city}, {donation.location?.state} {donation.location?.pincode}</p>
                  </div>
                </div>

                {/* Dropoff Address */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 w-4.5 h-4.5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm">B</span>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Dropoff Location (NGO)</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{donation.assignedTo?.ngo?.organizationDetails?.name || donation.assignedTo?.ngo?.name}</p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">{donation.assignedTo?.ngo?.organizationDetails?.address || 'NGO Office Facility Address'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Embedded Google Route Map */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5">
              <Compass className="text-emerald-600 w-4.5 h-4.5" /> Route Map
            </h3>
            <div className="w-full h-64 rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200">
              <iframe
                title="Google Maps Route directions"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?saddr=${donation.location?.coordinates?.lat || 12.9716},${donation.location?.coordinates?.lng || 77.5946}&daddr=Bangalore&z=12&output=embed`}
              />
            </div>
          </div>
        </div>

        {/* Contacts Column */}
        <div className="space-y-6">
          {/* Timeline details */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Pickup Deadline</h3>
            <div className="space-y-3 font-medium text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Limit: <strong className="text-red-600 font-bold">{formatDate(donation.pickupWindow?.end)} ({getExpiryText(donation.expiryDate)})</strong></span>
              </div>
            </div>
          </div>

          {/* Donor Contact Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
              <User className="text-orange-500 w-4 h-4" /> Donor Contact
            </h3>
            <div className="space-y-3">
              <div className="text-sm font-bold text-slate-800">
                {donation.donor?.organizationDetails?.name || donation.donor?.name || 'Private Donor'}
              </div>
              <div className="space-y-2 text-xs font-semibold text-slate-650">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{donation.contactNumber || donation.donor?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{donation.donor?.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* NGO Contact Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
              <User className="text-blue-500 w-4 h-4" /> NGO Coordinator
            </h3>
            <div className="space-y-3">
              <div className="text-sm font-bold text-slate-800">
                {donation.assignedTo?.ngo?.organizationDetails?.name || donation.assignedTo?.ngo?.name || 'Assigned NGO'}
              </div>
              <div className="space-y-2 text-xs font-semibold text-slate-650">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{donation.assignedTo?.ngo?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{donation.assignedTo?.ngo?.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VolunteerDonationDetails;
