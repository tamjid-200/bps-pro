// Server-only helper for Google Gemini (free tier via AI Studio).
// Only import this from app/api routes. The key must never reach the browser.
//
// Vercel stops a request after 30 seconds, so each Gemini call gets a short
// time limit. If a model is busy, we try the fallback model before time runs out.

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const FALLBACK_MODELS = ['gemini-3.5-flash-lite'];
const RETRYABLE = [429, 500, 503];
const REQUEST_TIMEOUT_MS = 8000; // per attempt
const MAX_TOTAL_MS = 24000; // stay under Vercel's 30s limit

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export type GeminiContent = {
  role: 'user' | 'model';
  parts: GeminiPart[];
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const primary = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const models = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: {
      temperature: 0.2,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  });

  const startedAt = Date.now();
  let lastStatus = 0;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const remaining = MAX_TOTAL_MS - (Date.now() - startedAt);
      if (remaining < 3000) break; // not enough time left for another call

      let res: Response;
      try {
        res = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body,
          signal: AbortSignal.timeout(Math.min(REQUEST_TIMEOUT_MS, remaining)),
        });
      } catch (err) {
        // Timed out or network error: move on to the next attempt or model
        console.error(`Gemini request on ${model} failed:`, err);
        lastStatus = 504;
        break;
      }

      if (res.ok) {
        const data = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts ?? [];
        return parts.map((p: { text?: string }) => p.text ?? '').join('');
      }

      lastStatus = res.status;
      const detail = await res.text();
      console.error(`Gemini error ${res.status} on ${model}:`, detail.slice(0, 300));

      // Model-specific problem (e.g. 404): skip to the next model
      if (!RETRYABLE.includes(res.status)) break;

      // Busy: wait briefly, then try again
      if (attempt < 2) await wait(1000);
    }
  }

  throw new Error(`Gemini request failed (${lastStatus || 'no response'})`);
}
