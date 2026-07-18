import React from 'react';
import clsx from 'clsx';

const TONES = {
  success: 'bg-success-100 text-success-800',
  warning: 'bg-warning-100 text-warning-800',
  danger: 'bg-danger-100 text-danger-800',
  info: 'bg-primary-100 text-primary-800',
  neutral: 'bg-dark-100 text-dark-600',
};

export function Badge({ tone = 'neutral', children }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', TONES[tone] || TONES.neutral)}>
      {children}
    </span>
  );
}
