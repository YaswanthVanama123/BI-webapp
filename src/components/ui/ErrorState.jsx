import React from 'react';

export function ErrorState({ error, onRetry }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm font-medium text-danger-600">Failed to load</p>
      <p className="text-xs text-dark-400 mt-1">{error}</p>
      {onRetry && <button className="btn-secondary mt-3" onClick={onRetry}>Retry</button>}
    </div>
  );
}
