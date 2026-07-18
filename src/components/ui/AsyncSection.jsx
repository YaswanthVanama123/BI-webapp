import React from 'react';
import { Spinner } from './Spinner';
import { ErrorState } from './ErrorState';

export default function AsyncSection({ loading, error, data, reload, children, minEmpty }) {
  if (loading) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (minEmpty && (!data || (Array.isArray(data) && data.length === 0))) {
    return <div className="card p-8 text-center text-sm text-dark-400">No data for the selected filters.</div>;
  }
  return children(data);
}
