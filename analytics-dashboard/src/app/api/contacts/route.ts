import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Contact from '@/models/Contact';

// 1. GET Request: Fetch all contacts for the logged-in user
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.name) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const contacts = await Contact.find({ username: session.user.name }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, contacts });

    } catch (error: any) {
        console.error('Fetch contacts error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// 2. POST Request: Bulk save contacts uploaded via CSV
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.name) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { contacts } = await request.json(); // Array of { name, phoneNumber, customPrompt }

        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return NextResponse.json({ error: 'Invalid or empty contacts list' }, { status: 400 });
        }

        await connectDB();

        // Map each contact to include the logged-in user's username
        const contactsToSave = contacts.map(c => ({
            name: c.name,
            phoneNumber: c.phoneNumber,
            customPrompt: c.customPrompt,
            status: 'pending',
            username: session.user.name
        }));

        // Bulk insert into MongoDB
        const insertedContacts = await Contact.insertMany(contactsToSave);

        return NextResponse.json({
            success: true,
            count: insertedContacts.length,
            contacts: insertedContacts
        });

    } catch (error: any) {
        console.error('Bulk save contacts error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
