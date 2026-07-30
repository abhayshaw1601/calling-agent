import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CostChart from '@/components/CostChart';
import VendorPie from '@/components/VendorPie';

import dbConnect from '@/lib/db';
import CallLog from '@/models/CallLog';

/**
 * Overview dashboard page.
 * Server Component — queries MongoDB directly and renders KPI cards + charts.
 */
export default async function DashboardOverview() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.name) redirect('/login');

  let stats = {
    totalCalls: 0,
    totalDuration: 0,
    totalCost: 0,
    dailyCostTimeSeries: [] as Array<{ date: string; cost: number; calls: number }>,
    vendorCosts: { twilioCost: 0, deepgramCost: 0, groqCost: 0, elevenlabsCost: 0 },
  };

  try {
    await dbConnect();
    const username = session.user.name;

    // 1. Aggregate totals for KPI cards
    const totalsResult = await CallLog.aggregate([
      { $match: { username, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          twilioCost: { $sum: '$costDetails.twilioCost' },
          deepgramCost: { $sum: '$costDetails.deepgramCost' },
          groqCost: { $sum: '$costDetails.groqCost' },
          elevenlabsCost: { $sum: '$costDetails.elevenlabsCost' },
          totalCost: { $sum: '$costDetails.totalCost' },
        }
      }
    ]);

    const totals = totalsResult[0] || {
      totalCalls: 0,
      totalDuration: 0,
      twilioCost: 0,
      deepgramCost: 0,
      groqCost: 0,
      elevenlabsCost: 0,
      totalCost: 0,
    };

    // 2. Daily cost time-series for the last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const dailySeries = await CallLog.aggregate([
      {
        $match: {
          username,
          status: 'completed',
          startTime: { $gte: fourteenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%b %d', date: '$startTime' }
          },
          cost: { $sum: '$costDetails.totalCost' },
          calls: { $sum: 1 },
        }
      },
      { $sort: { '_id': 1 } },
      { $project: { _id: 0, date: '$_id', cost: 1, calls: 1 } }
    ]);

    stats = {
      totalCalls: totals.totalCalls,
      totalDuration: totals.totalDuration,
      totalCost: totals.totalCost,
      dailyCostTimeSeries: dailySeries,
      vendorCosts: {
        twilioCost: totals.twilioCost,
        deepgramCost: totals.deepgramCost,
        groqCost: totals.groqCost,
        elevenlabsCost: totals.elevenlabsCost,
      }
    };
  } catch (err) {
    console.error('Failed to query database analytics:', err);
  }

  // Format total duration (seconds) into human-readable string
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
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
            <p className="text-xs text-neutral-500">Completed calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Call Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
            <p className="text-xs text-neutral-500">Across all completed calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accumulated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
            <p className="text-xs text-neutral-500">Calculated from API usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Analytics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Daily Spend Trend</CardTitle>
            <CardDescription>Day-to-day cost timeline across all API providers (last 14 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <CostChart data={stats.dailyCostTimeSeries} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Cost Split by Vendor</CardTitle>
            <CardDescription>Visual breakdown of API infrastructure spend</CardDescription>
          </CardHeader>
          <CardContent>
            <VendorPie data={stats.vendorCosts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
