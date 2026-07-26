'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface CostChartProps {
  data: Array<{
    date: string;
    cost: number;
    calls?: number;
  }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-md dark:border-neutral-700 dark:bg-neutral-900">
        <p className="text-xs font-semibold text-neutral-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-blue-600">
          ${payload[0].value.toFixed(4)} spent
        </p>
        {payload[0].payload.calls !== undefined && (
          <p className="text-xs text-neutral-400">{payload[0].payload.calls} call(s)</p>
        )}
      </div>
    );
  }
  return null;
};

/**
 * CostChart component
 * Renders an AreaChart of daily API spend using Recharts.
 */
export default function CostChart({ data }: CostChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-72 flex flex-col items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 gap-2">
        <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
        </svg>
        <span className="text-neutral-400 text-sm">No call data yet — charts will appear after your first calls.</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-neutral-800" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#737373' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#737373' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v.toFixed(2)}`}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="cost"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#costGradient)"
          dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#2563eb' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
