# ADR-010 — RabbitMQ como broker de eventos

**Status:** Aceita · **Data:** 2026-10-14

## Contexto
A saga precisa de entrega confiável de eventos entre três serviços, com roteamento por tipo de evento, novas tentativas e isolamento de mensagens com problema. O volume é baixo (dezenas de eventos por OS) e o orçamento de infraestrutura é o de uma conta AWS no Free Plan.

## Decisão
Usar **RabbitMQ 4.3** dentro do EKS (chart Helm local com a imagem oficial, namespace `messaging`), com esta topologia por serviço:

- exchange topic `oficina.events` (routing key = tipo do evento) e dead-letter exchange `oficina.dlx`;
- fila `<servico>.events`, ligada aos tipos que o serviço consome;
- fila `<servico>.events.retry` com TTL de 5 s, que devolve a mensagem à fila principal, com o header `x-retry-count` e 3 tentativas no total;
- fila `<servico>.events.dlq` para tentativas esgotadas e mensagens inválidas;
- mensagens persistentes e *publisher confirms*.

## Alternativas consideradas
- **Kafka (ou Amazon MSK):** log de eventos com replay, mas pesado para o volume e o custo do projeto; retry e DLQ teriam que ser construídos.
- **Amazon SQS/SNS:** gerenciado e barato, mas prende a solução à AWS e dificulta rodar tudo localmente com Docker Compose.
- **Amazon MQ (RabbitMQ gerenciado):** opção natural para produção, mas fora do Free Plan.

## Consequências
- O mesmo broker roda localmente (Docker Compose) e no cluster.
- Retry com atraso e DLQ saem da própria topologia, sem código de agendamento.
- O broker no cluster é um ponto único e, nesta fase, não tem volume persistente (limitação do Free Plan). Em produção, usar cluster com quorum queues ou Amazon MQ. O outbox (ADR-011) garante que nada se perde com o broker fora do ar: os eventos ficam pendentes no banco.
- A Bitnami descontinuou as imagens gratuitas do RabbitMQ. Por isso o chart é local, com a imagem oficial `rabbitmq:4.3-management`.
