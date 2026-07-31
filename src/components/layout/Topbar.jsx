import React, { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import config from '@/config';
import { useAuth } from '@/contexts/AuthContext';

function apiHost() {
  try { return new URL(config.apiBaseUrl).host; } catch { return config.apiBaseUrl; }
}

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const initials = (user?.name || user?.username || '?').trim().slice(0, 2).toUpperCase();

  return (
    <header className="flex items-center justify-between gap-3 border-b border-dark-200 bg-white px-4 py-3">
      <button className="lg:hidden text-dark-600" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
      <div className="flex-1" />
      <div className="flex items-center gap-3 text-xs text-dark-500">
        <span className="hidden sm:inline">TZ: {config.reportingTz}</span>
        <span className="hidden md:inline text-dark-400">API: {apiHost()}</span>
        <span className="rounded-full bg-success-100 px-2 py-0.5 font-medium text-success-800">Live API</span>
        <div className="relative" ref={ref}>
          <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-dark-50">
            <span className="h-7 w-7 rounded-full bg-primary-600 text-white grid place-items-center text-[11px] font-semibold">{initials}</span>
            <span className="hidden sm:inline font-medium text-dark-700 max-w-[10rem] truncate">{user?.name || user?.username}</span>
            <ChevronDown size={14} className="text-dark-400" />
          </button>
          {open && (
            <div className="absolute right-0 mt-1 w-52 rounded-md border border-dark-200 bg-white shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-dark-100">
                <div className="text-sm font-medium text-dark-800 truncate">{user?.name || user?.username}</div>
                <div className="text-[11px] text-dark-400 flex items-center gap-1"><UserIcon size={11} /> {user?.username} · {user?.role}</div>
              </div>
              <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
