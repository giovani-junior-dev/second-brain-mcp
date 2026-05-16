import type { Database } from 'better-sqlite3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openDb } from '../storage/db.js';
import { insertMessage } from '../storage/messages.js';
import { migrate } from '../storage/migrate.js';
import { extractPatterns } from './extractor.js';

let db: Database;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
});

describe('extractPatterns', () => {
  it('returns empty when no messages', async () => {
    const llm = vi.fn();
    const out = await extractPatterns(db, llm, 10);
    expect(out).toEqual([]);
    expect(llm).not.toHaveBeenCalled();
  });

  it('parses JSON array from llm', async () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'I prefer TDD' });
    const llm = vi.fn().mockResolvedValue({ text: '[{"pattern":"TDD","kind":"preference"}]' });
    const out = await extractPatterns(db, llm, 10);
    expect(out).toEqual([{ pattern: 'TDD', kind: 'preference' }]);
  });

  it('returns empty array if llm output invalid JSON', async () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'noise' });
    const llm = vi.fn().mockResolvedValue({ text: 'not json' });
    const out = await extractPatterns(db, llm, 10);
    expect(out).toEqual([]);
  });

  it('strips ```json markdown fence before parsing', async () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'TDD' });
    const llm = vi
      .fn()
      .mockResolvedValue({ text: '```json\n[{"pattern":"TDD","kind":"preference"}]\n```' });
    const out = await extractPatterns(db, llm, 10);
    expect(out).toEqual([{ pattern: 'TDD', kind: 'preference' }]);
  });

  it('strips plain ``` fence', async () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'x' });
    const llm = vi.fn().mockResolvedValue({ text: '```\n[{"pattern":"p","kind":"fact"}]\n```' });
    expect(await extractPatterns(db, llm, 10)).toHaveLength(1);
  });

  it('returns empty when LLM returns non-array JSON', async () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'x' });
    const llm = vi.fn().mockResolvedValue({ text: '{"not":"array"}' });
    expect(await extractPatterns(db, llm, 10)).toEqual([]);
  });
});
