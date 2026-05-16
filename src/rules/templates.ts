export const MARKER_BEGIN = '<!-- BEGIN: brain-injection -->';
export const MARKER_END = '<!-- END: brain-injection -->';

export type Target = 'claude' | 'cursor' | 'codex';

const HEADERS: Record<Target, string> = {
  claude: '## second-brain-mcp injected context',
  cursor: '## brain context (agents)',
  codex: '## brain context (codex)',
};

export function defaultOutPath(target: Target): string {
  if (target === 'claude') return 'CLAUDE.md';
  if (target === 'cursor') return 'AGENTS.md';
  return '.codex/rules.md';
}

export function renderBlock(target: Target, facts: string[]): string {
  const header = HEADERS[target];
  const body = facts.length ? facts.map((f) => `- ${f}`).join('\n') : '- (no facts yet)';
  return `${MARKER_BEGIN}\n${header}\n\n${body}\n${MARKER_END}`;
}
