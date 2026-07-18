import React from 'react';
import clsx from 'clsx';
import { DATE_PRESETS, rangeForPreset } from '@/utils/dateRanges';

export function DateRangeFilter({ value, onChange, min, max, className }) {
  const preset = value?.preset || 'this_month';
  const from = value?.from || '';
  const to = value?.to || '';

  const selectPreset = (p) => {
    if (p === 'custom') { onChange({ preset: 'custom', from, to }); return; }
    const r = rangeForPreset(p, undefined, { min, max });
    onChange({ preset: p, from: r.from, to: r.to });
  };

  return (
    <div className={clsx('flex flex-wrap items-end gap-3', className)}>
      <div className="flex flex-col">
        <span className="field-label">Period</span>
        <div className="inline-flex rounded-md border border-dark-300 overflow-hidden">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => selectPreset(p.value)}
              className={clsx('px-3 py-2 text-sm border-r border-dark-200 last:border-r-0 whitespace-nowrap',
                preset === p.value ? 'bg-primary-600 text-white' : 'bg-white text-dark-600 hover:bg-dark-50')}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {preset === 'custom' && (
        <>
          <label className="flex flex-col"><span className="field-label">From</span>
            <input type="date" className="field" value={from} min={min || undefined} max={max || undefined} onChange={(e) => onChange({ preset: 'custom', from: e.target.value, to })} /></label>
          <label className="flex flex-col"><span className="field-label">To</span>
            <input type="date" className="field" value={to} min={min || undefined} max={max || undefined} onChange={(e) => onChange({ preset: 'custom', from, to: e.target.value })} /></label>
        </>
      )}
    </div>
  );
}

export default DateRangeFilter;
