import React from 'react';
import clsx from 'clsx';

export function Card({ className, children, ...rest }) {
  return <div className={clsx('card p-4', className)} {...rest}>{children}</div>;
}
