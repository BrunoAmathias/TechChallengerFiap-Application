# 🔧 TechChallenger FIAP — API de Oficina Mecânica

API RESTful para gerenciamento de uma oficina mecânica, desenvolvida como parte do Tech Challenger da FIAP. O sistema permite controlar clientes, veículos, serviços, peças e ordens de serviço com autenticação via JWT.

---

## 📋 Sumário

- [Objetivo](#-objetivo)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Funcionalidades](#-funcionalidades)
- [Pré-requisitos](#-pré-requisitos)
- [Configuração e Execução Local](#-configuração-e-execução-local)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Documentação da API](#-documentação-da-api)
- [Testes](#-testes)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Banco de Dados](#-banco-de-dados)

---

## 🎯 Objetivo

O sistema tem como objetivo digitalizar e centralizar o fluxo operacional de uma oficina mecânica, permitindo:

- Cadastro e gestão de **clientes** (com validação de CPF/CNPJ)
- Cadastro e gestão de **veículos** (com validação de placa no formato antigo e Mercosul)
- Controle de **serviços** e **peças** disponíveis
- Abertura, acompanhamento e encerramento de **ordens de serviço**
- **Autenticação** segura com JWT para proteção dos endpoints

---

## 🛠 Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | 24| Runtime |
| Express | 5 | Framework HTTP |
| PostgreSQL | 15 | Banco de dados |
| JSON Web Token | 9 | Autenticação |
| Swagger (jsdoc + ui) | 6 / 5 | Documentação da API |
| Jest | 29 | Testes |
| Supertest | 6 | Testes funcionais |
| Docker / Docker Compose | — | Containerização |
| Nodemon | 3 | Hot reload em dev |

---

## 🏗 Arquitetura

O projeto segue os princípios do **Domain-Driven Design (DDD)**, dividido em quatro camadas:

```
src/
├── domain/           # Entidades e regras de negócio puras
├── application/      # Casos de uso (orquestração dos fluxos)
├── infrastructure/   # Repositórios, banco de dados e utilitários
└── presentation/     # Controllers, rotas e middlewares HTTP
```

**Fluxo de uma requisição:**

```
Requisição HTTP
    → presentation (rota + controller)
        → application (caso de uso)
            → domain (validação de negócio)
            → infrastructure (persistência)
```

Essa separação garante que as regras de negócio (como formato de placa ou CPF válido) vivam no Domain, independentes de qualquer infraestrutura ou framework.

---

## ✅ Funcionalidades

### Autenticação
- `POST /login` — Gera token JWT (credenciais via variáveis de ambiente)

### Clientes
- `GET /clientes` — Lista todos os clientes
- `GET /clientes/:id` — Busca cliente por ID
- `POST /clientes` — Cadastra novo cliente (validação de CPF/CNPJ)
- `PUT /clientes/:id` — Atualiza dados do cliente
- `DELETE /clientes/:id` — Remove cliente

### Veículos
- `GET /veiculos` — Lista todos os veículos
- `GET /veiculos/:id` — Busca veículo por ID
- `POST /veiculos` — Cadastra novo veículo (validação de placa)
- `PUT /veiculos/:id` — Atualiza dados do veículo
- `DELETE /veiculos/:id` — Remove veículo

### Serviços
- `GET /servicos` — Lista todos os serviços
- `GET /servicos/:id` — Busca serviço por ID
- `POST /servicos` — Cadastra novo serviço
- `PUT /servicos/:id` — Atualiza serviço
- `DELETE /servicos/:id` — Remove serviço

### Peças
- `GET /pecas` — Lista todas as peças
- `GET /pecas/:id` — Busca peça por ID
- `POST /pecas` — Cadastra nova peça
- `PUT /pecas/:id` — Atualiza peça
- `DELETE /pecas/:id` — Remove peça

### Ordens de Serviço
- `GET /ordens-servico` — Lista todas as ordens
- `GET /ordens-servico/:id` — Busca ordem por ID
- `POST /ordens-servico` — Abre nova ordem de serviço
- `PATCH /ordens-servico/:id/status` — Atualiza status da ordem
- `DELETE /ordens-servico/:id` — Remove ordem

> Todos os endpoints (exceto `/login`) exigem autenticação via `Bearer Token`.

---

## 📦 Pré-requisitos

- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados, **ou**
- [Node.js 18+](https://nodejs.org/) e [PostgreSQL 15+](https://www.postgresql.org/) instalados localmente

---

## 🚀 Configuração e Execução Local

### Opção 1 — Com Docker (recomendado)

Sobe a API, o banco PostgreSQL e o pgAdmin em um único comando:

```bash
# 1. Clone o repositório e entre na pasta do backend
cd backEnd

# 2. Suba os containers
docker-compose up --build
```

Serviços disponíveis após o start:

| Serviço | URL |
|---|---|
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api-docs |
| pgAdmin | http://localhost:5050 |
| PostgreSQL | localhost:5433 |

Credenciais do pgAdmin: `admin@admin.com` / `admin`

---

### Opção 2 — Sem Docker (execução local)

**1. Instale as dependências:**

```bash
cd backEnd
npm install
```

**2. Configure o banco de dados:**

Crie o banco manualmente no PostgreSQL e execute os scripts de inicialização em ordem:

```bash
psql -U postgres -d oficina -f db/init/01_clientes.sql
psql -U postgres -d oficina -f db/init/02_veiculos.sql
psql -U postgres -d oficina -f db/init/03_servicos.sql
psql -U postgres -d oficina -f db/init/04_pecas.sql
psql -U postgres -d oficina -f db/init/05_ordens_servico.sql
psql -U postgres -d oficina -f db/init/06_os_servicos.sql
psql -U postgres -d oficina -f db/init/07_os_pecas.sql
```

**3. Configure o arquivo `.env`** (veja a seção abaixo)

**4. Inicie o servidor:**

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz de `backEnd/` com o seguinte conteúdo:

```env
# Banco de dados
DB_USER=postgres
DB_HOST=localhost        # use "db" se estiver rodando via Docker
DB_NAME=oficina
DB_PASSWORD=sua_senha
DB_PORT=5433             # porta mapeada do Docker; use 5432 para local

# Usuário mock para autenticação
MOCK_USER_EMAIL=admin@oficina.com
MOCK_USER_PASSWORD=123456
MOCK_USER_ID=1

# JWT
JWT_SECRET=seu_segredo_aqui
```

> Para testes de integração, existe um `.env.test` separado com as configurações do banco de teste.

---

## 📖 Documentação da API

Com a aplicação rodando, acesse o Swagger UI em:

```
http://localhost:3000/api-docs
```

Todos os endpoints estão documentados com exemplos de request/response e esquemas de dados.

**Para autenticar no Swagger:**
1. Chame `POST /login` com email e senha
2. Copie o token retornado
3. Clique em **Authorize** (canto superior direito) e cole o token no campo `bearerAuth`

---

## 🧪 Testes

O projeto possui três níveis de testes:

### Testes Unitários
Testam as regras de negócio do Domain e os casos de uso da Application de forma isolada, sem dependência do banco.

```bash
npm run test:unit
```

### Testes de Integração
Testam os repositórios conectando ao banco de dados real (usando o `.env.test`).

```bash
npm run test:integration
```

Ou via Docker:

```bash
docker-compose run api-test
```

### Testes Funcionais
Testam os endpoints de ponta a ponta (HTTP → banco).

```bash
npm run test:functional
```

### Todos os testes

```bash
npm test
```

---

## 📁 Estrutura do Projeto

```
backEnd/
├── db/
│   └── init/                    # Scripts SQL de criação das tabelas
├── src/
│   ├── application/             # Casos de uso
│   │   ├── auth.service.js
│   │   ├── cliente.service.js
│   │   ├── veiculo.service.js
│   │   ├── servico.service.js
│   │   ├── peca.service.js
│   │   ├── ordemServico.service.js
│   │   └── notification.service.js
│   ├── domain/                  # Entidades e validações de negócio
│   │   ├── cliente.js
│   │   ├── veiculo.js
│   │   ├── servico.js
│   │   ├── peca.js
│   │   ├── ordemServico.js
│   │   └── statusTransition.js
│   ├── infrastructure/          # Repositórios e conexão com banco
│   │   ├── database/
│   │   │   └── connection.js
│   │   ├── utils/
│   │   │   └── cpf-validator.js
│   │   ├── auth.repository.js
│   │   ├── cliente.repository.js
│   │   ├── veiculo.repository.js
│   │   ├── servico.repository.js
│   │   ├── peca.repository.js
│   │   └── ordemServico.repository.js
│   └── presentation/            # Controllers, rotas e middlewares
│       ├── middlewares/
│       │   └── auth.middleware.js
│       ├── auth.controller.js / auth.routes.js
│       ├── cliente.controller.js / cliente.routes.js
│       ├── veiculo.controller.js / veiculo.routes.js
│       ├── servico.controller.js / servico.routes.js
│       ├── peca.controller.js / peca.routes.js
│       └── ordemServico.controller.js / ordemServico.routes.js
│   ├── server.js
│   └── swagger.config.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── functional/
├── .env
├── .env.test
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## 🗄 Banco de Dados

O banco `oficina` é criado automaticamente pelo Docker através dos scripts em `db/init/`. As tabelas são inicializadas na seguinte ordem:

1. `clientes` — dados dos clientes com CPF/CNPJ único
2. `veiculos` — veículos com placa única
3. `servicos` — catálogo de serviços disponíveis
4. `pecas` — estoque de peças
5. `ordens_servico` — ordens de serviço vinculadas a clientes e veículos
6. `os_servicos` — serviços vinculados a uma ordem
7. `os_pecas` — peças utilizadas em uma ordem

Todas as tabelas possuem campos `created_at` e `updated_at` gerenciados automaticamente por triggers.
