import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/authSlice';
import api from '../services/api';
import {
  LogOut, Users, ShieldCheck, ClipboardList, TrendingUp,
  CheckCircle2, XCircle, Clock, Wrench, ChevronRight,
  Home, Crown, Star, Activity, BarChart2, UserCheck, MessageSquare, EyeOff, Eye,
  CreditCard, FileText, AlertTriangle, PlusCircle, Search, Download, RefreshCw,
  ToggleLeft, ToggleRight, PackagePlus, Gavel
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'text-amber-400',  bg: 'bg-amber-400/10' },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  completed:  { label: 'Completed',  color: 'text-emerald-400',bg: 'bg-emerald-400/10' },
  cancelled:  { label: 'Cancelled',  color: 'text-rose-400',   bg: 'bg-rose-400/10' },
  in_progress:{ label: 'In Progress',color: 'text-violet-400', bg: 'bg-violet-400/10' },
};

const TABS = [
  { id: 'overview',      label: 'Overview',          icon: Home },
  { id: 'bookings',      label: 'Bookings',          icon: ClipboardList },
  { id: 'users',         label: 'Users',             icon: Users },
  { id: 'providers',     label: 'Provider Verify',   icon: UserCheck },
  { id: 'disputes',      label: 'Disputes',          icon: Gavel },
  { id: 'services',      label: 'Services',          icon: PackagePlus },
  { id: 'reviews',       label: 'Reviews',           icon: Star },
  { id: 'transactions',  label: 'Transactions',      icon: CreditCard },
];

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  // Core data
  const [bookings,  setBookings]  = useState([]);
  const [providers, setProviders] = useState([]);
  const [reviews,   setReviews]   = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // User Management
  const [allUsers,     setAllUsers]     = useState([]);
  const [userSearch,   setUserSearch]   = useState('');
  const [userLoading,  setUserLoading]  = useState(false);

  // Provider Verification
  const [pendingProviders,  setPendingProviders]  = useState([]);
  const [verifyLoading,     setVerifyLoading]     = useState(false);

  // Disputes
  const [disputes,       setDisputes]       = useState([]);
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionText,   setResolutionText]   = useState('');
  const [issueRefund,      setIssueRefund]      = useState(false);

  // Services
  const [categories,      setCategories]      = useState([]);
  const [allServices,     setAllServices]     = useState([]);
  const [newCatName,      setNewCatName]      = useState('');
  const [newCatDesc,      setNewCatDesc]      = useState('');
  const [newSvcName,      setNewSvcName]      = useState('');
  const [newSvcPrice,     setNewSvcPrice]     = useState('');
  const [newSvcCatId,     setNewSvcCatId]     = useState('');
  const [newSvcType,      setNewSvcType]      = useState('flat');
  const [serviceLoading,  setServiceLoading]  = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get('/bookings/').catch(() => ({ data: [] })),
      api.get('/providers/').catch(() => ({ data: [] })),
      api.get('/reviews/').catch(() => ({ data: [] })),
      api.get('/payments/history').catch(() => ({ data: [] }))
    ]).then(([bRes, pRes, rRes, payRes]) => {
      setBookings(bRes.data || []);
      setProviders(pRes.data?.items || pRes.data || []);
      setReviews(rRes.data || []);
      setPayments(payRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  // ── Load Users ───────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setUserLoading(true);
    try {
      const res = await api.get(`/admin/users?search=${userSearch}`);
      setAllUsers(res.data?.items || []);
    } catch { showToast('Failed to load users', 'error'); }
    finally { setUserLoading(false); }
  }, [userSearch]);

  useEffect(() => { if (activeTab === 'users') loadUsers(); }, [activeTab]);

  // ── Load Pending Providers ───────────────────────────────────────────────────
  const loadPendingProviders = useCallback(async (vstatus = 'pending') => {
    setVerifyLoading(true);
    try {
      const res = await api.get(`/admin/providers/pending?verification_status=${vstatus}`);
      setPendingProviders(res.data?.items || []);
    } catch { showToast('Failed to load providers', 'error'); }
    finally { setVerifyLoading(false); }
  }, []);

  useEffect(() => { if (activeTab === 'providers') loadPendingProviders(); }, [activeTab]);

  // ── Load Disputes ─────────────────────────────────────────────────────────
  const loadDisputes = useCallback(async () => {
    setDisputeLoading(true);
    try {
      const res = await api.get('/admin/disputes');
      setDisputes(res.data?.items || []);
    } catch { showToast('Failed to load disputes', 'error'); }
    finally { setDisputeLoading(false); }
  }, []);

  useEffect(() => { if (activeTab === 'disputes') loadDisputes(); }, [activeTab]);

  // ── Load Services ─────────────────────────────────────────────────────────
  const loadServices = useCallback(async () => {
    setServiceLoading(true);
    try {
      const [catRes, svcRes] = await Promise.all([
        api.get('/admin/services/categories'),
        api.get('/admin/services'),
      ]);
      setCategories(catRes.data || []);
      setAllServices(svcRes.data || []);
    } catch { showToast('Failed to load services', 'error'); }
    finally { setServiceLoading(false); }
  }, []);

  useEffect(() => { if (activeTab === 'services') loadServices(); }, [activeTab]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { is_active: !currentStatus });
      showToast(`User ${!currentStatus ? 'activated' : 'suspended'}`);
      loadUsers();
    } catch { showToast('Action failed', 'error'); }
  };

  const handleVerifyProvider = async (providerId, vstatus) => {
    try {
      await api.patch(`/admin/providers/${providerId}/verify`, { verification_status: vstatus });
      showToast(`Provider ${vstatus}`);
      loadPendingProviders();
    } catch { showToast('Action failed', 'error'); }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute) return;
    try {
      await api.patch(`/admin/disputes/${selectedDispute.dispute_id}`, {
        status: 'resolved',
        resolution_details: resolutionText,
        issue_refund: issueRefund,
      });
      showToast('Dispute resolved' + (issueRefund ? ' & refund issued' : ''));
      setSelectedDispute(null);
      setResolutionText('');
      setIssueRefund(false);
      loadDisputes();
    } catch { showToast('Failed to resolve dispute', 'error'); }
  };

  const handleToggleReview = async (reviewId, isHidden) => {
    try {
      await api.patch(`/reviews/${reviewId}/moderate`, { is_hidden: !isHidden });
      const res = await api.get('/reviews/');
      setReviews(res.data || []);
      showToast(`Review ${!isHidden ? 'hidden' : 'restored'}`);
    } catch { showToast('Action failed', 'error'); }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/services/categories', { name: newCatName, description: newCatDesc });
      showToast('Category created');
      setNewCatName(''); setNewCatDesc('');
      loadServices();
    } catch { showToast('Failed to create category', 'error'); }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!newSvcCatId) { showToast('Select a category first', 'error'); return; }
    try {
      await api.post('/admin/services', {
        name: newSvcName,
        category_id: newSvcCatId,
        base_price: parseFloat(newSvcPrice),
        price_type: newSvcType,
      });
      showToast('Service created');
      setNewSvcName(''); setNewSvcPrice(''); setNewSvcCatId('');
      loadServices();
    } catch { showToast('Failed to create service', 'error'); }
  };

  const handleDownloadInvoice = async (bookingId) => {
    try {
      const response = await api.get(`/payments/${bookingId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gharseva-invoice-${bookingId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { showToast('Invoice not available', 'error'); }
  };

  const handleDownloadCSV = async (type) => {
    try {
      const res = await api.get(`/admin/reports/${type}/csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gharseva_${type}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Report downloaded');
    } catch { showToast('Download failed', 'error'); }
  };

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalRevenue = payments.filter(p => p.status === 'captured').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const statusCounts = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {});

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Loading Admin Dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border transition-all ${
          toast.type === 'error'
            ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
            : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Dispute Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#14141f] border border-violet-500/20 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-1">Resolve Dispute</h3>
            <p className="text-slate-400 text-sm mb-4">Booking: {selectedDispute.booking_id.slice(0, 8)}…</p>
            <p className="text-sm text-slate-300 mb-3 bg-slate-800/60 rounded-lg p-3">{selectedDispute.reason}</p>
            <textarea
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white mb-3 resize-none focus:outline-none focus:border-violet-500"
              rows={3}
              placeholder="Resolution details…"
              value={resolutionText}
              onChange={e => setResolutionText(e.target.value)}
            />
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input type="checkbox" className="accent-violet-500" checked={issueRefund} onChange={e => setIssueRefund(e.target.checked)} />
              <span className="text-sm text-slate-300">Issue refund to customer</span>
            </label>
            <div className="flex gap-3">
              <button onClick={() => setSelectedDispute(null)} className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-600 transition-colors">Cancel</button>
              <button onClick={handleResolveDispute} className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">Resolve</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-[#0d0d18] border-r border-white/5 flex flex-col py-6 px-4 sticky top-0">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Admin</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
                activeTab === id
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center text-violet-300 text-xs font-bold">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-500">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all w-full">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
              <div className="flex gap-2">
                <button onClick={() => handleDownloadCSV('bookings')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm text-slate-300 transition-colors">
                  <Download className="w-4 h-4" /> Bookings CSV
                </button>
                <button onClick={() => handleDownloadCSV('payments')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm text-slate-300 transition-colors">
                  <Download className="w-4 h-4" /> Payments CSV
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Bookings',    value: bookings.length,             icon: ClipboardList, color: 'violet' },
                { label: 'Revenue Captured',  value: `₹${totalRevenue.toFixed(0)}`,icon: TrendingUp,   color: 'emerald' },
                { label: 'Active Providers',  value: providers.length,            icon: Users,         color: 'blue' },
                { label: 'Total Reviews',     value: reviews.length,              icon: Star,          color: 'amber' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={`bg-${color}-500/5 border border-${color}-500/20 rounded-2xl p-5`}>
                  <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 text-${color}-400`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-slate-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Status Breakdown */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Booking Status Breakdown</h2>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
                  <div key={k} className={`${cfg.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-xl font-bold ${cfg.color}`}>{statusCounts[k] || 0}</p>
                    <p className="text-xs text-slate-400 mt-1">{cfg.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── BOOKINGS ──────────────────────────────────────────────────────── */}
        {activeTab === 'bookings' && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">All Bookings</h1>
            <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {['ID', 'Status', 'Amount', 'Scheduled', 'Action'].map(h => (
                      <th key={h} className="text-left text-slate-400 font-medium py-3 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-slate-500 py-8">No bookings yet</td></tr>
                  ) : bookings.map(b => {
                    const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={b.booking_id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-3 px-4 text-slate-300 font-mono text-xs">{b.booking_id?.slice(0, 8)}…</td>
                        <td className="py-3 px-4"><span className={`${cfg.bg} ${cfg.color} px-2 py-0.5 rounded-full text-xs`}>{cfg.label}</span></td>
                        <td className="py-3 px-4 text-slate-300">₹{parseFloat(b.total_amount || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString() : '—'}</td>
                        <td className="py-3 px-4">
                          <button onClick={() => handleDownloadInvoice(b.booking_id)} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                            <FileText className="w-3 h-3" /> Invoice
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── USER MANAGEMENT ──────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">User Management</h1>
              <button onClick={loadUsers} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm text-slate-300 transition-colors">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  className="flex-1 bg-transparent py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
                  placeholder="Search by name or email…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadUsers()}
                />
              </div>
              <button onClick={loadUsers} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm text-white transition-colors">Search</button>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {['Name', 'Email', 'Role', 'Status', 'Joined', 'Action'].map(h => (
                      <th key={h} className="text-left text-slate-400 font-medium py-3 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userLoading ? (
                    <tr><td colSpan={6} className="text-center text-slate-500 py-8">Loading…</td></tr>
                  ) : allUsers.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-slate-500 py-8">No users found</td></tr>
                  ) : allUsers.map(u => (
                    <tr key={u.user_id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{u.full_name}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          u.role === 'admin' ? 'bg-violet-500/20 text-violet-300' :
                          u.role === 'provider' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-slate-700 text-slate-400'
                        }`}>{u.role}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${u.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleUserStatus(u.user_id, u.is_active)}
                          className={`flex items-center gap-1 text-xs transition-colors ${u.is_active ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                        >
                          {u.is_active ? <><ToggleRight className="w-4 h-4" /> Suspend</> : <><ToggleLeft className="w-4 h-4" /> Activate</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PROVIDER VERIFICATION ─────────────────────────────────────────── */}
        {activeTab === 'providers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Provider Verification</h1>
              <div className="flex gap-2">
                {['pending', 'approved', 'rejected'].map(s => (
                  <button key={s} onClick={() => loadPendingProviders(s)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs capitalize text-slate-300 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {verifyLoading ? (
              <div className="text-center text-slate-500 py-12">Loading…</div>
            ) : pendingProviders.length === 0 ? (
              <div className="text-center text-slate-500 py-12">No providers in this status</div>
            ) : (
              <div className="grid gap-4">
                {pendingProviders.map(p => (
                  <div key={p.provider_id} className="bg-white/3 border border-white/8 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-lg">
                      {p.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{p.full_name}</p>
                      <p className="text-xs text-slate-400">{p.email} · {p.experience_years}yr exp</p>
                      {p.bio && <p className="text-xs text-slate-500 mt-1 truncate">{p.bio}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      p.verification_status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' :
                      p.verification_status === 'rejected' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>{p.verification_status}</span>
                    {p.verification_status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleVerifyProvider(p.provider_id, 'approved')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs text-white transition-colors">Approve</button>
                        <button onClick={() => handleVerifyProvider(p.provider_id, 'rejected')} className="px-3 py-1.5 bg-rose-600/50 hover:bg-rose-600 rounded-lg text-xs text-rose-300 hover:text-white transition-colors">Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DISPUTES ──────────────────────────────────────────────────────── */}
        {activeTab === 'disputes' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Dispute Management</h1>
              <button onClick={loadDisputes} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm text-slate-300 transition-colors">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
            {disputeLoading ? (
              <div className="text-center text-slate-500 py-12">Loading…</div>
            ) : disputes.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <AlertTriangle className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                <p>No disputes found</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {disputes.map(d => (
                  <div key={d.dispute_id} className="bg-white/3 border border-white/8 rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            d.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' :
                            d.status === 'dismissed' ? 'bg-slate-700 text-slate-400' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>{d.status}</span>
                          <span className="text-xs text-slate-500">Booking: {d.booking_id?.slice(0, 8)}…</span>
                        </div>
                        <p className="text-sm text-white font-medium">Filed by: {d.filed_by_name}</p>
                        <p className="text-xs text-slate-400">{d.filed_by_email}</p>
                        <p className="text-sm text-slate-300 mt-2">{d.reason}</p>
                        {d.resolution_details && (
                          <p className="text-xs text-slate-500 mt-1">Resolution: {d.resolution_details}</p>
                        )}
                      </div>
                      {d.status === 'open' && (
                        <button
                          onClick={() => setSelectedDispute(d)}
                          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs text-white transition-colors flex-shrink-0"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SERVICES ──────────────────────────────────────────────────────── */}
        {activeTab === 'services' && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">Service Management</h1>
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Create Category */}
              <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-violet-400" /> Add Service Category
                </h2>
                <form onSubmit={handleCreateCategory} className="space-y-3">
                  <input
                    required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    placeholder="Category name (e.g. AC Repair)"
                    value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  />
                  <input
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    placeholder="Short description (optional)"
                    value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)}
                  />
                  <button type="submit" className="w-full py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm text-white font-medium transition-colors">
                    Create Category
                  </button>
                </form>

                <h3 className="text-xs font-semibold text-slate-500 mt-6 mb-3">Existing Categories</h3>
                {serviceLoading ? <p className="text-xs text-slate-500">Loading…</p> : (
                  <div className="space-y-2">
                    {categories.map(c => (
                      <div key={c.category_id} className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-sm text-slate-300">{c.name}</span>
                        <span className="text-xs text-slate-600">{c.description || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create Service */}
              <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-400" /> Add Service
                </h2>
                <form onSubmit={handleCreateService} className="space-y-3">
                  <select
                    required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    value={newSvcCatId} onChange={e => setNewSvcCatId(e.target.value)}
                  >
                    <option value="">Select Category…</option>
                    {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                  </select>
                  <input
                    required className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    placeholder="Service name"
                    value={newSvcName} onChange={e => setNewSvcName(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required type="number" min="0" step="0.01"
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                      placeholder="Base price (₹)"
                      value={newSvcPrice} onChange={e => setNewSvcPrice(e.target.value)}
                    />
                    <select
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                      value={newSvcType} onChange={e => setNewSvcType(e.target.value)}
                    >
                      <option value="flat">Flat Rate</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm text-white font-medium transition-colors">
                    Create Service
                  </button>
                </form>

                <h3 className="text-xs font-semibold text-slate-500 mt-6 mb-3">Existing Services</h3>
                {serviceLoading ? <p className="text-xs text-slate-500">Loading…</p> : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allServices.map(s => (
                      <div key={s.service_id} className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-sm text-slate-300">{s.name}</span>
                        <span className="text-xs text-emerald-400">₹{parseFloat(s.base_price || 0).toFixed(0)} {s.price_type === 'hourly' ? '/hr' : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── REVIEWS ───────────────────────────────────────────────────────── */}
        {activeTab === 'reviews' && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">Review Moderation</h1>
            {reviews.length === 0 ? (
              <div className="text-center text-slate-500 py-12">No reviews yet</div>
            ) : (
              <div className="grid gap-4">
                {reviews.map(r => (
                  <div key={r.review_id} className={`bg-white/3 border rounded-2xl p-5 transition-all ${r.is_hidden ? 'border-rose-500/20 opacity-60' : 'border-white/8'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} 
                          {r.is_hidden && <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">Hidden</span>}
                        </div>
                        <p className="text-sm text-slate-300">{r.comment || 'No comment'}</p>
                        {r.reply && <p className="text-xs text-slate-500 mt-1">Provider reply: {r.reply}</p>}
                      </div>
                      <button
                        onClick={() => handleToggleReview(r.review_id, r.is_hidden)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          r.is_hidden ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40' : 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/40'
                        }`}
                      >
                        {r.is_hidden ? <><Eye className="w-3 h-3" /> Restore</> : <><EyeOff className="w-3 h-3" /> Hide</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TRANSACTIONS ──────────────────────────────────────────────────── */}
        {activeTab === 'transactions' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Payment Transactions</h1>
              <button onClick={() => handleDownloadCSV('payments')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm text-slate-300 transition-colors">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    {['Payment ID', 'Booking', 'Amount', 'Status', 'Date', 'Invoice'].map(h => (
                      <th key={h} className="text-left text-slate-400 font-medium py-3 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-slate-500 py-8">No transactions yet</td></tr>
                  ) : payments.map(p => (
                    <tr key={p.payment_id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono text-xs">{p.payment_id?.slice(0, 8)}…</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-xs">{p.booking_id?.slice(0, 8)}…</td>
                      <td className="py-3 px-4 text-white font-medium">₹{parseFloat(p.amount || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          p.status === 'captured' ? 'bg-emerald-500/20 text-emerald-300' :
                          p.status === 'refunded' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-slate-700 text-slate-400'
                        }`}>{p.status}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleDownloadInvoice(p.booking_id)} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                          <FileText className="w-3 h-3" /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
