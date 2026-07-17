import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/authSlice';
import api from '../services/api';
import {
  LogOut, Users, ShieldCheck, ClipboardList, TrendingUp,
  CheckCircle2, XCircle, Clock, Wrench, ChevronRight,
  Home, Crown, Star, Activity, BarChart2, UserCheck
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'text-amber-400',  bg: 'bg-amber-400/10' },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  completed:  { label: 'Completed',  color: 'text-emerald-400',bg: 'bg-emerald-400/10' },
  cancelled:  { label: 'Cancelled',  color: 'text-rose-400',   bg: 'bg-rose-400/10' },
  in_progress:{ label: 'In Progress',color: 'text-violet-400', bg: 'bg-violet-400/10' },
};

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle2,
  completed: CheckCircle2,
  cancelled: XCircle,
  in_progress: Wrench,
};

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [bookings, setBookings]   = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/bookings/').catch(() => ({ data: [] })),
      api.get('/providers/').catch(() => ({ data: [] })),
    ]).then(([bRes, pRes]) => {
      setBookings(bRes.data || []);
      setProviders(pRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const stats = {
    bookings:        bookings.length,
    providers:       providers.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    completedJobs:   bookings.filter(b => b.status === 'completed').length,
    revenue:         bookings.filter(b => b.status === 'completed').length * 450,
    activeProviders: providers.filter(p => p.is_available).length,
  };

  // Booking breakdown by status
  const statusBreakdown = Object.entries(
    bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const handleLogout = () => { dispatch(logout()); navigate('/'); };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-400/10 border border-rose-400/20 flex items-center justify-center">
              <Crown className="w-4 h-4 text-rose-400" />
            </div>
            <span className="font-bold text-sm tracking-wide">GharSeva</span>
            <span className="text-slate-600 text-xs">/ Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <Crown className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-slate-300">{user?.full_name || user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 border border-transparent hover:border-rose-400/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-48 bg-rose-400/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-400/10 border border-rose-400/20 text-[10px] font-semibold text-rose-400 mb-4">
              <Crown className="w-3 h-3" /> Admin Control Panel
            </div>
            <h1 className="text-2xl font-bold">Platform Overview 📊</h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitor all bookings, providers, and platform health in real time.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Bookings',  value: stats.bookings,                              icon: ClipboardList, color: 'text-blue-400',    bg: 'bg-blue-400/10' },
            { label: 'Providers',       value: stats.providers,                             icon: Users,         color: 'text-violet-400',  bg: 'bg-violet-400/10' },
            { label: 'Pending',         value: stats.pendingBookings,                       icon: Clock,         color: 'text-amber-400',   bg: 'bg-amber-400/10' },
            { label: 'Completed Jobs',  value: stats.completedJobs,                         icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Active Providers',value: stats.activeProviders,                       icon: Activity,      color: 'text-rose-400',    bg: 'bg-rose-400/10' },
            { label: 'Revenue',         value: `₹${stats.revenue.toLocaleString('en-IN')}`,icon: TrendingUp,    color: 'text-teal-400',    bg: 'bg-teal-400/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl bg-slate-900/50 border border-slate-800 p-4 flex flex-col gap-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <div className="text-xl font-bold">{value}</div>
                <div className="text-[10px] text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* All Bookings */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-rose-400" />
                <span className="font-semibold text-sm">All Bookings</span>
              </div>
              <span className="text-xs text-slate-500">{bookings.length} total</span>
            </div>

            {loading ? (
              <div className="p-10 text-center">
                <div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Loading data…</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-7 h-7 text-slate-600" />
                </div>
                <p className="text-sm font-semibold text-slate-400">No bookings on platform yet</p>
                <p className="text-xs text-slate-600 mt-1">Bookings will appear here as customers create them</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50 max-h-96 overflow-y-auto">
                {bookings.map((b) => {
                  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                  const Icon = STATUS_ICONS[b.status] || Clock;
                  return (
                    <div key={b.booking_id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-800/20 transition group">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{b.service_name || 'Booking #' + b.booking_id?.slice(0, 8)}</p>
                          <p className="text-xs text-slate-500">
                            {b.scheduled_at ? new Date(b.scheduled_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Booking Status Breakdown */}
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-5">
                <BarChart2 className="w-4 h-4 text-rose-400" />
                <span className="font-semibold text-sm">Status Breakdown</span>
              </div>
              {statusBreakdown.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {statusBreakdown.map(([status, count]) => {
                    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                    const pct = stats.bookings > 0 ? Math.round((count / stats.bookings) * 100) : 0;
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={`${cfg.color} font-semibold`}>{cfg.label}</span>
                          <span className="text-slate-500">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full ${cfg.bg.replace('/10', '/60')}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Providers List */}
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-rose-400" />
                <span className="font-semibold text-sm">Providers</span>
              </div>
              {loading ? (
                <div className="p-6 text-center">
                  <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : providers.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs text-slate-600">No providers registered yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/50 max-h-64 overflow-y-auto">
                  {providers.slice(0, 10).map((p) => (
                    <div key={p.provider_id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-violet-400/10 flex items-center justify-center text-[11px] font-bold text-violet-300">
                          {p.full_name?.[0] || p.email?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div>
                          <p className="text-xs font-medium">{p.full_name || p.email}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-2.5 h-2.5 text-amber-400" />
                            <span className="text-[10px] text-slate-500">{p.avg_rating?.toFixed(1) || '—'}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${p.is_available ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
