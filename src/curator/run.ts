import type { Database } from 'better-sqlite3';
import { consolidateSkills } from './consolidate.js';
import { extractPatternsBatched } from './extractor-batched.js';
import type { Pattern } from './extractor.js';
import type { LlmAdapter } from './llm.js';
import { promotePatterns } from './promote.js';
import { markRun } from './scheduler.js';
import { generateSkill } from './skill-gen.js';
import { markStaleFacts } from './stale.js';

const GLOBAL_SCOPE = 'global';

export type RunSummary = {
  patterns: number;
  promotedFacts: number;
  generatedSkills: number;
  consolidatedSkills: number;
  staleFacts: number;
};

export async function runCurator(
  db: Database,
  llm: LlmAdapter,
  skillsDir: string,
  now: number,
): Promise<RunSummary> {
  const patterns: Pattern[] = await extractPatternsBatched(db, llm);
  const promoted = promotePatterns(db, patterns);
  const generated = patterns
    .filter((p) => p.kind === 'procedural')
    .map((p) => generateSkill(db, p, skillsDir))
    .filter((x): x is number => x !== undefined);
  const consolidated = consolidateSkills(db, GLOBAL_SCOPE);
  const stale = markStaleFacts(db, now);
  markRun(db, now);
  return {
    patterns: patterns.length,
    promotedFacts: promoted.length,
    generatedSkills: generated.length,
    consolidatedSkills: consolidated.length,
    staleFacts: stale,
  };
}
