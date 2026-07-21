'use client';

import React from 'react';
// import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface VendorPieProps {
  data: {
    twilioCost: number;
    deepgramCost: number;
    geminiCost: number;
    elevenlabsCost: number;
  };
}

/**
 * VendorPie component
 * Visualizes the cost breakdown/split by vendor (Twilio vs Deepgram vs Gemini vs ElevenLabs) using Recharts.
 */
export default function VendorPie({ data }: VendorPieProps) {
  // TODO: Build out the pie chart using recharts.
  // 1. Format data into an array: [{ name: 'Twilio', value: data.twilioCost }, ...]
  // 2. Define color palette arrays.
  // 3. Render <ResponsiveContainer> -> <PieChart> -> <Pie>
  // 4. Map cells with background colors.
  // 5. Add <Tooltip /> and <Legend /> for interaction.

  return (
    <div className="w-full h-80 flex items-center justify-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
      <span className="text-neutral-500 text-sm">
        [Vendor Pie Chart Placeholder - Render Recharts here]
      </span>
    </div>
  );
}
