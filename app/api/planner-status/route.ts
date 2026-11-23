// Returns Planner data for each block, for the signed-in user only:
//   connected: whether this user has connected their Microsoft 365 account
//   status:    the Confirmation Statement line shown on the block card
//   items:     every Planner task linked to the block, for the All tasks list
// Body: { blocks: [{ id, name, shortName }] }
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/server-auth';
import { getPlannerTasksForUser, PlannerTask } from '../../../lib/planner';

export const runtime = 'nodejs';
export const maxDuration = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

// Whole days from today to the due date. Negative means overdue.
function daysUntil(dueDateTime: string | null, today: Date): number | null {
  if (!dueDateTime) return null;
  const d = new Date(`${dueDateTime.slice(0, 10)}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - today.getTime()) / DAY_MS);
}

function toItem(t: PlannerTask, today: Date) {
  const done = t.percentComplete === 100;
  // Teams link: opens the Teams/Planner app if installed, otherwise the web version
  const tenant = process.env.MS_TENANT_ID ?? '';
  const context = JSON.stringify({ subEntityId: `/v1/plan/${t.planId}/view/grid/task/${t.id}` });
  const webUrl = 'https://tasks.teams.microsoft.com/teamsui/personalApp/alltasklists';
  const url =
    `https://teams.microsoft.com/l/entity/com.microsoft.teamspace.tab.planner/mytasks` +
    `?tenantId=${tenant}&webUrl=${encodeURIComponent(webUrl)}&context=${encodeURIComponent(context)}`;
  return {
    id: t.id,
    title: t.title,
    planTitle: t.planTitle,
    url,
    dueDate: t.dueDateTime ? t.dueDateTime.slice(0, 10) : null,
    done,
    daysLeft: done ? null : daysUntil(t.dueDateTime, today),
  };
}

export async function POST(req: NextRequest) {
  // Same sign-in check as the chat route
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });
  }

  let body: { blocks?: { id: string; name?: string; shortName?: string }[]; refresh?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  try {
    const result = await getPlannerTasksForUser(user.id, body.refresh === true);
    if (!result.connected) {
      return NextResponse.json({ connected: false, reason: result.reason, status: {}, items: {} });
    }
    const tasks: PlannerTask[] = result.tasks;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const status: Record<string, unknown> = {};
    const items: Record<string, unknown[]> = {};

    for (const block of body.blocks ?? []) {
      // A task belongs to a block only when its Planner plan name is exactly the block name
      // (case and extra spaces ignored). Task titles are never used, so there are no partial matches.
      const names = [block.shortName, block.name]
        .filter((t): t is string => !!t && t.trim().length > 0)
        .map((t) => t.trim().toLowerCase());
      const linked = tasks.filter((t) => names.includes((t.planTitle || '').trim().toLowerCase()));
      if (linked.length === 0) continue;

      items[block.id] = linked
        .map((t) => toItem(t, today))
        .sort((a, b) => {
          if (a.done !== b.done) return a.done ? 1 : -1;
          const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return da - db;
        });

      // Card line: the soonest open Confirmation Statement task for this block
      const confirmations = linked.filter((t) =>
        (t.title || '').toLowerCase().includes('confirmation')
      );
      if (confirmations.length > 0) {
        const open = confirmations.filter((t) => t.percentComplete !== 100);
        const pick = (open.length ? open : confirmations).sort((a, b) => {
          const da = a.dueDateTime ? new Date(a.dueDateTime).getTime() : Infinity;
          const db = b.dueDateTime ? new Date(b.dueDateTime).getTime() : Infinity;
          return da - db;
        })[0];
        status[block.id] = toItem(pick, today);
      }
    }

    return NextResponse.json({ connected: true, status, items });
  } catch (err) {
    console.error('Planner status failed:', err);
    const message = err instanceof Error ? err.message : 'Planner is unavailable';
    return NextResponse.json({ error: `Could not load Planner: ${message}` }, { status: 502 });
  }
}
