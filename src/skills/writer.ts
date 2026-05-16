import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import matter from 'gray-matter';
import { SkillFrontmatter, type SkillFrontmatterType } from './validator.js';

export function writeSkill(filePath: string, meta: SkillFrontmatterType, body: string): void {
  const validated = SkillFrontmatter.parse(meta);
  const out = matter.stringify(`${body.trim()}\n`, validated);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, out, 'utf8');
}
