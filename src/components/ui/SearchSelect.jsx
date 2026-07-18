import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, Search, X } from 'lucide-react';

export function SearchSelect({ value, onChange, options = [], placeholder = 'All', allLabel = 'All', className }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selected = options.find((o) => o.value === value) || null;
  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    const list = t ? options.filter((o) => String(o.label).toLowerCase().includes(t)) : options;
    return list.slice(0, 300);
  }, [term, options]);

  const pick = (v) => { onChange(v); setOpen(false); setTerm(''); };

  return (
    <div className={clsx('relative', className)} ref={ref}>
      <button type="button" className="field flex items-center justify-between gap-2 text-left min-w-[240px]" onClick={() => setOpen((o) => !o)}>
        <span className={clsx('truncate', !selected && 'text-dark-400')}>{selected ? selected.label : placeholder}</span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && <X size={14} className="text-dark-400 hover:text-dark-600" onClick={(e) => { e.stopPropagation(); pick(''); }} />}
          <ChevronDown size={16} className="text-dark-400" />
        </span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-[240px] bg-white border border-dark-200 rounded-md shadow-lg">
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-dark-100">
            <Search size={14} className="text-dark-400" />
            <input autoFocus className="w-full text-sm outline-none" placeholder="Search…" value={term} onChange={(e) => setTerm(e.target.value)} />
          </div>
          <ul className="max-h-64 overflow-auto py-1 text-sm">
            <li>
              <button type="button" className={clsx('w-full text-left px-3 py-1.5 hover:bg-dark-50', !value ? 'text-primary-700 bg-primary-50' : 'text-dark-500')} onClick={() => pick('')}>{allLabel}</button>
            </li>
            {filtered.map((o) => (
              <li key={o.value}>
                <button type="button" className={clsx('w-full text-left px-3 py-1.5 hover:bg-dark-50 truncate', o.value === value && 'bg-primary-50 text-primary-700')} onClick={() => pick(o.value)}>{o.label}</button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-3 py-2 text-dark-400">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
