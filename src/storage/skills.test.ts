import type { Database } from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDb } from './db.js';
import { migrate } from './migrate.js';
import { archiveSkill, getSkillByName, insertSkill, listSkills } from './skills.js';

let db: Database;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
});

describe('insertSkill', () => {
  it('persists skill, returns id', () => {
    const id = insertSkill(db, {
      name: 'tdd',
      description: 'red-green-refactor',
      filePath: 'skills/tdd/SKILL.md',
      scope: 'global',
    });
    expect(id).toBeGreaterThan(0);
  });

  it('enforces unique name', () => {
    insertSkill(db, { name: 'dup', filePath: 'a', scope: 'global' });
    expect(() => insertSkill(db, { name: 'dup', filePath: 'b', scope: 'global' })).toThrow();
  });
});

describe('getSkillByName', () => {
  it('returns skill row', () => {
    insertSkill(db, { name: 'x', filePath: 'p', scope: 'global' });
    expect(getSkillByName(db, 'x')?.name).toBe('x');
  });

  it('returns undefined when missing', () => {
    expect(getSkillByName(db, 'nope')).toBeUndefined();
  });
});

describe('listSkills', () => {
  it('filters by scope, excludes archived', () => {
    insertSkill(db, { name: 'a', filePath: 'a', scope: 'global' });
    insertSkill(db, { name: 'b', filePath: 'b', scope: 'project:x' });
    const archivedId = insertSkill(db, { name: 'c', filePath: 'c', scope: 'global' });
    archiveSkill(db, archivedId);
    const rows = listSkills(db, 'global');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe('a');
  });
});

describe('archiveSkill', () => {
  it('sets archived=1', () => {
    const id = insertSkill(db, { name: 'a', filePath: 'a', scope: 'global' });
    archiveSkill(db, id);
    expect(getSkillByName(db, 'a')?.archived).toBe(1);
  });
});
