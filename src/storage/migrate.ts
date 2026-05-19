import type { Database } from 'better-sqlite3';
import { SCHEMA_DDL } from './schema.js';

function hasColumn(db: Database, table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.some((r) => r.name === column);
}

function ensureContentHashColumn(db: Database): void {
  if (!hasColumn(db, 'messages', 'content_hash')) {
    db.exec('ALTER TABLE messages ADD COLUMN content_hash TEXT');
  }
}

export function migrate(db: Database): void {
  db.exec(SCHEMA_DDL);
  ensureContentHashColumn(db);
  db.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_content_hash ON messages(content_hash) WHERE content_hash IS NOT NULL',
  );
}
