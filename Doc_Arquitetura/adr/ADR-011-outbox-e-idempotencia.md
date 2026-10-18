# ADR-011 — Transactional Outbox e consumidores idempotentes

**Status:** Aceita · **Data:** 2026-10-14

## Contexto
Cada passo da saga precisa gravar uma mudança no banco **e** publicar um evento. Fazer as duas coisas separadamente perde eventos (falha depois do commit) ou publica eventos de mudanças que não aconteceram (falha depois da publicação). O RabbitMQ entrega *at-least-once*, então o mesmo evento pode chegar mais de uma vez.

## Decisão
- **Transactional Outbox:** o evento é gravado na tabela (ou collection) `outbox` na mesma transação da mudança de negócio. Um `OutboxPublisher` em segundo plano lê os pendentes, publica com *publisher confirms* e só então marca como publicado.
  - PostgreSQL (OS e Billing): `SELECT ... FOR UPDATE SKIP LOCKED`, seguro com várias réplicas.
  - MongoDB (Execution): reserva atômica com `findOneAndUpdate` e `lockedUntil`; a transação usa `session.withTransaction` (o Atlas é um replica set).
- **Idempotência no consumo:** o `eventId` é gravado em `processed_events` na mesma transação do handler. No PostgreSQL, com `INSERT ... ON CONFLICT DO NOTHING`; no MongoDB, com *upsert* e `$setOnInsert`, porque uma violação de chave única abortaria a transação inteira.
- Toda mudança de estado passa por um **UnitOfWork** (transação) que envolve a regra de negócio, o outbox e o `processed_events`.

## Alternativas consideradas
- **Publicar direto depois do commit:** perde eventos em falhas.
- **Change Data Capture (Debezium):** robusto, mas exige Kafka Connect e mais infraestrutura.
- **Transação distribuída (2PC):** não é suportada entre PostgreSQL, MongoDB e RabbitMQ.

## Consequências
- Nenhum evento é perdido nem publicado sem a mudança correspondente.
- Há uma latência extra do polling (1 s por padrão, configurável em `OUTBOX_POLL_INTERVAL_MS`).
- O outbox publica fora da requisição original, o que quebra o trace distribuído automático. Isso foi resolvido na ADR-014.
- `processed_events` cresce com o tempo; em produção, aplicar uma política de retenção.
