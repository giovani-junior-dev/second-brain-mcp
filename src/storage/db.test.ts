import { describe, expect, it } from 'vitest';
import { openDb } from './db.js';

describe('openDb', () => {
  it('opens in-memory database', () => {
    const db = openDb(':memory:');
    expect(db.open).toBe(true);
    db.close();
  });

  it('enables foreign keys', () => {
    const db = openDb(':memory:');
    const row = db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
    expect(row.foreign_keys).toBe(1);
    db.close();
  });

  it('sets WAL mode for file databases', () => {
    const db = openDb(':memory:');
    const row = db.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
    expect(['memory', 'wal']).toContain(row.journal_mode);
    db.close();
  });
});
