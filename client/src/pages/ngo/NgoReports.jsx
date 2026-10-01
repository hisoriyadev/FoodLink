import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  BarChart3, TrendingUp, PieChart as PieIcon, Award, Package, Utensils,
  ChevronDown, HelpCircle, Loader2
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'];
const DONUT_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

const NgoReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/ngo/reports');
        setData(res.data);
      } catch {
        toast.error('Failed to load report analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Generating analytics report...</p>
      </div>
    );
  }

  const { monthlyStats = [], categoryData = [], volunteerPerformance = [], trends = {} } = data || {};

  const totalMeals = monthlyStats.reduce((acc, curr) => acc + curr.meals, 0);
  const totalReceived = monthlyStats.reduce((acc, curr) => acc + curr.donations, 0);

  const donutData = [
    { name: 'Delivered', value: trends.delivered || 0 },
    { name: 'Cancelled', value: trends.cancelled || 0 },
    { name: 'Expired', value: trends.expired || 0 },
    { name: 'Active Requests', value: trends.active || 0 }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">NGO Reports & Analytics</h2>
        <p className="text-sm text-slate-500 mt-1">Interactive metrics tracking meal distribution, donor contributions, and volunteers performance.</p>
      </div>

      {/* KPI stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Meals distributed</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalMeals}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Donations claimed</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalReceived}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Registered Volunteers</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{volunteerPerformance.length}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Performance Area Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-emerald-500 w-5 h-5" /> Monthly distribution trends
            </h3>
            <p className="text-xs text-slate-400">Claims made vs total meals received per month.</p>
          </div>

          <div className="h-72 w-full">
            {monthlyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyStats}>
                  <defs>
                    <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area name="Claims" type="monotone" dataKey="donations" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDonations)" />
                  <Area name="Meals" type="monotone" dataKey="meals" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMeals)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 italic">No monthly data available</div>
            )}
          </div>
        </div>

        {/* Volunteer Performance Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Award className="text-purple-500 w-5 h-5" /> Top volunteers contribution
            </h3>
            <p className="text-xs text-slate-400">Total delivered assignments and meals completed by top network volunteers.</p>
          </div>

          <div className="h-72 w-full">
            {volunteerPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volunteerPerformance} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar name="Deliveries" dataKey="deliveries" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  <Bar name="Meals Served" dataKey="meals" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 italic">No volunteer performance records yet</div>
            )}
          </div>
        </div>

        {/* Categories Distribution Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <PieIcon className="text-blue-500 w-5 h-5" /> Food categories distribution
            </h3>
            <p className="text-xs text-slate-400">Breakdown of food categories claimed by the NGO.</p>
          </div>

          <div className="h-72 w-full flex items-center">
            {categoryData.length > 0 ? (
              <div className="w-full h-full flex flex-col sm:flex-row items-center">
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 flex flex-col gap-2 p-2">
                  {categoryData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-slate-800 font-bold">{item.value} postings</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 italic">No category data received yet</div>
            )}
          </div>
        </div>

        {/* Claim status distribution (Doughnut Chart) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="text-orange-500 w-5 h-5" /> Fulfillment & trends
            </h3>
            <p className="text-xs text-slate-400">Claims split between delivered, cancelled, active, and expired.</p>
          </div>

          <div className="h-72 w-full flex items-center">
            {donutData.length > 0 ? (
              <div className="w-full h-full flex flex-col sm:flex-row items-center">
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={85}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 flex flex-col gap-2 p-2">
                  {donutData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-slate-800 font-bold">{item.value} postings</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 italic">No distribution trends record found</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default NgoReports;
