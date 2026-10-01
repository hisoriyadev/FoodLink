import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, Trash2, Search, Filter, PackageOpen, CheckCircle,
  Truck, AlertTriangle, ShieldCheck, Info, Clock, Check, RefreshCw
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const TYPE_CONFIG = {
  new_donation: { label: 'New Donation', icon: PackageOpen, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  donation_accepted: { label: 'Accepted', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  volunteer_assigned: { label: 'Volunteer Assigned', icon: Truck, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  pickup_started: { label: 'Pickup Started', icon: Truck, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  food_picked_up: { label: 'Food Picked Up', icon: PackageOpen, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  delivery_completed: { label: 'Delivery Completed', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  donation_cancelled: { label: 'Cancelled', icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
  account_approved: { label: 'Account Approved', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  system: { label: 'System', icon: Info, color: 'text-slate-600 bg-slate-100 border-slate-200' },
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const NotificationPage = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('all'); // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase());

      const matchesRead =
        readFilter === 'all'
          ? true
          : readFilter === 'unread'
          ? !n.isRead
          : n.isRead;

      const matchesType = typeFilter === 'all' ? true : n.type === typeFilter;

      return matchesSearch && matchesRead && matchesType;
    });
  }, [notifications, search, readFilter, typeFilter]);

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      markAsRead(n._id);
    }
    if (n.relatedDonation?._id || n.relatedDonation) {
      const donId = n.relatedDonation._id || n.relatedDonation;
      navigate(`/dashboard/donations/${donId}`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Notifications Center
            {unreadCount > 0 && (
              <span className="text-xs font-bold bg-emerald-500 text-white px-2.5 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time updates on donations, assignments, and account activities.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={fetchNotifications}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 bg-white shadow-sm transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 bg-white"
            >
              <Trash2 className="w-4 h-4" /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-3">
            {/* Status Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['all', 'unread', 'read'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setReadFilter(tab)}
                  className={`px-3 py-1 text-xs font-semibold capitalize rounded-md transition-colors ${
                    readFilter === tab
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Type Dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Types</option>
              {Object.keys(TYPE_CONFIG).map((t) => (
                <option key={t} value={t}>
                  {TYPE_CONFIG[t].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-white border border-slate-200 rounded-xl animate-pulse p-4 flex gap-4"
              >
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center bg-white border border-slate-200 rounded-xl py-16 px-4">
            <Bell className="mx-auto h-12 w-12 text-slate-300 mb-2 opacity-60" />
            <h3 className="text-base font-bold text-slate-800">No notifications found</h3>
            <p className="text-sm text-slate-500 mt-1">
              There are no notifications matching your search or filter criteria.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((n) => {
              const typeConfig = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
              const Icon = typeConfig.icon;

              return (
                <motion.div
                  layout
                  key={n._id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleNotificationClick(n)}
                  className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start gap-4 group ${
                    !n.isRead ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl border ${typeConfig.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                        <h4 className={`text-sm font-bold truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                          {n.title}
                        </h4>
                      </div>

                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {n.message}
                    </p>

                    {n.relatedDonation && (
                      <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:underline">
                        <span>Related Donation: {n.relatedDonation.title || 'View Donation Details'}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 self-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(n._id);
                        }}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n._id);
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
