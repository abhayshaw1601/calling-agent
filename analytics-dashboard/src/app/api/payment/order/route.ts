
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { amount } = await req.json(); // amount in USD (e.g., 5, 10, 20, 50)

        // 1. Fetch live USD to INR conversion rate
        let exchangeRate = 90.0; // Fallback rate
        try {
            const rateRes = await fetch('https://open.er-api.com/v6/latest/USD', {
                next: { revalidate: 3600 } // cached rate for 1 hour
            });
            if (rateRes.ok) {
                const rateData = await rateRes.json();
                if (rateData?.rates?.INR) {
                    exchangeRate = rateData.rates.INR;
                }
            }
        } catch (err) {
            console.error('Failed to fetch live exchange rate, using fallback:', err);
        }

        //convert USD to INR for Razorpay transaction
        const amountInINR = Math.round(amount * exchangeRate);

        const options = {
            amount: amountInINR * 100, // Razorpay works in paise (e.g. 850 INR = 85000 paise)
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: session.user.id,
                usdAmount: amount.toString(), // Original USD amount to credit
                exchangeRateUsed: exchangeRate.toFixed(4),
            },
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
        });
    } catch (error) {
        console.error('[RAZORPAY_ORDER_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
