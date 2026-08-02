import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ChartFrame } from './ChartFrame';
import { PALETTE, tooltipStyle } from './palette';

export function PieChartCard({ title, subtitle, data, nameKey, valueKey, height, valueFormatter }) {
  return (
    <ChartFrame title={title} subtitle={subtitle} height={height}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius="75%" innerRadius="45%" paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={valueFormatter ? (value, name) => [valueFormatter(value), name] : undefined} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ChartFrame>
  );
}
