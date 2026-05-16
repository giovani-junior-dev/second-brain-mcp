import type { Database } from 'better-sqlite3';
import { type SkillRow, archiveSkill, listSkills } from '../storage/skills.js';

const SIMILARITY_THRESHOLD = 0.85;

function tokens(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/\s+/).filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = new Set([...a].filter((x) => b.has(x))).size;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

function isDuplicate(a: SkillRow, b: SkillRow): boolean {
  const desc = jaccard(tokens(a.description ?? ''), tokens(b.description ?? ''));
  return desc >= SIMILARITY_THRESHOLD;
}

export function consolidateSkills(db: Database, scope: string): number[] {
  const skills = listSkills(db, scope);
  const archived: number[] = [];
  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      const a = skills[i];
      const b = skills[j];
      if (!a || !b) continue;
      if (!isDuplicate(a, b)) continue;
      archiveSkill(db, b.id);
      archived.push(b.id);
    }
  }
  return archived;
}
