import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNotifications } from '../../context/NotificationContext';
import {
  Truck, CheckCircle, Flame, Navigation, Clock, MapPin,
  Building, Phone, ArrowRight, PackageOpen
} from 'lucide-react';

const StatCard = ({ name, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{name}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value ?? '—'}</p>
    </div>
  </motion.div>
);

const VolunteerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { socket } = useNotifications();

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/volunteer/dashboard');
      setData(res.data);
    } catch {
      toast.error('Failed to load dashboard metrics');
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const activeTasks = data?.activeTasks || [];

  const statCards = [
    { name: 'Active Deliveries', value: stats.activeTasksCount, icon: Truck, color: 'bg-blue-500' },
    { name: 'Completed Tasks', value: stats.completedTasksCount, icon: CheckCircle, color: 'bg-emerald-500' },
    { name: 'Meals Delivered', value: stats.totalMealsDelivered, icon: Flame, color: 'bg-orange-500' },
  ];

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-sans">Volunteer Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Accept delivery jobs and manage surplus food redistribution routes.</p>
        </div>
        <Link
          to="/dashboard/volunteer/tasks"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          <PackageOpen className="-ml-1 mr-2 h-5 w-5" />
          Discover Tasks
        </Link>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((card, i) => (
          <StatCard key={card.name} {...card} delay={i * 0.08} />
        ))}
      </div>

      {/* Active Tasks list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">My Active Deliveries</h3>
          <Link
            to="/dashboard/volunteer/deliveries"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Manage Active <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeTasks.length === 0 ? (
          <div className="text-center py-16 px-4 text-slate-400">
            <Truck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium">You do not have any active delivery assignments right now.</p>
            <Link
              to="/dashboard/volunteer/tasks"
              className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
            >
              Claim a Delivery Job
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeTasks.map((t) => (
              <div key={t._id} className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${t.status === 'picked_up' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}>
                      {t.status === 'picked_up' ? 'In Transit' : 'Assigned (Pending Pickup)'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">Quantity: {t.quantity} {t.unit}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{t.title}</h4>
                  
                  {/* Address Strip */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-slate-600 pt-2">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Pickup Location (Donor)</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{t.donor?.organizationDetails?.name || t.donor?.name}</p>
                        <p className="text-slate-500 mt-0.5">{t.location?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Building className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Dropoff Location (NGO)</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{t.assignedTo?.ngo?.organizationDetails?.name || t.assignedTo?.ngo?.name}</p>
                        <p className="text-slate-500 mt-0.5">{t.assignedTo?.ngo?.organizationDetails?.address || 'NGO Office Address'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto">
                  <Link
                    to={`/dashboard/donations/${t._id}`}
                    className="flex-1 lg:flex-initial text-center px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-4 h-4" /> Track & Update
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;
