import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bin = resolve(__dirname, '..', 'node_modules', '@biomejs', 'biome', 'bin', 'biome');
const r = spawnSync(process.execPath, [bin, 'check', 'src'], { stdio: 'inherit' });
process.exit(r.status ?? 1);
