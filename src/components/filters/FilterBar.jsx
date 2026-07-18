import React from 'react';
import { RotateCcw } from 'lucide-react';
import { useFilters } from '@/contexts/FiltersContext';
import { useFilterOptions } from '@/hooks/useFilterOptions';

const STATUSES = ['active', 'suspended', 'stopped', 'cancelled', 'churned', 'inactive'];
const GRANULARITIES = ['day', 'week', 'month', 'quarter', 'year'];

function Field({ label, children }) {
  return (
    <label className="flex flex-col">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export default function FilterBar() {
  const { filters, setFilter, reset } = useFilters();
  const { routes, technicians, categories } = useFilterOptions();
  return (
    <div className="card p-3 mb-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <Field label="Start date">
          <input type="date" className="field" value={filters.startDate} onChange={(e) => setFilter('startDate', e.target.value)} />
        </Field>
        <Field label="End date">
          <input type="date" className="field" value={filters.endDate} onChange={(e) => setFilter('endDate', e.target.value)} />
        </Field>
        <Field label="Route">
          <select className="field" value={filters.routeCode} onChange={(e) => setFilter('routeCode', e.target.value)}>
            <option value="all">All routes</option>
            {routes.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Technician">
          <select className="field" value={filters.technicianId} onChange={(e) => setFilter('technicianId', e.target.value)}>
            <option value="all">All technicians</option>
            {technicians.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select className="field" value={filters.serviceCategoryId} onChange={(e) => setFilter('serviceCategoryId', e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Customer status">
          <select className="field" value={filters.customerStatus} onChange={(e) => setFilter('customerStatus', e.target.value)}>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Granularity">
          <select className="field" value={filters.granularity} onChange={(e) => setFilter('granularity', e.target.value)}>
            {GRANULARITIES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex justify-end mt-3">
        <button className="btn-secondary" onClick={reset}><RotateCcw size={14} /> Reset filters</button>
      </div>
    </div>
  );
}
