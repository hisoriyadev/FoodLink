import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Compass, Clock, Truck, CheckCircle2, User, Phone, Mail,
  Calendar, ArrowRight, Package, RefreshCw, Eye, XCircle, Info
} from 'lucide-react';

const STATUS_TEXT = {
  claimed: 'Claimed (Preparing for pickup)',
  picked_up: 'Picked Up (In Transit)',
  delivered: 'Delivered / Received',
};

const STATUS_CLASSES = {
  claimed: 'bg-blue-50 border border-blue-200 text-blue-800',
  picked_up: 'bg-indigo-50 border border-indigo-200 text-indigo-800',
  delivered: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
};

const AcceptedDonations = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [volunteers, setVolunteers] = useState([]);
  
  // Volunteer assign modal state
  const [activeClaimId, setActiveClaimId] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  const fetchClaims = async () => {
    try {
      const res = await api.get('/ngo/claims');
      setClaims(res.data);
    } catch {
      toast.error('Failed to load active requests');
    }
  };

  const fetchVolunteers = async () => {
    try {
      const res = await api.get('/ngo/volunteers');
      setVolunteers(res.data);
    } catch {
      console.error('Failed to load volunteers');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchClaims(), fetchVolunteers()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleMarkReceived = async (claimId) => {
    if (!window.confirm('Mark this donation as successfully received/delivered?')) return;
    try {
      await api.patch('/donations/status', {
        donationId: claimId,
        status: 'delivered'
      });
      toast.success('Food donation received successfully!');
      fetchClaims();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCancelRequest = async (claimId) => {
    if (!window.confirm('Are you sure you want to cancel this request? The food item will become available for other NGOs.')) return;
    try {
      await api.patch('/donations/status', {
        donationId: claimId,
        status: 'available'
      });
      toast.success('Request cancelled successfully');
      fetchClaims();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const openAssignModal = (claim) => {
    setActiveClaimId(claim._id);
    setSelectedVolunteer(claim.assignedTo?.volunteer?._id || '');
    setShowAssignModal(true);
  };

  const handleAssignVolunteer = async () => {
    if (!selectedVolunteer) {
      toast.error('Please select a volunteer');
      return;
    }
    try {
      await api.post('/ngo/request-volunteer', {
        donationId: activeClaimId,
        volunteerId: selectedVolunteer
      });
      toast.success('Volunteer assigned successfully!');
      setShowAssignModal(false);
      fetchClaims();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign volunteer');
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Food Requests</h2>
          <p className="text-sm text-slate-500 mt-1">Track and manage active claims, coordinate pick ups, and assign volunteers.</p>
        </div>
        <button
          onClick={fetchClaims}
          className="p-2 border rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse p-6 space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-10 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center bg-white border border-slate-200 rounded-xl py-16 px-4">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-800">No active food requests</h3>
          <p className="mt-1 text-sm text-slate-500">You do not have any active food listings claimed at this time.</p>
          <Link
            to="/dashboard/ngo/available"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            Claim food listings <ArrowRight className="ml-1.5 w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {claims.map((claim) => (
            <motion.div
              layout
              key={claim._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row"
            >
              {/* Image Thumbnail Column */}
              <div className="w-full md:w-60 bg-slate-100 flex-shrink-0 relative h-48 md:h-auto">
                {claim.images && claim.images.length > 0 ? (
                  <img
                    src={claim.images[0].url}
                    alt={claim.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                    <Package className="w-10 h-10 mb-1" />
                    <span className="text-xs font-bold uppercase">{claim.category}</span>
                  </div>
                )}
                <span className={`absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-bold uppercase ${claim.dietary?.isVeg ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                  {claim.dietary?.isVeg ? 'Veg' : 'Non-Veg'}
                </span>
              </div>

              {/* Body Column */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full capitalize">
                        {claim.category}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Quantity: {claim.quantity} {claim.unit}</span>
                    </div>

                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg ${STATUS_CLASSES[claim.status] || 'bg-slate-100'}`}>
                      {STATUS_TEXT[claim.status] || claim.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">{claim.title}</h3>
                  <p className="text-xs text-slate-500 font-semibold mb-4">
                    Donor: {claim.donor?.organizationDetails?.name || claim.donor?.name || 'Private Donor'}
                  </p>

                  {/* Info Row details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-4 border border-slate-100 rounded-xl mb-4">
                    <div className="flex items-start gap-1.5">
                      <Compass className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-slate-400 font-semibold uppercase">Pickup Address</p>
                        <p className="text-slate-700 font-bold mt-0.5">{claim.location?.address}, {claim.location?.city}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-slate-400 font-semibold uppercase">Pickup window</p>
                        <p className="text-slate-700 font-bold mt-0.5">
                          {formatDate(claim.pickupWindow?.start)} — <br/>
                          {formatDate(claim.pickupWindow?.end)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <Truck className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-slate-400 font-semibold uppercase">Assigned Volunteer</p>
                        {claim.assignedTo?.volunteer ? (
                          <div className="mt-0.5">
                            <p className="text-slate-900 font-bold flex items-center gap-1">
                              {claim.assignedTo.volunteer.name}
                            </p>
                            <p className="text-slate-500 text-[10px]">{claim.assignedTo.volunteer.phone}</p>
                          </div>
                        ) : (
                          <p className="text-slate-500 italic mt-0.5">Unassigned</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex gap-2">
                    <Link
                      to={`/dashboard/donations/${claim._id}`}
                      className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details & tracking
                    </Link>

                    <button
                      onClick={() => handleCancelRequest(claim._id)}
                      className="px-3.5 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      Cancel Request
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openAssignModal(claim)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <User className="w-3.5 h-3.5" />
                      {claim.assignedTo?.volunteer ? 'Change Volunteer' : 'Assign Volunteer'}
                    </button>

                    <button
                      onClick={() => handleMarkReceived(claim._id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Received
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

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

export default AcceptedDonations;
