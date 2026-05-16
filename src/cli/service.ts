import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import type { Database } from 'better-sqlite3';
import { openDb } from '../storage/db.js';
import { listFacts } from '../storage/facts.js';
import { migrate } from '../storage/migrate.js';
import { listSkills } from '../storage/skills.js';
import { BRAIN_DIR, CONFIG_FILE, DB_FILE, DEFAULT_CONFIG, SKILLS_DIR } from './paths.js';

export type InitResult = {
  created: boolean;
  dbPath: string;
};

export function initBrain(): InitResult {
  const created = !existsSync(BRAIN_DIR);
  mkdirSync(BRAIN_DIR, { recursive: true });
  mkdirSync(SKILLS_DIR, { recursive: true });
  if (!existsSync(CONFIG_FILE)) writeFileSync(CONFIG_FILE, DEFAULT_CONFIG, 'utf8');
  const db = openDb(DB_FILE);
  migrate(db);
  db.close();
  return { created, dbPath: DB_FILE };
}

export type Status = {
  dbPath: string;
  factCount: number;
  skillCount: number;
  lastCuratorRun: string | null;
};

export function status(db: Database): Status {
  const facts = listFacts(db, 'global').length;
  const skills = listSkills(db, 'global').length;
  const row = db.prepare("SELECT value FROM curator_state WHERE key='last_run_at'").get() as
    | { value: string }
    | undefined;
  return {
    dbPath: DB_FILE,
    factCount: facts,
    skillCount: skills,
    lastCuratorRun: row?.value ?? null,
  };
}

export function exportScope(db: Database, scope: string): string {
  const facts = listFacts(db, scope);
  const skills = listSkills(db, scope);
  return JSON.stringify({ scope, facts, skills }, null, 2);
}
