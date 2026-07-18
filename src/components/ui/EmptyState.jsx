import React from 'react';

export function EmptyState({ title = 'No data', message }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm font-medium text-dark-600">{title}</p>
      {message && <p className="text-xs text-dark-400 mt-1">{message}</p>}
    </div>
  );
}
