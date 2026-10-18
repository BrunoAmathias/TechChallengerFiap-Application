# ADR-014 — Trace distribuído pelo envelope do evento

**Status:** Aceita · **Data:** 2026-10-17 · **Complementa:** ADR-005 (eventos customizados no New Relic)

## Contexto
O agente do New Relic propaga o trace automaticamente em HTTP e no `amqplib`, desde que a publicação aconteça dentro da transação que originou o evento. Com o Transactional Outbox (ADR-011), quem publica é um processo em segundo plano, fora de qualquer transação. O trace terminava no primeiro serviço, e não dava para ver a saga atravessando os serviços.

## Decisão
O contexto do trace viaja **dentro do envelope** do evento:
1. `criarEvento` captura os cabeçalhos da transação atual (`traceparent`, `tracestate`, `newrelic`) e grava em `traceContext`, campo opcional do envelope.
2. O `OutboxPublisher` copia esses cabeçalhos para os headers da mensagem AMQP.
3. O `EventConsumer` processa cada evento numa transação `RabbitMQ/Consumir/<tipo>` que aceita os cabeçalhos (`acceptDistributedTraceHeaders`), continuando o trace de quem publicou. Se a instrumentação automática já abriu uma transação, ela é reutilizada.
4. Cada evento consumido gera o evento customizado `SagaEvento` (processado, retry ou DLQ, com a tentativa e a latência desde a geração), e os erros vão para o Errors inbox com `noticeError`.

O código fica em `src/infrastructure/observability/tracing.js`, igual nos três serviços.

## Alternativas consideradas
- **Só o `correlationId` nos logs:** permite juntar os logs da OS, mas não mostra tempos e dependências num trace.
- **Publicar direto na requisição, sem outbox:** propagaria o trace, mas perderia a garantia de entrega.
- **OpenTelemetry:** é o padrão aberto, mas exigiria trocar a instrumentação já adotada com o New Relic.

## Consequências
- Cada gatilho externo (abertura da OS, decisão do cliente, webhook do Mercado Pago, ação do mecânico) gera um trace que atravessa todos os serviços que reagem a ele. Validado na AWS: o webhook do Mercado Pago aparece como um único trace com Billing, OS e Execution.
- O envelope ganha um campo opcional; consumidores que não o usam o ignoram.
- Os traces de uma mesma OS são ligados pelo atributo `osId`.
