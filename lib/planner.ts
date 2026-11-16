// Server-only: reads Microsoft Planner tasks through Microsoft Graph.
// Reads every plan in the Microsoft 365 account automatically, so new plans
// appear without changing any settings.
// Needs MS_TENANT_ID, MS_CLIENT_ID and MS_CLIENT_SECRET in Vercel.

const LOGIN = 'https://login.microsoftonline.com';
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

let cache: { at: number; tasks: PlannerTask[] } | null = null;

async function graphToken(): Promise<string> {
  const tenant = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) {
    throw new Error('Microsoft settings are missing in Vercel');
  }

  const res = await fetch(`${LOGIN}/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
    signal: AbortSignal.timeout(8000),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`Microsoft sign-in failed (${res.status})`);
  }
  return json.access_token as string;
}

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

// Plans attached to one Microsoft 365 group. Groups without Planner return nothing.
async function plansForGroup(groupId: string, token: string): Promise<{ id: string; title: string }[]> {
  try {
    return await graphGetAll(`${GRAPH}/groups/${groupId}/planner/plans?$select=id,title`, token);
  } catch {
    return [];
  }
}

async function tasksForPlan(plan: { id: string; title: string }, token: string): Promise<PlannerTask[]> {
  try {
    const raw = await graphGetAll(
      `${GRAPH}/planner/plans/${plan.id}/tasks?$select=id,title,dueDateTime,percentComplete`,
      token
    );
    return raw.map((t) => ({ ...t, planTitle: plan.title ?? '', planId: plan.id }));
  } catch {
    return [];
  }
}

export async function getPlannerTasks(): Promise<PlannerTask[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.tasks;

  const token = await graphToken();
  const groups = await graphGetAll(`${GRAPH}/groups?$select=id,displayName`, token);

  // Find every plan, ten groups at a time, to stay inside the time limit
  const plans: { id: string; title: string }[] = [];
  for (let i = 0; i < groups.length; i += 10) {
    const batch = groups.slice(i, i + 10);
    const found = await Promise.all(batch.map((g) => plansForGroup(g.id, token)));
    found.forEach((list) => plans.push(...list));
  }

  // Read the tasks in each plan, ten plans at a time
  const tasks: PlannerTask[] = [];
  for (let i = 0; i < plans.length; i += 10) {
    const batch = plans.slice(i, i + 10);
    const found = await Promise.all(batch.map((p) => tasksForPlan(p, token)));
    found.forEach((list) => tasks.push(...list));
  }

  cache = { at: Date.now(), tasks };
  return tasks;
}
