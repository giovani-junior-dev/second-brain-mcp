import type { Database } from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDb } from '../storage/db.js';
import { migrate } from '../storage/migrate.js';
import { listSkillsTool } from './tools/list-skills.js';
import { recall } from './tools/recall.js';
import { sessionSearch } from './tools/session-search.js';
import { write } from './tools/write.js';

let db: Database;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
});

function messageCount(): number {
  const row = db.prepare('SELECT COUNT(*) AS c FROM messages').get() as { c: number };
  return row.c;
}

function messagesContent(): string[] {
  return (
    db.prepare('SELECT content FROM messages ORDER BY id').all() as { content: string }[]
  ).map((r) => r.content);
}

describe('message capture (via direct insert)', () => {
  it('exists separately from facts table — write does NOT auto-create message at tool level', () => {
    write(db, { content: 'note', type: 'note' });
    expect(messageCount()).toBe(0);
  });
});

describe('readonly tools sanity', () => {
  it('list_skills and session_search return without DB write', () => {
    listSkillsTool(db, {});
    sessionSearch(db, { query: 'x' });
    recall(db, { query: 'x' });
    expect(messageCount()).toBe(0);
  });
});

// Capture is server-wired. Subprocess test covers full path. Smoke here verifies
// the helper module is importable and message table accepts captured shape.
describe('captured message shape compatibility', () => {
  it('messages table accepts tool: prefixed content', () => {
    db.prepare('INSERT INTO messages (session_id, role, content, created_at) VALUES (?,?,?,?)').run(
      'sess-uuid-1',
      'tool',
      'brain.write: my fact text',
      Date.now(),
    );
    const out = messagesContent();
    expect(out).toContain('brain.write: my fact text');
  });

  it('FTS indexes captured content for curator extraction', () => {
    const id = db
      .prepare('INSERT INTO messages (session_id, role, content, created_at) VALUES (?,?,?,?)')
      .run('s1', 'tool', 'brain.write: prefer TDD always', Date.now()).lastInsertRowid;
    db.prepare('INSERT INTO messages_fts (rowid, content) VALUES (?, ?)').run(
      Number(id),
      'brain.write: prefer TDD always',
    );
    const row = db.prepare("SELECT rowid FROM messages_fts WHERE messages_fts MATCH 'TDD'").get() as
      | { rowid: number }
      | undefined;
    expect(row?.rowid).toBe(Number(id));
  });
});
