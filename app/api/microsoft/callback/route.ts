// Microsoft sends the user back here after they sign in.
// Saves their encrypted connection, then returns them to the app.
import { NextRequest, NextResponse } from 'next/server';
import { MS_REDIRECT_URI, MS_SCOPES, postToken, readState, saveConnection } from '../../../../lib/microsoft-tokens';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const home = (result: string) => NextResponse.redirect(new URL(`/?microsoft=${result}`, req.url));

  const params = req.nextUrl.searchParams;
  if (params.get('error')) return home('denied'); // user pressed Cancel

  const code = params.get('code');
  const state = params.get('state');
  const userId = state ? readState(state) : null;
  if (!code || !userId) return home('failed');

  try {
    const r = await postToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: MS_REDIRECT_URI,
      scope: MS_SCOPES,
    });
    if (!r.ok || !r.json.refresh_token) return home('failed');
    await saveConnection(userId, r.json.refresh_token as string);
    return home('connected');
  } catch {
    return home('failed');
  }
}
