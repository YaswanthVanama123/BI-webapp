import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { NAV_ITEMS } from './navigation';
import NotFoundPage from './NotFoundPage';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/features/auth/LoginPage';
import LandingPage from '@/features/auth/LandingPage';

function FullScreenLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-dark-50 text-dark-500">
      <div className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /> Loading…</div>
    </div>
  );
}

function Gate() {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  if (loading) return <FullScreenLoader />;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  const items = NAV_ITEMS.filter((it) => !it.adminOnly || isAdmin);
  return (
    <Routes>
      {/* Authenticated users never see the public login/landing */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/welcome" element={<Navigate to="/" replace />} />
      <Route element={<AppLayout />}>
        {items.map((it) => (it.to === '/'
          ? <Route key="index" index element={it.element} />
          : <Route key={it.to} path={it.to} element={it.element} />))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  );
}
