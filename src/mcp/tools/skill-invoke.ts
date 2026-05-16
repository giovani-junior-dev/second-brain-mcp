import { readFileSync } from 'node:fs';
import type { Database } from 'better-sqlite3';
import { getSkillByName } from '../../storage/skills.js';
import { SkillInvokeInput } from '../schemas.js';

export function skillInvoke(db: Database, raw: unknown): { name: string; content: string } {
  const input = SkillInvokeInput.parse(raw);
  const row = getSkillByName(db, input.name);
  if (!row || row.archived === 1) {
    throw new Error(`skill not found: ${input.name}`);
  }
  const content = readFileSync(row.file_path, 'utf8');
  return { name: row.name, content };
}
