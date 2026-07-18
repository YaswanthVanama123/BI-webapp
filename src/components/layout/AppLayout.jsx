import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import FilterBar from '@/components/filters/FilterBar';
import { HIDE_FILTER_PATHS } from '@/app/navigation';

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const showFilters = !HIDE_FILTER_PATHS.has(location.pathname);

  return (
    <div className="flex h-screen bg-dark-100">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {showFilters && <FilterBar />}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
