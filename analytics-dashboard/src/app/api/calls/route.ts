import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import CallLog from '@/models/CallLog';

export const dynamic = 'force-dynamic';

/**
 * GET /api/calls
 * Returns all call logs for the logged-in user, sorted newest first.
 * Each record includes metadata + full transcript array + cost breakdown.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const calls = await CallLog.find({ username: session.user.name })
      .sort({ startTime: -1 })
      .select('callSid phoneNumber status startTime endTime duration costDetails transcript')
      .lean();

    return NextResponse.json({ success: true, calls });
  } catch (error: any) {
    console.error('GET /api/calls error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
