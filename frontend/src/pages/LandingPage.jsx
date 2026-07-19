import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, ShieldCheck, Zap, Sparkles, Star } from 'lucide-react';
import Button from '../components/common/Button';
import api from '../services/api';

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, featRes] = await Promise.all([
          api.get('/categories'),
          api.get('/services?is_featured=true')
        ]);
        setCategories(catRes.data);
        setFeaturedServices(featRes.data);
      } catch (err) {
        console.error("Failed to fetch landing page data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/providers?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/providers?category=${encodeURIComponent(categoryName)}`); // Later can map categoryName to ID or handle differently
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pb-20">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center">
        {/* Glow effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-amber-400/5 blur-[120px] rounded-full pointer-events-none" />

        {/* AI Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-xs font-semibold text-amber-400 mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Smart Provider Matching
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Reliable Home Services.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200">
            Powered by AI.
          </span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl font-light">
          Connect instantly with background-verified professional electricians, plumbers, painters, and cleaners in your city.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-10 w-full max-w-2xl relative">
          <div className="flex items-center bg-slate-900/60 border border-slate-800 focus-within:border-amber-400/60 focus-within:ring-4 focus-within:ring-amber-400/10 rounded-2xl p-2 transition duration-200 shadow-xl backdrop-blur-md">
            <Search className="w-5 h-5 text-slate-500 ml-3" />
            <input
              type="text"
              placeholder="What home service do you need today? e.g. Plumber, Deep Cleaning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none py-3 px-3 text-sm text-slate-100 placeholder-slate-500"
            />
            <Button type="submit" variant="primary" size="md" className="rounded-xl px-6">
              Search
            </Button>
          </div>
        </form>
      </section>

      {/* Featured Services */}
      {featuredServices.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-amber-400 flex items-center gap-2">
                <Star size={24} className="fill-amber-400" /> Featured Services
              </h2>
              <p className="text-sm text-slate-400 mt-1">Our most popular and highly rated offerings.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredServices.map(service => (
              <div 
                key={service.service_id} 
                onClick={() => navigate(`/services/${service.service_id}`)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-amber-500/50 hover:bg-slate-800 transition-all cursor-pointer shadow-lg relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -z-10 group-hover:scale-150 transition-transform"></div>
                <h3 className="font-bold text-white text-lg">{service.name}</h3>
                <p className="text-sm text-slate-400 mt-2 line-clamp-2">{service.description}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-amber-500 font-bold">₹{service.base_price} {service.price_type === 'hourly' ? '/ hr' : ''}</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold group-hover:text-amber-400 transition-colors">Details →</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Browse Categories</h2>
            <p className="text-sm text-slate-400 mt-1">Select a category to view availability</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                onClick={() => handleCategoryClick(cat.category_id)}
                className="group text-left p-6 rounded-2xl bg-slate-900/30 border border-slate-850 hover:border-slate-800 hover:bg-slate-900/50 hover:scale-[1.02] transition-all duration-300 backdrop-blur-md relative overflow-hidden"
              >
                {/* Highlight bar */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500/0 via-amber-400/0 to-amber-300/0 group-hover:from-amber-500/20 group-hover:via-amber-400/40 group-hover:to-yellow-300/20 transition-all duration-300" />
                
                <h3 className="text-base font-semibold group-hover:text-amber-300 transition duration-200 mt-2">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-2 font-normal line-clamp-2">
                  {cat.description || "Explore services in this category."}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Why GharSeva Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-900/80 mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-12">Why Choose GharSeva?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900">
            <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold">100% Background Verified</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Every provider undergoes identity check verification and credential screening before receiving bookings.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900">
            <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold">Smart Matching Engine</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Our preference matching algorithms score candidates based on geographic proximity, review history, and response profiles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900">
            <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold">Transparent Estimations</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Clear cost estimates shown upfront before booking. Secure payment gateways handle transactions automatically.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
