import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export type LogEntry = {
  ts: string;
  tool: string;
  input: unknown;
  ok: boolean;
  error?: string;
};

export function createLogger(logPath: string): (entry: LogEntry) => void {
  if (!existsSync(dirname(logPath))) mkdirSync(dirname(logPath), { recursive: true });
  return (entry) => {
    try {
      appendFileSync(logPath, `${JSON.stringify(entry)}\n`, 'utf8');
    } catch {
      // never break tool on log failure
    }
  };
}
