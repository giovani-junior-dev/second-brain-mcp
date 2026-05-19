# Goal Plan — add-session-indexer (F9)

## 1. Contexto
- Repo: `<repo>/`
- Stack: TS strict + Node 20 + better-sqlite3
- Pré-req: F2 storage done
- Origem: Pi-hermes-memory expõe feature similar, mostra ganho real (38 messages, 2 projects)

## 2. Estado final mensurável
- `src/indexer/jsonl.ts` parse line-delimited JSONL (~/.claude/projects/<proj>/<session>.jsonl) → IndexedMessage[]
- Filtra `type=user|assistant` apenas. Skip `thinking|tool_use|tool_result|attachment|file-history-snapshot|system|permission-mode|last-prompt|ai-title`
- Extrai content: string direto OR array de `{type:"text", text}`
- `src/indexer/scan.ts` lista todos `*.jsonl` recursivo em `~/.claude/projects/`
- `src/indexer/index-runner.ts` orquestra: dedup por hash SHA1(sessionId+uuid), persiste em `messages` table + `messages_fts`
- CLI `brain index-sessions [--projects=A,B] [--since=YYYY-MM-DD]` retorna summary `{sessionsProcessed, sessionsIndexed, sessionsSkipped, messagesIndexed, projectsIndexed}`
- Dedup: rerun não duplica (hash unique check)
- Project name: basename(cwd) do primeiro user message no arquivo

## 3. Prova surfaceável
- `npm test -- indexer 2>&1 | grep "Tests:"` >=12 passed
- `npm test -- --coverage 2>&1 | grep "src/indexer"` >=80%
- `npm run build 2>&1 | tail -3` clean
- `node dist/cli/index.js index-sessions --projects=second-brain-mcp` retorna JSON

## 4. Restrições
### Projeto
- NÃO modificar JSONL origem (read-only)
- NÃO indexar `thinking` (privacidade) ou `tool_use` (ruído)
- NÃO duplicar messages — hash content-addressed
- Função ≤20 linhas, ≤2 params (3+ → obj)
- Sem Manager/Helper/Util
### Padrão
- TDD RED first
- Sem --no-verify, @ts-ignore, lint disable
- Sem modificar lockfiles
- Commits descritivos

## 5. Bound
- 25 turns

## 6. Modo
- Auto mode ON
- Headless OK

## 7. Condição final
```
Implementar src/indexer/ do second-brain-mcp. Estado final: jsonl.ts parse line-delimited JSONL (~/.claude/projects/<proj>/<session>.jsonl) extraindo user+assistant messages com content string ou array de {type:text,text}, scan.ts lista *.jsonl recursivo em ~/.claude/projects/, index-runner.ts dedupa por hash SHA1(sessionId+uuid) persistindo em messages + messages_fts, CLI brain index-sessions [--projects=A,B] [--since=DATE] retorna JSON summary {sessionsProcessed,sessionsIndexed,sessionsSkipped,messagesIndexed,projectsIndexed}. Provar com `npm test -- indexer 2>&1 | grep "Tests:"` >=12 passed 0 failed, `npm test -- --coverage 2>&1 | grep "src/indexer"` >=80% coverage, `npm run build 2>&1 | tail -3` sem erros. Skip thinking|tool_use|tool_result|attachment|file-history-snapshot|system|permission-mode|last-prompt|ai-title types. Hash dedup obrigatorio (rerun nao duplica). Sem modificar JSONL origem, sem Manager/Helper/Util, funcoes <=20 linhas <=2 params, TDD RED first, sem --no-verify sem @ts-ignore sem desabilitar lint sem modificar lockfiles sem mensagens vagas, or stop after 25 turns. Report turn count, test count, coverage indexer, build status e remaining bound each turn. Claude must echo full output of each verification command.
```

## 8. Checklist
- [x] ≤4000 chars
- [x] comandos + outputs
- [x] restrições projeto + padrão
- [x] bound 25 turns
- [x] echo obrigatório
