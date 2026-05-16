import type { Database } from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDb } from '../storage/db.js';
import { getFactById } from '../storage/facts.js';
import { migrate } from '../storage/migrate.js';
import { DAY_MS, STALE_DAYS } from './constants.js';
import { markStaleFacts } from './stale.js';

let db: Database;
const NOW = 1_700_000_000_000;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
});

function insertRaw(scope: string, content: string, createdAt: number): number {
  const info = db
    .prepare('INSERT INTO facts (scope, content, type, created_at) VALUES (?, ?, ?, ?)')
    .run(scope, content, 'note', createdAt);
  return Number(info.lastInsertRowid);
}

describe('markStaleFacts', () => {
  it('marks facts older than STALE_DAYS as stale type', () => {
    const id = insertRaw('global', 'old', NOW - (STALE_DAYS + 1) * DAY_MS);
    const n = markStaleFacts(db, NOW);
    expect(n).toBe(1);
    expect(getFactById(db, id)?.type).toBe('stale');
  });

  it('does not mark recent facts', () => {
    insertRaw('global', 'fresh', NOW - 1000);
    expect(markStaleFacts(db, NOW)).toBe(0);
  });

  it('never deletes', () => {
    const id = insertRaw('global', 'x', NOW - (STALE_DAYS + 2) * DAY_MS);
    markStaleFacts(db, NOW);
    expect(getFactById(db, id)).toBeDefined();
  });
});
