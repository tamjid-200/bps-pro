// Server-only: reads Microsoft Planner tasks for ONE signed-in BPS Pro user,
// using that user's own Microsoft 365 connection (see microsoft-tokens.ts).
// Microsoft only returns the plans that user can see, so each person sees
// only their own Planner plans.
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

// Plans this user can see (their own plans plus plans shared with them)
async function plansForUser(token: string): Promise<{ id: string; title: string }[]> {
  return graphGetAll(`${GRAPH}/me/planner/plans?$select=id,title`, token);
}

async function tasksForPlan(plan: { id: string; title: string }, token: string): Promise<PlannerTask[]> {
  try {
    const raw = await graphGetAll(
      `${GRAPH}/planner/plans/${plan.id}/tasks?$select=id,title,dueDateTime,percentComplete`,
      token
    );
    return raw.map((t) => ({ ...t, planTitle: plan.title ?? '', planId: plan.id }));
  } catch {
    return []; // one plan that cannot be read should not stop the others
  }
}

export async function getPlannerTasksForUser(userId: string): Promise<PlannerResult> {
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < CACHE_MS) return { connected: true, tasks: hit.tasks };

  const auth = await userMicrosoftToken(userId);
  if (!auth.connected) return { connected: false, reason: auth.reason };

  const plans = await plansForUser(auth.token);

  // Read the tasks in each plan, ten plans at a time, to stay inside the time limit
  const tasks: PlannerTask[] = [];
  for (let i = 0; i < plans.length; i += 10) {
    const batch = plans.slice(i, i + 10);
    const found = await Promise.all(batch.map((p) => tasksForPlan(p, auth.token)));
    found.forEach((list) => tasks.push(...list));
  }

  cache.set(userId, { at: Date.now(), tasks });
  return { connected: true, tasks };
}
