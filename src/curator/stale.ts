import type { Database } from 'better-sqlite3';
import { DAY_MS, STALE_DAYS } from './constants.js';

const STALE_TYPE = 'stale';

export function markStaleFacts(db: Database, now: number): number {
  const cutoff = now - STALE_DAYS * DAY_MS;
  const info = db
    .prepare(
      'UPDATE facts SET type = ? WHERE archived = 0 AND type != ? AND COALESCE(last_used_at, created_at) < ?',
    )
    .run(STALE_TYPE, STALE_TYPE, cutoff);
  return info.changes;
}
