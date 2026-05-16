import type { Database } from 'better-sqlite3';
import { listSkills } from '../../storage/skills.js';
import { ListSkillsInput } from '../schemas.js';

const DEFAULT_SCOPE = 'global';

export function listSkillsTool(
  db: Database,
  raw: unknown,
): { skills: { name: string; description: string | null }[] } {
  const input = ListSkillsInput.parse(raw);
  const rows = listSkills(db, input.scope ?? DEFAULT_SCOPE);
  return { skills: rows.map((r) => ({ name: r.name, description: r.description })) };
}
