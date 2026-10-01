import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNotifications } from '../../context/NotificationContext';
import {
  Compass, MapPin, Building, Users, Calendar, ArrowRight,
  Truck, Inbox, RefreshCw, Clock, Zap
} from 'lucide-react';

const VolunteerTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasNewTask, setHasNewTask] = useState(false);

  const { socket } = useNotifications();

  const fetchTasks = async () => {
    setLoading(true);
    setHasNewTask(false);
    try {
      const res = await api.get('/volunteer/tasks');
      setTasks(res.data);
    } catch {
      toast.error('Failed to load pending delivery tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    if (socket) {
      socket.on('donations:refresh', () => setHasNewTask(true));
      return () => socket.off('donations:refresh');
    }
  }, [socket]);

  const handleClaimTask = async (taskId) => {
    try {
      await api.post('/volunteer/accept-task', { donationId: taskId });
      toast.success('Delivery task claimed successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim delivery job');
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Delivery Jobs Marketplace</h2>
          <p className="text-sm text-slate-500 mt-1">Claim transport requests from donors to local NGOs in need.</p>
        </div>

        <button
          onClick={fetchTasks}
          className="p-2 border rounded-lg hover:bg-slate-50 text-slate-600 transition-colors bg-white shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Live Jobs Banner */}
      <AnimatePresence>
        {hasNewTask && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-blue-600 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Zap className="w-4 h-4 text-yellow-300" />
              New delivery jobs just became available!
            </div>
            <button
              onClick={fetchTasks}
              className="flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse p-6 space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-10 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center bg-white border border-slate-200 rounded-xl py-16 px-4">
          <Inbox className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-800">No pending delivery jobs</h3>
          <p className="mt-1 text-sm text-slate-500">All current NGO food claims have transport drivers assigned. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <motion.div
              layout
              key={task._id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              {/* Header block */}
              <div className="p-6 border-b border-slate-100 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full capitalize">
                      {task.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2 line-clamp-1">{task.title}</h3>
                  </div>
                  <span className="flex-shrink-0 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-500" /> {getExpiryText(task.expiryDate)}
                  </span>
                </div>

                <div className="flex gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4 text-slate-400" /> Serves {task.peopleServed} ppl</span>
                  <span className="flex items-center gap-1"><Compass className="w-4 h-4 text-slate-400" /> Quantity: {task.quantity} {task.unit}</span>
                </div>
              </div>

              {/* Transit/Address panel */}
              <div className="p-6 bg-slate-50/50 flex-1 space-y-4">
                {/* Pickup details */}
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">A</div>
                  <div className="text-xs font-medium text-slate-600">
                    <p className="text-slate-400 font-semibold uppercase text-[9px]">Pickup Location (Donor)</p>
                    <p className="font-bold text-slate-800 mt-0.5">{task.donor?.organizationDetails?.name || task.donor?.name}</p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">{task.location?.address}</p>
                  </div>
                </div>

                {/* Dropoff details */}
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">B</div>
                  <div className="text-xs font-medium text-slate-600">
                    <p className="text-slate-400 font-semibold uppercase text-[9px]">Dropoff Location (NGO)</p>
                    <p className="font-bold text-slate-800 mt-0.5">{task.assignedTo?.ngo?.organizationDetails?.name || task.assignedTo?.ngo?.name}</p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">{task.assignedTo?.ngo?.organizationDetails?.address || 'NGO Office Address'}</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-6 border-t border-slate-100 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400 font-medium">
                  Pickup limit: <strong className="text-slate-600 font-bold">{formatDate(task.pickupWindow?.end)}</strong>
                </span>

                <button
                  onClick={() => handleClaimTask(task._id)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" /> Accept Job
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VolunteerTasks;
