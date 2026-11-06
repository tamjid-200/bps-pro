import { NextResponse } from 'next/server';
import { callGemini, type GeminiContent } from '../../../lib/gemini';
import { requireUser } from '../../../lib/server-auth';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_CONTEXT_CHARS = 60000;

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const context = typeof body?.context === 'string' ? body.context : '';

  // Keep the last 10 messages, only user/assistant text, and cap length.
  const recent = messages
    .filter(
      (m: { role?: string; content?: unknown }) =>
        (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string'
    )
    .slice(-10);

  const contents: GeminiContent[] = recent.map((m: { role: string; content: string }) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content.slice(0, 4000) }],
  }));

  // Gemini needs the conversation to start with a user message.
  while (contents.length && contents[0].role !== 'user') contents.shift();
  if (contents.length === 0) {
    return NextResponse.json({ error: 'Empty message.' }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const system = `You are the assistant inside BPS Pro, a residential block property management app used by Block Property Solutions Ltd (UK).
Answer ONLY using the BPS DATA below. If the answer is not in the data, say you cannot find it. Never invent dates, policy numbers or amounts.
Use UK date format (for example 5 Nov 2026). Be concise and clear. Today is ${today}.

BPS DATA:
${context.slice(0, MAX_CONTEXT_CHARS)}`;

  try {
    const reply = await callGemini({ system, contents });
    return NextResponse.json({ reply: reply || 'Sorry, I could not produce an answer.' });
  } catch (err) {
    console.error('Chat route error:', err);
    return NextResponse.json(
      { error: 'The AI assistant is unavailable right now. Please try again shortly.' },
      { status: 502 }
    );
  }
}
