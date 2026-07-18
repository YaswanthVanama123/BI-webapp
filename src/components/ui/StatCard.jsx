import React from 'react';
import clsx from 'clsx';
import { Card } from './Card';

export function StatCard({ label, value, sublabel, delta, tone = 'neutral' }) {
  const deltaTone = delta?.tone === 'up' ? 'text-success-600' : delta?.tone === 'down' ? 'text-danger-600' : 'text-dark-400';
  const accent = { success: 'text-success-600', warning: 'text-warning-600', danger: 'text-danger-600', info: 'text-primary-600', neutral: 'text-dark-900' }[tone];
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-dark-400">{label}</span>
      <span className={clsx('text-2xl font-semibold', accent)}>{value}</span>
      <div className="flex items-center gap-2 text-xs">
        {sublabel && <span className="text-dark-500">{sublabel}</span>}
        {delta && <span className={deltaTone}>{delta.text}</span>}
      </div>
    </Card>
  );
}
