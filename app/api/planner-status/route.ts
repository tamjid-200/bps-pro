// Returns the Confirmation Statement status for each block, read from Planner.
// Body: { blocks: [{ id, name, shortName }] }
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/server-auth';
import { getPlannerTasks, PlannerTask } from '../../../lib/planner';

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

export async function POST(req: NextRequest) {
  // Same sign-in check as the chat route
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });
  }

  let body: { blocks?: { id: string; name?: string; shortName?: string }[] } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  try {
    const tasks: PlannerTask[] = await getPlannerTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const status: Record<string, unknown> = {};
    for (const block of body.blocks ?? []) {
      const terms = [block.shortName, block.name]
        .filter((t): t is string => !!t && t.trim().length > 0)
        .map((t) => t.toLowerCase());

      const matches = tasks.filter((t) => {
        const title = (t.title || '').toLowerCase();
        return terms.some((term) => title.includes(term));
      });
      if (matches.length === 0) continue;

      // Prefer an open task. Among open tasks, use the one due soonest.
      const open = matches.filter((t) => t.percentComplete !== 100);
      const pick =
        (open.length ? open : matches).sort((a, b) => {
          const da = a.dueDateTime ? new Date(a.dueDateTime).getTime() : Infinity;
          const db = b.dueDateTime ? new Date(b.dueDateTime).getTime() : Infinity;
          return da - db;
        })[0];

      status[block.id] = {
        title: pick.title,
        dueDate: pick.dueDateTime ? pick.dueDateTime.slice(0, 10) : null,
        done: pick.percentComplete === 100,
        daysLeft: pick.percentComplete === 100 ? null : daysUntil(pick.dueDateTime, today),
      };
    }

    return NextResponse.json({ status });
  } catch (err) {
    console.error('Planner status failed:', err);
    const message = err instanceof Error ? err.message : 'Planner is unavailable';
    return NextResponse.json({ error: `Could not load Planner: ${message}` }, { status: 502 });
  }
}
