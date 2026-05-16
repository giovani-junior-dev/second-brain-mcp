import Database, { type Database as DatabaseType } from 'better-sqlite3';

export function openDb(path: string): DatabaseType {
  const db = new Database(path);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  return db;
}
