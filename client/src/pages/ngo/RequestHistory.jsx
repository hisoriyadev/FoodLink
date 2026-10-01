import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Search, Filter, ArrowUpDown, Download, Calendar, Eye,
  CheckCircle2, XCircle, Info, RefreshCw
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

const RequestHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & sorting
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('updatedAtDesc');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = {
        search,
        status,
      };
      const res = await api.get('/ngo/history', { params });
      setHistory(res.data);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  // Export CSV Helper
  const handleExport = () => {
    if (history.length === 0) {
      toast.error('No history records to export');
      return;
    }

    const headers = ['Title', 'Category', 'Quantity', 'Unit', 'Serves', 'Status', 'Donor', 'Volunteer', 'Completed Date'];
    const rows = history.map(d => [
      d.title,
      d.category,
      d.quantity,
      d.unit,
      d.peopleServed,
      d.status,
      d.donor?.organizationDetails?.name || d.donor?.name || 'Private Donor',
      d.assignedTo?.volunteer?.name || 'N/A',
      new Date(d.updatedAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `foodlink_ngo_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('History list exported successfully!');
  };

  const getSortedHistory = () => {
    const data = [...history];
    if (sort === 'updatedAtDesc') {
      return data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    if (sort === 'quantityDesc') {
      return data.sort((a, b) => b.quantity - a.quantity);
    }
    if (sort === 'titleAsc') {
      return data.sort((a, b) => a.title.localeCompare(b.title));
    }
    return data;
  };

  const sortedData = getSortedHistory();

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Request History</h2>
          <p className="text-sm text-slate-500 mt-1">Logs of all past completed, cancelled, or expired food collections.</p>
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

      {/* Filter and Search block */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search history logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Filter
          </button>
        </form>

        <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 uppercase">
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
              <option value="updatedAtDesc">Recently Updated</option>
              <option value="quantityDesc">Quantity size</option>
              <option value="titleAsc">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden animate-pulse">
          <div className="h-10 bg-slate-100 border-b" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 border-b bg-white last:border-0" />
          ))}
        </div>
      ) : sortedData.length === 0 ? (
        <div className="text-center bg-white border border-slate-200 rounded-xl py-16 px-4">
          <Info className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-800">No records found</h3>
          <p className="mt-1 text-sm text-slate-500">There is no completed request history matching your query.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  {['Food item', 'Donor Name', 'Category', 'Volunteer', 'Status', 'Completed Date', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {sortedData.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{d.title}</div>
                      <div className="text-xs text-slate-500">{d.quantity} {d.unit} (Serves {d.peopleServed})</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-600">
                      {d.donor?.organizationDetails?.name || d.donor?.name || 'Private Donor'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 capitalize">{d.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-semibold">
                      {d.assignedTo?.volunteer?.name || <span className="italic text-slate-400 font-medium">None</span>}
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
                        <Eye className="w-4 h-4" /> View Details
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

export default RequestHistory;
