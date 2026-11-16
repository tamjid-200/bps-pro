// Browser-side: asks our own API for the Planner data of every block.
// Returns { status, items }: status for the block card, items for the All tasks list.
import { supabase } from './supabase';

export async function fetchPlannerStatus(blocks) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const res = await fetch('/api/planner-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      blocks: blocks.map((b) => ({ id: b.id, name: b.name, shortName: b.shortName })),
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Could not load Planner status');
  return { status: json.status || {}, items: json.items || {} };
}
