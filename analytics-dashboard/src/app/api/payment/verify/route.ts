import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
        const userId = session.user.id;

        // verify the signature using sha256
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(text)
            .digest('hex');

        const isSignatureValid = generated_signature === razorpay_signature;

        if (!isSignatureValid) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        // fetch the order details from Razorpay to get the secure amount & metadata
        const order = await razorpay.orders.fetch(razorpay_order_id);
        const usdAmount = Number(order.notes?.usdAmount);

        if (!usdAmount || isNaN(usdAmount)) {
            return NextResponse.json({ error: 'Invalid amount metadata in Razorpay order' }, { status: 400 });
        }

        // 3. Update user's wallet balance in MongoDB
        await dbConnect();
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { balance: usdAmount } },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Payment verified successfully',
            balance: updatedUser.balance
        }, { status: 200 });
    } catch (error) {
        console.error('[RAZORPAY_VERIFY_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
