import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const VOICE_ENGINE_URL = process.env.VOICE_ENGINE_URL || 'http://localhost:5050';

/**
 * POST /api/call/start
 * Proxy route: validates session, then forwards the call request to the voice-engine.
 * Body: { contactId?: string, to?: string, customPrompt?: string }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contactId, to, customPrompt } = body;

    if (!contactId && !to) {
      return NextResponse.json({ error: 'Provide either contactId or a phone number (to).' }, { status: 400 });
    }

    // Forward request to voice-engine with the authenticated username injected
    const engineRes = await fetch(`${VOICE_ENGINE_URL}/call/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: session.user.name,
        contactId,
        to,
        customPrompt,
      }),
    });

    const engineData = await engineRes.json();

    if (!engineRes.ok) {
      return NextResponse.json({ error: engineData.error || 'Voice engine error' }, { status: engineRes.status });
    }

    return NextResponse.json({ success: true, callSid: engineData.callSid });
  } catch (error: any) {
    console.error('POST /api/call/start proxy error:', error.message);
    // Provide helpful message if voice-engine is unreachable
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: `Cannot connect to voice engine at ${VOICE_ENGINE_URL}. Is it running?` },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
