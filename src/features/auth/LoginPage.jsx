import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const from = location.state?.from || '/';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid username or password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-dark-50">
      {/* Brand / hero panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/15 grid place-items-center font-extrabold text-lg backdrop-blur">EM</div>
          <div>
            <div className="text-lg font-bold leading-tight">EnviroMaster BI</div>
            <div className="text-xs text-white/70">Operational &amp; Financial Intelligence</div>
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">Run the business<br />on real numbers.</h1>
          <p className="mt-4 max-w-md text-white/80">Revenue, routes, drive time, payroll cost and customer health — pulled straight from RouteStar, in one dashboard.</p>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            {['Revenue', 'Operations', 'Cost & Profit'].map((t) => (
              <div key={t} className="rounded-lg bg-white/10 px-3 py-3 text-sm font-medium backdrop-blur">{t}</div>
            ))}
          </div>
        </div>
        <div className="text-xs text-white/60">© EnviroMaster NRV</div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="h-9 w-9 rounded-lg bg-primary-600 text-white grid place-items-center font-bold">EM</div>
            <span className="font-semibold">EnviroMaster BI</span>
          </div>
          <h2 className="text-2xl font-bold text-dark-800">Sign in</h2>
          <p className="text-sm text-dark-500 mt-1">Enter your credentials to access the dashboard.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="field-label">Username</span>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input className="field pl-9 w-full" autoFocus autoComplete="username" value={username}
                  onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
              </div>
            </label>
            <label className="block">
              <span className="field-label">Password</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input type="password" className="field pl-9 w-full" autoComplete="current-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </label>

            {error && <div className="rounded-md bg-danger-50 border border-danger-200 px-3 py-2 text-sm text-danger-700">{error}</div>}

            <button type="submit" disabled={busy || !username || !password}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-50">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-dark-400">
            <Link to="/welcome" className="hover:text-dark-600">← Back to overview</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
