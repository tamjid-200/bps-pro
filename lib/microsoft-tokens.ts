// Server-only: each BPS Pro user connects their own Microsoft 365 account.
// This file keeps that connection safe:
//   - the Microsoft refresh token is encrypted (AES-256-GCM) before it is stored
//   - the "state" value sent to Microsoft is signed, so a connection can only be
//     saved to the BPS Pro login that started it
// Needs in Vercel: MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TOKEN_KEY,
// SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL.
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const MS_REDIRECT_URI = 'https://bps-pro.vercel.app/api/microsoft/callback';
export const MS_SCOPES = 'offline_access User.Read Tasks.Read';

const LOGIN = 'https://login.microsoftonline.com';
const STATE_MS = 10 * 60 * 1000; // a sign-in must finish within 10 minutes

// ---------- encryption key ----------

// MS_TOKEN_KEY: 32 random bytes, base64. Generate with: openssl rand -base64 32
function tokenKey(): Buffer {
  const raw = process.env.MS_TOKEN_KEY;
  if (!raw) throw new Error('MS_TOKEN_KEY is missing in Vercel');
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) throw new Error('MS_TOKEN_KEY must be 32 random bytes (base64)');
  return buf;
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', tokenKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString('base64')).join('.');
}

export function decryptToken(stored: string): string {
  const [ivB, tagB, encB] = stored.split('.');
  if (!ivB || !tagB || !encB) throw new Error('Stored token is malformed');
  const decipher = createDecipheriv('aes-256-gcm', tokenKey(), Buffer.from(ivB, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encB, 'base64')), decipher.final()]).toString('utf8');
}

// ---------- signed "state" for the Microsoft sign-in ----------

function stateKey(): Buffer {
  // A separate key derived from MS_TOKEN_KEY, so the two uses never mix
  return createHash('sha256').update(tokenKey()).update('bps-oauth-state').digest();
}

export function makeState(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ u: userId, exp: Date.now() + STATE_MS, n: randomBytes(8).toString('hex') })
  ).toString('base64url');
  const sig = createHmac('sha256', stateKey()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

// Returns the BPS Pro user id the state was made for, or null if it is forged or expired
export function readState(state: string): string | null {
  const [payload, sig] = state.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', stateKey()).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    return typeof data.u === 'string' ? data.u : null;
  } catch {
    return null;
  }
}

// ---------- Microsoft sign-in ----------

function microsoftConfig() {
  const tenant = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) {
    throw new Error('Microsoft settings are missing in Vercel');
  }
  return { tenant, clientId, clientSecret };
}

export function authorizeUrl(state: string): string {
  const { tenant, clientId } = microsoftConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: MS_REDIRECT_URI,
    response_mode: 'query',
    scope: MS_SCOPES,
    state,
    prompt: 'select_account',
  });
  return `${LOGIN}/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
}

// Calls the Microsoft token endpoint
export async function postToken(form: Record<string, string>) {
  const { tenant, clientId, clientSecret } = microsoftConfig();
  const res = await fetch(`${LOGIN}/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...form }),
    signal: AbortSignal.timeout(8000),
  });
  const json: any = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

// Database access that bypasses the per-user security rules.
// Only used here on the server, never sent to the browser.
export function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing in Vercel');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Saves (or replaces) one user's encrypted Microsoft refresh token
export async function saveConnection(userId: string, refreshToken: string) {
  const { tenant } = microsoftConfig();
  const { error } = await adminDb()
    .from('microsoft_connections')
    .upsert({
      user_id: userId,
      refresh_token_enc: encryptToken(refreshToken),
      tenant_id: tenant,
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error('Could not save the Microsoft connection');
}

export type UserToken =
  | { connected: true; token: string }
  | { connected: false; reason: 'not_connected' | 'reconnect' };

// Gets a fresh Microsoft access token for one BPS Pro user.
// Microsoft gives a new refresh token each time, so the new one is saved.
export async function userMicrosoftToken(userId: string): Promise<UserToken> {
  const db = adminDb();
  const { data, error } = await db
    .from('microsoft_connections')
    .select('refresh_token_enc')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error('Could not read the Microsoft connection');
  if (!data) return { connected: false, reason: 'not_connected' };

  let refresh: string;
  try {
    refresh = decryptToken(data.refresh_token_enc);
  } catch {
    return { connected: false, reason: 'reconnect' };
  }

  const r = await postToken({ grant_type: 'refresh_token', refresh_token: refresh, scope: MS_SCOPES });
  if (!r.ok || !r.json.access_token) {
    // The connection was revoked or expired: remove it so the user is asked to connect again
    if (r.json.error === 'invalid_grant') {
      await db.from('microsoft_connections').delete().eq('user_id', userId);
      return { connected: false, reason: 'reconnect' };
    }
    throw new Error(`Microsoft sign-in failed (${r.status})`);
  }
  if (r.json.refresh_token) await saveConnection(userId, r.json.refresh_token);
  return { connected: true, token: r.json.access_token as string };
}
