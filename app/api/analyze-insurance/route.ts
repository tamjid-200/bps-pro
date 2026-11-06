import { NextResponse } from 'next/server';
import { callGemini } from '../../../lib/gemini';
import { requireUser } from '../../../lib/server-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
// Vercel limits request bodies to about 4.5 MB. Base64 adds about a third, so cap the text length.
const MAX_BASE64_CHARS = 4_600_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const cleanString = (v: unknown, max = 200) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

const cleanDate = (v: unknown) => (typeof v === 'string' && DATE_RE.test(v) ? v : null);

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const mimeType = body?.mimeType as string;
  const pdfBase64 = body?.pdfBase64 as string;
  const fileName = cleanString(body?.fileName, 120) || 'document';

  if (!ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
  }
  if (!pdfBase64 || typeof pdfBase64 !== 'string') {
    return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  }
  if (pdfBase64.length > MAX_BASE64_CHARS) {
    return NextResponse.json(
      { error: 'File is too large to read automatically (max about 3.5 MB).' },
      { status: 413 }
    );
  }

  const system =
    'You read UK property insurance documents for a block management company. Extract only what the document clearly states. Never guess. Reply with JSON only.';

  const prompt = `File name: ${fileName}
Return a JSON object with exactly these keys:
- insurer: insurance company name, or null
- policyNumber: policy number, or null
- coverType: type of cover (for example "Buildings", "Terrorism", "Reinstatement"), or null
- startDate: date the cover starts, format YYYY-MM-DD, or null
- expiryDate: date the cover period ends or renews, format YYYY-MM-DD, or null
- notes: under 25 words on anything important (excess, renewal condition), or null
Use null for anything not clearly stated in the document.`;

  try {
    const text = await callGemini({
      system,
      json: true,
      contents: [
        {
          role: 'user',
          parts: [{ inlineData: { mimeType, data: pdfBase64 } }, { text: prompt }],
        },
      ],
    });

    const parsed = JSON.parse(text);
    const cover = {
      insurer: cleanString(parsed?.insurer),
      policyNumber: cleanString(parsed?.policyNumber, 80),
      coverType: cleanString(parsed?.coverType, 80),
      startDate: cleanDate(parsed?.startDate),
      expiryDate: cleanDate(parsed?.expiryDate),
      notes: cleanString(parsed?.notes, 300),
      analysedAt: new Date().toISOString(),
    };

    return NextResponse.json({ cover });
  } catch (err) {
    console.error('Insurance analysis error:', err);
    return NextResponse.json(
      { error: 'Could not read this document automatically. You can enter the dates manually.' },
      { status: 502 }
    );
  }
}
