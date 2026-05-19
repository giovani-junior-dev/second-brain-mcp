import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Database } from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDb } from '../storage/db.js';
import { migrate } from '../storage/migrate.js';
import { runIndexer } from './index-runner.js';

let db: Database;
let root: string;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
  root = mkdtempSync(join(tmpdir(), 'runner-'));
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

function writeSession(project: string, sessionId: string, messages: unknown[]): void {
  const dir = join(root, project);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${sessionId}.jsonl`);
  writeFileSync(path, messages.map((m) => JSON.stringify(m)).join('\n'), 'utf8');
}

function userMsg(sessionId: string, uuid: string, text: string, cwd: string): unknown {
  return {
    type: 'user',
    sessionId,
    uuid,
    message: { content: text },
    timestamp: '2026-05-01T00:00:00Z',
    cwd,
  };
}

describe('runIndexer', () => {
  it('indexes messages from all sessions', () => {
    writeSession('p1', 's1', [
      userMsg('s1', 'u1', 'hello', 'C:/proj/p1'),
      userMsg('s1', 'u2', 'world', 'C:/proj/p1'),
    ]);
    const r = runIndexer(db, root);
    expect(r.messagesIndexed).toBe(2);
    expect(r.sessionsProcessed).toBe(1);
    expect(r.projectsIndexed).toEqual(['p1']);
  });

  it('dedups by hash on rerun', () => {
    writeSession('p1', 's1', [userMsg('s1', 'u1', 'hi', 'C:/proj/p1')]);
    runIndexer(db, root);
    const second = runIndexer(db, root);
    expect(second.messagesIndexed).toBe(0);
  });

  it('filters by project list', () => {
    writeSession('p1', 's1', [userMsg('s1', 'u1', 'a', 'C:/proj/p1')]);
    writeSession('p2', 's2', [userMsg('s2', 'u2', 'b', 'C:/proj/p2')]);
    const r = runIndexer(db, root, { projects: ['p1'] });
    expect(r.messagesIndexed).toBe(1);
    expect(r.projectsIndexed).toEqual(['p1']);
  });

  it('filters by since timestamp', () => {
    writeSession('p1', 's1', [
      {
        type: 'user',
        sessionId: 's1',
        uuid: 'u1',
        message: { content: 'old' },
        timestamp: '2025-01-01T00:00:00Z',
        cwd: 'C:/proj/p1',
      },
      {
        type: 'user',
        sessionId: 's1',
        uuid: 'u2',
        message: { content: 'new' },
        timestamp: '2026-06-01T00:00:00Z',
        cwd: 'C:/proj/p1',
      },
    ]);
    const since = Date.parse('2026-01-01T00:00:00Z');
    const r = runIndexer(db, root, { since });
    expect(r.messagesIndexed).toBe(1);
  });

  it('populates messages_fts for BM25 search', () => {
    writeSession('p1', 's1', [userMsg('s1', 'u1', 'unique marker xyz', 'C:/proj/p1')]);
    runIndexer(db, root);
    const row = db.prepare("SELECT rowid FROM messages_fts WHERE messages_fts MATCH 'xyz'").get() as
      | { rowid: number }
      | undefined;
    expect(row).toBeDefined();
  });
});
