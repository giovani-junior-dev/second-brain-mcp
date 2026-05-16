import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { discoverSkills } from './discovery.js';
import { parseSkill } from './parser.js';
import { SkillFrontmatter } from './validator.js';
import { writeSkill } from './writer.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'sk-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('parseSkill', () => {
  it('parses frontmatter and body', () => {
    const path = join(dir, 'SKILL.md');
    writeFileSync(path, '---\nname: tdd\ndescription: red-green-refactor\n---\n\nbody text');
    const out = parseSkill(path);
    expect(out.meta.name).toBe('tdd');
    expect(out.body).toBe('body text');
  });

  it('throws when missing required fields', () => {
    const path = join(dir, 'SKILL.md');
    writeFileSync(path, '---\nname: x\n---\nbody');
    expect(() => parseSkill(path)).toThrow();
  });
});

describe('writeSkill', () => {
  it('round-trips parse→write→parse identical', () => {
    const path = join(dir, 'a', 'SKILL.md');
    const meta = { name: 'tdd', description: 'red green refactor', tags: ['testing'] };
    writeSkill(path, meta, 'body content');
    const parsed = parseSkill(path);
    expect(parsed.meta.name).toBe('tdd');
    expect(parsed.meta.tags).toEqual(['testing']);
    expect(parsed.body).toBe('body content');
  });

  it('output matches snapshot', () => {
    const path = join(dir, 'b', 'SKILL.md');
    writeSkill(path, { name: 'x', description: 'd' }, 'hello');
    const parsed = parseSkill(path);
    expect({ meta: parsed.meta, body: parsed.body }).toMatchInlineSnapshot(`
      {
        "body": "hello",
        "meta": {
          "description": "d",
          "name": "x",
        },
      }
    `);
  });

  it('rejects invalid meta', () => {
    expect(() =>
      writeSkill(join(dir, 'x', 'SKILL.md'), { name: '', description: 'd' } as never, 'b'),
    ).toThrow();
  });
});

describe('discoverSkills', () => {
  it('finds SKILL.md recursive', () => {
    mkdirSync(join(dir, 'one'));
    mkdirSync(join(dir, 'two'));
    writeFileSync(join(dir, 'one', 'SKILL.md'), '---\nname: o\ndescription: d\n---\nb');
    writeFileSync(join(dir, 'two', 'SKILL.md'), '---\nname: t\ndescription: d\n---\nb');
    expect(discoverSkills(dir)).toHaveLength(2);
  });

  it('returns empty when dir missing', () => {
    expect(discoverSkills(join(dir, 'nope'))).toEqual([]);
  });
});

describe('SkillFrontmatter schema', () => {
  it('rejects empty description', () => {
    expect(() => SkillFrontmatter.parse({ name: 'a', description: '' })).toThrow();
  });
  it('accepts optional fields', () => {
    expect(SkillFrontmatter.parse({ name: 'a', description: 'd', version: '1.0' }).version).toBe(
      '1.0',
    );
  });
});
