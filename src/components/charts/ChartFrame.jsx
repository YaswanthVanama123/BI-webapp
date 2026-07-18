import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui';

export function ChartFrame({ title, subtitle, children, height = 300 }) {
  return (
    <Card>
      {title && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-dark-800">{title}</h3>
          {subtitle && <p className="text-xs text-dark-400">{subtitle}</p>}
        </div>
      )}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </Card>
  );
}
