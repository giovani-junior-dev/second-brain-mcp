import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SKILL_FILENAME = 'SKILL.md';

function walk(root: string, found: string[]): void {
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, found);
    } else if (entry === SKILL_FILENAME) {
      found.push(full);
    }
  }
}

export function discoverSkills(rootDir: string): string[] {
  if (!existsSync(rootDir)) return [];
  const out: string[] = [];
  walk(rootDir, out);
  return out;
}
