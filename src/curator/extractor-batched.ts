import type { Database } from 'better-sqlite3';
import { type Pattern, extractPatterns as extractFromCorpus } from './extractor.js';
import type { LlmAdapter } from './llm.js';

const CHUNK_CHARS = 4000;
const MAX_CHUNKS = 5;
const MAX_PER_SESSION = 10;
const DEDUP_JACCARD_THRESHOLD = 0.7;

type SessionRow = { session_id: string; content: string };

function stratifiedCorpus(db: Database): string[] {
  const rows = db
    .prepare(
      `SELECT session_id, content FROM (
         SELECT session_id, content, ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at DESC) AS rn
         FROM messages
       ) WHERE rn <= ?
       ORDER BY session_id, rn`,
    )
    .all(MAX_PER_SESSION) as SessionRow[];
  return rows.map((r) => `[${r.session_id}] ${r.content}`);
}

function chunkLines(lines: string[], chunkChars: number): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const line of lines) {
    if ((current + line).length > chunkChars && current) {
      chunks.push(current);
      current = '';
    }
    current += `${line}\n`;
  }
  if (current.trim()) chunks.push(current);
  return chunks.slice(0, MAX_CHUNKS);
}

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 3),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = new Set([...a].filter((x) => b.has(x))).size;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

function isDuplicate(a: Pattern, b: Pattern): boolean {
  if (a.kind !== b.kind) return false;
  return jaccard(tokens(a.pattern), tokens(b.pattern)) >= DEDUP_JACCARD_THRESHOLD;
}

function dedupePatterns(all: Pattern[]): Pattern[] {
  const out: Pattern[] = [];
  for (const p of all) {
    if (out.some((existing) => isDuplicate(existing, p))) continue;
    out.push(p);
  }
  return out;
}

async function extractChunk(llm: LlmAdapter, chunk: string): Promise<Pattern[]> {
  // Reuse existing extractor by passing chunk as if it were corpus.
  // Lightweight wrapper: temp DB not needed; call llm directly via adapter pattern.
  // For simplicity, build minimal in-memory invocation:
  const fakeDb = {
    prepare: () => ({ all: () => [{ content: chunk }] }),
  } as unknown as Database;
  return extractFromCorpus(fakeDb, llm, 1);
}

export async function extractPatternsBatched(db: Database, llm: LlmAdapter): Promise<Pattern[]> {
  const lines = stratifiedCorpus(db);
  if (lines.length === 0) return [];
  const chunks = chunkLines(lines, CHUNK_CHARS);
  const all: Pattern[] = [];
  for (const chunk of chunks) {
    const patterns = await extractChunk(llm, chunk);
    all.push(...patterns);
  }
  return dedupePatterns(all);
}
