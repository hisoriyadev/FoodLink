import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  TrendingUp, Utensils, Heart, ShieldCheck, Sparkles, MapPin,
  Clock, AlertTriangle, Users, Award, RefreshCw
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

const AdminAnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('daily'); // 'daily' | 'weekly' | 'monthly'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, insightsRes] = await Promise.all([
        api.get('/ai/analytics'),
        api.get('/ai/insights'),
      ]);
      setData(analyticsRes.data.analytics);
      setInsights(insightsRes.data.insights);
    } catch {
      toast.error('Failed to load AI analytics dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-10 bg-slate-200 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const summary = data?.summary || {};
  const chartTrends =
    timeframe === 'daily'
      ? data?.dailyTrends
      : timeframe === 'weekly'
      ? data?.weeklyTrends
      : data?.monthlyTrends;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI & Smart Analytics Engine</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> AI LIVE
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Real-time redistribution metrics, predictive food waste insights, and impact reports.</p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-xs shadow-xs hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-emerald-600" /> Refresh AI Models
        </button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meals Served</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{summary.totalMealsServed?.toLocaleString()}</h3>
            <span className="text-[11px] text-emerald-600 font-semibold">↑ +14% vs last week</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Surplus Food Saved</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{summary.totalFoodSavedKg?.toLocaleString()} kg</h3>
            <span className="text-[11px] text-blue-600 font-semibold">↑ Zero-waste efficiency</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Donations</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{summary.totalDonations}</h3>
            <span className="text-[11px] text-amber-600 font-semibold">{summary.deliveredCount} successfully delivered</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold shadow-sm">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Accuracy Rate</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">97.8%</h3>
            <span className="text-[11px] text-purple-600 font-semibold">Optimal NGO matching</span>
          </div>
        </motion.div>
      </div>

      {/* Main Trends Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Donation Volume & Impact Over Time</h3>
            <p className="text-xs text-slate-500">Track meals delivered and food rescued across different timeline views.</p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {['daily', 'weekly', 'monthly'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  timeframe === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartTrends}>
              <defs>
                <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey={timeframe === 'daily' ? 'day' : timeframe === 'weekly' ? 'week' : 'month'} stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }} />
              <Legend />
              <Area type="monotone" dataKey="donations" name="Total Donations" stroke="#10b981" fillOpacity={1} fill="url(#colorDonations)" strokeWidth={3} />
              <Area type="monotone" dataKey="foodSavedKg" name="Rescued Food (kg)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMeals)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Category Distribution & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Food Category Distribution</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.categoriesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="category"
                >
                  {data?.categoriesData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Predictive Insights Panel */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-bold">Predictive AI Insights & Directives</h3>
          </div>

          <div className="space-y-3">
            {insights?.aiRecommendations?.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  {i + 1}
                </span>
                <p className="text-slate-200 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">High Food Waste Hotspots</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {insights?.highFoodWasteAreas?.map((area, i) => (
                <div key={i} className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 flex justify-between items-center">
                  <span className="font-semibold text-slate-200">{area.area}</span>
                  <span className="text-red-400 font-bold">{area.wasteEstKg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;
