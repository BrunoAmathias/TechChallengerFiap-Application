# ADR-012 — Banco por serviço (PostgreSQL e MongoDB)

**Status:** Aceita · **Data:** 2026-10-14 · **Atualiza:** RFC-002 (PostgreSQL único do monólito)

## Contexto
Microsserviços que compartilham banco ficam acoplados pelo esquema. A fase exige pelo menos um banco SQL e um NoSQL.

## Decisão
| Serviço | Banco | Motivo |
|---|---|---|
| OS Service | PostgreSQL (Neon, `os_db`) | Dados relacionais (cliente, veículo, OS e itens), reserva atômica de estoque (`UPDATE ... WHERE quantidade >= $1`) e dados migrados do monólito |
| Billing | PostgreSQL (Neon, `billing_db`) | Dinheiro exige transações ACID, unicidade e consistência forte. Os itens do orçamento ficam em JSONB, por serem um retrato do momento |
| Execution | MongoDB (Atlas M0) | A execução é um agregado de documento único (itens, timeline de etapas, técnico e prioridade) que muda junto; esquema flexível e leitura da fila por prioridade com índice |

Cada banco tem usuário próprio, criado pelo Terraform do repo DB, e nenhum serviço acessa o banco de outro. Dados de outro serviço chegam pelos eventos ou, raramente, pela API interna `GET /internal/os/:id`.

## Alternativas consideradas
- **MongoDB também no Billing:** possível, mas pagamentos se beneficiam de constraints e transações relacionais maduras.
- **DynamoDB no Execution:** gerenciado na AWS, mas sem transações tão simples entre outbox e documento, e mais difícil de rodar localmente.
- **Um banco com schemas separados:** reduz custo, mas mantém o acoplamento operacional (backup, versão e credenciais).

## Consequências
- Cada serviço evolui o próprio esquema: migrations com `node-pg-migrate` no OS e no Billing; schema Mongoose no Execution.
- Relatórios que cruzam serviços precisam ser montados por eventos ou pelas APIs, não por JOIN.
- A Lambda de login lê `clientes` do `os_db`. É uma exceção documentada, por pertencer ao mesmo contexto de cadastro.
