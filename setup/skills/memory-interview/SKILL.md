---
name: memory-interview
description: One-time onboarding interview that pre-fills user profile in brain so future sessions start with context instead of blank slate. Trigger when user runs `/memory-interview`, `brain interview`, says "interview me", "preencher perfil", "onboarding brain", or is detected as new user (brain.recall scope=global returns empty). Asks 7 friendly questions ONE AT A TIME, saves each answer via `mcp__brain__write` scope=global. Skips question if user already has matching fact. Conversational tone, not form.
---

# memory-interview

One-time onboarding interview. Pre-fills user profile in brain.

## When to trigger

- User explicitly: `/memory-interview`, "interview me", "preencher perfil", "onboarding brain"
- First-time detection: `mcp__brain__recall query="preference" scope="global"` returns empty fence
- Re-trigger by request: user wants to refresh profile

## Procedure

1. **Detect prior state**: call `mcp__brain__recall query="*" scope="global" limit=50`
   - If facts found: acknowledge, ask whether to update/add/skip existing profile before questions
   - If empty: proceed to questions
2. **Ask ONE question at a time**. Wait for user answer before next.
3. **After each answer**: immediately `mcp__brain__write content="<fact>" type="preference" scope="global"`
4. **Tone**: friendly chat, not form. Adapt follow-ups based on user style.
5. **End**: summarize what was saved, confirm.

## Questions (ONE AT A TIME)

1. Como devo te chamar? (nome ou apelido)
2. Em qual fuso horário você está? (ex: America/Sao_Paulo, UTC-3)
3. Quais linguagens de programação e ferramentas você mais usa?
4. Qual seu editor ou IDE preferido?
5. Como você prefere que eu me comunique? (conciso vs detalhado, mostrar comandos vs explicar)
6. Sobre seu estilo de trabalho — algo que eu deva saber? (ação primeiro vs plano primeiro, TDD, workflows específicos, pet peeves)
7. Tem algo mais que você quer que eu sempre lembre sobre você?

## Write template per answer

```
mcp__brain__write {
  content: "User <fact>",
  type: "preference",
  scope: "global"
}
```

Examples:
- "User prefers to be called Junior"
- "User timezone is America/Sao_Paulo"
- "User comfortable in any language, frequently uses Claude Code and Pi agent"
- "User preferred editor is VS Code"
- "User prefers objective explanations: reasoning + path forward, concise. Show commands and steps."
- "User likes plan before building, TDD, clean architecture, consistent patterns (MVC stays MVC, monorepo stays monorepo)"

## Closing

After question 7:
> Fechado, [nome]. Perfil salvo. Vou lembrar para próximas sessões:
> - te chamar de [nome]
> - fuso [tz]
> - [stack]
> - editor [editor]
> - [comunicação]
> - [estilo de trabalho]
> - [extras]
>
> Se tiver algo novo no futuro, você me avisa.

## Hard rules

- ONE question per turn. Não enviar todas de uma vez.
- Aguardar resposta antes de avançar.
- `mcp__brain__write` imediato após cada resposta — não acumular.
- Adaptar tom à linguagem do user (PT-BR vs EN).
- Pular pergunta se fact equivalente já existir.
- Não inventar respostas se user disser "skip" ou "passa".
- Skill executa **uma vez** no perfil inicial. Re-trigger só sob pedido explícito.
