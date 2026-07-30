import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const { username, email, password } = await req.json();

        // 1. Basic validation
        if (!username || !email || !password) {
            return NextResponse.json(
                { error: 'Username, email, and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        await connectDB();

        // 2. Check if username already exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return NextResponse.json(
                { error: 'Username is already taken' },
                { status: 400 }
            );
        }

        // 3. Check if email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return NextResponse.json(
                { error: 'Email is already registered' },
                { status: 400 }
            );
        }

        // 4. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Create new user with a starting balance (e.g. $10.00 trial credit)
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            balance: 10.00 // Give new users $10 starting credits
        });

        await newUser.save();

        return NextResponse.json(
            { message: 'User registered successfully', success: true },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('[SIGNUP_API_ERROR]', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
