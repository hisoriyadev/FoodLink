import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  History, Download, RefreshCw, Eye, HelpCircle, Info,
  Flame, CheckCircle, PackageOpen
} from 'lucide-react';

const STATUS_TEXT = {
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const STATUS_BADGES = {
  delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
  expired: 'bg-orange-50 text-orange-700 border border-orange-200',
};

const VolunteerHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & sorting
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('updatedAtDesc');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/donations/history'); // reuse compatible general history
      setHistory(res.data);
    } catch {
      toast.error('Failed to load delivery history log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleExport = () => {
    if (history.length === 0) {
      toast.error('No history records to export');
      return;
    }

    const headers = ['Title', 'Category', 'Quantity', 'Unit', 'Servings', 'Status', 'Donor', 'NGO Client', 'Delivered Date'];
    const rows = history.map(d => [
      d.title,
      d.category,
      d.quantity,
      d.unit,
      d.peopleServed,
      d.status,
      d.donor?.organizationDetails?.name || d.donor?.name || 'Private Donor',
      d.assignedTo?.ngo?.organizationDetails?.name || d.assignedTo?.ngo?.name || 'N/A',
      new Date(d.updatedAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `foodlink_volunteer_delivery_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Delivery history exported successfully!');
  };

  const getFilteredHistory = () => {
    let data = [...history];
    if (status) {
      data = data.filter(d => d.status === status);
    }
    if (sort === 'updatedAtDesc') {
      return data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    if (sort === 'servingsDesc') {
      return data.sort((a, b) => b.peopleServed - a.peopleServed);
    }
    return data;
  };

  const filteredData = getFilteredHistory();
  const totalMeals = history.filter(x => x.status === 'delivered').reduce((acc, curr) => acc + (curr.peopleServed || 0), 0);
  const totalCompleted = history.filter(x => x.status === 'delivered').length;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Delivery History</h2>
          <p className="text-sm text-slate-500 mt-1">Logs of all past completed, expired, or cancelled deliveries.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          
          <button
            onClick={fetchHistory}
            className="p-2 border rounded-lg hover:bg-slate-50 text-slate-600 transition-colors bg-white shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats KPI panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Meals Transported</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalMeals}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Completed Routes</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalCompleted}</p>
          </div>
        </div>
      </div>

      {/* Filter and sorting */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex flex-wrap gap-4 text-xs font-semibold text-slate-500 uppercase">
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="py-1 px-2 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="flex items-center gap-2 ml-0 sm:ml-auto">
          <span>Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="py-1 px-2 border border-slate-200 rounded-md text-xs bg-white focus:outline-none"
          >
            <option value="updatedAtDesc">Recently Completed</option>
            <option value="servingsDesc">Servings size</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden animate-pulse">
          <div className="h-10 bg-slate-100 border-b" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 border-b bg-white last:border-0" />
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center bg-white border border-slate-200 rounded-xl py-16 px-4">
          <Info className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-800">No history found</h3>
          <p className="mt-1 text-sm text-slate-500">There are no logged delivery jobs matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  {['Food item', 'Donor', 'NGO Destination', 'Status', 'Date completed', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredData.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                      <div>{d.title}</div>
                      <div className="text-xs text-slate-400 font-medium">Quantity: {d.quantity} {d.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-650">
                      {d.donor?.organizationDetails?.name || d.donor?.name || 'Private Donor'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-650">
                      {d.assignedTo?.ngo?.organizationDetails?.name || d.assignedTo?.ngo?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${STATUS_BADGES[d.status] || 'bg-slate-100'}`}>
                        {STATUS_TEXT[d.status] || d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">{formatDate(d.updatedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/dashboard/donations/${d._id}`}
                        className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold gap-1"
                      >
                        <Eye className="w-4 h-4" /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerHistory;
