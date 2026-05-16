import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Database } from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openDb } from '../storage/db.js';
import { insertMessage } from '../storage/messages.js';
import { migrate } from '../storage/migrate.js';
import { runCurator } from './run.js';

let db: Database;
let dir: string;
const NOW = 1_700_000_000_000;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
  dir = mkdtempSync(join(tmpdir(), 'r-'));
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('runCurator', () => {
  it('returns summary with zero counts on empty DB', async () => {
    const llm = vi.fn();
    const out = await runCurator(db, llm, dir, NOW);
    expect(out.patterns).toBe(0);
    expect(out.promotedFacts).toBe(0);
  });

  it('persists last_run_at after run', async () => {
    const llm = vi.fn().mockResolvedValue({ text: '[]' });
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'noise' });
    await runCurator(db, llm, dir, NOW);
    const row = db.prepare("SELECT value FROM curator_state WHERE key='last_run_at'").get() as {
      value: string;
    };
    expect(row.value).toBe(String(NOW));
  });

  it('promotes pattern repeated across 3 sessions', async () => {
    for (const s of ['a', 'b', 'c']) {
      insertMessage(db, { sessionId: s, role: 'user', content: 'always TDD' });
    }
    const llm = vi.fn().mockResolvedValue({ text: '[{"pattern":"TDD","kind":"preference"}]' });
    const out = await runCurator(db, llm, dir, NOW);
    expect(out.promotedFacts).toBe(1);
  });

  it('generates skill from procedural pattern', async () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'run npm test' });
    const llm = vi
      .fn()
      .mockResolvedValue({ text: '[{"pattern":"run npm test","kind":"procedural"}]' });
    const out = await runCurator(db, llm, dir, NOW);
    expect(out.generatedSkills).toBe(1);
  });

  it('preference pattern does NOT generate skill', async () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'TDD' });
    const llm = vi.fn().mockResolvedValue({ text: '[{"pattern":"TDD","kind":"preference"}]' });
    const out = await runCurator(db, llm, dir, NOW);
    expect(out.generatedSkills).toBe(0);
  });

  it('fact pattern does NOT generate skill', async () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'sky blue' });
    const llm = vi.fn().mockResolvedValue({ text: '[{"pattern":"sky blue","kind":"fact"}]' });
    const out = await runCurator(db, llm, dir, NOW);
    expect(out.generatedSkills).toBe(0);
  });

  it('marks run even when zero patterns extracted', async () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'noise' });
    const llm = vi.fn().mockResolvedValue({ text: '[]' });
    await runCurator(db, llm, dir, NOW);
    const row = db.prepare("SELECT value FROM curator_state WHERE key='last_run_at'").get() as
      | { value: string }
      | undefined;
    expect(row?.value).toBe(String(NOW));
  });

  it('returns summary with exact counts per kind', async () => {
    for (const s of ['a', 'b', 'c']) {
      insertMessage(db, { sessionId: s, role: 'user', content: 'always TDD here' });
    }
    insertMessage(db, { sessionId: 'd', role: 'user', content: 'run lint hook' });
    const llm = vi.fn().mockResolvedValue({
      text: '[{"pattern":"TDD","kind":"preference"},{"pattern":"run lint hook","kind":"procedural"}]',
    });
    const out = await runCurator(db, llm, dir, NOW);
    expect(out.patterns).toBe(2);
    expect(out.promotedFacts).toBe(1);
    expect(out.generatedSkills).toBe(1);
  });

  it('stale facts counted in summary', async () => {
    const oldCreatedAt = NOW - 31 * 24 * 60 * 60 * 1000;
    db.prepare('INSERT INTO facts (scope, content, type, created_at) VALUES (?,?,?,?)').run(
      'global',
      'old fact',
      'note',
      oldCreatedAt,
    );
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'noise' });
    const llm = vi.fn().mockResolvedValue({ text: '[]' });
    const out = await runCurator(db, llm, dir, NOW);
    expect(out.staleFacts).toBe(1);
  });
});
