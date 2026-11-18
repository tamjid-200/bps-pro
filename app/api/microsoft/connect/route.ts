// Starts the Microsoft 365 sign-in for the signed-in BPS Pro user.
// Returns the Microsoft sign-in address; the browser then opens it.
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/server-auth';
import { authorizeUrl, makeState } from '../../../../lib/microsoft-tokens';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });
  }
  try {
    return NextResponse.json({ url: authorizeUrl(makeState(user.id)) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Microsoft is not set up';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
