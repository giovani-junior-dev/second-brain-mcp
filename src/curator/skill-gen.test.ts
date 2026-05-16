import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
// readFileSync used by new strength tests
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Database } from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDb } from '../storage/db.js';
import { migrate } from '../storage/migrate.js';
import { getSkillByName } from '../storage/skills.js';
import { generateSkill } from './skill-gen.js';

let db: Database;
let dir: string;

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db);
  dir = mkdtempSync(join(tmpdir(), 'skill-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('generateSkill', () => {
  it('writes SKILL.md and inserts row for procedural', () => {
    const id = generateSkill(
      db,
      { pattern: 'Run npm test before commit', kind: 'procedural' },
      dir,
    );
    expect(id).toBeGreaterThan(0);
    const row = getSkillByName(db, 'run-npm-test-before-commit');
    expect(row?.name).toBe('run-npm-test-before-commit');
    const body = readFileSync(row?.file_path ?? '', 'utf8');
    expect(body).toContain('---');
    expect(body).toContain('Run npm test before commit');
  });

  it('returns undefined for non-procedural', () => {
    const id = generateSkill(db, { pattern: 'likes dark mode', kind: 'preference' }, dir);
    expect(id).toBeUndefined();
  });

  it('returns undefined for fact kind', () => {
    expect(generateSkill(db, { pattern: 'sky is blue', kind: 'fact' }, dir)).toBeUndefined();
  });

  it('slugify lowercases mixed case', () => {
    generateSkill(db, { pattern: 'Run NPM Test Always', kind: 'procedural' }, dir);
    expect(getSkillByName(db, 'run-npm-test-always')).toBeDefined();
  });

  it('slugify collapses special chars and spaces to single hyphen', () => {
    generateSkill(db, { pattern: 'use   TDD!! @before  commit', kind: 'procedural' }, dir);
    expect(getSkillByName(db, 'use-tdd-before-commit')).toBeDefined();
  });

  it('slugify trims leading and trailing hyphens', () => {
    generateSkill(db, { pattern: '...weird input...', kind: 'procedural' }, dir);
    const row = getSkillByName(db, 'weird-input');
    expect(row).toBeDefined();
    expect(row?.name.startsWith('-')).toBe(false);
    expect(row?.name.endsWith('-')).toBe(false);
  });

  it('slugify truncates at 40 chars', () => {
    const long = 'a'.repeat(100);
    generateSkill(db, { pattern: long, kind: 'procedural' }, dir);
    const row = getSkillByName(db, 'a'.repeat(40));
    expect(row?.name.length).toBe(40);
  });

  it('SKILL.md body contains frontmatter with name and description', () => {
    generateSkill(db, { pattern: 'commit hook check', kind: 'procedural' }, dir);
    const row = getSkillByName(db, 'commit-hook-check');
    const body = readFileSync(row?.file_path ?? '', 'utf8');
    expect(body).toMatch(/^---\nname: commit-hook-check\ndescription: commit hook check\n---/);
  });

  it('SKILL.md body includes pattern in body section', () => {
    generateSkill(db, { pattern: 'unique-marker-xyz step', kind: 'procedural' }, dir);
    const row = getSkillByName(db, 'unique-marker-xyz-step');
    const body = readFileSync(row?.file_path ?? '', 'utf8');
    const bodyAfterFrontmatter = body.split('---').slice(2).join('---');
    expect(bodyAfterFrontmatter).toContain('unique-marker-xyz step');
  });

  it('inserts row with scope=global', () => {
    generateSkill(db, { pattern: 'scope test', kind: 'procedural' }, dir);
    expect(getSkillByName(db, 'scope-test')?.scope).toBe('global');
  });

  it('writes file to correct nested path', () => {
    generateSkill(db, { pattern: 'path test', kind: 'procedural' }, dir);
    const row = getSkillByName(db, 'path-test');
    expect(row?.file_path).toContain('path-test');
    expect(row?.file_path.endsWith('SKILL.md')).toBe(true);
  });

  it('is idempotent: second call with same pattern returns undefined', () => {
    const first = generateSkill(db, { pattern: 'idempotent test', kind: 'procedural' }, dir);
    expect(first).toBeDefined();
    const second = generateSkill(db, { pattern: 'idempotent test', kind: 'procedural' }, dir);
    expect(second).toBeUndefined();
  });

  it('returns undefined when pattern has no slugifiable chars', () => {
    expect(generateSkill(db, { pattern: '!!!@@@###', kind: 'procedural' }, dir)).toBeUndefined();
  });
});
