import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/authSlice';
import api from '../services/api';
import {
  LogOut, Star, Briefcase, ToggleLeft, ToggleRight,
  Clock, CheckCircle2, XCircle, Wrench, ChevronRight,
  User, Home, TrendingUp, MapPin, Shield, Calendar, MessageSquare, Reply
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'text-amber-400',  bg: 'bg-amber-400/10' },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  completed:  { label: 'Completed',  color: 'text-emerald-400',bg: 'bg-emerald-400/10' },
  cancelled:  { label: 'Cancelled',  color: 'text-rose-400',   bg: 'bg-rose-400/10' },
  in_progress:{ label: 'In Progress',color: 'text-violet-400', bg: 'bg-violet-400/10' },
};

export default function ProviderDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');
  
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/bookings/').catch(() => ({ data: [] })),
      api.get('/providers/').catch(() => ({ data: [] })),
    ]).then(([bRes, pRes]) => {
      setBookings(bRes.data || []);
      // Find this provider's profile from provider list
      const allProviders = pRes.data || [];
      const myProfile = allProviders.find(p => p.user_id === user?.user_id || p.email === user?.email);
      setProfile(myProfile || null);
      
      if (myProfile) {
        api.get(`/providers/${myProfile.provider_id}/reviews`)
          .then(res => setReviews(res.data || []))
          .catch(() => setReviews([]));
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) return;
    try {
      const res = await api.patch(`/reviews/${reviewId}/reply`, { reply: replyText });
      setReviews(reviews.map(r => r.review_id === reviewId ? res.data : r));
      setReplyingTo(null);
      setReplyText('');
    } catch (err) {
      alert("Failed to submit reply.");
    }
  };

  const stats = {
    total:     bookings.length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    earnings:  bookings.filter(b => b.status === 'completed').length * 450,
  };

  const handleLogout = () => { dispatch(logout()); navigate('/'); };

  const toggleAvailability = async () => {
    if (!profile) return;
    setToggling(true);
    try {
      await api.put(`/providers/${profile.provider_id}`, {
        is_available: !profile.is_available,
      });
      setProfile(prev => ({ ...prev, is_available: !prev.is_available }));
    } catch {
      // ignore
    } finally {
      setToggling(false);
    }
  };

  const isAvailable = profile?.is_available ?? false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
              <Home className="w-4 h-4 text-violet-400" />
            </div>
            <span className="font-bold text-sm tracking-wide">GharSeva</span>
            <span className="text-slate-600 text-xs">/ Provider</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <User className="w-3.5 h-3.5 text-violet-400" />
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
        {/* Welcome + Availability Toggle */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-400/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-400/10 border border-violet-400/20 text-[10px] font-semibold text-violet-400 mb-4">
                <Briefcase className="w-3 h-3" /> Provider Dashboard
              </div>
              <h1 className="text-2xl font-bold">Welcome, {user?.full_name?.split(' ')[0] || 'Provider'}! 🛠️</h1>
              <p className="text-sm text-slate-400 mt-1">
                {profile ? `${profile.experience_years || 0} yrs experience · ${profile.total_jobs || stats.completed} jobs done` : 'Manage your jobs and availability below.'}
              </p>
            </div>

            {/* Availability Toggle */}
            <div className="flex-shrink-0 flex flex-col items-start sm:items-end gap-2">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Availability Status</p>
              <button
                onClick={toggleAvailability}
                disabled={toggling || !profile}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-semibold transition-all shadow-lg ${
                  isAvailable
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-emerald-400/10'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                {toggling ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isAvailable ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
                {isAvailable ? 'Available for Work' : 'Set as Unavailable'}
              </button>
              {profile && (
                <span className="text-[10px] text-slate-600">
                  ⭐ {profile.avg_rating?.toFixed(1) || '4.5'} rating · {profile.service_radius_km || 15}km radius
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Jobs',   value: stats.total,                icon: Briefcase,  color: 'text-violet-400',  bg: 'bg-violet-400/10' },
            { label: 'Pending',      value: stats.pending,              icon: Clock,      color: 'text-amber-400',   bg: 'bg-amber-400/10' },
            { label: 'Completed',    value: stats.completed,            icon: CheckCircle2,color:'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Est. Earnings',value: `₹${stats.earnings.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl bg-slate-900/50 border border-slate-800 p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-2">
              <button 
                onClick={() => setActiveTab('jobs')}
                className={`font-semibold text-sm pb-2 border-b-2 transition-colors ${activeTab === 'jobs' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
              >
                Assigned Jobs
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`font-semibold text-sm pb-2 border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
              >
                Customer Reviews
              </button>
            </div>

            {/* Bookings */}
            {activeTab === 'jobs' && (
              <div className="rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-violet-400" />
                  <span className="font-semibold text-sm">Assigned Jobs</span>
                </div>

                {loading ? (
                  <div className="p-10 text-center">
                    <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-slate-500">Loading jobs…</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-7 h-7 text-slate-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">No jobs assigned yet</p>
                    <p className="text-xs text-slate-600 mt-1">Make sure your availability is set to receive jobs</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/50">
                    {bookings.map((b) => {
                      const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                      return (
                        <div key={b.booking_id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/20 transition group">
                          <div className="flex items-center gap-4">
                            <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                              <Wrench className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{b.service_name || 'Service Job'}</p>
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
            )}
            
            {/* Reviews */}
            {activeTab === 'reviews' && (
              <div className="rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-sm">Customer Reviews</span>
                </div>
                
                {reviews.length === 0 ? (
                  <div className="p-10 text-center">
                    <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-400">No reviews yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/50">
                    {reviews.map(review => (
                      <div key={review.review_id} className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span key={star} className={`text-sm ${star <= review.rating ? 'text-amber-500' : 'text-slate-700'}`}>★</span>
                            ))}
                          </div>
                          <span className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        {review.comment && <p className="text-sm text-slate-300 italic mb-4">"{review.comment}"</p>}
                        
                        {review.reply ? (
                          <div className="bg-slate-800/50 p-3 rounded-lg border-l-2 border-violet-500">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Your Reply</p>
                            <p className="text-sm text-slate-300">{review.reply}</p>
                          </div>
                        ) : (
                          <div>
                            {replyingTo === review.review_id ? (
                              <div className="mt-3 flex gap-2">
                                <input 
                                  type="text"
                                  value={replyText}
                                  onChange={e => setReplyText(e.target.value)}
                                  placeholder="Type your reply..."
                                  className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white"
                                />
                                <button onClick={() => handleReplySubmit(review.review_id)} className="bg-violet-500 text-white px-4 py-2 rounded text-sm font-bold">Send</button>
                                <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="bg-slate-800 text-slate-300 px-4 py-2 rounded text-sm font-bold">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setReplyingTo(review.review_id)} className="text-xs text-violet-400 font-semibold hover:underline flex items-center gap-1">
                                <Reply size={14} /> Reply to Customer
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
          </div>

          {/* Profile Card */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-5">
                <User className="w-4 h-4 text-violet-400" />
                <span className="font-semibold text-sm">My Profile</span>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/30 to-violet-800/20 border border-violet-400/20 flex items-center justify-center text-2xl font-bold text-violet-300">
                  {user?.full_name?.[0] || 'P'}
                </div>
                <div>
                  <p className="font-bold text-sm">{user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-400/10 border border-emerald-400/20">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] font-semibold text-emerald-400">Verified Provider</span>
                </div>
              </div>

              {profile && (
                <div className="mt-5 space-y-3 pt-4 border-t border-slate-800">
                  {[
                    { icon: Star,    label: 'Rating',      value: `${profile.avg_rating?.toFixed(1) || '4.5'} / 5.0` },
                    { icon: Briefcase,label:'Experience',   value: `${profile.experience_years || 0} years` },
                    { icon: MapPin,  label: 'Service Area', value: `${profile.service_radius_km || 15} km radius` },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </div>
                      <span className="text-slate-300 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Days Active */}
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-5">
              <p className="text-xs font-semibold text-slate-400 mb-3">Work Days</p>
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map((d, i) => (
                  <div key={d} className={`aspect-square rounded-lg flex items-center justify-center text-[9px] font-bold ${i >= 1 && i <= 5 ? 'bg-violet-400/20 text-violet-300' : 'bg-slate-800/60 text-slate-600'}`}>
                    {d}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-2">Mon–Fri by default</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
