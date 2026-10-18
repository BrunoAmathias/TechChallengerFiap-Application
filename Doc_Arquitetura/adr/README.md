# ADRs — Fase 4 (microsserviços)

Registros das decisões de arquitetura tomadas na migração do monólito para microsserviços. As decisões ADR-001 a ADR-007, da fase anterior, estão no [documento de arquitetura v1.0](../Documentacao_Arquitetura_TechChallenge.md#6-adrs---architecture-decision-records) e continuam válidas dentro de cada serviço. A visão geral desta fase está em [Arquitetura_Microsservicos_Fase4.md](../Arquitetura_Microsservicos_Fase4.md).

| ADR | Decisão | Status |
|---|---|---|
| [ADR-008](ADR-008-decomposicao-em-microsservicos.md) | Decompor o monólito em OS Service, Billing e Execution | Aceita |
| [ADR-009](ADR-009-saga-coreografada.md) | Saga coreografada, com compensações | Aceita (complementa a ADR-002) |
| [ADR-010](ADR-010-rabbitmq.md) | RabbitMQ como broker, com retry por TTL e DLQ | Aceita |
| [ADR-011](ADR-011-outbox-e-idempotencia.md) | Transactional Outbox e consumidores idempotentes | Aceita |
| [ADR-012](ADR-012-banco-por-servico.md) | Banco por serviço: PostgreSQL (OS, Billing) e MongoDB (Execution) | Aceita |
| [ADR-013](ADR-013-mercado-pago.md) | Mercado Pago Checkout Pro com webhook verificado | Aceita |
| [ADR-014](ADR-014-trace-distribuido-pelo-envelope.md) | Contexto do trace distribuído dentro do envelope do evento | Aceita (complementa a ADR-005) |
| [ADR-015](ADR-015-repositorio-e-pipeline-por-servico.md) | Repositório, pipeline e namespace por serviço, com ALB compartilhado | Aceita (complementa a ADR-007) |

Formato: contexto, decisão, alternativas consideradas e consequências.
