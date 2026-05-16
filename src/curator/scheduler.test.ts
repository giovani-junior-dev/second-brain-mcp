import type { Database } from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDb } from '../storage/db.js';
import { insertMessage } from '../storage/messages.js';
import { migrate } from '../storage/migrate.js';
import { CURATOR_INTERVAL_HOURS, HOUR_MS, IDLE_THRESHOLD_HOURS } from './constants.js';
import { markRun, pause, resume, shouldRun } from './scheduler.js';

let db: Database;
const NOW = 1_000_000_000_000;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
});

describe('shouldRun', () => {
  it('false when activity too recent', () => {
    db.prepare('INSERT INTO messages (session_id, role, content, created_at) VALUES (?,?,?,?)').run(
      's1',
      'user',
      'x',
      NOW - HOUR_MS,
    );
    expect(shouldRun(db, NOW)).toBe(false);
  });

  it('true when idle past threshold and never ran', () => {
    db.prepare('INSERT INTO messages (session_id, role, content, created_at) VALUES (?,?,?,?)').run(
      's1',
      'user',
      'x',
      NOW - (IDLE_THRESHOLD_HOURS + 1) * HOUR_MS,
    );
    expect(shouldRun(db, NOW)).toBe(true);
  });

  it('false when ran within interval', () => {
    insertMessage(db, { sessionId: 's1', role: 'user', content: 'x' });
    markRun(db, NOW - (CURATOR_INTERVAL_HOURS - 1) * HOUR_MS);
    expect(shouldRun(db, NOW)).toBe(false);
  });

  it('respects paused flag', () => {
    db.prepare('INSERT INTO messages (session_id, role, content, created_at) VALUES (?,?,?,?)').run(
      's1',
      'user',
      'x',
      NOW - 10 * HOUR_MS,
    );
    pause(db);
    expect(shouldRun(db, NOW)).toBe(false);
    resume(db);
    expect(shouldRun(db, NOW)).toBe(true);
  });
});
