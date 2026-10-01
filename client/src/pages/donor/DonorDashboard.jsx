import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  PackageOpen,
  PlusCircle,
  ClipboardList,
  BarChart2,
  ArrowRight,
  Loader2,
} from 'lucide-react';

const StatCard = ({ name, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{name}</p>
      <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
    </div>
  </motion.div>
);

const DonorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/donations/stats/donor');
        setStats(res.data);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { name: 'Total Donations', value: stats?.totalDonations, icon: PackageOpen, color: 'bg-emerald-500' },
    { name: 'Active Listings', value: stats?.activeListings, icon: PlusCircle, color: 'bg-blue-500' },
    { name: 'Delivered', value: stats?.delivered, icon: ClipboardList, color: 'bg-indigo-500' },
    { name: 'Pending Pickups', value: stats?.pendingPickups, icon: Loader2, color: 'bg-orange-500' },
    { name: 'Total Meals Served', value: stats?.totalMeals, icon: BarChart2, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Donor Dashboard</h2>
        <Link
          to="/dashboard/donations/create"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
        >
          <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
          New Donation
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <StatCard key={c.name} {...c} delay={i * 0.07} />
        ))}
      </div>

      <div className="flex justify-end">
        <Link
          to="/dashboard/donations"
          className="inline-flex items-center text-emerald-600 hover:underline font-medium"
        >
          View All Donations <ArrowRight className="ml-1 w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default DonorDashboard;
