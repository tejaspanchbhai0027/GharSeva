import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Star, MapPin, Briefcase, Calendar, Clock, CheckCircle, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

const ProviderProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [profileRes, availRes, servicesRes, reviewsRes] = await Promise.all([
          api.get(`/providers/${id}`),
          api.get(`/providers/${id}/availability`),
          api.get(`/providers/${id}/services`),
          api.get(`/providers/${id}/reviews`)
        ]);
        setProvider(profileRes.data);
        setAvailability(availRes.data);
        setServices(servicesRes.data);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load provider profile.");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="container mx-auto px-4 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-amber-500 hover:text-amber-400 mb-6 transition-colors">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-6 rounded-xl flex flex-col items-center justify-center text-center max-w-md mx-auto mt-20">
          <AlertCircle size={48} className="mb-4" />
          <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
          <p>{error || "The provider you are looking for does not exist."}</p>
        </div>
      </div>
    );
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-amber-500 hover:text-amber-400 mb-6 transition-colors font-medium">
        <ArrowLeft size={18} /> Back to Search
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg text-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-800"></div>
            
            <div className="relative z-10 pt-4">
              <div className="w-32 h-32 mx-auto bg-slate-800 rounded-full overflow-hidden border-4 border-slate-900 shadow-xl mb-4">
                {provider.profile_photo_url ? (
                  <img src={provider.profile_photo_url} alt={provider.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-5xl font-bold bg-slate-800">
                    {provider.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <h1 className="text-2xl font-bold text-white mb-1">{provider.full_name}</h1>
              <p className="text-slate-400 text-sm mb-4">Joined {new Date(provider.created_at || Date.now()).getFullYear()}</p>
              
              {provider.verification_status === 'approved' && (
                <div className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-full text-xs font-semibold mb-6 shadow-sm">
                  <ShieldCheck size={14} /> Verified Professional
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                    <Star size={18} className="fill-amber-400" />
                    <span className="font-bold text-lg">{provider.avg_rating?.toFixed(1)}</span>
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">{provider.total_jobs} Jobs done</div>
                </div>
                <div className="text-center border-l border-slate-800">
                  <div className="flex items-center justify-center gap-1 text-white mb-1">
                    <Briefcase size={18} className="text-slate-400" />
                    <span className="font-bold text-lg">{provider.experience_years}</span>
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Years Exp.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-2">Contact & Location</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-300">
                <MapPin size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">Service Area</p>
                  <p className="text-sm text-slate-400">Up to {provider.service_radius_km} km radius</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-slate-300">
                <CheckCircle size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">Status</p>
                  <p className="text-sm text-slate-400 flex items-center gap-1">
                    {provider.is_available ? (
                      <><span className="w-2 h-2 rounded-full bg-green-500"></span> Available for booking</>
                    ) : (
                      <><span className="w-2 h-2 rounded-full bg-red-500"></span> Currently Unavailable</>
                    )}
                  </p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-2">Services Offered</h3>
            {services.length === 0 ? (
                <p className="text-slate-400 text-sm">No services listed yet.</p>
            ) : (
                <div className="space-y-3">
                    {services.map(service => (
                        <div key={service.service_id} className="border border-slate-700 bg-slate-950 p-4 rounded-lg flex flex-col gap-3">
                            <div>
                                <h4 className="font-bold text-white text-md">{service.name}</h4>
                                <p className="text-slate-400 text-xs line-clamp-2 mt-1">{service.description}</p>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-amber-500 font-bold text-lg">₹{service.base_price}</span>
                                <button 
                                    disabled={!provider.is_available}
                                    onClick={() => navigate(`/book/${provider.provider_id}/${service.service_id}`)}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {provider.is_available ? 'Book' : 'Unavailable'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>

        {/* Right Column: Details & Availability */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Bio */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              About Me
            </h2>
            <div className="prose prose-invert max-w-none">
              {provider.bio ? (
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{provider.bio}</p>
              ) : (
                <p className="text-slate-500 italic">This professional hasn't written a bio yet.</p>
              )}
            </div>
          </div>

          {/* Availability Calendar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar size={22} className="text-amber-500" />
              Weekly Availability
            </h2>
            
            {availability.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-slate-700 rounded-lg">
                <Clock size={32} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">No availability schedule set yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {daysOfWeek.map((day, idx) => {
                  const daySlots = availability.filter(s => s.day_of_week === idx);
                  if (daySlots.length === 0) return null;
                  
                  return (
                    <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                      <h3 className="font-semibold text-white mb-3 border-b border-slate-800 pb-2">{day}</h3>
                      <div className="space-y-2">
                        {daySlots.map((slot, sIdx) => (
                          <div 
                            key={sIdx} 
                            className={`flex items-center gap-2 text-sm p-2 rounded ${slot.is_blocked ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-800 text-slate-300'}`}
                          >
                            <Clock size={14} className={slot.is_blocked ? 'text-red-400' : 'text-slate-500'} />
                            <span>{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</span>
                            {slot.is_blocked && <span className="ml-auto text-xs uppercase tracking-wider font-semibold">Blocked</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Reviews */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Star size={22} className="text-amber-500" />
              Customer Reviews
            </h2>
            
            {reviews.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-slate-700 rounded-lg bg-slate-950">
                <p className="text-slate-400">No reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map(review => (
                  <div key={review.review_id} className="border-b border-slate-800 pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={`text-sm ${star <= review.rating ? 'text-amber-500' : 'text-slate-700'}`}>★</span>
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    {review.comment && <p className="text-slate-300 text-sm italic">"{review.comment}"</p>}
                    
                    {review.reply && (
                      <div className="bg-slate-800/50 p-3 rounded-lg mt-3 border-l-2 border-amber-500">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Provider Reply</p>
                        <p className="text-sm text-slate-300">{review.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ProviderProfilePage;
