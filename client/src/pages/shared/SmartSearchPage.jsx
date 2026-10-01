import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import FreshnessBadge from '../../components/ai/FreshnessBadge';
import PriorityBadge from '../../components/ai/PriorityBadge';
import { Search, Sparkles, Filter, MapPin, Calendar, Clock, ArrowRight, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const SmartSearchPage = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [freshnessFilter, setFreshnessFilter] = useState('');
  const [minPriority, setMinPriority] = useState(0);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSmartSearch = async () => {
    setLoading(true);
    try {
      const params = {
        q: query,
        category,
        freshness: freshnessFilter,
        minPriority,
      };
      const res = await api.get('/ai/search', { params });
      setDonations(res.data.donations || []);
    } catch {
      toast.error('AI smart search request failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartSearch();
  }, [category, freshnessFilter, minPriority]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSmartSearch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Smart Search & Matching</h2>
          <span className="bg-purple-100 text-purple-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI POWERED
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">Instant multi-criteria search combining freshness scores, priority rankings, and geolocation.</p>
      </div>

      {/* Filter Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by food name, description, city, or area address..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Run AI Query
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
          {/* Category Selector */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Categories</option>
              <option value="Cooked">Cooked Meals</option>
              <option value="Raw">Raw Produce</option>
              <option value="Packaged">Packaged Goods</option>
              <option value="Beverages">Beverages</option>
              <option value="Baked">Baked Goods</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Freshness Selector */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">AI Freshness Level</label>
            <select
              value={freshnessFilter}
              onChange={(e) => setFreshnessFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Any Freshness</option>
              <option value="Fresh">Fresh (60%+)</option>
              <option value="Moderate">Moderate (25%-60%)</option>
              <option value="Urgent">Urgent (&lt;25%)</option>
            </select>
          </div>

          {/* Min Priority Score */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Min Priority Score: {minPriority}</label>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={minPriority}
              onChange={(e) => setMinPriority(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-white border border-slate-200 rounded-2xl animate-pulse p-5 space-y-4">
              <div className="h-6 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-16 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <PackageOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 mt-3">No donations match your AI filter criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try lowering the minimum priority score or clearing specific freshness parameters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {donations.map((d, index) => (
            <motion.div
              key={d._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-slate-900 line-clamp-1">{d.title}</h3>
                  <PriorityBadge priorityScore={d.priorityScore} />
                </div>

                <div className="flex items-center gap-2">
                  <FreshnessBadge preparationDate={d.preparationDate} expiryDate={d.expiryDate} score={d.freshnessScore} label={d.freshness?.label} />
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">{d.category}</span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{d.description}</p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{d.location?.address || 'Pickup Address'}, {d.location?.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Serves ~<strong>{d.peopleServed} people</strong> ({d.quantity} {d.unit})</span>
                  </div>
                </div>
              </div>

              <Link
                to={`/ngo/donations/${d._id}`}
                className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                View Details & Claim <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartSearchPage;
