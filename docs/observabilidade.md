# Observabilidade — New Relic

Os três microsserviços usam o agente Node.js do New Relic (`require('newrelic')` na primeira linha do `server.js`), cada um com o próprio nome de aplicação:

| Serviço | `NEW_RELIC_APP_NAME` | Repositório |
|---|---|---|
| OS Service | `oficina-api` | TechChallengerFiap-Application |
| Billing | `oficina-billing` | TechChallengerFiap-Billing |
| Execution | `oficina-execution` | TechChallengerFiap-Execution |

A chave (`NEW_RELIC_LICENSE_KEY`) vem do Secret de cada serviço no Kubernetes. Sem a chave, ou com `NEW_RELIC_ENABLED=false` (como nos testes), o agente fica desligado e a API dele não faz nada.

## Trace distribuído pela saga

Uma OS atravessa os três serviços por eventos no RabbitMQ. Cada gatilho externo da saga começa um trace: a abertura da OS (`POST /os`), a decisão do cliente no link do orçamento, o webhook do Mercado Pago e as ações do mecânico no Execution. O objetivo é que **cada trace siga por todos os serviços que reagem àquele gatilho**, em vez de parar no primeiro serviço. O que liga os traces de uma mesma OS é o atributo `osId`.

A instrumentação automática do agente não resolve isso sozinha por causa do **Transactional Outbox**: o evento é gravado no banco durante a requisição, mas quem publica é o `OutboxPublisher`, um processo em segundo plano que roda fora de qualquer transação. Na hora da publicação, o contexto do trace já se perdeu.

Solução: o contexto viaja **dentro do envelope** do evento.

```
POST /os (transação HTTP, trace T)
  └─ criarEvento('os.aberta')  → envelope.traceContext = { traceparent, tracestate, newrelic } de T
       └─ outbox (Postgres/Mongo)
            └─ OutboxPublisher → headers AMQP recebem o traceContext
                 └─ Billing: EventConsumer abre a transação "RabbitMQ/Consumir/os.aberta"
                      e aceita os cabeçalhos → continua o trace T
                      └─ criarEvento('orcamento.gerado') → captura o contexto (ainda T) → ...
```

Peças do código, iguais nos três serviços:

| Arquivo | Papel |
|---|---|
| `src/infrastructure/observability/tracing.js` | `capturarContextoTrace()`, `cabecalhosDoEvento()` e `processarComTrace()` |
| `src/application/events/eventFactory.js` | `criarEvento` grava o `traceContext` no envelope quando há trace ativo |
| `src/infrastructure/messaging/outbox.publisher.js` | publica os cabeçalhos do `traceContext` nos headers da mensagem |
| `src/infrastructure/messaging/consumer.js` | processa cada evento numa transação que aceita esses cabeçalhos e registra o `SagaEvento` |

Se a instrumentação automática do `amqplib` já tiver aberto uma transação de mensagem (e aceitado os headers), o consumidor apenas a reutiliza, sem criar uma segunda transação.

### Como ver o trace de uma OS

1. Em **APM & Services → oficina-api → Distributed tracing**, abra um trace de `POST /os`. Ele deve conter também os spans do Billing (`RabbitMQ/Consumir/os.aberta`) e a volta para o OS (`RabbitMQ/Consumir/orcamento.gerado`).
2. Ou procure pelo `osId`, que vai como atributo em toda transação de consumo:

```sql
SELECT appName, name, duration, trace.id FROM Transaction WHERE osId = '48' SINCE 1 day ago
```

## Eventos customizados

| Evento | Serviço | Quando | Atributos principais |
|---|---|---|---|
| `SagaEvento` | todos | cada evento consumido do RabbitMQ | `servico`, `origem`, `eventType`, `osId`, `status` (`processado`, `retry`, `dlq`), `tentativa`, `resultado`, `duracaoMs`, `latenciaMs`, `erro` |
| `SagaCompensacao` | OS, Billing | compensação aplicada (cancelar OS e liberar estoque, falha de orçamento, estorno) | `osId`, `servico`, `evento`, `acao`, `motivo`/`valor` |
| `SagaEtapa` | Execution | mudança de etapa da execução | `osId`, `evento`, `statusAnterior`, `duracaoMinutos` |
| `StatusOS` | OS | transição de status da OS | `ordemId`, `statusAnterior`, `novoStatus`, `origem`, `duracaoStatusMinutos` |
| `OrdemServico` | OS | OS criada | `ordemId`, `status`, `valorTotal` |
| `PagamentoDivergente` | Billing | pagamento aprovado com valor ou moeda diferentes do orçamento | `osId`, `pagamentoId`, `mpPaymentId` |
| `WebhookAssinaturaInvalida` | Billing | webhook aceito com assinatura inválida (`MP_WEBHOOK_SIGNATURE=warn`) | `paymentId`, `motivo` |
| `FalhaIntegracao` | Billing | falha ao enviar o e-mail do orçamento | `osId`, `sistema`, `mensagem` |

`latenciaMs` é o tempo entre o evento ser gerado (`occurredAt`) e terminar de ser consumido, incluindo a espera no outbox e na fila.

Erros no consumo também são enviados com `noticeError`, e aparecem em **Errors inbox** com `eventId`, `eventType` e `tentativa`.

## Logs

Os logs são JSON (pino) com `correlationId` = `osId`. O agente encaminha os logs ao New Relic (*APM logs in context*). Logs emitidos durante uma transação, inclusive no consumo de eventos, ficam ligados ao trace.

```sql
SELECT timestamp, entity.name, message FROM Log WHERE correlationId = '48' SINCE 1 day ago
```

## Dashboard

O dashboard **"Oficina - Saga e Microsserviços"** está versionado em [observabilidade/dashboard-oficina.json](observabilidade/dashboard-oficina.json) e tem duas páginas:

- **Saga:** eventos processados, retries e DLQ, compensações, latência p95, falhas por OS e status das OS.
- **Serviços:** throughput, latência p95, taxa de erro, consumo de mensagens, erros mais frequentes, alertas do Billing, tempo por etapa da execução e logs de erro.

Há duas formas de criá-lo:

**Pela API (NerdGraph):** precisa de uma *User key* (`NRAK-...`, em **API keys** no New Relic) e do id da conta:

```bash
export NEW_RELIC_API_KEY=NRAK-...
export NEW_RELIC_ACCOUNT_ID=1234567
./scripts/criar-dashboard-newrelic.sh
```

**Pela tela:** em **Dashboards → Import dashboard**, cole o JSON depois de trocar todos os `"accountIds": [0]` pelo id da conta.
