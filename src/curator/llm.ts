export type LlmRequest = {
  system: string;
  user: string;
};

export type LlmResponse = {
  text: string;
};

export type LlmAdapter = (req: LlmRequest) => Promise<LlmResponse>;

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 2048;

async function anthropic(req: LlmRequest): Promise<LlmResponse> {
  const key = process.env.ANTHROPIC_API_KEY ?? '';
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS,
      system: req.system,
      messages: [{ role: 'user', content: req.user }],
    }),
  });
  if (!res.ok) {
    throw new Error(`llm http ${res.status}`);
  }
  const data = (await res.json()) as { content: { text: string }[] };
  return { text: data.content[0]?.text ?? '' };
}

export function defaultLlm(): LlmAdapter {
  return anthropic;
}
