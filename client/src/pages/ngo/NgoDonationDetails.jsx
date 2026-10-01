import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Clock, PackageOpen, Info, AlertTriangle,
  Truck, CheckCircle2, Calendar, Phone, Mail, User, XCircle,
  HelpCircle, Compass, Heart, Share2, ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotifications } from '../../context/NotificationContext';

const NgoDonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  
  // Modals / Dropdowns
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');

  const fetchDonation = async () => {
    try {
      const { data } = await api.get(`/ngo/donations/${id}`);
      setDonation(data);
    } catch {
      toast.error('Failed to load donation details');
      navigate('/dashboard/ngo/available');
    }
  };

  const fetchVolunteers = async () => {
    try {
      const { data } = await api.get('/ngo/volunteers');
      setVolunteers(data);
    } catch {
      console.error('Failed to load volunteers');
    }
  };

  const { socket } = useNotifications();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDonation(), fetchVolunteers()]);
      setLoading(false);
    };
    init();

    if (socket) {
      socket.emit('join:donation', id);
      const handleUpdate = (updatedDonation) => {
        if (updatedDonation._id === id) {
          setDonation(updatedDonation);
          toast.success('Live update: Donation details updated!');
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
      <div className="flex flex-col justify-center items-center h-96 space-y-4 animate-pulse">
        <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading donation details...</p>
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

  const handleClaim = async () => {
    try {
      await api.post('/ngo/accept', { donationId: donation._id });
      toast.success('Donation claimed successfully!');
      fetchDonation();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim donation');
    }
  };

  const handleAssignVolunteer = async () => {
    if (!selectedVolunteer) {
      toast.error('Please select a volunteer');
      return;
    }
    try {
      await api.post('/ngo/request-volunteer', {
        donationId: donation._id,
        volunteerId: selectedVolunteer
      });
      toast.success('Volunteer assignment updated successfully!');
      setShowAssignModal(false);
      fetchDonation();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign volunteer');
    }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel your request for this food donation? It will become available to other NGOs.')) return;
    try {
      // Patch status back to available and clear assigned NGO
      await api.patch('/donations/status', {
        donationId: donation._id,
        status: 'available'
      });
      toast.success('Request cancelled successfully');
      navigate('/dashboard/ngo/available');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleMarkReceived = async () => {
    if (!window.confirm('Confirm that this food donation has been successfully received/delivered?')) return;
    try {
      await api.patch('/donations/status', {
        donationId: donation._id,
        status: 'delivered'
      });
      toast.success('Donation marked as delivered/received');
      fetchDonation();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Check roles / states
  const isAvailable = donation.status === 'available';
  const isClaimedByMe = donation.statusHistory.some(h => h.status === 'claimed' && h.updatedBy === donation.assignedTo?.ngo?._id);
  const statusColors = {
    available: 'bg-emerald-500 text-white',
    claimed: 'bg-blue-500 text-white',
    picked_up: 'bg-indigo-500 text-white',
    delivered: 'bg-green-500 text-white',
    expired: 'bg-red-500 text-white',
    cancelled: 'bg-slate-500 text-white',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </button>

        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[donation.status] || 'bg-slate-100'}`}>
          {donation.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {/* Gallery */}
            <div className="bg-slate-50 p-6 flex flex-col items-center justify-center border-b border-slate-200">
              {donation.images && donation.images.length > 0 ? (
                <div className="w-full">
                  <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-white border border-slate-200 relative mb-4">
                    <img
                      src={donation.images[activeImage].url}
                      alt="Food donation banner"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {donation.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {donation.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImage(idx)}
                          className={`w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 transition-all ${activeImage === idx ? 'border-emerald-500 shadow-md' : 'border-slate-200'}`}
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/9] w-full bg-slate-150 rounded-lg flex flex-col items-center justify-center text-slate-400">
                  <PackageOpen className="w-16 h-16 mb-2" />
                  <p className="font-semibold text-sm">No images provided by donor</p>
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">
                  {donation.category}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">{donation.title}</h1>
                <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed">{donation.description}</p>
              </div>

              {/* Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Quantity</p>
                  <p className="text-base font-bold text-slate-800 mt-1">{donation.quantity} {donation.unit}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Serves</p>
                  <p className="text-base font-bold text-slate-800 mt-1">{donation.peopleServed} People</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Type</p>
                  <p className="text-base font-bold text-slate-800 mt-1">{donation.dietary?.isVeg ? 'Vegetarian 🟢' : 'Non-Vegetarian 🔴'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Condition</p>
                  <p className="text-base font-bold text-slate-800 mt-1">{donation.foodCondition}</p>
                </div>
              </div>

              {/* Specification Grid */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h3 className="text-base font-bold text-slate-800">Operational details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium text-slate-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span>Preparation: <strong className="text-slate-800 font-semibold">{formatDate(donation.preparationDate)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span>Expiration: <strong className="text-red-600 font-semibold">{formatDate(donation.expiryDate)} ({getExpiryText(donation.expiryDate)})</strong></span>
                  </div>
                  <div className="sm:col-span-2 flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <span>Pickup Window: <strong className="text-slate-800 font-semibold">{formatDate(donation.pickupWindow?.start)} — {formatDate(donation.pickupWindow?.end)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Special instructions */}
              {donation.specialInstructions && (
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-base font-bold text-slate-800 mb-2">Instructions from donor</h3>
                  <div className="bg-orange-50 border border-orange-200 text-orange-950 p-4 rounded-xl text-sm flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <p>{donation.specialInstructions}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Google Maps / Address Block */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="text-emerald-600 w-5 h-5" /> Pickup address & location
            </h3>
            <div className="text-sm font-medium text-slate-700">
              <p className="font-bold text-slate-900">{donation.location?.address}</p>
              <p>{donation.location?.city}, {donation.location?.state} {donation.location?.pincode}</p>
            </div>

            {/* Embedded Visual Map Container */}
            <div className="w-full h-64 rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200 flex flex-col justify-center items-center text-slate-400">
              <iframe
                title="Google Map Location"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${donation.location?.coordinates?.lat || 12.9716},${donation.location?.coordinates?.lng || 77.5946}&z=15&output=embed`}
              />
            </div>
          </div>
        </div>

        {/* Action Panel Side Column */}
        <div className="space-y-6">
          {/* Main Action Actions */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">NGO claim actions</h3>
            
            {isAvailable ? (
              <button
                onClick={handleClaim}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Claim Donation
              </button>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-lg capitalize">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  {donation.status.replace('_', ' ')}
                </div>

                {/* Cancel action if claimed or volunteer requested */}
                {['claimed', 'picked_up'].includes(donation.status) && (
                  <button
                    onClick={handleCancelRequest}
                    className="w-full py-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Cancel Request
                  </button>
                )}

                {/* Mark as Received if status is picked_up or claimed */}
                {['claimed', 'picked_up'].includes(donation.status) && (
                  <button
                    onClick={handleMarkReceived}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Received
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Volunteer Assignment card */}
          {!isAvailable && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="text-blue-500 w-5 h-5" /> Volunteer details
              </h3>
              
              {donation.assignedTo?.volunteer ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm font-medium space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                      {donation.assignedTo.volunteer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{donation.assignedTo.volunteer.name}</h4>
                      <p className="text-xs text-slate-500">Delivery Volunteer</p>
                    </div>
                  </div>
                  <div className="space-y-1 pt-2 text-xs border-t border-blue-200/50">
                    <p className="flex items-center gap-1.5 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {donation.assignedTo.volunteer.phone || 'N/A'}
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {donation.assignedTo.volunteer.email}
                    </p>
                  </div>

                  {/* Re-assign Volunteer button */}
                  {['claimed', 'picked_up'].includes(donation.status) && (
                    <button
                      onClick={() => { setSelectedVolunteer(donation.assignedTo.volunteer._id); setShowAssignModal(true); }}
                      className="w-full mt-2 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Change Volunteer
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">No volunteer has been assigned to pick up this donation yet.</p>
                  {['claimed', 'picked_up'].includes(donation.status) && (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <User className="w-4 h-4" /> Assign Volunteer
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Contact Information card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="text-slate-500 w-5 h-5" /> Donor contact
            </h3>
            <div className="space-y-3">
              <div className="text-sm font-bold text-slate-800">
                {donation.donor?.organizationDetails?.name || donation.donor?.name || 'Private Donor'}
              </div>
              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{donation.contactNumber || donation.donor?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{donation.donor?.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Volunteer Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Truck className="w-5 h-5 text-blue-500" /> Select Volunteer
                </h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <label className="block text-sm font-semibold text-slate-700">Available Volunteers</label>
                <select
                  value={selectedVolunteer}
                  onChange={(e) => setSelectedVolunteer(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select a Volunteer...</option>
                  {volunteers.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.status})
                    </option>
                  ))}
                </select>

                <div className="text-xs text-slate-500 flex gap-1.5 p-3 bg-slate-50 border rounded-lg">
                  <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p>Assigning a volunteer will notify them to collect this food donation from the donor location.</p>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignVolunteer}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  Assign Volunteer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NgoDonationDetails;
