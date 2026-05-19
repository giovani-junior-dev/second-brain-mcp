import type { Database } from 'better-sqlite3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openDb } from '../storage/db.js';
import { insertMessage } from '../storage/messages.js';
import { migrate } from '../storage/migrate.js';
import { extractPatternsBatched } from './extractor-batched.js';

let db: Database;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
});

describe('extractPatternsBatched', () => {
  it('returns empty when no messages', async () => {
    const llm = vi.fn();
    expect(await extractPatternsBatched(db, llm)).toEqual([]);
    expect(llm).not.toHaveBeenCalled();
  });

  it('calls LLM per chunk and aggregates results', async () => {
    for (let i = 0; i < 30; i++) {
      insertMessage(db, { sessionId: `s${i}`, role: 'user', content: 'x'.repeat(200) });
    }
    const llm = vi
      .fn()
      .mockResolvedValueOnce({ text: '[{"pattern":"alpha","kind":"preference"}]' })
      .mockResolvedValueOnce({ text: '[{"pattern":"beta","kind":"fact"}]' });
    const out = await extractPatternsBatched(db, llm);
    expect(llm).toHaveBeenCalled();
    expect(out.length).toBeGreaterThan(0);
  });

  it('dedupes similar patterns across chunks (Jaccard >= 0.7)', async () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'msg' });
    const llm = vi
      .fn()
      .mockResolvedValueOnce({
        text: '[{"pattern":"prefer biome over eslint","kind":"preference"}]',
      })
      .mockResolvedValueOnce({
        text: '[{"pattern":"prefer biome over eslint","kind":"preference"}]',
      });
    const out = await extractPatternsBatched(db, llm);
    const matches = out.filter((p) => p.pattern.includes('biome'));
    expect(matches.length).toBe(1);
  });

  it('keeps patterns with different kinds even if same text', async () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'm' });
    const llm = vi.fn().mockResolvedValueOnce({
      text: '[{"pattern":"npm test","kind":"procedural"},{"pattern":"npm test","kind":"preference"}]',
    });
    const out = await extractPatternsBatched(db, llm);
    expect(out).toHaveLength(2);
  });

  it('stratifies by session: max 10 messages per session', async () => {
    for (let i = 0; i < 50; i++) {
      insertMessage(db, { sessionId: 's1', role: 'user', content: `m${i}` });
    }
    const llm = vi.fn().mockResolvedValue({ text: '[]' });
    await extractPatternsBatched(db, llm);
    expect(llm).toHaveBeenCalledTimes(1);
  });
});
