import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../services/authSlice';
import { Menu, X, User as UserIcon, LogOut, Settings, Calendar, Briefcase } from 'lucide-react';
import Button from './Button';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    setIsProfileOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-900/60 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 tracking-tight">
            GharSeva
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400/10 text-amber-400 rounded-full">
            MVP
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white transition duration-200">
            Browse Services
          </Link>
          {user && (
            <>
              {user.role === 'customer' && (
                <Link to="/bookings" className="text-sm font-medium text-slate-300 hover:text-white transition duration-200">
                  My Bookings
                </Link>
              )}
              {user.role === 'provider' && (
                <>
                  <Link to="/availability" className="text-sm font-medium text-slate-300 hover:text-white transition duration-200">
                    Schedule Availability
                  </Link>
                  <Link to="/jobs" className="text-sm font-medium text-slate-300 hover:text-white transition duration-200">
                    Incoming Jobs
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Action Buttons / Profile */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 font-bold uppercase">
                  {user.full_name[0]}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-slate-200 leading-none">{user.full_name}</p>
                  <span className="text-[10px] text-slate-500 capitalize">{user.role}</span>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1.5 backdrop-blur-md">
                  <div className="px-4 py-2 border-b border-slate-800/60 mb-1.5">
                    <p className="text-xs text-slate-400">Signed in as</p>
                    <p className="text-xs font-semibold text-slate-200 truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition duration-150"
                  >
                    <Settings className="w-4 h-4" /> Account Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition duration-150"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary">Register</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-white p-1 focus:outline-none"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Links */}
      {isOpen && (
        <div className="md:hidden px-6 pb-6 pt-2 border-t border-slate-900 bg-slate-950 flex flex-col gap-4">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="text-sm font-medium text-slate-300 hover:text-white"
          >
            Browse Services
          </Link>
          {user && (
            <>
              {user.role === 'customer' && (
                <Link
                  to="/bookings"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium text-slate-300 hover:text-white"
                >
                  My Bookings
                </Link>
              )}
              {user.role === 'provider' && (
                <>
                  <Link
                    to="/availability"
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium text-slate-300 hover:text-white"
                  >
                    Schedule Availability
                  </Link>
                  <Link
                    to="/jobs"
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium text-slate-300 hover:text-white"
                  >
                    Incoming Jobs
                  </Link>
                </>
              )}
              <div className="h-px bg-slate-900 my-1" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 font-bold uppercase">
                  {user.full_name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{user.full_name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-rose-950/40 text-rose-400 hover:bg-rose-950/20"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          )}
          {!user && (
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <Button variant="secondary" className="w-full">Login</Button>
              </Link>
              <Link to="/register" onClick={() => setIsOpen(false)}>
                <Button variant="primary" className="w-full">Register</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
