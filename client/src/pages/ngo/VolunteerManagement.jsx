import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Users, Mail, Phone, CheckCircle, Clock, AlertCircle, Search, Filter,
  Shield, CheckCircle2, UserCheck, UserX, RefreshCw
} from 'lucide-react';

const VolunteerManagement = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ngo/volunteers');
      setVolunteers(res.data);
    } catch {
      toast.error('Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Volunteer Network</h2>
          <p className="text-sm text-slate-500 mt-1">Manage delivery assignments, contact active volunteers, and view performance.</p>
        </div>
        
        <button
          onClick={fetchVolunteers}
          className="inline-flex items-center px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold transition-colors gap-1 bg-white shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh List
        </button>
      </div>

      {/* Filter and search strip */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search volunteers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-600 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="busy">Busy (On Duty)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 bg-white border border-slate-100 rounded-xl animate-pulse p-5 space-y-4 shadow-sm">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-full" />
                <div className="space-y-2 flex-1 pt-1">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-8 bg-slate-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredVolunteers.length === 0 ? (
        <div className="text-center bg-white border border-slate-200 rounded-xl py-16 px-4">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-800">No volunteers found</h3>
          <p className="mt-1 text-sm text-slate-500">Try modifying your search or filter keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVolunteers.map((v) => (
            <motion.div
              layout
              key={v._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div>
                {/* Profile Header */}
                <div className="flex items-center gap-3 mb-4">
                  {v.profilePicture ? (
                    <img
                      src={v.profilePicture}
                      alt={v.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-lg">
                      {v.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="overflow-hidden">
                    <h3 className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                      {v.name}
                      <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize mt-1 ${v.status === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'available' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                      {v.status}
                    </span>
                  </div>
                </div>

                {/* Email / Phone */}
                <div className="space-y-1.5 text-xs text-slate-600 font-semibold mb-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{v.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{v.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Stats Bar */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 rounded-lg p-3 text-center text-xs font-semibold text-slate-600 mt-2">
                <div className="border-r border-slate-200">
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Active Duties</p>
                  <p className="text-slate-800 font-bold mt-0.5 text-sm">{v.activeDeliveries}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[9px]">Delivered</p>
                  <p className="text-emerald-600 font-bold mt-0.5 text-sm">{v.completedDeliveries}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VolunteerManagement;
