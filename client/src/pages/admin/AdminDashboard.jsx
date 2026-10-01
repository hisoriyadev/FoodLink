import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Users, HeartHandshake, Building2, Bike, PackageOpen,
  Clock, CheckCircle, Scale, Utensils
} from 'lucide-react';

const PIE_COLORS = ['#10b981', '#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

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

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, chartRes, catRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/stats/donations-chart'),
          api.get('/admin/stats/categories-chart'),
        ]);
        setStats(statsRes.data);
        setChartData(chartRes.data);
        setCategoryData(catRes.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const statCards = [
    { name: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'bg-blue-500' },
    { name: 'Total Donors', value: stats?.totalDonors, icon: HeartHandshake, color: 'bg-emerald-500' },
    { name: 'Total NGOs', value: stats?.totalNGOs, icon: Building2, color: 'bg-purple-500' },
    { name: 'Volunteers', value: stats?.totalVolunteers, icon: Bike, color: 'bg-pink-500' },
    { name: 'Total Donations', value: stats?.totalDonations, icon: PackageOpen, color: 'bg-orange-500' },
    { name: 'Pending', value: stats?.pendingDonations, icon: Clock, color: 'bg-yellow-500' },
    { name: 'Completed', value: stats?.completedDonations, icon: CheckCircle, color: 'bg-teal-500' },
    { name: 'Food Saved (Kg)', value: stats?.foodSavedKg, icon: Scale, color: 'bg-indigo-500' },
    { name: 'Meals Served', value: stats?.mealsServed, icon: Utensils, color: 'bg-rose-500' },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-sm text-slate-500 mt-1">Welcome back, Admin. Here's what's happening with FoodLink today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {statCards.map((card, i) => (
          <StatCard key={card.name} {...card} delay={i * 0.07} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Donations — Last 30 Days</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Line type="monotone" dataKey="donations" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No chart data yet</div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Donations by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="45%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No data yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
