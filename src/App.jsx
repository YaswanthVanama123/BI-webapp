import React from 'react';
import { FiltersProvider } from '@/contexts/FiltersContext';
import AppRouter from '@/app/AppRouter';

export default function App() {
  return (
    <FiltersProvider>
      <AppRouter />
    </FiltersProvider>
  );
}
