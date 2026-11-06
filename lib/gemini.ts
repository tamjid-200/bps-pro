// Server-only helper for Google Gemini (free tier via AI Studio).
// Only import this from app/api routes. The key must never reach the browser.

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export type GeminiContent = {
  role: 'user' | 'model';
  parts: GeminiPart[];
};

export async function callGemini({
  system,
  contents,
  json = false,
}: {
  system: string;
  contents: GeminiContent[];
  json?: boolean;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        temperature: 0.2,
        ...(json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('Gemini error', res.status, detail.slice(0, 500));
    throw new Error(`Gemini request failed (${res.status})`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p: { text?: string }) => p.text ?? '').join('');
}
