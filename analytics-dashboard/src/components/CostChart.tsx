'use client';

import React from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CostChartProps {
  data: Array<{
    date: string;
    cost: number;
  }>;
}

/**
 * CostChart component
 * Visualizes daily API spend (Twilio, Deepgram, Gemini, ElevenLabs) using Recharts.
 */
export default function CostChart({ data }: CostChartProps) {
  // TODO: Build out the line chart using recharts.
  // 1. Uncomment import statement above.
  // 2. Map data and pass to <ResponsiveContainer> -> <LineChart>
  // 3. Render <CartesianGrid strokeDasharray="3 3" />, <XAxis dataKey="date" />, <YAxis />
  // 4. Add <Tooltip /> and <Line type="monotone" dataKey="cost" stroke="#2563eb" />
  
  return (
    <div className="w-full h-80 flex items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
      <span className="text-neutral-500 text-sm">
        [Cost Line Chart Placeholder - Render Recharts here]
      </span>
    </div>
  );
}
