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