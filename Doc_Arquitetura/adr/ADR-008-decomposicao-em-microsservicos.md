# ADR-008 — Decomposição em três microsserviços

**Status:** Aceita · **Data:** 2026-10-14

## Contexto
O monólito concentrava cadastro, ordens de serviço, orçamento, pagamento e acompanhamento da oficina num único processo e num único banco. A Fase 4 exige pelo menos três microsserviços com repositório, banco e pipeline próprios. Um corte errado gera serviços que precisam se chamar o tempo todo ou compartilhar tabelas.

## Decisão
Separar por capacidade de negócio, cada serviço dono dos próprios dados:

| Serviço | Capacidade | Dono de |
|---|---|---|
| **OS Service** (repo Application) | Atendimento: clientes, veículos, catálogo de serviços e peças, estoque e ciclo de vida da OS | Status da OS, estoque, histórico |
| **Billing** | Financeiro: orçamento, aprovação do cliente, pagamento e estorno | Orçamento e pagamento |
| **Execution** | Oficina: fila de trabalho, prioridade, diagnóstico, reparo e tempos | Execução e métricas da oficina |

A Lambda de login por CPF continua separada e lê `clientes` do banco do OS Service, por ser do mesmo contexto de cadastro.

## Alternativas consideradas
- **Separar cadastros (clientes e veículos) num quarto serviço:** aumentaria as chamadas síncronas na abertura da OS sem ganho de independência, porque o cadastro muda junto com o atendimento.
- **Manter o orçamento no OS Service e separar só o pagamento:** orçamento e pagamento formam uma única conversa com o cliente e com o Mercado Pago; separá-los criaria uma etapa a mais na saga sem necessidade.

## Consequências
- Cada serviço pode ser implantado e escalado sozinho, com o banco mais adequado ao seu dado (ADR-012).
- O fluxo da OS passa a ser distribuído e exige uma saga com compensações (ADR-009), mensageria confiável (ADR-010 e ADR-011) e rastreamento entre serviços (ADR-014).
- O estoque fica no OS Service: a reserva acontece na abertura da OS e a devolução na compensação, sem consistência distribuída de estoque.
