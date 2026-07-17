import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authSlice';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { UserCheck, Briefcase } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // default customer
  const [validationError, setValidationError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    const result = await dispatch(
      registerUser({
        email,
        password,
        full_name: fullName,
        phone: phone || undefined,
        role,
      })
    );

    if (registerUser.fulfilled.match(result)) {
      // Store registering email in session storage for verification step
      sessionStorage.setItem('verifying_email', email);
      navigate('/verify-email');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-amber-400/5 blur-[90px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg p-8 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-md shadow-2xl relative">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Create Account</h2>
          <p className="text-xs text-slate-400 mt-2">Join GharSeva and find trusted help today</p>
        </div>

        {/* Global errors */}
        {(validationError || error) && (
          <div className="mb-5 p-4 rounded-xl bg-rose-950/20 border border-rose-500/25 text-xs text-rose-400 font-medium">
            {validationError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Role Toggle Selector */}
          <div className="flex gap-4 mb-2">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${
                role === 'customer'
                  ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                  : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-750'
              }`}
            >
              <UserCheck className="w-6 h-6" />
              <div>
                <p className="text-sm font-semibold">Homeowner</p>
                <span className="text-[10px] text-slate-500">I want to book services</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('provider')}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${
                role === 'provider'
                  ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                  : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-750'
              }`}
            >
              <Briefcase className="w-6 h-6" />
              <div>
                <p className="text-sm font-semibold">Service Provider</p>
                <span className="text-[10px] text-slate-500">I want to get jobs</span>
              </div>
            </button>
          </div>

          <Input
            label="Full Name *"
            id="fullName"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <Input
            label="Email Address *"
            id="email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Phone Number"
            id="phone"
            type="tel"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="Password *"
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" variant="primary" loading={status === 'loading'} className="w-full mt-3 py-3 rounded-xl">
            Register Account
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
