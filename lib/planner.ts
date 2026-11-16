// Server-only: reads Microsoft Planner tasks through Microsoft Graph.
// Needs MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET and MS_PLANNER_PLAN_IDS in Vercel.

const LOGIN = 'https://login.microsoftonline.com';
const GRAPH = 'https://graph.microsoft.com/v1.0';

export type PlannerTask = {
  id: string;
  title: string;
  dueDateTime: string | null;
  percentComplete: number;
  planTitle: string;
};

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

// Reads every task from each plan listed in MS_PLANNER_PLAN_IDS
// (comma-separated). Falls back to MS_PLANNER_PLAN_ID if that is the only one set.
export async function getPlannerTasks(): Promise<PlannerTask[]> {
  const raw = process.env.MS_PLANNER_PLAN_IDS || process.env.MS_PLANNER_PLAN_ID || '';
  const planIds = raw.split(',').map((id) => id.trim()).filter(Boolean);
  if (planIds.length === 0) throw new Error('MS_PLANNER_PLAN_IDS is missing in Vercel');

  const token = await graphToken();
  const tasks: PlannerTask[] = [];

  for (const planId of planIds) {
    // The plan's name, e.g. "Granary Wharf", so tasks can be matched to a site
    const planRes = await fetch(`${GRAPH}/planner/plans/${planId}?$select=title`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    const planJson = planRes.ok ? await planRes.json() : {};
    const planTitle: string = planJson.title ?? '';

    let url: string | null =
      `${GRAPH}/planner/plans/${planId}/tasks?$select=id,title,dueDateTime,percentComplete`;
    let pages = 0;

    while (url && pages < 10) {
      const res: Response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Planner request failed (${res.status})`);
      const json = await res.json();
      for (const t of json.value ?? []) tasks.push({ ...t, planTitle });
      url = json['@odata.nextLink'] ?? null;
      pages++;
    }
  }
  return tasks;
}
