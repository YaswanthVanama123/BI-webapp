import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { NAV_ITEMS } from './navigation';
import NotFoundPage from './NotFoundPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {NAV_ITEMS.map((it) => (it.to === '/'
            ? <Route key="index" index element={it.element} />
            : <Route key={it.to} path={it.to} element={it.element} />))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
