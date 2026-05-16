import type { Database } from 'better-sqlite3';

export type SkillInput = {
  name: string;
  description?: string;
  filePath: string;
  scope: string;
};

export type SkillRow = {
  id: number;
  name: string;
  description: string | null;
  file_path: string;
  scope: string;
  use_count: number;
  last_used_at: number | null;
  pinned: number;
  archived: number;
  created_at: number;
};

export function insertSkill(db: Database, skill: SkillInput): number {
  const now = Date.now();
  const stmt = db.prepare(
    'INSERT INTO skills (name, description, file_path, scope, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  const info = stmt.run(skill.name, skill.description ?? null, skill.filePath, skill.scope, now);
  return Number(info.lastInsertRowid);
}

export function getSkillByName(db: Database, name: string): SkillRow | undefined {
  return db.prepare('SELECT * FROM skills WHERE name = ?').get(name) as SkillRow | undefined;
}

export function listSkills(db: Database, scope: string): SkillRow[] {
  return db
    .prepare('SELECT * FROM skills WHERE scope = ? AND archived = 0 ORDER BY name ASC')
    .all(scope) as SkillRow[];
}

export function archiveSkill(db: Database, id: number): void {
  db.prepare('UPDATE skills SET archived = 1 WHERE id = ?').run(id);
}
