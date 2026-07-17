import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword } from '../services/authSlice';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setValidationError('Please enter your email address.');
      return;
    }

    const result = await dispatch(forgotPassword({ email }));
    if (forgotPassword.fulfilled.match(result)) {
      setSuccessMessage('Reset code successfully sent! Redirecting to setup new password...');
      sessionStorage.setItem('verifying_email', email);
      setTimeout(() => {
        navigate('/reset-password');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-amber-400/5 blur-[90px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-md shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-400/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Forgot Password</h2>
          <p className="text-xs text-slate-400 mt-2">Enter your email address to receive a recovery OTP code</p>
        </div>

        {/* Global errors */}
        {(validationError || error) && (
          <div className="mb-5 p-4 rounded-xl bg-rose-950/20 border border-rose-500/25 text-xs text-rose-400 font-medium">
            {validationError || error}
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/25 text-xs text-emerald-400 font-medium">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            id="email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button type="submit" variant="primary" loading={status === 'loading'} className="w-full mt-2 py-3 rounded-xl">
            Request Recovery OTP
          </Button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          Remembered your password?{' '}
          <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
