import React from 'react';
import clsx from 'clsx';

export function RouteTabs({ routes = [], value, onChange, allLabel = 'All routes', className }) {
  const active = value || 'all';
  const tabs = ['all', ...routes];
  return (
    <div className={clsx('flex flex-wrap gap-1 border-b border-dark-200 overflow-x-auto', className)}>
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t === 'all' ? 'all' : t)}
          className={clsx('px-3 py-2 text-sm -mb-px border-b-2 whitespace-nowrap',
            active === t ? 'border-primary-600 text-primary-700 font-semibold' : 'border-transparent text-dark-500 hover:text-dark-700')}
        >
          {t === 'all' ? allLabel : t}
        </button>
      ))}
    </div>
  );
}

export default RouteTabs;
