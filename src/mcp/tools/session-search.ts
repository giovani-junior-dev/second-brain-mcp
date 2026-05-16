import type { Database } from 'better-sqlite3';
import { FTS_LIMIT_DEFAULT } from '../../storage/constants.js';
import { searchMessages } from '../../storage/messages.js';
import { wrapBrainContext } from '../sanitize.js';
import { SessionSearchInput } from '../schemas.js';

export function sessionSearch(db: Database, raw: unknown): { content: string } {
  const input = SessionSearchInput.parse(raw);
  const safe = `"${input.query.replace(/"/g, '""')}"`;
  const rows = searchMessages(db, safe, input.limit ?? FTS_LIMIT_DEFAULT);
  return { content: wrapBrainContext(rows.map((r) => r.content)) };
}
