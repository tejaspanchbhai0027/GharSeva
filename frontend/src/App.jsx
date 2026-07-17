import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './services/authSlice';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Public Pages
import LandingPage        from './pages/LandingPage';
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import VerifyEmailPage    from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';

// Role Dashboards
import CustomerDashboard from './pages/CustomerDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard    from './pages/AdminDashboard';

// ---------------------------------------------------------
// Guards
// ---------------------------------------------------------

/** Redirect to login if not authenticated */
function RequireAuth({ children }) {
  const { accessToken } = useSelector((s) => s.auth);
  if (!accessToken) return <Navigate to="/login" replace />;
  return children;
}

/** Redirect to correct dashboard if already logged in */
function RedirectIfLoggedIn({ children }) {
  const { accessToken, user } = useSelector((s) => s.auth);
  if (accessToken && user) return <Navigate to={dashboardPath(user.role)} replace />;
  return children;
}

/** Pick the correct dashboard route based on role */
function RoleDashboard() {
  const { user } = useSelector((s) => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={dashboardPath(user.role)} replace />;
}

function dashboardPath(role) {
  if (role === 'admin')    return '/admin/dashboard';
  if (role === 'provider') return '/provider/dashboard';
  return '/customer/dashboard';
}

// ---------------------------------------------------------
// App
// ---------------------------------------------------------

function App() {
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state) => state.auth);

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchCurrentUser());
    }
  }, [accessToken, dispatch]);

  return (
    <Routes>
      {/* ---- Public pages with Navbar + Footer ---- */}
      <Route
        path="/"
        element={
          <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
            <Navbar />
            <main className="flex-grow"><LandingPage /></main>
            <Footer />
          </div>
        }
      />

      <Route
        path="/login"
        element={
          <RedirectIfLoggedIn>
            <LoginPage />
          </RedirectIfLoggedIn>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfLoggedIn>
            <RegisterPage />
          </RedirectIfLoggedIn>
        }
      />
      <Route path="/verify-email"    element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* ---- Role-based redirect after login ---- */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <RoleDashboard />
          </RequireAuth>
        }
      />

      {/* ---- Protected dashboards (no shared Navbar/Footer) ---- */}
      <Route
        path="/customer/dashboard"
        element={
          <RequireAuth>
            <CustomerDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/provider/dashboard"
        element={
          <RequireAuth>
            <ProviderDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAuth>
            <AdminDashboard />
          </RequireAuth>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
