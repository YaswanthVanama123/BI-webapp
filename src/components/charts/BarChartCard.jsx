import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { ChartFrame } from './ChartFrame';
import { PALETTE, axisProps, tooltipStyle } from './palette';

export function BarChartCard({ title, subtitle, data, xKey, bars, height, referenceY }) {
  return (
    <ChartFrame title={title} subtitle={subtitle} height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {referenceY != null && (
          <ReferenceLine y={referenceY} stroke="#EF4444" strokeDasharray="4 4" label={{ value: `benchmark ${referenceY}`, fontSize: 11, fill: '#EF4444' }} />
        )}
        {bars.map((b, i) => (
          <Bar key={b.key} dataKey={b.key} name={b.label || b.key} fill={b.color || PALETTE[i % PALETTE.length]} radius={[3, 3, 0, 0]} stackId={b.stackId} />
        ))}
      </BarChart>
    </ChartFrame>
  );
}
