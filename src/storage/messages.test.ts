import type { Database } from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDb } from './db.js';
import { insertMessage, searchMessages } from './messages.js';
import { migrate } from './migrate.js';

let db: Database;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
});

describe('insertMessage', () => {
  it('persists message returning id', () => {
    const id = insertMessage(db, {
      sessionId: 's1',
      project: 'p1',
      role: 'user',
      content: 'hello',
    });
    expect(id).toBeGreaterThan(0);
  });
});

describe('searchMessages', () => {
  it('returns BM25 ranked matches', () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'sqlite migration' });
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'unrelated topic' });
    const rows = searchMessages(db, 'sqlite', 5);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.content).toContain('sqlite');
  });

  it('returns empty when no match', () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'foo' });
    expect(searchMessages(db, 'bar', 5)).toEqual([]);
  });

  it('respects limit', () => {
    for (let i = 0; i < 5; i++) {
      insertMessage(db, { sessionId: 's1', role: 'user', content: `item ${i}` });
    }
    expect(searchMessages(db, 'item', 2)).toHaveLength(2);
  });
});
