import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { MARKER_BEGIN, MARKER_END } from './templates.js';

export class RulesError extends Error {}

function ensureDirExists(filePath: string): void {
  if (!existsSync(dirname(filePath))) {
    throw new RulesError(`destination directory does not exist: ${dirname(filePath)}`);
  }
}

function replaceBetweenMarkers(text: string, block: string): string {
  const start = text.indexOf(MARKER_BEGIN);
  const end = text.indexOf(MARKER_END);
  if (start === -1 || end === -1) return `${text.trimEnd()}\n\n${block}\n`;
  return `${text.slice(0, start)}${block}${text.slice(end + MARKER_END.length)}`;
}

export function applyBlock(filePath: string, block: string): void {
  ensureDirExists(filePath);
  if (!existsSync(filePath)) {
    writeFileSync(filePath, `${block}\n`, 'utf8');
    return;
  }
  const existing = readFileSync(filePath, 'utf8');
  writeFileSync(filePath, replaceBetweenMarkers(existing, block), 'utf8');
}
