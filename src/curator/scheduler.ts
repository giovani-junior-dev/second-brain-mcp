import type { Database } from 'better-sqlite3';
import { CURATOR_INTERVAL_HOURS, HOUR_MS, IDLE_THRESHOLD_HOURS } from './constants.js';

const LAST_RUN_KEY = 'last_run_at';
const PAUSED_KEY = 'paused';

function getState(db: Database, key: string): string | undefined {
  const row = db.prepare('SELECT value FROM curator_state WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value;
}

function setState(db: Database, key: string, value: string): void {
  db.prepare(
    'INSERT INTO curator_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  ).run(key, value);
}

function lastActivity(db: Database): number {
  const row = db.prepare('SELECT MAX(created_at) AS m FROM messages').get() as { m: number | null };
  return row.m ?? 0;
}

export function shouldRun(db: Database, now: number): boolean {
  if (getState(db, PAUSED_KEY) === '1') return false;
  const idle = now - lastActivity(db);
  if (idle < IDLE_THRESHOLD_HOURS * HOUR_MS) return false;
  const lastRun = Number(getState(db, LAST_RUN_KEY) ?? '0');
  return now - lastRun >= CURATOR_INTERVAL_HOURS * HOUR_MS;
}

export function markRun(db: Database, now: number): void {
  setState(db, LAST_RUN_KEY, String(now));
}

export function pause(db: Database): void {
  setState(db, PAUSED_KEY, '1');
}

export function resume(db: Database): void {
  setState(db, PAUSED_KEY, '0');
}
