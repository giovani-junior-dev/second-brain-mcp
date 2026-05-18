# Goal Plan — bootstrap-second-brain-mcp (F1)

## 1. Contexto
- Repo: `<repo>/`
- Stack: TypeScript + Node 20 + MCP SDK + better-sqlite3
- Estado atual: dir vazio com `docs/` (PRD + ADRs + goals)
- Comando teste: `npm test` (Vitest, criar em F1)
- Comando build: `npm run build` (tsup)
- Comando lint: `npm run lint` (Biome)
- Comando typecheck: `npm run typecheck` (tsc --noEmit)

## 2. Estado final mensurável
- `package.json` com scripts: `build`, `test`, `lint`, `typecheck`, `start`
- `tsconfig.json` strict mode, `target: ES2022`, `module: ESNext`
- `biome.json` config
- `vitest.config.ts` config + 1 smoke test passando
- `src/index.ts` exporta versão (placeholder)
- `npm install` exits 0
- `npm run build` exits 0 produzindo `dist/`
- `npm test` exits 0 com ≥1 teste passando
- `npm run lint` exits 0 zero violations
- `npm run typecheck` exits 0
- `.gitignore` com `node_modules/`, `dist/`, `*.db`, `.brain/`
- `README.md` mínimo (nome, descrição, instalação placeholder)

## 3. Prova surfaceável
- Comandos rodados a cada turno:
  - `npm test 2>&1 | tail -10`
  - `npm run build 2>&1 | tail -5`
  - `npm run lint 2>&1 | tail -5`
  - `npm run typecheck 2>&1 | tail -5`
- Output literal esperado:
  - `Tests: 1 passed` ou similar Vitest
  - sem erros tsc
  - sem violations Biome
  - dist/index.js existente (provar com `ls dist/`)
- Frequência: a cada turno
- Echo obrigatório: sim

## 4. Restrições

### Projeto
- NÃO criar código de funcionalidade (storage/curator/mcp/cli) — só skeleton
- NÃO instalar dependências fora da stack PRD seção 2
- NÃO criar arquivos fora do diretório do projeto
- NÃO commitar `node_modules/` ou `dist/`
- Manter `package.json` types: "module" (ESM)

### Padrão
- NÃO usar `--no-verify`
- NÃO desabilitar lint, sem `// @ts-ignore`
- NÃO modificar lockfiles manualmente
- Mensagens de commit descritivas (sem `wip`/`fix`/`update`)
- Sem segredos commitados

## 5. Bound
- 15 turns — F1 é skeleton puro, sem lógica

## 6. Modo
- Auto mode: ligar
- Headless opcional

## 7. Condição final (cole no /goal)

```
Bootstrap projeto second-brain-mcp em C:/Users/<user>/Desktop/second-brain-mcp. Estado final: package.json valido com scripts build/test/lint/typecheck/start, tsconfig.json strict ES2022 ESNext, biome.json, vitest.config.ts, src/index.ts exportando versao 0.1.0, README.md minimo, .gitignore com node_modules/dist/*.db/.brain. Provar com `npm install` exits 0, `npm run build 2>&1 | tail -5` mostrando dist criado sem erros, `npm test 2>&1 | tail -10` mostrando ao menos 1 teste passando com "passed", `npm run lint 2>&1 | tail -5` zero violations, `npm run typecheck 2>&1 | tail -5` sem erros, `ls dist/` mostrando index.js. Sem criar codigo de funcionalidade (so skeleton), sem dependencias fora da stack PRD (typescript, @modelcontextprotocol/sdk, better-sqlite3, @anthropic-ai/sdk, zod, commander, gray-matter, vitest, @stryker-mutator/core, @biomejs/biome, tsup), sem commitar node_modules ou dist, sem --no-verify, sem @ts-ignore, sem desabilitar lint, sem modificar lockfiles manualmente, sem mensagens de commit vagas, or stop after 15 turns. Report turn count, build status, test count, lint violations e remaining bound each turn. Claude must echo full output of each verification command.
```

## 8. Comando completo

```
/goal Bootstrap projeto second-brain-mcp em C:/Users/<user>/Desktop/second-brain-mcp. Estado final: package.json valido com scripts build/test/lint/typecheck/start, tsconfig.json strict ES2022 ESNext, biome.json, vitest.config.ts, src/index.ts exportando versao 0.1.0, README.md minimo, .gitignore com node_modules/dist/*.db/.brain. Provar com `npm install` exits 0, `npm run build 2>&1 | tail -5` mostrando dist criado sem erros, `npm test 2>&1 | tail -10` mostrando ao menos 1 teste passando com "passed", `npm run lint 2>&1 | tail -5` zero violations, `npm run typecheck 2>&1 | tail -5` sem erros, `ls dist/` mostrando index.js. Sem criar codigo de funcionalidade, sem dependencias fora da stack PRD, sem commitar node_modules ou dist, sem --no-verify, sem @ts-ignore, sem desabilitar lint, sem modificar lockfiles manualmente, sem mensagens de commit vagas, or stop after 15 turns. Report turn count, build status, test count, lint violations e remaining bound each turn. Claude must echo full output of each verification command.
```

## 9. Checklist pré-entrega
- [x] ≤4000 chars
- [x] comando concreto presente (npm install/build/test/lint/typecheck)
- [x] output literal definido
- [x] restrições específicas + padrão
- [x] bound 15 turns
- [x] echo obrigatório
- [x] arquivo salvo em docs/goals/
