import React, { createContext, useContext, useMemo, useState } from 'react';
import { rangeForPreset } from '@/utils/dateRanges';

const YEAR = rangeForPreset('this_year');
const DEFAULTS = {
  startDate: YEAR.from,
  endDate: YEAR.to,
  granularity: 'month',
  routeCode: 'all',
  technicianId: 'all',
  department: 'all',
  customerStatus: 'all',
  serviceCategoryId: 'all',
};

const FiltersContext = createContext(null);

export function FiltersProvider({ children }) {
  const [filters, setFilters] = useState(DEFAULTS);

  const value = useMemo(() => ({
    filters,
    setFilter: (key, val) => setFilters((f) => ({ ...f, [key]: val })),
    setFilters,
    reset: () => setFilters(DEFAULTS),
  }), [filters]);

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters must be used within FiltersProvider');
  return ctx;
}

export { DEFAULTS };
