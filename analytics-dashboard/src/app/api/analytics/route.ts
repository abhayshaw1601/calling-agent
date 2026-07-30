import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import CallLog from '@/models/CallLog';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics
 * Fetches aggregated call telemetry for the logged-in user:
 * - Total calls, total duration, total spend
 * - Daily cost time-series for CostChart
 * - Vendor cost breakdown for VendorPie
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const stats = {
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

    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error('API error fetching analytics:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

