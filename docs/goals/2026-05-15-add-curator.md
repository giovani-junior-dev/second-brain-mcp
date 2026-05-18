# Goal Plan — add-curator (F4)

## 1. Contexto
- Repo: `<repo>/`
- Stack: TS + @anthropic-ai/sdk + msw (mock LLM)
- Pré-req: F2 (storage) + F3 (mcp) done

## 2. Estado final mensurável
- `src/curator/extractor.ts` chama LLM aux (Anthropic Haiku default) com últimas N sessões → extrai patterns
- `src/curator/scheduler.ts` detecta idle (no activity >2h AND last_run >24h) → trigger
- `src/curator/promote.ts` promove pattern → fact (L2) se repetir ≥3x cross-session
- `src/curator/skill-gen.ts` gera skill SKILL.md se padrão procedural detectado
- `src/curator/consolidate.ts` mergeia skills similares (similarity threshold), archive duplicatas (nunca deleta)
- `src/curator/stale.ts` marca facts stale se last_used_at >30d (constante nomeada)
- `curator_state` table persiste last_run_at, paused
- Provider LLM agnóstico via env `BRAIN_LLM_PROVIDER=anthropic|openai`, default anthropic
- msw mocka chamadas LLM em testes (contract tests)
- Constantes nomeadas: `IDLE_THRESHOLD_HOURS=2`, `CURATOR_INTERVAL_HOURS=24`, `PATTERN_REPEAT_THRESHOLD=3`, `STALE_DAYS=30`, `ARCHIVE_DAYS=90`

## 3. Prova surfaceável
- Comandos:
  - `npm test -- curator 2>&1 | grep -E "Tests:|passed"`
  - `npm test -- --coverage 2>&1 | grep -E "src/curator"`
  - `npx stryker run --mutate "src/curator/**/*.ts" 2>&1 | tail -10`
  - `npm run build 2>&1 | tail -5`
- Output esperado:
  - `Tests: N passed` com N≥20
  - coverage src/curator ≥80%
  - mutation ≥70%
  - build sem erros

## 4. Restrições

### Projeto
- NÃO deletar facts/skills — só archive (REQ-10)
- NÃO chamar API LLM real em testes — sempre msw
- NÃO criar interface sem 2ª implementação real (mockada não conta)
- NÃO usar cron — idle-triggered apenas (igual Hermes)
- Magic numbers proibidos — constantes nomeadas
- Função ≤20 linhas
- Sem boolean flag param
- Provider LLM atrás de adapter ÚNICO (não 2 interfaces)

### Padrão
- TDD obrigatório
- NÃO --no-verify, NÃO @ts-ignore, NÃO lint disable
- NÃO modificar lockfiles
- Commits descritivos

## 5. Bound
- 25 turns

## 7. Condição final

```
Implementar src/curator/ do second-brain-mcp. Estado final: extractor.ts chama LLM aux (Anthropic Haiku default via env BRAIN_LLM_PROVIDER) extraindo patterns das ultimas N sessoes, scheduler.ts detecta idle (no activity >2h AND last_run >24h) e triggers, promote.ts promove pattern->fact L2 se repete >=3x cross-session, skill-gen.ts cria SKILL.md se padrao procedural, consolidate.ts mergeia/archive skills similares, stale.ts marca facts last_used >30d sem deletar, curator_state persiste last_run_at e paused, constantes nomeadas IDLE_THRESHOLD_HOURS/CURATOR_INTERVAL_HOURS/PATTERN_REPEAT_THRESHOLD/STALE_DAYS/ARCHIVE_DAYS. Provar com `npm test -- curator 2>&1 | grep "Tests:"` mostrando >=20 testes passed 0 failed, `npm test -- --coverage 2>&1 | grep "src/curator"` >=80% coverage, `npx stryker run --mutate "src/curator/**/*.ts" 2>&1 | tail -10` mutation >=70%, `npm run build 2>&1 | tail -5` sem erros. Sem deletar facts/skills (so archive), sem chamar LLM real em testes (msw obrigatorio), sem interface sem 2a implementacao real, sem cron (idle-triggered apenas), sem magic numbers, sem boolean flag param, funcoes <=20 linhas, TDD obrigatorio, sem --no-verify, sem @ts-ignore, sem desabilitar lint, sem modificar lockfiles, sem mensagens de commit vagas, or stop after 25 turns. Report turn count, test count, coverage curator, mutation score e remaining bound each turn. Claude must echo full output of each verification command.
```

## 9. Checklist pré-entrega
- [x] ≤4000 chars
- [x] comandos + outputs
- [x] restrições projeto + padrão
- [x] bound 25 turns
- [x] echo obrigatório
