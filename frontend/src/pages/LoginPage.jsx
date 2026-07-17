import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authSlice';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email.trim() || !password.trim()) {
      setValidationError('Please enter both your email and password.');
      return;
    }

    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      const user = result.payload.user;
      if (user.role === 'admin')         navigate('/admin/dashboard');
      else if (user.role === 'provider') navigate('/provider/dashboard');
      else                               navigate('/customer/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-amber-400/5 blur-[90px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-md shadow-2xl relative">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-2">Sign in to manage bookings and request matches</p>
        </div>

        {/* Global errors */}
        {(validationError || error) && (
          <div className="mb-5 p-4 rounded-xl bg-rose-950/20 border border-rose-500/25 text-xs text-rose-400 font-medium">
            {validationError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Email Address"
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                Password
              </label>
              <Link to="/forgot-password" className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition">
                Forgot Password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" loading={status === 'loading'} className="w-full mt-2 py-3 rounded-xl">
            <LogIn className="w-4 h-4 mr-2" /> Sign In
          </Button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-amber-400 hover:text-amber-300 font-semibold transition">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
