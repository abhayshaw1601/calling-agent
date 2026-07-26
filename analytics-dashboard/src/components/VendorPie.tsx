'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface VendorPieProps {
  data: {
    twilioCost: number;
    deepgramCost: number;
    groqCost: number;
    elevenlabsCost: number;
  };
}

const VENDOR_CONFIG = [
  { key: 'twilioCost', label: 'Twilio', color: '#F22F46' },
  { key: 'deepgramCost', label: 'Deepgram', color: '#13EF93' },
  { key: 'groqCost', label: 'Groq', color: '#7C3AED' },
  { key: 'elevenlabsCost', label: 'ElevenLabs', color: '#F59E0B' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-md dark:border-neutral-700 dark:bg-neutral-900">
        <p className="text-xs font-semibold" style={{ color: payload[0].payload.color }}>
          {payload[0].name}
        </p>
        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
          ${payload[0].value.toFixed(5)}
        </p>
        <p className="text-xs text-neutral-400">
          {payload[0].payload.percent}% of total
        </p>
      </div>
    );
  }
  return null;
};

const renderCustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
      {payload.map((entry: any, index: number) => (
        <li key={index} className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </li>
      ))}
    </ul>
  );
};

/**
 * VendorPie component
 * Renders a donut PieChart showing cost split by vendor using Recharts.
 */
export default function VendorPie({ data }: VendorPieProps) {
  const chartData = VENDOR_CONFIG.map((v) => ({
    name: v.label,
    value: (data as any)[v.key] as number,
    color: v.color,
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  const chartDataWithPercent = chartData.map((d) => ({
    ...d,
    percent: total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0',
  }));

  // No data yet — all zeros
  if (total === 0) {
    return (
      <div className="w-full h-72 flex flex-col items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 gap-2">
        <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <span className="text-neutral-400 text-sm">No cost data yet — vendor breakdown will appear here.</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <PieChart>
        <Pie
          data={chartDataWithPercent}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {chartDataWithPercent.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderCustomLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
}
