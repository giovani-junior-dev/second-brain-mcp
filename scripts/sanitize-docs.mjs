import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const files = [
  'docs/goals/2026-05-15-add-cli.md',
  'docs/goals/2026-05-15-add-curator.md',
  'docs/goals/2026-05-15-add-mcp-tools.md',
  'docs/goals/2026-05-15-add-rules-generator.md',
  'docs/goals/2026-05-15-add-skills-format.md',
  'docs/goals/2026-05-15-add-storage-layer.md',
  'docs/goals/2026-05-15-bootstrap-second-brain-mcp.md',
  'docs/goals/2026-05-15-polish-v0-1-release.md',
  'docs/goals/README.md',
];

let changed = 0;
for (const f of files) {
  const before = readFileSync(f, 'utf8');
  const after = before
    .replaceAll('C:/Users/Script7/Desktop/second-brain-mcp/', '<repo>/')
    .replaceAll('C:\\Users\\Script7\\Desktop\\second-brain-mcp\\', '<repo>\\')
    .replaceAll('Script7', '<user>');
  if (after !== before) {
    writeFileSync(f, after, 'utf8');
    changed++;
    console.log(`  sanitized: ${f}`);
  }
}
console.log(`${changed} files sanitized`);
