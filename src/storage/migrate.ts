import type { Database } from 'better-sqlite3';
import { SCHEMA_DDL } from './schema.js';

export function migrate(db: Database): void {
  db.exec(SCHEMA_DDL);
}
