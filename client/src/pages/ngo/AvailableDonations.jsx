import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNotifications } from '../../context/NotificationContext';
import {
  Search, Grid, List as ListIcon, Filter, ArrowUpDown, Clock,
  MapPin, Users, Heart, Eye, CheckCircle2, ChevronLeft, ChevronRight,
  Info, RefreshCw
} from 'lucide-react';

const CATEGORIES = ['Cooked', 'Raw', 'Packaged', 'Beverages', 'Baked', 'Other'];

const AvailableDonations = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [hasNewDonation, setHasNewDonation] = useState(false);
  
  // Query params state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [expiryTime, setExpiryTime] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sort, setSort] = useState('createdAtDesc');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Saved donations local storage state (Save for Later feature)
  const [savedIds, setSavedIds] = useState([]);

  const { socket } = useNotifications();

  useEffect(() => {
    const saved = localStorage.getItem('ngo_saved_donations');
    if (saved) {
      setSavedIds(JSON.parse(saved));
    }
  }, []);

  const fetchDonations = async () => {
    setLoading(true);
    setHasNewDonation(false);
    try {
      const params = {
        page,
        limit: 9,
        search,
        category,
        expiryTime,
        quantity,
      };

      if (sort === 'expiryAsc') params.sort = 'expiryAsc';
      if (sort === 'quantityDesc') params.sort = 'quantityDesc';

      const res = await api.get('/ngo/donations', { params });
      setDonations(res.data.donations);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch {
      toast.error('Error fetching donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [page, category, expiryTime, quantity, sort]);

  // Real-time: show banner when new donations arrive
  useEffect(() => {
    if (!socket) return;
    const handleNewDonation = () => {
      setHasNewDonation(true);
    };
    socket.on('donations:refresh', handleNewDonation);
    return () => socket.off('donations:refresh', handleNewDonation);
  }, [socket]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDonations();
  };

  const handleAccept = async (donationId) => {
    try {
      await api.post('/ngo/accept', { donationId });
      toast.success('Donation accepted successfully!');
      fetchDonations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept donation');
    }
  };

  const toggleSave = (id) => {
    let updated;
    if (savedIds.includes(id)) {
      updated = savedIds.filter(x => x !== id);
      toast.success('Removed from saved list');
    } else {
      updated = [...savedIds, id];
      toast.success('Saved for later');
    }
    setSavedIds(updated);
    localStorage.setItem('ngo_saved_donations', JSON.stringify(updated));
  };

  // Expiry Countdown Helper
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
      {/* Real-time New Donation Banner */}
      <AnimatePresence>
        {hasNewDonation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-600 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="w-2 h-2 bg-white rounded-full animate-ping" />
              New donations just posted! Refresh to see the latest.
            </div>
            <button
              onClick={fetchDonations}
              className="flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Load Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Available surplus food</h2>
          <p className="text-sm text-slate-500 mt-1">Discover and claim food donations from donors in your area.</p>
        </div>

        {/* View Mode & Count */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between">
          <span className="text-sm font-medium text-slate-500">{total} donations found</span>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by food name or donor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Expiry</label>
            <select
              value={expiryTime}
              onChange={(e) => { setExpiryTime(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Any Time</option>
              <option value="soon">Expires within 6 hrs</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Min Servings</label>
            <select
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Any Servings</option>
              <option value="10">10+ people</option>
              <option value="50">50+ people</option>
              <option value="100">100+ people</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Sort By</label>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="createdAtDesc">Recently Added</option>
              <option value="expiryAsc">Expiring Soonest</option>
              <option value="quantityDesc">Largest Servings</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-1 flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setCategory('');
                setExpiryTime('');
                setQuantity('');
                setSort('createdAtDesc');
                setPage(1);
              }}
              className="w-full py-1.5 px-3 border border-dashed border-slate-300 hover:border-slate-400 text-slate-600 rounded-lg text-sm font-medium transition-colors text-center"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 space-y-4 animate-pulse">
              <div className="w-full h-44 bg-slate-200 rounded-lg" />
              <div className="h-5 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-8 bg-slate-200 rounded-lg flex-1" />
                <div className="h-8 bg-slate-200 rounded-lg flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center bg-white border border-slate-200 rounded-xl py-16 px-4">
          <Info className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-800">No donations available</h3>
          <p className="mt-1 text-sm text-slate-500">There are no available donations matching your criteria right now.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {donations.map((d) => (
            <motion.div
              layout
              key={d._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Image Section */}
              <div className="h-44 bg-slate-100 relative">
                {d.images && d.images.length > 0 ? (
                  <img
                    src={d.images[0].url}
                    alt={d.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                    <span className="text-sm font-semibold tracking-wide uppercase">{d.category}</span>
                  </div>
                )}
                
                {/* Veg/Non-Veg badge */}
                <span className={`absolute top-3 left-3 px-2 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider shadow-sm ${d.dietary?.isVeg ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                  {d.dietary?.isVeg ? 'Veg' : 'Non-Veg'}
                </span>

                {/* Expiry countdown badge */}
                <span className="absolute bottom-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900/80 text-white backdrop-blur-sm flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  {getExpiryText(d.expiryDate)}
                </span>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full capitalize">
                      {d.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Condition: <strong className="text-slate-600 font-semibold">{d.foodCondition}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-1">{d.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mb-3">Posted by: {d.donor?.organizationDetails?.name || d.donor?.name || 'Private Donor'}</p>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-slate-100 pt-3 mb-4 text-xs font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Serves {d.peopleServed} people</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{d.location?.city || 'Local Area'}</span>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                  <Link
                    to={`/dashboard/donations/${d._id}`}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </Link>

                  <button
                    onClick={() => handleAccept(d._id)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white rounded-lg transition-colors gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Claim
                  </button>

                  <button
                    onClick={() => toggleSave(d._id)}
                    className={`p-2 border rounded-lg transition-colors ${savedIds.includes(d._id) ? 'bg-rose-50 border-rose-200 text-rose-500' : 'border-slate-200 hover:bg-slate-50 text-slate-400'}`}
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Table Layout */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  {['Food item', 'Donor', 'Category', 'Quantity', 'Serves', 'Expires', 'Dietary', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {donations.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{d.title}</div>
                      <div className="text-xs text-slate-500">{d.location?.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-600">
                      {d.donor?.organizationDetails?.name || d.donor?.name || 'Private Donor'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 capitalize">{d.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-semibold">{d.quantity} {d.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">For {d.peopleServed} ppl</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">{getExpiryText(d.expiryDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${d.dietary?.isVeg ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {d.dietary?.isVeg ? 'Veg' : 'Non-Veg'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                      <Link to={`/dashboard/donations/${d._id}`} className="text-emerald-600 hover:text-emerald-700 font-medium">Details</Link>
                      <span className="text-slate-300">|</span>
                      <button onClick={() => handleAccept(d._id)} className="text-slate-800 hover:text-emerald-600 font-semibold">Claim</button>
                      <span className="text-slate-300">|</span>
                      <button onClick={() => toggleSave(d._id)} className={`${savedIds.includes(d._id) ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}>
                        <Heart className="w-4 h-4 fill-current inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-between items-center bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-600 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm font-semibold text-slate-700">Page {page} of {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, pages))}
            disabled={page === pages}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-600 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AvailableDonations;
