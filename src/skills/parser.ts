import { readFileSync } from 'node:fs';
import matter from 'gray-matter';
import { SkillFrontmatter, type SkillFrontmatterType } from './validator.js';

export type ParsedSkill = {
  meta: SkillFrontmatterType;
  body: string;
};

export function parseSkill(filePath: string): ParsedSkill {
  const raw = readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const meta = SkillFrontmatter.parse(parsed.data);
  return { meta, body: parsed.content.trim() };
}
