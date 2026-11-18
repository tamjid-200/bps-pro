// Removes this BPS Pro user's Microsoft 365 connection.
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/server-auth';
import { adminDb } from '../../../../lib/microsoft-tokens';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });
  }
  try {
    const { error } = await adminDb().from('microsoft_connections').delete().eq('user_id', user.id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not disconnect Microsoft 365. Please try again.' }, { status: 500 });
  }
}
