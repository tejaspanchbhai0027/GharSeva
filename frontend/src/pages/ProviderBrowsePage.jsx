import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import ProviderCard from '../components/ProviderCard';
import { Search, Filter, SortAsc, Sparkles, Map as MapIcon, List, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const ProviderBrowsePage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || '';

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [category, setCategory] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [minExperience, setMinExperience] = useState(0);
  const [sortBy, setSortBy] = useState('rating');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [isAiMatching, setIsAiMatching] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (category) params.append('category_id', category);
      if (minRating > 0) params.append('rating_min', minRating);
      if (minExperience > 0) params.append('experience_min', minExperience);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      params.append('page', page);
      params.append('limit', 10);

      const res = await api.get(`/providers?${params.toString()}`);
      setProviders(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
      setTotalItems(res.data.total || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch providers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, category, minRating, minExperience, sortBy, sortOrder, page]);

  useEffect(() => {
    // debounce fetching slightly to avoid spamming while typing search
    const delayDebounceFn = setTimeout(() => {
      fetchProviders();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchProviders]);

  const handleAiMatch = async () => {
    setIsAiMatching(true);
    try {
      // Mocking AI match parameters for M1
      // In M2 this will come from the booking wizard
      // Service ID (mock dummy UUID), scheduled_at (tomorrow), address_id (mock dummy UUID)
      const mockServiceId = "00000000-0000-0000-0000-000000000000";
      const mockAddressId = "00000000-0000-0000-0000-000000000000";
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const mockScheduledAt = tomorrow.toISOString();

      const res = await api.get(`/providers/match`, {
        params: {
          service_id: mockServiceId,
          scheduled_at: mockScheduledAt,
          address_id: mockAddressId
        }
      });
      
      // In a real scenario, this returns a list of matches. We'd display them.
      // Since it's mocked and might fail if dummy IDs aren't in DB, we catch it.
      setProviders(res.data.map(m => m.provider));
      setTotalItems(res.data.length);
      setTotalPages(1);
    } catch (err) {
      setError("AI Matching requires a valid service and address (To be fully integrated in M2).");
    } finally {
      setIsAiMatching(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Find a Professional</h1>
          <p className="text-slate-400">Discover trusted service providers near you.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleAiMatch}
            disabled={isAiMatching}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold py-2 px-5 rounded-lg shadow-lg shadow-amber-500/20 transition-all disabled:opacity-70"
          >
            <Sparkles size={18} />
            {isAiMatching ? 'Matching...' : 'AI Match'}
          </button>

          <div className="bg-slate-800 p-1 rounded-lg flex items-center shadow-inner">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-amber-400' : 'text-slate-400 hover:text-white'}`}
              title="List View"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md flex items-center justify-center transition-colors ${viewMode === 'map' ? 'bg-slate-700 text-amber-400' : 'text-slate-400 hover:text-white'}`}
              title="Map View"
            >
              <MapIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Filter size={18} className="text-amber-500" />
              <h2 className="text-lg font-semibold text-white">Filters</h2>
            </div>

            {/* Search */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-400 mb-1">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-500" />
                </div>
                <input
                  type="text"
                  placeholder="Name or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Minimum Rating */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-400 mb-1">Min Rating</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={minRating}
                onChange={(e) => { setMinRating(parseFloat(e.target.value)); setPage(1); }}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Any</span>
                <span>{minRating > 0 ? `${minRating}+ Stars` : ''}</span>
                <span>5 Stars</span>
              </div>
            </div>

            {/* Minimum Experience */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-400 mb-1">Min Experience (Years)</label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={minExperience}
                onChange={(e) => { setMinExperience(parseInt(e.target.value)); setPage(1); }}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Any</span>
                <span>{minExperience > 0 ? `${minExperience}+ Yrs` : ''}</span>
                <span>20+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Top Bar (Sorting & Counts) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-slate-400 text-sm">
              Showing <span className="text-white font-medium">{providers.length}</span> of <span className="text-white font-medium">{totalItems}</span> providers
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <SortAsc size={16} className="text-slate-500 hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 text-sm flex-1 sm:flex-none"
              >
                <option value="rating">Sort by Rating</option>
                <option value="experience">Sort by Experience</option>
              </select>
              
              <select
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-500 text-sm"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3 mb-6">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {viewMode === 'map' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 h-[600px] flex items-center justify-center text-slate-500 relative overflow-hidden">
                {/* Embedded mock map for MVP visualization */}
                <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight="0" 
                    marginWidth="0" 
                    src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=New%20Delhi+(GharSeva%20Service%20Area)&amp;t=&amp;z=12&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
                    className="rounded-lg opacity-80"
                ></iframe>
                <div className="absolute inset-0 bg-slate-950/40 pointer-events-none flex items-center justify-center">
                    <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-xl text-center pointer-events-auto">
                        <MapIcon size={32} className="mx-auto text-amber-500 mb-2" />
                        <h3 className="text-white font-bold mb-1">Google Maps Integration</h3>
                        <p className="text-sm text-slate-300">Requires production API key to plot dynamic provider locations.</p>
                    </div>
                </div>
            </div>
          ) : (
            <>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 h-40 animate-pulse flex gap-5">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 space-y-4 py-1">
                            <div className="h-6 bg-slate-800 rounded w-1/3"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-slate-800 rounded"></div>
                                <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                            </div>
                        </div>
                    </div>
                  ))}
                </div>
              ) : providers.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No providers found</h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                    Try adjusting your filters, searching for a different term, or lowering your minimum requirements.
                  </p>
                  <button 
                    onClick={() => {
                        setSearchTerm('');
                        setCategory('');
                        setMinRating(0);
                        setMinExperience(0);
                    }}
                    className="mt-6 text-amber-500 hover:text-amber-400 font-medium transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {providers.map(provider => (
                    <ProviderCard key={provider.provider_id} provider={provider} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && !loading && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                          page === i + 1 
                            ? 'bg-amber-500 text-slate-950 font-bold' 
                            : 'bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderBrowsePage;
