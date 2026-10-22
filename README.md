# Oficina Mecânica — Tech Challenge FIAP

Plataforma de gestão de oficina mecânica: abertura de ordens de serviço (OS), orçamento com aprovação do cliente, pagamento online pelo Mercado Pago e acompanhamento da execução pela oficina.

Na **Fase 4**, o monólito foi dividido em **três microsserviços** que se coordenam por uma **saga coreografada** sobre RabbitMQ. Este repositório tem o **OS Service** e a documentação geral do sistema.

## Sumário

- [Visão geral do sistema](#visão-geral-do-sistema)
- [Repositórios](#repositórios)
- [Fluxo da ordem de serviço (saga)](#fluxo-da-ordem-de-serviço-saga)
- [Como rodar localmente](#como-rodar-localmente)
- [Deploy na AWS](#deploy-na-aws)
- [CI/CD e qualidade](#cicd-e-qualidade)
- [Observabilidade](#observabilidade)
- [OS Service (este repositório)](#os-service-este-repositório)
- [Documentação](#documentação)

## Visão geral do sistema

```mermaid
flowchart LR
    Cliente[Cliente / atendente / mecânico] -->|HTTP| ALB[ALB compartilhado]
    Cliente --> Lambda[Lambda de login por CPF]
    MP[Mercado Pago] -->|webhook| ALB
    ALB --> OS[OS Service]
    ALB --> BIL[Billing]
    ALB --> EXE[Execution]
    OS <-->|eventos| MQ[(RabbitMQ)]
    BIL <-->|eventos| MQ
    EXE <-->|eventos| MQ
    BIL -->|Checkout Pro, consulta e estorno| MP
    OS --> PG1[(PostgreSQL<br/>os_db)]
    Lambda --> PG1
    BIL --> PG2[(PostgreSQL<br/>billing_db)]
    EXE --> MDB[(MongoDB<br/>Atlas)]
```

| Serviço | Responsabilidade | Banco | Tecnologia |
|---|---|---|---|
| **OS Service** | Clientes, veículos, serviços, peças e estoque; abertura e status da OS; entrega | PostgreSQL (Neon) | Node.js 20, Express 5 |
| **Billing** | Orçamento, link de aprovação por e-mail, pagamento e estorno no Mercado Pago | PostgreSQL (Neon) | Node.js 20, Express 5, SDK Mercado Pago |
| **Execution** | Fila da oficina, prioridade, diagnóstico, reparo, finalização e tempos | MongoDB (Atlas) | Node.js 20, Express 5, Mongoose |

Pontos principais da arquitetura:
- **Saga coreografada** com compensações: recusa do orçamento, falha no pagamento e falha na execução cancelam a OS, devolvem o estoque e, quando já houve pagamento, fazem o estorno.
- **Transactional Outbox** e **consumidores idempotentes**: nenhum evento é perdido ou aplicado duas vezes.
- **Retry e DLQ** pelo próprio RabbitMQ: 3 tentativas com atraso e, depois, fila de mensagens mortas.
- **Banco por serviço**: nenhum serviço acessa o banco de outro.
- **Trace distribuído** no New Relic atravessando os serviços pelos eventos.

A arquitetura completa, com diagramas, está em [Doc_Arquitetura/Arquitetura_Microsservicos_Fase4.md](Doc_Arquitetura/Arquitetura_Microsservicos_Fase4.md).

## Repositórios

| Repositório | O que tem |
|---|---|
| **[TechChallengerFiap-Application](https://github.com/BrunoAmathias/TechChallengerFiap-Application)** (este) | OS Service, contratos de eventos e documentação geral |
| [TechChallengerFiap-Billing](https://github.com/BrunoAmathias/TechChallengerFiap-Billing) | Billing Service |
| [TechChallengerFiap-Execution](https://github.com/BrunoAmathias/TechChallengerFiap-Execution) | Execution Service |
| [TechChallengerFiap-K8s](https://github.com/BrunoAmathias/TechChallengerFiap-K8s) | Terraform do EKS, RabbitMQ, ECR, namespaces e Secrets compartilhados |
| [TechChallengerFiap-DB](https://github.com/BrunoAmathias/TechChallengerFiap-DB) | Terraform dos bancos (Neon `os_db` e `billing_db`, MongoDB Atlas) |
| [TechChallengerFiap-ServerLess](https://github.com/BrunoAmathias/TechChallengerFiap-ServerLess) | Lambda de autenticação de clientes por CPF |

## Fluxo da ordem de serviço (saga)

```mermaid
sequenceDiagram
    autonumber
    participant OS as OS Service
    participant B as Billing
    participant E as Execution
    OS->>B: os.aberta
    B->>OS: orcamento.gerado (OS: Aguardando aprovação)
    Note over B: cliente aprova pelo link do e-mail
    B->>OS: orcamento.aprovado (OS: Aguardando pagamento)
    Note over B: Mercado Pago confirma o pagamento (webhook)
    B->>OS: pagamento.confirmado (OS: Aguardando execução)
    B->>E: pagamento.confirmado (execução NA_FILA)
    E->>OS: execucao.status_atualizado (Em diagnóstico, Em execução)
    E->>OS: execucao.finalizada (OS: Finalizada)
    Note over OS: PATCH /os/:id/entregar → Entregue (os.entregue)
```

| Compensação | Gatilho | Efeito |
|---|---|---|
| Orçamento recusado ou impossível | `orcamento.recusado` / `orcamento.falhou` | OS **Cancelada** e estoque devolvido |
| Pagamento rejeitado ou expirado | `pagamento.falhou` | OS **Cancelada** e estoque devolvido |
| Falha na execução | `execucao.falhou` | Billing **estorna** o pagamento; OS **Cancelada** e estoque devolvido |

Contratos de todos os eventos, envelope e máquina de estados: [docs/eventos.md](docs/eventos.md).

## Como rodar localmente

Pré-requisitos: Docker Desktop e Node.js 20.

### Só o OS Service

```bash
cd backEnd
cp .env.example .env
docker compose up -d --build     # Postgres (5433), RabbitMQ (5672, painel em 15672), migrations e API
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api-docs
- Painel do RabbitMQ: http://localhost:15672 (usuário e senha `oficina`)

Sem Docker para a API: `npm install`, `npm run migrate:up` (com `DB_URL` apontando para um Postgres) e `npm run dev`.

### Os três serviços juntos (saga completa)

Os três usam o **mesmo RabbitMQ**: suba o do OS Service e rode os outros dois apontando para ele (é o padrão dos `.env.example`).

```bash
# 1) OS Service + RabbitMQ (porta 3000)
cd TechChallengerFiap-Application/backEnd && cp .env.example .env && docker compose up -d --build

# 2) Billing (porta 3001), com o Mercado Pago simulado (MERCADOPAGO_MODE=fake)
cd TechChallengerFiap-Billing && cp .env.example .env
docker compose up -d db
npm install && DB_URL=postgresql://postgres:postgres@localhost:5434/billing_db npm run migrate:up
npm run dev

# 3) Execution (porta 3002)
cd TechChallengerFiap-Execution && cp .env.example .env
docker compose up -d mongo
npm install && npm run dev
```

Use o mesmo `JWT_SECRET` e o mesmo `SERVICE_TOKEN` nos três `.env`. O token JWT vem do `POST /login` do OS Service.

## Deploy na AWS

Ordem do primeiro deploy:

1. **[TechChallengerFiap-DB](https://github.com/BrunoAmathias/TechChallengerFiap-DB):** cria os bancos e usuários (Neon e Atlas).
2. **[TechChallengerFiap-K8s](https://github.com/BrunoAmathias/TechChallengerFiap-K8s):** cria o EKS, o RabbitMQ, os repositórios no ECR, os namespaces `os`, `billing` e `execution` e os Secrets compartilhados (`rabbitmq` e `service-auth`).
3. **Serviços:** o merge na `main` de cada repositório roda o CD, que publica a imagem no ECR e aplica os manifests no namespace do serviço.

Os três serviços ficam atrás de **um ALB compartilhado** (`group.name: oficina`):

| Path | Serviço |
|---|---|
| `/orcamentos`, `/pagamentos`, `/webhooks/mercadopago` | Billing |
| `/execucoes` | Execution |
| `/` (demais rotas) | OS Service |

O endereço do ALB aparece em `kubectl get ingress -A`.

## CI/CD e qualidade

Cada repositório tem pipelines próprios:

| Workflow | Quando roda | O que faz |
|---|---|---|
| `ci.yml` | PR para `Dev`, `Homolog` e `main`; push em `Dev` e `Homolog` | lint, migrations num Postgres de serviço, testes com **cobertura mínima de 80%** (inclui BDD), `docker build` |
| `cd.yml` | merge na `main` | CI completo com **SonarCloud e Quality Gate** (reprovação bloqueia o deploy), imagem no ECR (tag = SHA), Secret do serviço, `kubectl kustomize` + apply, rollout e smoke test |

| Serviço | Testes | Linhas | Branches |
|---|---|---|---|
| OS Service | 258 | 97,3% | 85,9% |
| Billing | 142 | 97,0% | 85,3% |
| Execution | 77 | 98,5% | 84,6% |

Os cenários **BDD** ficam em `tests/features/*.feature` (Gherkin em português, jest-cucumber). O SonarCloud roda só na `main` porque o plano gratuito da organização não libera resultados de outras branches.

**Fluxo de branches:** `Dev` → `Homolog` → `main`, sempre por PR. As branches `main` e `Homolog` dos cinco repositórios têm um ruleset do GitHub: PR obrigatório, check de CI obrigatório e atualizado, sem push direto, force push ou exclusão. A configuração é feita pelo script [scripts/proteger-branch-main.sh](scripts/proteger-branch-main.sh).

## Observabilidade

New Relic em cada serviço (`oficina-api`, `oficina-billing`, `oficina-execution`), com:
- **trace distribuído atravessando a saga**: o contexto do trace viaja no envelope do evento e continua no serviço que o consome;
- **eventos customizados** da saga: `SagaEvento` (processado, retry ou DLQ, com latência), `SagaCompensacao`, `StatusOS` e outros;
- **logs** JSON com `correlationId` = `osId`, ligados ao trace;
- **dashboard** "Oficina - Saga e Microsserviços", versionado em [docs/observabilidade/dashboard-oficina.json](docs/observabilidade/dashboard-oficina.json) e criado com [scripts/criar-dashboard-newrelic.sh](scripts/criar-dashboard-newrelic.sh).

Detalhes e consultas NRQL: [docs/observabilidade.md](docs/observabilidade.md).

---

## OS Service (este repositório)

Dono do cadastro (clientes, veículos, serviços e peças), do estoque e do **status da OS**. Abre a OS, reserva o estoque, publica `os.aberta` e reage aos eventos do Billing e do Execution para mover a OS pela máquina de estados.

### Endpoints

Todos exigem `Authorization: Bearer <token>`, exceto `/login`, `/health`, `/health/live` e `/os/consulta/:id`. A documentação interativa fica em `/api-docs`.

| Grupo | Endpoints |
|---|---|
| Autenticação | `POST /login` |
| Clientes | `GET/POST /clientes`, `GET/PUT/DELETE /clientes/:id` |
| Veículos | `GET/POST /veiculos`, `GET/PUT/DELETE /veiculos/:id` |
| Serviços | `GET/POST /servicos`, `GET/PUT/DELETE /servicos/:id` |
| Peças | `GET/POST /pecas`, `GET/PUT/DELETE /pecas/:id` |
| Ordens de serviço | `POST /os` (abre a OS e reserva o estoque), `GET /os`, `GET /os/:id`, `GET /os/cliente/:documento`, `GET /os/consulta/:id`, `GET /os/:id/historico`, `GET /os/:id/servicos-finalizados`, `PATCH /os/:id/entregar` |
| Interno (serviço a serviço) | `GET /internal/os/:id` com header `x-service-token` |
| Saúde | `GET /health` (readiness), `GET /health/live` (liveness) |

O status da OS não é alterado por rota: ele muda pelos eventos da saga. A exceção é a entrega (`PATCH /os/:id/entregar`).

### Estrutura

```text
backEnd/
├── src/
│   ├── domain/             entidades, máquina de estados da OS (statusTransition.js), erros
│   ├── application/        casos de uso, handlers da saga, fábrica de eventos
│   ├── infrastructure/
│   │   ├── database/       conexão pg e UnitOfWork (transação)
│   │   ├── repositories/   OS, histórico, outbox, processed_events, cadastros
│   │   ├── messaging/      RabbitMQ: conexão, topologia (retry/DLQ), consumer, outbox publisher
│   │   └── observability/  propagação do trace distribuído
│   └── interfaces/         rotas, controllers e middlewares (JWT, correlationId, service token)
├── migrations/             node-pg-migrate (SQL)
├── tests/                  unit, functional, integration e features (BDD)
├── k8s/                    Deployment, Service, HPA, ConfigMap, Ingress e kustomization
└── terraForm/              legado das fases anteriores (cluster local com Kind)
docs/                       contratos de eventos e observabilidade
Doc_Arquitetura/            documento de arquitetura e ADRs
scripts/                    proteção de branch e criação do dashboard
```

### Testes

```bash
cd backEnd
npm run lint
npm run test:unit                      # rápido, sem banco
npm run test:bdd                       # cenários Gherkin da saga
DB_URL=postgresql://postgres:postgres@localhost:5433/oficina npm run migrate:up
DB_URL=postgresql://postgres:postgres@localhost:5433/oficina npm run test:coverage   # todos os testes, como no CI
```

### Variáveis de ambiente

| Variável | Uso |
|---|---|
| `DB_URL` (ou `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`), `DB_SSL` | PostgreSQL |
| `RABBITMQ_URL`, `RABBITMQ_RETRY_DELAY_MS`, `OUTBOX_POLL_INTERVAL_MS` | Mensageria. Sem `RABBITMQ_URL`, a API sobe e os eventos ficam no outbox |
| `JWT_SECRET` | Assinatura do JWT (o mesmo nos três serviços e na Lambda) |
| `SERVICE_TOKEN` | Autenticação da rota interna |
| `MOCK_USER_EMAIL`, `MOCK_USER_PASSWORD`, `MOCK_USER_ID` | Usuário do `POST /login` |
| `NEW_RELIC_LICENSE_KEY`, `NEW_RELIC_ENABLED` | Observabilidade |
| `LOG_LEVEL` | Nível dos logs (pino) |

No cluster, os valores sensíveis vêm do Secret `api-secret` (criado pelo CD a partir dos GitHub Secrets) e dos Secrets compartilhados `rabbitmq` e `service-auth`.

### Secrets do repositório (GitHub → Settings → Secrets and variables → Actions)

| Nome | Tipo | Uso |
|---|---|---|
| `DB_URL`, `JWT_SECRET`, `MOCK_USER_EMAIL`, `MOCK_USER_PASSWORD`, `MOCK_USER_ID`, `NEW_RELIC_LICENSE_KEY` | secret | conteúdo do `api-secret` |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | secret | push no ECR e deploy no EKS |
| `SONAR_TOKEN` | secret | SonarCloud (sem ele, o CI só avisa e segue) |

## Documentação

| Documento | Conteúdo |
|---|---|
| [Doc_Arquitetura/Arquitetura_Microsservicos_Fase4.md](Doc_Arquitetura/Arquitetura_Microsservicos_Fase4.md) | Arquitetura da Fase 4: componentes, saga, compensações, implantação, segurança e validação |
| [Doc_Arquitetura/adr/](Doc_Arquitetura/adr/README.md) | Decisões de arquitetura da Fase 4 (ADR-008 a ADR-015) |
| [Doc_Arquitetura/Documentacao_Arquitetura_TechChallenge.md](Doc_Arquitetura/Documentacao_Arquitetura_TechChallenge.md) | Arquitetura v1.0 (monólito), RFCs e ADR-001 a ADR-007 |
| [docs/eventos.md](docs/eventos.md) | Contratos de eventos, envelope, garantias e máquina de estados da OS |
| [docs/observabilidade.md](docs/observabilidade.md) | New Relic: trace distribuído, eventos customizados, logs e dashboard |
