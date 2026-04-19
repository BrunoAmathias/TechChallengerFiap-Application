# Testes da Aplicação

Esta pasta contém os testes unitários, de integração e funcionais da aplicação.

## Estrutura

- `unit/` - Testes unitários (testam componentes isolados)
- `integration/` - Testes de integração (testam interação com banco de dados)
- `functional/` - Testes funcionais (testam endpoints da API)

## Como executar

```bash
# Todos os testes
npm test

# Apenas unitários
npm run test:unit

# Apenas integração
npm run test:integration

# Apenas funcionais
npm run test:functional
```

## Configuração necessária

### Variáveis de ambiente
Certifique-se de que o arquivo `.env` contém as seguintes variáveis para os testes funcionarem:

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=oficina
DB_PASSWORD=test123
DB_PORT=5432

MOCK_USER_EMAIL=admin@oficina.com
MOCK_USER_PASSWORD=123456
MOCK_USER_ID=1

JWT_SECRET=supersecret
```

### Banco de dados
Os testes de integração e funcionais requerem um banco PostgreSQL configurado com as tabelas da aplicação.

## Cobertura atual ✅

### Unitários (69 testes - 100% funcionando)
- **cpf-validator.test.js** - Testa utilitário de validação de CPF/CNPJ
- **cliente.domain.test.js** - Testa domínio Cliente
- **cliente.service.test.js** - Testa serviços de cliente
- **veiculo.domain.test.js** - Testa domínio Veículo
- **veiculo.service.test.js** - Testa serviços de veículo
- **servico.domain.test.js** - Testa domínio Serviço
- **servico.service.test.js** - Testa serviços de serviço
- **peca.domain.test.js** - Testa domínio Peça
- **peca.service.test.js** - Testa serviços de peça
- **ordemServico.domain.test.js** - Testa domínio Ordem de Serviço

### Integração (Mockados)
- **cliente.repository.test.js** - Testa repositório de cliente (mockado)

### Funcionais (Mockados)
- **auth.test.js** - Testa endpoint de login
- **cliente.test.js** - Testa endpoints de cliente (mockado)

## Status dos Testes

### ✅ Funcionando Perfeitamente
- **Testes Unitários**: Todos os 69 testes passando
- **Testes Funcionais de Auth**: Endpoint de login funcionando

### ⚠️ Com Problemas de Infraestrutura
- **Testes de Integração**: Problema de autenticação SCRAM vs MD5 no PostgreSQL
- **Testes Funcionais**: Dependem do banco de dados

### 🔧 Soluções Implementadas
- **Mocks**: Criadas versões mockadas dos testes que não precisam de DB real
- **Configuração**: Ajustada autenticação do PostgreSQL para MD5

## Notas
- Os testes unitários usam mocks para isolar componentes
- Testes de integração mockados não precisam de banco real
- Testes funcionais mockados testam a API sem infraestrutura externa
- `cliente.domain.test.js` - Testa domínio Cliente
- `cliente.service.test.js` - Testa serviços de cliente

### Integração
- `cliente.repository.test.js` - Testa repositório de cliente com banco real

### Funcionais
- `auth.test.js` - Testa endpoint de login
- `cliente.test.js` - Testa endpoints de cliente (requer autenticação)

## Notas
- Os testes unitários usam mocks para isolar componentes
- Testes de integração modificam o banco de dados - use um banco de teste
- Testes funcionais testam a API completa