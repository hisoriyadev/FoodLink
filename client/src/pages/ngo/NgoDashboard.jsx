import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNotifications } from '../../context/NotificationContext';
import {
  PackageOpen, CheckCircle, Truck, Clock, Utensils, Users,
  ArrowRight, Loader2
} from 'lucide-react';

const STATUS_COLORS = {
  claimed: 'bg-blue-100 text-blue-700',
  picked_up: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
};

const StatCard = ({ name, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{name}</p>
      <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
    </div>
  </motion.div>
);

const NgoDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { socket } = useNotifications();

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/ngo/dashboard');
      setData(res.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    if (socket) {
      socket.on('donations:refresh', fetchDashboard);
      return () => socket.off('donations:refresh', fetchDashboard);
    }
  }, [socket]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentRequests = data?.recentRequests || [];

  const statCards = [
    { name: 'Available Donations', value: stats.availableDonations, icon: PackageOpen, color: 'bg-blue-500' },
    { name: 'Accepted Donations', value: stats.acceptedDonations, icon: CheckCircle, color: 'bg-emerald-500' },
    { name: 'Completed Deliveries', value: stats.completedDeliveries, icon: Truck, color: 'bg-teal-500' },
    { name: 'Pending Pickups', value: stats.pendingPickups, icon: Clock, color: 'bg-orange-500' },
    { name: 'Total Meals Received', value: stats.totalMealsReceived, icon: Utensils, color: 'bg-purple-500' },
    { name: 'Active Volunteers', value: stats.activeVolunteers, icon: Users, color: 'bg-pink-500' },
  ];

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">NGO Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Overview of your food rescue operations.</p>
        </div>
        <Link
          to="/dashboard/ngo/available"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
        >
          <PackageOpen className="-ml-1 mr-2 h-5 w-5" />
          Browse Donations
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, i) => (
          <StatCard key={card.name} {...card} delay={i * 0.07} />
        ))}
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">Recent Requests</h3>
          <Link to="/dashboard/ngo/history" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {recentRequests.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No recent activity yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Food Item', 'Donor', 'Status', 'Volunteer', 'Updated'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.map(d => (
                  <tr key={d._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Link to={`/dashboard/donations/${d._id}`} className="text-sm font-medium text-slate-900 hover:text-emerald-600">
                        {d.title}
                      </Link>
                      <p className="text-xs text-slate-500">{d.quantity} {d.unit}</p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{d.donor?.name || '—'}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[d.status] || 'bg-slate-100 text-slate-600'}`}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                      {d.assignedTo?.volunteer?.name || <span className="italic text-slate-400">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(d.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NgoDashboard;
