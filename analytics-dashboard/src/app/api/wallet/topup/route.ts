import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
    try {
        // 1. Get the current user session
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse the body to get the topup amount
        const { amount } = await request.json();
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        await connectDB();

        // 3. Increment the user's balance in MongoDB
        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            { $inc: { balance: amount } },
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            balance: updatedUser.balance
        });

    } catch (error: any) {
        console.error('Wallet top-up API error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
