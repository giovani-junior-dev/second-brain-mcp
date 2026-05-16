import { describe, expect, it } from 'vitest';
import { openDb } from './db.js';
import { migrate } from './migrate.js';

const expectedTables = [
  'messages',
  'messages_fts',
  'messages_fts_trigram',
  'facts',
  'facts_fts',
  'skills',
  'curator_state',
];

function listTables(path: string): string[] {
  const db = openDb(path);
  migrate(db);
  const rows = db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table')").all() as {
    name: string;
  }[];
  db.close();
  return rows.map((r) => r.name);
}

describe('migrate', () => {
  it('creates all required tables', () => {
    const tables = listTables(':memory:');
    for (const t of expectedTables) {
      expect(tables).toContain(t);
    }
  });

  it('is idempotent', () => {
    const db = openDb(':memory:');
    migrate(db);
    expect(() => migrate(db)).not.toThrow();
    const count = (
      db.prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE name='facts'").get() as {
        c: number;
      }
    ).c;
    expect(count).toBe(1);
    db.close();
  });

  it('enables FTS5 trigram tokenizer on messages_fts_trigram', () => {
    const db = openDb(':memory:');
    migrate(db);
    db.prepare("INSERT INTO messages_fts_trigram(rowid, content) VALUES (1, 'hello world')").run();
    const row = db
      .prepare("SELECT rowid FROM messages_fts_trigram WHERE content MATCH 'hel'")
      .get() as { rowid: number } | undefined;
    expect(row?.rowid).toBe(1);
    db.close();
  });
});
