import React from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, subtitle, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:p-8" onClick={onClose}>
      <div className="card w-full max-w-4xl max-h-[86vh] overflow-auto p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-dark-100 px-5 py-3 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-dark-900">{title}</h2>
            {subtitle && <p className="text-xs text-dark-500 mt-0.5">{subtitle}</p>}
          </div>
          <button className="text-dark-400 hover:text-dark-700" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
