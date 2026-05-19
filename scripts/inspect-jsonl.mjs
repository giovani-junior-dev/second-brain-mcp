import { readFileSync } from 'node:fs';
const path = process.argv[2];
const target = process.argv[3] ?? 'user';
const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
for (const l of lines) {
  try {
    const o = JSON.parse(l);
    if (o.type === target) {
      console.log(JSON.stringify(o, null, 2).slice(0, 1500));
      console.log('---');
      break;
    }
  } catch {}
}
