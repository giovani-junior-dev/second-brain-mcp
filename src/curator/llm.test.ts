import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { defaultLlm } from './llm.js';

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  process.env.ANTHROPIC_API_KEY = 'test-key';
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('defaultLlm anthropic', () => {
  it('parses content[0].text from response', async () => {
    server.use(
      http.post('https://api.anthropic.com/v1/messages', () =>
        HttpResponse.json({ content: [{ text: 'pattern: TDD' }] }),
      ),
    );
    const out = await defaultLlm()({ system: 's', user: 'u' });
    expect(out.text).toBe('pattern: TDD');
  });

  it('throws on non-2xx', async () => {
    server.use(
      http.post('https://api.anthropic.com/v1/messages', () =>
        HttpResponse.json({ error: 'oops' }, { status: 500 }),
      ),
    );
    await expect(defaultLlm()({ system: 's', user: 'u' })).rejects.toThrow(/llm http 500/);
  });

  it('returns empty when no content', async () => {
    server.use(
      http.post('https://api.anthropic.com/v1/messages', () => HttpResponse.json({ content: [] })),
    );
    const out = await defaultLlm()({ system: 's', user: 'u' });
    expect(out.text).toBe('');
  });
});
