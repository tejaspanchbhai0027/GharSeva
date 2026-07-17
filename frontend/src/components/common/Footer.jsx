import React from 'react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900/60 py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="text-center md:text-left">
          <p className="text-sm font-semibold text-slate-300">
            GharSeva Home Services Marketplace
          </p>
          <p className="text-xs text-slate-600 mt-1">
            © {year} GharSeva Inc. All rights reserved.
          </p>
        </div>

        {/* Links */}
        <div className="flex gap-6 text-xs text-slate-500">
          <a href="#" className="hover:text-slate-300 transition duration-150">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300 transition duration-150">Terms of Service</a>
          <a href="#" className="hover:text-slate-300 transition duration-150">Support Desk</a>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/40 border border-slate-800 text-[10px] text-slate-500 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>API Core Connected</span>
        </div>
      </div>
    </footer>
  );
}
