CREATE TABLE IF NOT EXISTS veiculos (
    id SERIAL PRIMARY KEY,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    ano INTEGER NOT NULL,
    placa VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
