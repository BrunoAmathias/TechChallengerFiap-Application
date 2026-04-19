CREATE TABLE IF NOT EXISTS ordens_servico (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    veiculo_id INTEGER NOT NULL,
    valor_total NUMERIC(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Recebida',
    aprovado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION atualizar_updated_at_os()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_os ON ordens_servico;

CREATE TRIGGER trigger_update_os
BEFORE UPDATE ON ordens_servico
FOR EACH ROW
EXECUTE FUNCTION atualizar_updated_at_os();