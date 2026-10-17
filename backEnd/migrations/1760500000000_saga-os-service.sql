-- Up Migration
-- Fase 4: OS Service na saga coreografada (histórico, outbox e idempotência).

ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS motivo_cancelamento VARCHAR(255);

-- O status antigo "Recusada" não existe mais na máquina de estados.
UPDATE ordens_servico SET status = 'Cancelada', motivo_cancelamento = 'Orçamento recusado'
 WHERE status = 'Recusada';

-- Histórico de cada mudança de status da OS
CREATE TABLE IF NOT EXISTS os_historico (
  id SERIAL PRIMARY KEY,
  os_id INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  status_anterior VARCHAR(50),
  status VARCHAR(50) NOT NULL,
  origem VARCHAR(50) NOT NULL,
  event_id UUID,
  observacao TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_os_historico_os_id ON os_historico (os_id, created_at);

-- Transactional Outbox: gravada na mesma transação do negócio e publicada
-- no RabbitMQ pelo OutboxPublisher.
CREATE TABLE IF NOT EXISTS outbox (
  id UUID PRIMARY KEY,
  aggregate_id VARCHAR(100) NOT NULL,
  type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_outbox_pendentes ON outbox (created_at) WHERE published_at IS NULL;

-- Idempotência dos consumers: cada eventId é processado uma única vez.
CREATE TABLE IF NOT EXISTS processed_events (
  event_id UUID PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Down Migration
DROP TABLE IF EXISTS processed_events;
DROP TABLE IF EXISTS outbox;
DROP TABLE IF EXISTS os_historico;
ALTER TABLE ordens_servico DROP COLUMN IF EXISTS motivo_cancelamento;
