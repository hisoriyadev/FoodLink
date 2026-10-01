import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import DonationCard from '../../components/common/DonationCard';
import { PlusCircle, Search, Filter, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MyDonations = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('createdAt_desc');

  // Pagination state (basic implementation)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      let url = `/donations/my?page=${page}&limit=12`;
      if (searchTerm) url += `&search=${searchTerm}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      // Map sortOrder to query param
      if (sortOrder === 'expiry_asc') url += `&sort=expiryAsc`;
      else if (sortOrder === 'expiry_desc') url += `&sort=expiryDesc`;
      // default is createdAt desc which backend handles

      const { data } = await api.get(url);
      setDonations(data.donations);
      setTotalPages(data.pages);
    } catch (error) {
      toast.error('Failed to fetch donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const delayDebounceFn = setTimeout(() => {
      fetchDonations();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, sortOrder, page]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this donation? This action cannot be undone.')) {
      try {
        await api.delete(`/donations/${id}`);
        toast.success('Donation deleted successfully');
        fetchDonations();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete donation');
      }
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const { data } = await api.get(`/donations/${id}`);
      navigate('/dashboard/donations/create', { state: { duplicateFrom: data } });
    } catch (error) {
      toast.error('Failed to duplicate donation');
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            My Donations
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your food listings and track their progress.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/dashboard/donations/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <PlusCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Donation
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset page on search
            }}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          />
        </div>

        <div className="flex w-full md:w-auto gap-4">
          <div className="flex items-center w-full md:w-auto">
            <Filter className="h-5 w-5 text-slate-400 mr-2 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="block w-full py-2 pl-3 pr-10 border border-slate-300 bg-white rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="claimed">Claimed</option>
              <option value="picked_up">Picked Up</option>
              <option value="delivered">Delivered</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="block w-full py-2 pl-3 pr-10 border border-slate-300 bg-white rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          >
            <option value="createdAt_desc">Newest First</option>
            <option value="expiry_asc">Expiring Soon</option>
            <option value="expiry_desc">Expiry Latest</option>
          </select>
        </div>
      </div>

      {/* Grid Content */}
      {loading && donations.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center bg-white py-16 px-4 rounded-lg shadow-sm border border-slate-200">
          <PackageOpen className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No donations found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchTerm || statusFilter ? 'Try adjusting your filters.' : 'Get started by creating a new food donation.'}
          </p>
          {!searchTerm && !statusFilter && (
            <div className="mt-6">
              <Link
                to="/dashboard/donations/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
              >
                <PlusCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                New Donation
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {donations.map(donation => (
              <DonationCard 
                key={donation._id} 
                donation={donation} 
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6 rounded-lg shadow-sm">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyDonations;
