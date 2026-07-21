import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CostChart from '@/components/CostChart';
import VendorPie from '@/components/VendorPie';

/**
 * Overview dashboard page.
 * Loads telemetry statistics and renders the KPI cards and chart components.
 */
export default async function DashboardOverview() {
  // TODO: Fetch analytics from Next.js internal API or directly query database using Server Component features
  // e.g.:
  // const res = await fetch('http://localhost:3000/api/analytics', { cache: 'no-store' });
  // const data = await res.json();
  
  // Skeletons / Mock local states to showcase layout structure
  const stats = {
    totalCalls: 120,
    averageDuration: "1m 45s",
    totalSpend: "$23.40",
    timeSeriesData: [
      { date: 'Jul 15', cost: 2.1 },
      { date: 'Jul 16', cost: 4.5 },
      { date: 'Jul 17', cost: 3.8 },
      { date: 'Jul 18', cost: 5.2 },
      { date: 'Jul 19', cost: 4.8 },
      { date: 'Jul 20', cost: 3.0 },
    ],
    vendorData: {
      twilioCost: 5.40,
      deepgramCost: 3.60,
      geminiCost: 4.20,
      elevenlabsCost: 10.20
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-neutral-500">Real-time metrics for your automated voice engine</p>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls Handled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls}</div>
            <p className="text-xs text-neutral-500">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Call Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageDuration}</div>
            <p className="text-xs text-neutral-500">Stable latency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accumulated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSpend}</div>
            <p className="text-xs text-neutral-500">Calculated from API usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Analytics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Daily Spend Trend</CardTitle>
            <CardDescription>Day-to-day cost timeline across all API providers</CardDescription>
          </CardHeader>
          <CardContent>
            <CostChart data={stats.timeSeriesData} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Cost Split by Vendor</CardTitle>
            <CardDescription>Visual breakdown of API infrastructure spend</CardDescription>
          </CardHeader>
          <CardContent>
            <VendorPie data={stats.vendorData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
