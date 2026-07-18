import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { NAV } from '@/app/navigation';

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={onClose} />}
      <aside className={clsx(
        'fixed z-40 h-full w-64 shrink-0 overflow-y-auto border-r border-dark-200 bg-white transition-transform lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-dark-100">
          <div className="h-8 w-8 rounded-md bg-primary-600 text-white grid place-items-center font-bold">EM</div>
          <div>
            <div className="text-sm font-semibold leading-tight">EnviroMaster BI</div>
            <div className="text-[11px] text-dark-400 leading-tight">Operational &amp; Financial</div>
          </div>
        </div>
        <nav className="px-3 py-3 space-y-4">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-dark-400 mb-1">{group.section}</div>
              <div className="space-y-0.5">
                {group.items.map((it) => (
                  <NavLink key={it.to} to={it.to} end={it.end} onClick={onClose}
                    className={({ isActive }) => clsx('flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm',
                      isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-dark-600 hover:bg-dark-50')}>
                    <it.icon size={16} />
                    {it.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
