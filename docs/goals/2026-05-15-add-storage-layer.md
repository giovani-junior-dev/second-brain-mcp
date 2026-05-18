# Goal Plan — add-storage-layer (F2)

## 1. Contexto
- Repo: `<repo>/`
- Stack: TS + better-sqlite3 + Vitest
- Estado atual: F1 concluída (skeleton + smoke)
- Comando teste: `npm test`
- Comando build: `npm run build`
- Pré-req: F1 done (`docs/goals/2026-05-15-bootstrap-second-brain-mcp.md`)

## 2. Estado final mensurável
- `src/storage/db.ts` abre/cria SQLite via better-sqlite3
- `src/storage/migrate.ts` aplica DDL do PRD §4 (tabelas messages + messages_fts + messages_fts_trigram + facts + facts_fts + skills + curator_state)
- `src/storage/facts.ts` CRUD: insertFact, getFactById, searchFacts (FTS5), archiveFact, listFacts(scope)
- `src/storage/messages.ts` CRUD: insertMessage, searchMessages (FTS5 BM25)
- `src/storage/skills.ts` CRUD: insertSkill, getSkillByName, listSkills, archiveSkill
- Migration idempotente (rodar 2x não quebra)
- Migration roda em DB temporário no teste (não pollui filesystem)
- Vitest cobertura ≥80% em src/storage/
- Mutation score ≥70% via Stryker (subset storage/)

## 3. Prova surfaceável
- Comandos:
  - `npm test -- storage 2>&1 | grep -E "Tests:|passed|failed"`
  - `npm test -- --coverage 2>&1 | grep -E "src/storage|All files"`
  - `npx stryker run --mutate "src/storage/**/*.ts" 2>&1 | tail -10`
  - `npm run build 2>&1 | tail -5`
- Output esperado:
  - `Tests: N passed, 0 failed` com N≥15
  - coverage src/storage ≥80%
  - mutation score ≥70%
  - build sem erros

## 4. Restrições

### Projeto
- NÃO importar de fora de `src/storage/` (boundary)
- NÃO usar embeddings ou vector store
- NÃO usar ORM (Prisma/TypeORM/Drizzle) — só better-sqlite3 raw
- NÃO criar interface sem 2ª implementação
- Função ≤20 linhas, ≤2 params
- Sem `Manager`/`Helper`/`Util` no naming
- Constantes para magic numbers (ex: `STALE_THRESHOLD_DAYS = 30`)
- DDL versionada em arquivo .sql separado ou template literal
- Boolean flag param proibido — separar em 2 funções

### Padrão
- TDD: RED test antes de cada feature
- NÃO --no-verify, NÃO @ts-ignore, NÃO lint disable
- NÃO modificar lockfiles
- Commits descritivos por feature

## 5. Bound
- 20 turns

## 7. Condição final

```
Implementar camada src/storage/ do second-brain-mcp. Estado final: db.ts abre SQLite better-sqlite3, migrate.ts aplica DDL completo (messages + messages_fts + messages_fts_trigram + facts + facts_fts + skills + curator_state) idempotente, facts.ts/messages.ts/skills.ts com CRUD + FTS5 search BM25. Provar com `npm test -- storage 2>&1 | grep "Tests:"` mostrando >=15 testes passed e 0 failed, `npm test -- --coverage 2>&1 | grep "src/storage"` mostrando >=80% coverage em src/storage, `npx stryker run --mutate "src/storage/**/*.ts" 2>&1 | tail -10` mostrando mutation score >=70%, `npm run build 2>&1 | tail -5` sem erros. Sem importar de fora de src/storage (boundary), sem embeddings, sem ORM (so better-sqlite3 raw), sem interface sem 2a implementacao, sem Manager/Helper/Util generico, sem boolean flag param, sem magic numbers (constantes nomeadas), funcoes <=20 linhas e <=2 params, TDD obrigatorio (RED antes), sem --no-verify, sem @ts-ignore, sem desabilitar lint, sem modificar lockfiles, sem mensagens de commit vagas, or stop after 20 turns. Report turn count, test count, coverage storage, mutation score e remaining bound each turn. Claude must echo full output of each verification command.
```

## 9. Checklist pré-entrega
- [x] ≤4000 chars
- [x] comandos concretos
- [x] outputs literais
- [x] restrições projeto + padrão
- [x] bound 20 turns
- [x] echo obrigatório
