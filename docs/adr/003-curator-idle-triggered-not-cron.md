# ADR-003: Curator idle-triggered, não cron

## Status
Accepted — 2026-05-15

## Contexto
Curator precisa rodar periodicamente: extract patterns, promote facts, consolidate skills. Opções: cron daemon, idle-triggered, on-demand.

## Decisão
**Idle-triggered** (igual Hermes `agent/curator.py`). Trigger: `idle > IDLE_THRESHOLD_HOURS AND (now - last_run) > CURATOR_INTERVAL_HOURS`.

## Razões
- Hermes usa exatamente isso, comprovado
- Sem daemon = sem processo background separado
- Sem cron = sem dependência de scheduler do OS
- Idle = momento natural pra processar (não compete com main agent)
- LLM cost só quando faz sentido (não toda hora)

## Rejeitados
- **Cron daemon**: complexidade, processo extra, sync issues
- **On-demand only**: user esquece de rodar, drift instala
- **Always-on background**: caro em tokens LLM

## Trade-offs aceitos
- Se user usa agente 24/7 sem idle real → curator nunca dispara → fallback CLI `brain curator run`
- Latência: padrão pode esperar até CURATOR_INTERVAL_HOURS pra integrar aprendizado
