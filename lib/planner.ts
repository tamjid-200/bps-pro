// Server-only: reads the Microsoft Planner tasks ASSIGNED TO one signed-in BPS Pro user,
// using that user's own Microsoft 365 connection (see microsoft-tokens.ts).
// Each person only sees the tasks that are assigned to them in Planner.
import { userMicrosoftToken } from './microsoft-tokens';

const GRAPH = 'https://graph.microsoft.com/v1.0';
const CACHE_MS = 10 * 60 * 1000; // reuse results for 10 minutes

export type PlannerTask = {
  id: string;
  title: string;
  dueDateTime: string | null;
  percentComplete: number;
  planTitle: string;
  planId: string;
};

export type PlannerResult =
  | { connected: true; tasks: PlannerTask[] }
  | { connected: false; reason: 'not_connected' | 'reconnect' };

// Results per BPS Pro user, so one person never gets another person's tasks
const cache = new Map<string, { at: number; tasks: PlannerTask[] }>();

// Reads every item from a Graph list, following the paging links
async function graphGetAll(url: string, token: string): Promise<any[]> {
  const out: any[] = [];
  let next: string | null = url;
  let pages = 0;
  while (next && pages < 20) {
    const res: Response = await fetch(next, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Graph request failed (${res.status})`);
    const json = await res.json();
    out.push(...(json.value ?? []));
    next = json['@odata.nextLink'] ?? null;
    pages++;
  }
  return out;
}

// Plan names, so each task can show which plan (block) it belongs to.
// Plans the user can see are read in one call; any others are read one by one.
async function planTitles(planIds: string[], token: string): Promise<Map<string, string>> {
  const titles = new Map<string, string>();
  const plans = await graphGetAll(`${GRAPH}/me/planner/plans?$select=id,title`, token).catch(() => []);
  plans.forEach((p) => titles.set(p.id, p.title ?? ''));

  const missing = planIds.filter((id) => !titles.has(id));
  const found = await Promise.all(
    missing.map(async (id) => {
      try {
        const res = await fetch(`${GRAPH}/planner/plans/${id}?$select=id,title`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return [id, ''] as const;
        const json = await res.json();
        return [id, json.title ?? ''] as const;
      } catch {
        return [id, ''] as const;
      }
    })
  );
  found.forEach(([id, title]) => titles.set(id, title));
  return titles;
}

export async function getPlannerTasksForUser(userId: string, force = false): Promise<PlannerResult> {
  const hit = cache.get(userId);
  if (!force && hit && Date.now() - hit.at < CACHE_MS) return { connected: true, tasks: hit.tasks };

  const auth = await userMicrosoftToken(userId);
  if (!auth.connected) return { connected: false, reason: auth.reason };

  // Tasks assigned to this person, across all plans
  const raw = await graphGetAll(`${GRAPH}/me/planner/tasks`, auth.token);
  const planIds = Array.from(new Set(raw.map((t) => t.planId as string).filter(Boolean)));
  const titles = await planTitles(planIds, auth.token);

  const tasks: PlannerTask[] = raw.map((t) => ({
    id: t.id,
    title: t.title ?? '',
    dueDateTime: t.dueDateTime ?? null,
    percentComplete: t.percentComplete ?? 0,
    planId: t.planId ?? '',
    planTitle: titles.get(t.planId) ?? '',
  }));

  cache.set(userId, { at: Date.now(), tasks });
  return { connected: true, tasks };
}
