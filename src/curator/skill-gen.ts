import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Database } from 'better-sqlite3';
import { getSkillByName, insertSkill } from '../storage/skills.js';
import type { Pattern } from './extractor.js';

const GLOBAL_SCOPE = 'global';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function skillBody(pattern: Pattern): string {
  return `---\nname: ${slugify(pattern.pattern)}\ndescription: ${pattern.pattern}\n---\n\n${pattern.pattern}\n`;
}

export function generateSkill(
  db: Database,
  pattern: Pattern,
  skillsDir: string,
): number | undefined {
  if (pattern.kind !== 'procedural') return undefined;
  const slug = slugify(pattern.pattern);
  if (!slug) return undefined;
  const existing = getSkillByName(db, slug);
  if (existing) return undefined;
  const filePath = join(skillsDir, slug, 'SKILL.md');
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, skillBody(pattern), 'utf8');
  return insertSkill(db, {
    name: slug,
    description: pattern.pattern,
    filePath,
    scope: GLOBAL_SCOPE,
  });
}
