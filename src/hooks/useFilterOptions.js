import { useEffect, useState } from 'react';
import biService from '@/services/biService';

export function useFilterOptions() {
  const [opts, setOpts] = useState({ routes: [], technicians: [], departments: [], categories: [], loading: true });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [routes, emps, cats] = await Promise.all([
          biService.routes({}),
          biService.employees({}),
          biService.serviceCategories({}),
        ]);
        if (!alive) return;
        const employees = emps.data || [];
        setOpts({
          routes: (routes.data || []).map((r) => r.routeCode).filter(Boolean),
          technicians: employees
            .filter((e) => e.isTechnician !== false)
            .map((e) => ({ id: e._id, name: e.fullName })),
          departments: [...new Set(employees.map((e) => e.department).filter(Boolean))],
          categories: (cats.data || []).map((c) => ({ id: c._id, name: c.name })),
          loading: false,
        });
      } catch {
        if (alive) setOpts((o) => ({ ...o, loading: false }));
      }
    })();
    return () => { alive = false; };
  }, []);

  return opts;
}

export default useFilterOptions;
