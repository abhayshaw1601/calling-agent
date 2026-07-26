import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

/**
 * GET /api/wallet/balance
 * Returns the current wallet balance for the logged-in user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('balance username');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, balance: user.balance, username: user.username });
  } catch (error: any) {
    console.error('GET /api/wallet/balance error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
