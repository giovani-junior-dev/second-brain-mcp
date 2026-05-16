import type { Database } from 'better-sqlite3';
import { insertFact } from '../../storage/facts.js';
import { WriteInput, type WriteInputType } from '../schemas.js';

const DEFAULT_SCOPE = 'global';

export function write(db: Database, raw: unknown): { id: number; status: string } {
  const input: WriteInputType = WriteInput.parse(raw);
  const id = insertFact(db, {
    scope: input.scope ?? DEFAULT_SCOPE,
    content: input.content,
    type: input.type,
  });
  return { id, status: 'ok' };
}
