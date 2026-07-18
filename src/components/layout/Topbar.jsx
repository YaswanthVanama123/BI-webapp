import React from 'react';
import { Menu } from 'lucide-react';
import config from '@/config';

function apiHost() {
  try { return new URL(config.apiBaseUrl).host; } catch { return config.apiBaseUrl; }
}

export default function Topbar({ onMenu }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-dark-200 bg-white px-4 py-3">
      <button className="lg:hidden text-dark-600" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
      <div className="flex-1" />
      <div className="flex items-center gap-3 text-xs text-dark-500">
        <span>TZ: {config.reportingTz}</span>
        <span className="text-dark-400">API: {apiHost()}</span>
        <span className="rounded-full bg-success-100 px-2 py-0.5 font-medium text-success-800">Live API</span>
      </div>
    </header>
  );
}
