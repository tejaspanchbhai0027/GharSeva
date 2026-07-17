import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import Button from '../components/common/Button';

const CATEGORIES = [
  { id: '1', name: 'Cleaning', icon: '🧹', desc: 'Home cleaning, sofa & carpet deep cleaning', complexity: 'Low' },
  { id: '2', name: 'Plumbing', icon: '🚰', desc: 'Leak repair, pipe fitting, drain unclogging', complexity: 'Medium' },
  { id: '3', name: 'Electrical', icon: '⚡', desc: 'Wiring, appliance repair, switchboards', complexity: 'Medium-High' },
  { id: '4', name: 'Carpentry', icon: '🪚', desc: 'Furniture repair, custom woodwork', complexity: 'Medium' },
  { id: '5', name: 'Painting', icon: '🎨', desc: 'Interior & exterior wall texturing', complexity: 'Medium' },
  { id: '6', name: 'Pest Control', icon: '🐜', desc: 'General pest and termite treatments', complexity: 'Medium' },
  { id: '7', name: 'Appliance Repair', icon: '🔌', desc: 'AC, refrigerator, washing machines', complexity: 'High' },
  { id: '8', name: 'Gardening', icon: '🌱', desc: 'Lawn mowing, pruning, plant care', complexity: 'Low' },
];

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/providers?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/providers?category=${encodeURIComponent(categoryName)}`);
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

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Browse Categories</h2>
            <p className="text-xs text-slate-400 mt-1">Select a category to view availability</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              className="group text-left p-6 rounded-2xl bg-slate-900/30 border border-slate-850 hover:border-slate-800 hover:bg-slate-900/50 hover:scale-[1.02] transition-all duration-300 backdrop-blur-md relative overflow-hidden"
            >
              {/* Highlight bar */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500/0 via-amber-400/0 to-amber-300/0 group-hover:from-amber-500/20 group-hover:via-amber-400/40 group-hover:to-yellow-300/20 transition-all duration-300" />
              
              <div className="w-12 h-12 text-3xl bg-slate-900/80 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-all duration-300">
                {cat.icon}
              </div>
              <h3 className="text-base font-semibold group-hover:text-amber-300 transition duration-200">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 mt-2 font-normal line-clamp-2">
                {cat.desc}
              </p>
              
              {/* Complexity tag */}
              <div className="mt-4 inline-flex items-center text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full capitalize">
                Complexity: {cat.complexity}
              </div>
            </button>
          ))}
        </div>
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
