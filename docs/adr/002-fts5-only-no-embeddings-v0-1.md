# ADR-002: FTS5 puro sem embeddings em v0.1

## Status
Accepted — 2026-05-15

## Contexto
Recall semântico pode usar: FTS5 BM25 (lexical), embeddings neurais (semantic), híbrido. Hermes core usa FTS5 puro + trigram tokenizer + LLM summarization (sem embeddings). Embeddings só em plugins opcionais.

## Decisão
v0.1 = **FTS5 puro** (BM25 + trigram). Embeddings adiados para v0.2+ como opt-in.

## Razões
- Hermes provou que funciona em produção sem embeddings
- Zero deps externas (Qdrant/Chroma/pgvector)
- SQLite + FTS5 = single file DB, portável
- Performance < 100ms em 1M docs com BM25
- LLM summarization no recall paga só nos top-K, não em todos
- v0.1 = MVP, escopo mínimo, YAGNI

## Rejeitados
- **Embeddings desde v0.1**: complexidade extra sem demanda comprovada
- **Híbrido**: 2x esforço, sem benefício mensurável no MVP

## Trade-offs aceitos
- Busca por sinônimos ("pg" vs "postgres") menos efetiva — usuário aprende sintaxe
- Idiomas com flexão complexa podem subperformar — trigram tokenizer mitiga

## Revisitar quando
- Recall hit-rate <50% medido em uso real
- User feedback indica busca semântica como bloqueador
