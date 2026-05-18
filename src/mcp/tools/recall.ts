import type { Database } from 'better-sqlite3';
import { FTS_LIMIT_DEFAULT } from '../../storage/constants.js';
import { searchFacts, searchFactsInScope } from '../../storage/facts.js';
import { wrapBrainContext } from '../sanitize.js';
import { RecallInput, type RecallInputType } from '../schemas.js';

export function recall(db: Database, raw: unknown): { content: string } {
  const input: RecallInputType = RecallInput.parse(raw);
  const limit = input.limit ?? FTS_LIMIT_DEFAULT;
  const safeQuery = `"${input.query.replace(/"/g, '""')}"`;
  const rows = input.scope
    ? searchFactsInScope(db, safeQuery, input.scope, limit)
    : searchFacts(db, safeQuery, limit);
  return { content: wrapBrainContext(rows.map((r) => r.content)) };
}
