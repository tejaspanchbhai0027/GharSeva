import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Star, Clock, FileText, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [service, setService] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const [servRes, provRes] = await Promise.all([
          api.get(`/services/${id}`),
          api.get(`/providers?service_id=${id}`) // Assuming the API supports filtering providers by service
        ]);
        setService(servRes.data);
        setProviders(provRes.data.items || provRes.data);
      } catch (err) {
        console.error("Failed to load service details", err);
        setError("Failed to load service details.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchServiceData();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">{error || "Service not found"}</h2>
        <Button variant="outline" onClick={() => navigate('/')}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header Banner */}
      <div className="bg-slate-900 border-b border-slate-800 pt-8 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-amber-500 hover:text-amber-400 mb-6 transition-colors text-sm font-semibold">
            <ArrowLeft size={16} /> Back
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              {service.is_featured && (
                <span className="inline-block bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs px-2 py-1 rounded mb-3 font-semibold tracking-wider uppercase">
                  Featured Service
                </span>
              )}
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">{service.name}</h1>
              <p className="text-slate-400 text-lg max-w-2xl">{service.description}</p>
            </div>
            
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center min-w-[200px]">
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold mb-1">Starting from</p>
              <div className="text-3xl font-black text-amber-500">
                ₹{service.base_price} <span className="text-lg font-normal text-slate-500">{service.price_type === 'hourly' ? '/ hr' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl py-12">
        <div className="grid md:grid-cols-3 gap-12">
          
          {/* Main Content */}
          <div className="md:col-span-2 space-y-12">
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="text-amber-500" /> Service Overview
              </h2>
              <div className="prose prose-invert max-w-none text-slate-300">
                <p>
                  Our verified professionals are equipped with the necessary tools and expertise to deliver high-quality {service.name.toLowerCase()} services directly at your home. 
                  Pricing is transparently calculated based on our base {service.price_type === 'hourly' ? 'hourly rate' : 'flat fee'}.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" /> High quality materials and modern techniques.</li>
                  <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" /> Post-service cleanup and safety checks.</li>
                  <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" /> 100% Satisfaction Guarantee.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <ShieldCheck className="text-amber-500" /> Top Professionals for {service.name}
              </h2>
              
              {providers.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
                  <p className="text-slate-400 mb-4">We are currently onboarding professionals for this specific service in your area.</p>
                  <Button variant="outline" onClick={() => navigate('/providers')}>Browse All Providers</Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {providers.slice(0, 5).map(provider => (
                    <div key={provider.provider_id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-500">
                          {provider.profile_photo_url ? (
                            <img src={provider.profile_photo_url} alt={provider.full_name} className="w-full h-full object-cover" />
                          ) : provider.full_name?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{provider.full_name}</h3>
                          <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                            <span className="flex items-center gap-1 text-amber-500 font-semibold"><Star size={14} className="fill-amber-500" /> {provider.avg_rating?.toFixed(1) || 'New'}</span>
                            <span>•</span>
                            <span>{provider.experience_years} Yrs Exp</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="primary" 
                        className="w-full sm:w-auto shrink-0 font-bold"
                        onClick={() => navigate(`/book/${provider.provider_id}/${service.service_id}`)}
                      >
                        Book Now
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-white mb-4 border-b border-slate-800 pb-2">How it works</h3>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <p className="text-sm text-slate-300">Select a verified professional from the list.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <p className="text-sm text-slate-300">Choose your preferred date, time, and address.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                  <p className="text-sm text-slate-300">Provider arrives and completes the service.</p>
                </li>
              </ol>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 text-center">
              <ShieldCheck size={32} className="mx-auto text-amber-500 mb-3" />
              <h3 className="font-bold text-amber-500 mb-2">GharSeva Guarantee</h3>
              <p className="text-xs text-amber-500/80">If you're not fully satisfied with the service, we'll make it right. Your peace of mind is our priority.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
