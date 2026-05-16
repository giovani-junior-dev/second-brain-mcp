import type { Database } from 'better-sqlite3';
import type { LlmAdapter } from './llm.js';

const SYSTEM_PROMPT =
  'You extract recurring patterns from session messages. Reply JSON array of objects {pattern, kind}. kind in {preference,procedural,fact}.';

export type Pattern = {
  pattern: string;
  kind: 'preference' | 'procedural' | 'fact';
};

const MAX_SESSIONS_CHARS = 8000;

function recentMessages(db: Database, limit: number): string {
  const rows = db
    .prepare('SELECT content FROM messages ORDER BY created_at DESC LIMIT ?')
    .all(limit) as { content: string }[];
  return rows
    .map((r) => r.content)
    .join('\n')
    .slice(0, MAX_SESSIONS_CHARS);
}

function stripFence(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/);
  if (fence) return fence[1] ?? '';
  return trimmed;
}

export async function extractPatterns(
  db: Database,
  llm: LlmAdapter,
  msgLimit: number,
): Promise<Pattern[]> {
  const corpus = recentMessages(db, msgLimit);
  if (!corpus) return [];
  const res = await llm({ system: SYSTEM_PROMPT, user: corpus });
  try {
    const parsed = JSON.parse(stripFence(res.text));
    return Array.isArray(parsed) ? (parsed as Pattern[]) : [];
  } catch {
    return [];
  }
}
