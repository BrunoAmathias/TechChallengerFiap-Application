# ADR-009 — Saga coreografada

**Status:** Aceita · **Data:** 2026-10-14 · **Complementa:** ADR-002 (REST síncrono continua nas APIs de usuário)

## Contexto
Uma OS atravessa os três serviços: é aberta no OS Service, orçada e paga no Billing e executada no Execution. Não existe transação distribuída entre PostgreSQL, MongoDB e o Mercado Pago, e cada etapa pode falhar (cliente recusa, pagamento rejeitado, reparo inviável). É preciso consistência eventual com desfazimento explícito.

## Decisão
Usar uma **saga coreografada**: cada serviço reage a eventos de domínio dos outros e publica os próprios, sem orquestrador central. O `correlationId` de todos os eventos é o `osId`.

Compensações:

| Falha | Compensação |
|---|---|
| `orcamento.recusado`, `orcamento.falhou`, `pagamento.falhou` | OS Service cancela a OS e devolve o estoque |
| `execucao.falhou` | Billing estorna o pagamento no Mercado Pago **e** OS Service cancela a OS e devolve o estoque, em paralelo |

O OS Service é a fonte da verdade do status e aplica uma máquina de estados explícita (`statusTransition.js`). Transições inválidas lançam erro, resolvido pelo retry quando é só uma questão de ordem de chegada. Eventos atrasados ou repetidos são ignorados.

**Desvio do plano inicial:** "Cancelada" ficou alcançável até "Em execução", e não só antes da execução, para que uma falha durante o reparo possa ser compensada.

## Alternativas consideradas
- **Orquestração (serviço coordenador ou AWS Step Functions):** o fluxo fica visível num lugar só, mas cria um ponto central de acoplamento e mais um componente para operar. Com quatro etapas lineares, a coreografia é suficiente.
- **Chamadas REST encadeadas:** acoplam a disponibilidade dos serviços e não resolvem falhas parciais.

## Consequências
- Os serviços ficam desacoplados no tempo: o Billing pode estar fora do ar e processar os eventos quando voltar.
- O fluxo fica espalhado pelos serviços. Mitigações: contrato único em `docs/eventos.md`, histórico da OS (`GET /os/:id/historico`), evento `SagaEvento` e trace distribuído (ADR-014).
- Os handlers precisam ser idempotentes e tolerantes a eventos fora de ordem (ADR-011).
