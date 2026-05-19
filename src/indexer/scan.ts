import { readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECTS_DIR = '.claude/projects';

export function scanJsonl(rootDir: string): string[] {
  const found: string[] = [];
  walk(rootDir, found);
  return found;
}

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = join(dir, name);
    let s: ReturnType<typeof statSync>;
    try {
      s = statSync(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) walk(full, out);
    else if (name.endsWith('.jsonl')) out.push(full);
  }
}

export function defaultProjectsRoot(): string {
  return join(homedir(), PROJECTS_DIR);
}
