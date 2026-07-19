import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Briefcase } from 'lucide-react';

const ProviderCard = ({ provider }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-amber-500/50 transition-colors shadow-lg flex flex-col md:flex-row gap-5 items-start">
      {/* Profile Photo */}
      <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-slate-800 rounded-full overflow-hidden border-2 border-slate-700">
        {provider.profile_photo_url ? (
          <img src={provider.profile_photo_url} alt={provider.full_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-3xl font-bold bg-slate-800">
            {provider.full_name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-grow flex flex-col justify-between w-full">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-white">{provider.full_name}</h3>
              <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                <Briefcase size={14} className="text-amber-500" />
                {provider.experience_years} years experience
              </p>
            </div>
            
            <div className="bg-slate-800 px-3 py-1 rounded-full flex items-center gap-1 border border-slate-700">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className="font-bold text-white text-sm">{provider.avg_rating.toFixed(1)}</span>
              <span className="text-slate-500 text-xs">({provider.total_jobs} jobs)</span>
            </div>
          </div>

          <p className="text-slate-300 mt-3 text-sm line-clamp-2">
            {provider.bio || "No bio provided."}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-slate-400">
            <MapPin size={14} />
            <span>Serves up to {provider.service_radius_km} km radius</span>
          </div>

          <Link
            to={`/providers/${provider.provider_id}`}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition-colors text-sm text-center"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;
