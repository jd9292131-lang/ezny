BEGIN;

ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS referencia_pagamento TEXT;

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS relatos_suporte (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo VARCHAR(40) NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  descricao TEXT NOT NULL,
  email TEXT,
  anexo_nome TEXT,
  anexo_tipo VARCHAR(150),
  anexo_dados BYTEA,
  estado VARCHAR(20) NOT NULL DEFAULT 'novo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_relatos_suporte_created ON relatos_suporte(created_at DESC);

COMMIT;
