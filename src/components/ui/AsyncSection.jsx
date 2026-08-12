import React from 'react';
import { Spinner } from './Spinner';
import { ErrorState } from './ErrorState';

export default function AsyncSection({ loading, error, data, reload, children, minEmpty }) {
  const hasData = data != null && !(Array.isArray(data) && data.length === 0);
  if (loading && !hasData) return <Spinner />;
  if (error && !hasData) return <ErrorState error={error} onRetry={reload} />;
  if (minEmpty && !hasData) {
    return <div className="card p-8 text-center text-sm text-dark-400">No data for the selected filters.</div>;
  }
  return children(data);
}
