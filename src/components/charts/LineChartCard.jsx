import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartFrame } from './ChartFrame';
import { PALETTE, axisProps, tooltipStyle } from './palette';

export function LineChartCard({ title, subtitle, data, xKey, lines, height }) {
  return (
    <ChartFrame title={title} subtitle={subtitle} height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {lines.map((l, i) => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.label || l.key} stroke={l.color || PALETTE[i % PALETTE.length]} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ChartFrame>
  );
}
