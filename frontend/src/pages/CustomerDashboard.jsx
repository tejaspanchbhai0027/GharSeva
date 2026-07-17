import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/authSlice';
import api from '../services/api';
import {
  CalendarDays, ClipboardList, Star, Zap, LogOut,
  PlusCircle, Clock, CheckCircle2, XCircle, Wrench,
  ChevronRight, User, Sparkles, Home
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'text-amber-400',  bg: 'bg-amber-400/10',  icon: Clock },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-400',   bg: 'bg-blue-400/10',   icon: CheckCircle2 },
  completed:  { label: 'Completed',  color: 'text-emerald-400',bg: 'bg-emerald-400/10',icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',  color: 'text-rose-400',   bg: 'bg-rose-400/10',   icon: XCircle },
  in_progress:{ label: 'In Progress',color: 'text-violet-400', bg: 'bg-violet-400/10', icon: Wrench },
};

const SERVICES = [
  { name: 'Cleaning',         icon: '🧹' },
  { name: 'Plumbing',         icon: '🚰' },
  { name: 'Electrical',       icon: '⚡' },
  { name: 'Carpentry',        icon: '🪚' },
  { name: 'Painting',         icon: '🎨' },
  { name: 'Pest Control',     icon: '🐜' },
  { name: 'Appliance Repair', icon: '🔌' },
  { name: 'Gardening',        icon: '🌱' },
];

export default function CustomerDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings/')
      .then((r) => setBookings(r.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total:     bookings.length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    active:    bookings.filter(b => ['confirmed','in_progress'].includes(b.status)).length,
  };

  const handleLogout = () => { dispatch(logout()); navigate('/'); };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <Home className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-bold text-sm tracking-wide">GharSeva</span>
            <span className="text-slate-600 text-xs">/ Customer</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <User className="w-3.5 h-3.5 text-amber-400" />
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

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Welcome Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/60 border border-slate-800 p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-[10px] font-semibold text-amber-400 mb-4">
              <Sparkles className="w-3 h-3" /> Customer Dashboard
            </div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(' ')[0] || 'there'}! 👋</h1>
            <p className="text-sm text-slate-400 mt-1">Book verified home service professionals instantly.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-sm font-bold hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/20"
            >
              <PlusCircle className="w-4 h-4" /> Book a Service
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Bookings', value: stats.total,     icon: ClipboardList, color: 'text-blue-400',    bg: 'bg-blue-400/10' },
            { label: 'Pending',        value: stats.pending,   icon: Clock,         color: 'text-amber-400',   bg: 'bg-amber-400/10' },
            { label: 'Active',         value: stats.active,    icon: Zap,           color: 'text-violet-400',  bg: 'bg-violet-400/10' },
            { label: 'Completed',      value: stats.completed, icon: Star,          color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl bg-slate-900/50 border border-slate-800 p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bookings List */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-sm">My Bookings</span>
              </div>
              {bookings.length > 0 && (
                <span className="text-xs text-slate-500">{bookings.length} total</span>
              )}
            </div>

            {loading ? (
              <div className="p-10 text-center">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Loading bookings…</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-7 h-7 text-slate-600" />
                </div>
                <p className="text-sm font-semibold text-slate-400">No bookings yet</p>
                <p className="text-xs text-slate-600 mt-1">Browse services and book your first professional</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold hover:bg-amber-400/20 transition"
                >
                  Browse Services
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {bookings.map((b) => {
                  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <div key={b.booking_id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/20 transition group">
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{b.service_name || 'Service Booking'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {b.scheduled_at ? new Date(b.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Schedule TBD'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Service Browse */}
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-sm">Quick Book</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {SERVICES.map((s) => (
                <button
                  key={s.name}
                  onClick={() => navigate(`/?category=${encodeURIComponent(s.name)}`)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-400/30 hover:bg-slate-800/60 transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{s.icon}</span>
                  <span className="text-[10px] text-slate-400 font-medium text-center leading-tight">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
