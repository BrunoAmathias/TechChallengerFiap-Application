# 🗄️ Banco de Dados - Sistema de Ordem de Serviço

Este documento contém os **scripts SQL completos** das tabelas do sistema:

* Clientes
* Veículos
* Serviços
* Peças
* Ordens de Serviço

---

# 🧾 Tabela: Clientes

Armazena os dados dos clientes.

| Campo          | Tipo      | Descrição           |
| -------------- | --------- | ------------------- |
| id             | SERIAL    | Identificador único |
| nome           | VARCHAR   | Nome do cliente     |
| email          | VARCHAR   | Email               |
| telefone       | VARCHAR   | Telefone            |
| tipo_documento | VARCHAR   | CPF ou CNPJ         |
| documento      | VARCHAR   | Documento único     |
| created_at     | TIMESTAMP | Data de criação     |
| updated_at     | TIMESTAMP | Data de atualização |

```sql
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    tipo_documento VARCHAR(10) NOT NULL,
    documento VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_tipo_documento CHECK (
        UPPER(tipo_documento) IN ('CPF', 'CNPJ')
    )
);

CREATE OR REPLACE FUNCTION atualizar_updated_at_clientes()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_clientes ON clientes;

CREATE TRIGGER trigger_update_clientes
BEFORE UPDATE ON clientes
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at_clientes();
```

---

# 🚗 Tabela: Veículos

Armazena os veículos cadastrados.

| Campo      | Tipo      | Descrição        |
| ---------- | --------- | ---------------- |
| id         | SERIAL    | Identificador    |
| marca      | VARCHAR   | Marca do veículo |
| modelo     | VARCHAR   | Modelo           |
| ano        | INTEGER   | Ano              |
| placa      | VARCHAR   | Placa única      |
| created_at | TIMESTAMP | Criação          |
| updated_at | TIMESTAMP | Atualização      |

```sql
CREATE TABLE IF NOT EXISTS veiculos (
    id SERIAL PRIMARY KEY,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    ano INTEGER NOT NULL,
    placa VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_placa_formato CHECK (
        placa ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'
    )
);

CREATE OR REPLACE FUNCTION atualizar_updated_at_veiculos()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_veiculos ON veiculos;

CREATE TRIGGER trigger_update_veiculos
BEFORE UPDATE ON veiculos
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at_veiculos();
```

---

# 🔧 Tabela: Serviços

Armazena os serviços disponíveis.

| Campo      | Tipo          | Descrição        |
| ---------- | ------------- | ---------------- |
| id         | SERIAL        | Identificador    |
| nome       | VARCHAR       | Nome do serviço  |
| descricao  | VARCHAR       | Descrição        |
| valor      | NUMERIC(10,2) | Valor do serviço |
| created_at | TIMESTAMP     | Criação          |
| updated_at | TIMESTAMP     | Atualização      |

```sql
CREATE TABLE IF NOT EXISTS servicos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION atualizar_updated_at_servicos()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_servicos ON servicos;

CREATE TRIGGER trigger_update_servicos
BEFORE UPDATE ON servicos
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at_servicos();
```

---

# 📦 Tabela: Peças

Armazena peças e insumos.

| Campo      | Tipo      | Descrição     |
| ---------- | --------- | ------------- |
| id         | SERIAL    | Identificador |
| nome       | VARCHAR   | Nome da peça  |
| descricao  | VARCHAR   | Descrição     |
| valor      | VARCHAR   | Valor (texto) |
| quantidade | INTEGER   | Estoque disponível |
| created_at | TIMESTAMP | Criação       |
| updated_at | TIMESTAMP | Atualização   |

```sql
CREATE TABLE IF NOT EXISTS pecas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor VARCHAR(50) NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_updated_at ON pecas;

CREATE TRIGGER trigger_atualizar_updated_at
BEFORE UPDATE ON pecas
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at();
```

---

# 🧾 Tabela: Ordens de Serviço

Armazena as ordens de serviço do sistema.

| Campo       | Tipo          | Descrição             |
| ----------- | ------------- | --------------------- |
| id          | SERIAL        | Identificador         |
| cliente_id  | INTEGER       | Referência ao cliente |
| veiculo_id  | INTEGER       | Referência ao veículo |
| valor_total | NUMERIC(10,2) | Valor total           |
| status      | VARCHAR       | Status da OS          |
| aprovado    | BOOLEAN       | Indica aprovação      |
| created_at  | TIMESTAMP     | Criação               |
| updated_at  | TIMESTAMP     | Atualização           |

```sql
CREATE TABLE IF NOT EXISTS ordens_servico (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    veiculo_id INTEGER NOT NULL,
    valor_total NUMERIC(10,2) DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Recebida',
    aprovado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_status CHECK (status IN (
        'Recebida',
        'Em diagnóstico',
        'Aguardando aprovação',
        'Em execução',
        'Finalizada',
        'Entregue'
    ))
);

CREATE OR REPLACE FUNCTION atualizar_updated_at_os()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ordens_servico ON ordens_servico;

CREATE TRIGGER trigger_update_ordens_servico
BEFORE UPDATE ON ordens_servico
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at_os();
```

---

# 🔗 Tabela: OS_SERVICOS

Armazena os serviços vinculados a cada ordem de serviço.

| Campo          | Tipo          | Descrição                          |
| -------------- | ------------- | ---------------------------------- |
| id             | SERIAL        | Identificador                      |
| os_id          | INTEGER       | Referência à ordem de serviço      |
| servico_id     | INTEGER       | Referência ao serviço              |
| quantidade     | INTEGER       | Quantidade do serviço              |
| valor_unitario | NUMERIC(10,2) | Valor unitário do serviço          |
| total          | NUMERIC(10,2) | Total do item no orçamento         |
| status         | VARCHAR(50)   | Status do serviço individual       |
| start_time     | TIMESTAMP     | Data/hora de início do serviço     |
| end_time       | TIMESTAMP     | Data/hora de conclusão do serviço  |
| created_at     | TIMESTAMP     | Data de criação                    |
| updated_at     | TIMESTAMP     | Data de atualização                |

```sql
CREATE TABLE IF NOT EXISTS os_servicos (
  id SERIAL PRIMARY KEY,
  os_id INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  servico_id INTEGER NOT NULL REFERENCES servicos(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Aguardando aprovação',
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para atualizar automaticamente updated_at
CREATE OR REPLACE FUNCTION atualizar_updated_at_os_servicos()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_os_servicos ON os_servicos;

CREATE TRIGGER trigger_update_os_servicos
BEFORE UPDATE ON os_servicos
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at_os_servicos();
```
```

---

# 🧩 Tabela: OS_PECAS

Armazena as peças vinculadas a cada ordem de serviço.

| Campo          | Tipo          | Descrição                          |
| -------------- | ------------- | ---------------------------------- |
| id             | SERIAL        | Identificador                      |
| os_id          | INTEGER       | Referência à ordem de serviço      |
| peca_id        | INTEGER       | Referência à peça                  |
| quantidade     | INTEGER       | Quantidade da peça                 |
| valor_unitario | NUMERIC(10,2) | Valor unitário da peça             |
| total          | NUMERIC(10,2) | Total do item no orçamento         |

```sql
CREATE TABLE IF NOT EXISTS os_pecas (
  id SERIAL PRIMARY KEY,
  os_id INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  peca_id INTEGER NOT NULL REFERENCES pecas(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL
);
```

### ✔ Via pgAdmin / DBeaver

1. Abra o editor SQL
2. Cole este arquivo
3. Execute tudo

---

### ✔ Via terminal

```bash
psql -U usuario -d banco -f script.sql
```

---

# 🧠 Observações

* Todos os IDs são auto-incrementais (`SERIAL`)
* `created_at` é gerado automaticamente
* `updated_at` é atualizado automaticamente via trigger
* Validações importantes foram aplicadas com `CHECK` e `UNIQUE`

---

# 📌 Próximos Passos

* Criar tabelas de relacionamento (`os_servicos`, `os_pecas`)
* Implementar controle de estoque
* Criar APIs REST
* Adicionar autenticação JWT

---
