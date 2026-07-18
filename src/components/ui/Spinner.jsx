import React from 'react';

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-dark-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-dark-200 border-t-primary-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
