// Server-only: reads Microsoft Planner tasks through Microsoft Graph.
// Needs MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET and MS_PLANNER_PLAN_ID in Vercel.

const LOGIN = 'https://login.microsoftonline.com';
const GRAPH = 'https://graph.microsoft.com/v1.0';

export type PlannerTask = {
  id: string;
  title: string;
  dueDateTime: string | null;
  percentComplete: number;
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

// Reads every task in the plan, following Graph's paging links.
export async function getPlannerTasks(): Promise<PlannerTask[]> {
  const planId = process.env.MS_PLANNER_PLAN_ID;
  if (!planId) throw new Error('MS_PLANNER_PLAN_ID is missing in Vercel');

  const token = await graphToken();
  const tasks: PlannerTask[] = [];
  let url: string | null =
    `${GRAPH}/planner/plans/${planId}/tasks?$select=id,title,dueDateTime,percentComplete`;

  while (url && tasks.length < 500) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Planner request failed (${res.status})`);
    const json = await res.json();
    tasks.push(...(json.value ?? []));
    url = json['@odata.nextLink'] ?? null;
  }
  return tasks;
}
