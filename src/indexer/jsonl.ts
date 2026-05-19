import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

export type IndexedMessage = {
  sessionId: string;
  uuid: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  project: string;
};

const KEEP_ROLES = new Set(['user', 'assistant']);

function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter(
      (p): p is { type: string; text: string } =>
        p && p.type === 'text' && typeof p.text === 'string',
    )
    .map((p) => p.text)
    .join('\n')
    .trim();
}

function projectFromCwd(cwd: unknown): string {
  if (typeof cwd !== 'string' || !cwd) return 'unknown';
  return basename(cwd.replace(/\\/g, '/'));
}

function parseLine(line: string): IndexedMessage | null {
  try {
    const o = JSON.parse(line) as Record<string, unknown>;
    const type = o.type as string;
    if (!KEEP_ROLES.has(type)) return null;
    const msg = (o.message ?? {}) as Record<string, unknown>;
    const text = extractText(msg.content);
    if (!text.trim()) return null;
    return {
      sessionId: String(o.sessionId ?? ''),
      uuid: String(o.uuid ?? ''),
      role: type as 'user' | 'assistant',
      content: text,
      timestamp: String(o.timestamp ?? ''),
      project: projectFromCwd(o.cwd),
    };
  } catch {
    return null;
  }
}

export function parseJsonl(path: string): IndexedMessage[] {
  const raw = readFileSync(path, 'utf8');
  const out: IndexedMessage[] = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const parsed = parseLine(line);
    if (parsed) out.push(parsed);
  }
  return out;
}
