import { z } from 'zod';

export const SkillFrontmatter = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
  scope: z.string().optional(),
});

export type SkillFrontmatterType = z.infer<typeof SkillFrontmatter>;
