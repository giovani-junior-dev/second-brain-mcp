import { z } from 'zod';

const nonBlank = (label: string) =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, `${label} must be non-empty`));

export const RecallInput = z.object({
  query: nonBlank('query'),
  scope: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const WriteInput = z.object({
  content: nonBlank('content'),
  type: nonBlank('type'),
  scope: z.string().optional(),
});

export const ListSkillsInput = z.object({
  scope: z.string().optional(),
});

export const SkillInvokeInput = z.object({
  name: nonBlank('name'),
});

export const SessionSearchInput = z.object({
  query: nonBlank('query'),
  limit: z.number().int().min(1).max(50).optional(),
});

export const RecallOutput = z.object({ content: z.string() });
export const WriteOutput = z.object({ id: z.number(), status: z.string() });
export const ListSkillsOutput = z.object({
  skills: z.array(z.object({ name: z.string(), description: z.string().nullable() })),
});
export const SkillInvokeOutput = z.object({ name: z.string(), content: z.string() });
export const SessionSearchOutput = z.object({ content: z.string() });

export type RecallInputType = z.infer<typeof RecallInput>;
export type WriteInputType = z.infer<typeof WriteInput>;
export type ListSkillsInputType = z.infer<typeof ListSkillsInput>;
export type SkillInvokeInputType = z.infer<typeof SkillInvokeInput>;
export type SessionSearchInputType = z.infer<typeof SessionSearchInput>;
