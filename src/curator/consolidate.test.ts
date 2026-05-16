import type { Database } from 'better-sqlite3';
import { beforeEach, describe, expect, it } from 'vitest';
import { openDb } from '../storage/db.js';
import { migrate } from '../storage/migrate.js';
import { getSkillByName, insertSkill, listSkills } from '../storage/skills.js';
import { consolidateSkills } from './consolidate.js';

let db: Database;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
});

describe('consolidateSkills', () => {
  it('archives near-duplicate skills by description similarity', () => {
    insertSkill(db, {
      name: 'a',
      description: 'run tdd cycle red green refactor',
      filePath: 'a',
      scope: 'global',
    });
    insertSkill(db, {
      name: 'b',
      description: 'run tdd cycle red green refactor',
      filePath: 'b',
      scope: 'global',
    });
    const archived = consolidateSkills(db, 'global');
    expect(archived).toHaveLength(1);
    expect(listSkills(db, 'global')).toHaveLength(1);
  });

  it('keeps dissimilar skills', () => {
    insertSkill(db, { name: 'a', description: 'tdd cycle', filePath: 'a', scope: 'global' });
    insertSkill(db, {
      name: 'b',
      description: 'database migration tool',
      filePath: 'b',
      scope: 'global',
    });
    expect(consolidateSkills(db, 'global')).toEqual([]);
  });

  it('never deletes, only archives', () => {
    insertSkill(db, { name: 'a', description: 'same words', filePath: 'a', scope: 'global' });
    insertSkill(db, { name: 'b', description: 'same words', filePath: 'b', scope: 'global' });
    consolidateSkills(db, 'global');
    expect(getSkillByName(db, 'b')?.archived).toBe(1);
  });
});
