import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/authSlice';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { ShieldAlert } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  useEffect(() => {
    const savedEmail = sessionStorage.getItem('verifying_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMessage('');

    if (!email.trim() || !otpCode.trim() || !newPassword.trim()) {
      setValidationError('Please fill in all input fields.');
      return;
    }

    if (otpCode.length !== 6) {
      setValidationError('Recovery OTP must be exactly 6 digits.');
      return;
    }

    const result = await dispatch(resetPassword({ email, otp_code: otpCode, new_password: newPassword }));
    if (resetPassword.fulfilled.match(result)) {
      setSuccessMessage('Password updated successfully! Redirecting you to login...');
      sessionStorage.removeItem('verifying_email');
      setTimeout(() => {
        navigate('/login');
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
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-2">Enter the verification code and set your new password credentials</p>
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

          <Input
            label="Recovery Code (OTP)"
            id="otpCode"
            type="text"
            maxLength={6}
            placeholder="123456"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
          />

          <Input
            label="New Password"
            id="newPassword"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <Button type="submit" variant="primary" loading={status === 'loading'} className="w-full mt-2 py-3 rounded-xl">
            Update Password
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
