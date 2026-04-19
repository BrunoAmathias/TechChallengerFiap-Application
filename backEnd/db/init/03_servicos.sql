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
