// Browser-side: talks to our own API for the signed-in user's Planner data and
// Microsoft 365 connection.
import { supabase } from './supabase';

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Returns { connected, status, items }: status for the block card, items for the All tasks list
export async function fetchPlannerStatus(blocks) {
  const res = await fetch('/api/planner-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({
      blocks: blocks.map((b) => ({ id: b.id, name: b.name, shortName: b.shortName })),
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Could not load Planner status');
  return {
    connected: !!json.connected,
    status: json.status || {},
    items: json.items || {},
  };
}

// Sends the user to the Microsoft sign-in page; Microsoft brings them back to the app
export async function connectMicrosoft() {
  const res = await fetch('/api/microsoft/connect', { method: 'POST', headers: await authHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.url) throw new Error(json.error || 'Could not start Microsoft sign-in');
  window.location.href = json.url;
}

export async function disconnectMicrosoft() {
  const res = await fetch('/api/microsoft/disconnect', { method: 'POST', headers: await authHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Could not disconnect Microsoft 365');
}
