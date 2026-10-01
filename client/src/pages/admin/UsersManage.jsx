import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Filter, Loader2, Trash2, ShieldCheck, ShieldOff, Edit, X, Check } from 'lucide-react';

const ROLES = ['', 'donor', 'ngo', 'volunteer', 'admin'];
const STATUSES = [{ label: 'All Status', value: '' }, { label: 'Active', value: 'active' }, { label: 'Suspended', value: 'inactive' }];

const RoleBadge = ({ role }) => {
  const colors = {
    admin: 'bg-red-100 text-red-700',
    donor: 'bg-emerald-100 text-emerald-700',
    ngo: 'bg-purple-100 text-purple-700',
    volunteer: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${colors[role] || 'bg-slate-100 text-slate-700'}`}>
      {role}
    </span>
  );
};

const UsersManage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, userId: null, action: null, label: '' });

  // Edit role inline
  const [editingRole, setEditingRole] = useState({ userId: null, role: '' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/admin/users?page=${page}&limit=12`;
      if (search) url += `&search=${search}`;
      if (roleFilter) url += `&role=${roleFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const { data } = await api.get(url);
      setUsers(data.users);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 400);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'suspended'}`);
      fetchUsers();
    } catch {
      toast.error('Action failed');
    }
    setConfirmDialog({ open: false, userId: null, action: null, label: '' });
  };

  const handleDelete = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
    setConfirmDialog({ open: false, userId: null, action: null, label: '' });
  };

  const handleRoleChange = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}`, { role: editingRole.role });
      toast.success('Role updated');
      setEditingRole({ userId: null, role: '' });
      fetchUsers();
    } catch {
      toast.error('Role update failed');
    }
  };

  const confirmAction = () => {
    if (confirmDialog.action === 'delete') handleDelete(confirmDialog.userId);
    if (confirmDialog.action === 'toggle') handleToggleStatus(confirmDialog.userId, confirmDialog.currentStatus);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500 mt-1">{total} users registered on FoodLink.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {ROLES.map(r => <option key={r} value={r}>{r ? r.charAt(0).toUpperCase() + r.slice(1) : 'All Roles'}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingRole.userId === user._id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingRole.role}
                            onChange={e => setEditingRole({ userId: user._id, role: e.target.value })}
                            className="border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            {['donor', 'ngo', 'volunteer', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <button onClick={() => handleRoleChange(user._id)} className="text-emerald-600 hover:text-emerald-700">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingRole({ userId: null, role: '' })} className="text-slate-400 hover:text-red-500">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <RoleBadge role={user.role} />
                          <button
                            onClick={() => setEditingRole({ userId: user._id, role: user.role })}
                            className="text-slate-300 hover:text-emerald-500 transition-colors"
                            title="Change role"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.isActive !== false ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setConfirmDialog({ open: true, userId: user._id, action: 'toggle', currentStatus: user.isActive !== false, label: user.isActive !== false ? 'suspend' : 'activate' })}
                          className={`p-1.5 rounded-md transition-colors ${user.isActive !== false ? 'text-orange-500 hover:bg-orange-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                          title={user.isActive !== false ? 'Suspend' : 'Activate'}
                        >
                          {user.isActive !== false ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setConfirmDialog({ open: true, userId: user._id, action: 'delete', label: 'permanently delete' })}
                          className="p-1.5 rounded-md text-red-400 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Action</h3>
              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to <span className="font-semibold text-red-600">{confirmDialog.label}</span> this user? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmDialog({ open: false })} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button onClick={confirmAction} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersManage;
