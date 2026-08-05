import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardGrid from '@/components/DashboardGrid';

import dbConnect from '@/lib/db';
import CallLog from '@/models/CallLog';

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

  let recentCalls: any[] = [];

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

    // 3. Query 5 most recent calls for Activity Log
    const rawCalls = await CallLog.find({ username })
      .sort({ startTime: -1 })
      .limit(5);

    recentCalls = rawCalls.map(c => ({
      _id: c._id.toString(),
      phoneNumber: c.phoneNumber,
      status: c.status,
      duration: c.duration,
      costDetails: {
        totalCost: c.costDetails?.totalCost || 0
      },
      startTime: c.startTime.toISOString()
    }));

  } catch (err) {
    console.error('Failed to query database analytics:', err);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-outline-variant pb-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Overview</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">AI Voice Agent performance &amp; infrastructure metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label-md text-label-md text-on-surface-variant">Last 14 Days</span>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">calendar_today</span>
        </div>
      </div>

      <DashboardGrid stats={stats} recentCalls={recentCalls} />
    </div>
  );
}
