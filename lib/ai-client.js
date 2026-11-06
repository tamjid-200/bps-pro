// Browser-side helpers. These call our own /api routes and send the logged-in
// user's Supabase token. The Gemini key never appears in this file.
import { supabase } from './supabase';

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  let json = {};
  try {
    json = await res.json();
  } catch (e) {
    // Non-JSON response, handled below
  }
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export async function askBps(messages, context) {
  const { reply } = await postJson('/api/chat', { messages, context });
  return reply;
}

// Vercel's request limit is about 4.5 MB. Base64 adds about 33%, so keep files under about 3.5 MB.
const MAX_PDF_BYTES = 3.5 * 1024 * 1024;

export async function analyzeInsuranceFile(file) {
  const base64 = String(file.data || '').split(',')[1] || '';
  const approxBytes = (base64.length * 3) / 4;
  if (approxBytes > MAX_PDF_BYTES) {
    throw new Error('File is too large to read automatically (max about 3.5 MB). You can enter the dates manually.');
  }
  const { cover } = await postJson('/api/analyze-insurance', {
    mimeType: file.type,
    pdfBase64: base64,
    fileName: file.name,
  });
  return cover;
}
