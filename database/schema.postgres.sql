-- EZNY PostgreSQL production schema
-- Execute once against the target PostgreSQL database (Neon/Supabase/etc.).

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(120), telefone VARCHAR(40) UNIQUE, senha TEXT,
  email VARCHAR(254), bio TEXT,
  tipo VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (tipo IN ('user','admin')),
  data_nascimento TEXT, banido SMALLINT NOT NULL DEFAULT 0, banido_ate TIMESTAMPTZ,
  eliminacao_agendada SMALLINT NOT NULL DEFAULT 0, eliminacao_ate TIMESTAMPTZ,
  tipo_conta VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (tipo_conta IN ('normal','premium')),
  avatar TEXT, localizacao TEXT, verificado SMALLINT NOT NULL DEFAULT 0,
  premium_desde TIMESTAMPTZ, premium_ate TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_conta ON usuarios(tipo_conta);

-- Compatibilidade com bases Neon já existentes criadas numa versão anterior.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(254);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bio TEXT;

CREATE TABLE IF NOT EXISTS anuncios (
  id BIGSERIAL PRIMARY KEY, titulo TEXT, descricao TEXT, preco NUMERIC(14,2), marca TEXT,
  estado TEXT, contacto TEXT, categoria TEXT, imagem TEXT, galeria JSONB NOT NULL DEFAULT '[]'::jsonb,
  usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'pendente',
  codigo TEXT, ano INTEGER, quilometragem INTEGER, combustivel TEXT, caixa TEXT, tracao TEXT,
  cor TEXT, portas INTEGER, lotacao INTEGER, versao TEXT, modelo TEXT, localizacao TEXT,
  negociavel SMALLINT DEFAULT 0, equipamentos TEXT, descricao_completa TEXT, destaque SMALLINT DEFAULT 0,
  atributos JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_anuncios_usuario_status ON anuncios(usuario_id,status);
CREATE INDEX IF NOT EXISTS idx_anuncios_status ON anuncios(status);
CREATE INDEX IF NOT EXISTS idx_anuncios_categoria ON anuncios(categoria);
ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS atributos JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS comentarios (
  id BIGSERIAL PRIMARY KEY, anuncio_id BIGINT NOT NULL REFERENCES anuncios(id) ON DELETE CASCADE,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, conteudo TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, resposta_id BIGINT
);
CREATE INDEX IF NOT EXISTS idx_comentarios_anuncio ON comentarios(anuncio_id);

CREATE TABLE IF NOT EXISTS reacoes (
  id BIGSERIAL PRIMARY KEY, anuncio_id BIGINT NOT NULL REFERENCES anuncios(id) ON DELETE CASCADE,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, tipo TEXT DEFAULT 'like',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(anuncio_id,usuario_id)
);

CREATE TABLE IF NOT EXISTS seguidores (
  id BIGSERIAL PRIMARY KEY, seguidor_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  seguido_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(seguidor_id,seguido_id)
);

CREATE TABLE IF NOT EXISTS mensagens (
  id BIGSERIAL PRIMARY KEY, remetente_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  destinatario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, conteudo TEXT,
  imagem TEXT, localizacao TEXT, lida SMALLINT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mensagens_destinatario ON mensagens(destinatario_id,"createdAt");

CREATE TABLE IF NOT EXISTS notificacoes (
  id BIGSERIAL PRIMARY KEY, usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE, tipo TEXT,
  titulo TEXT, mensagem TEXT, anuncio_id BIGINT, lida SMALLINT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, referencia_id BIGINT, referencia_tipo TEXT
);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_lida ON notificacoes(usuario_id,lida);

CREATE TABLE IF NOT EXISTS perfis_premium (
  id BIGSERIAL PRIMARY KEY, usuario_id BIGINT UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  foto_capa TEXT, nome_comercial TEXT, categoria_negocio TEXT, descricao TEXT, telefone_whatsapp TEXT,
  email TEXT, localizacao TEXT, horario_funcionamento TEXT, website TEXT, redes_sociais TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id BIGSERIAL PRIMARY KEY, avaliador_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  perfil_premium_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estrelas INTEGER NOT NULL CHECK(estrelas BETWEEN 1 AND 5), comentario TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(avaliador_id,perfil_premium_id)
);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_perfil ON avaliacoes(perfil_premium_id);

CREATE TABLE IF NOT EXISTS avaliacoes_denuncias (
  id BIGSERIAL PRIMARY KEY, avaliacao_id BIGINT NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
  denunciante_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, motivo TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(avaliacao_id,denunciante_id)
);

CREATE TABLE IF NOT EXISTS denuncias (
  id BIGSERIAL PRIMARY KEY, denunciante_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_reportado_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  anuncio_id BIGINT REFERENCES anuncios(id) ON DELETE SET NULL, tipo_denuncia TEXT DEFAULT 'outro',
  descricao TEXT NOT NULL, status TEXT DEFAULT 'pendente', resposta_admin TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_denuncias_status ON denuncias(status);

CREATE TABLE IF NOT EXISTS destaques (
  id BIGSERIAL PRIMARY KEY, anuncio_id BIGINT NOT NULL REFERENCES anuncios(id) ON DELETE CASCADE,
  tipo_destaque TEXT DEFAULT 'premium', patrocinado SMALLINT DEFAULT 0, ordem INTEGER DEFAULT 0,
  ativo SMALLINT DEFAULT 1, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, expira_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_destaques_ativo ON destaques(ativo,ordem);

CREATE TABLE IF NOT EXISTS verificacoes_pendentes (
  id BIGSERIAL PRIMARY KEY, usuario_id BIGINT UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  bi_documento TEXT, nif_documento TEXT, empresa_documento TEXT, status TEXT DEFAULT 'pendente',
  admin_observacao TEXT, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessoes_ativas (
  id BIGSERIAL PRIMARY KEY, sessao_id TEXT UNIQUE NOT NULL, usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  ip TEXT, user_agent TEXT, "ultima_atividade" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sessoes_atividade ON sessoes_ativas("ultima_atividade");
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes_ativas(usuario_id);

CREATE TABLE IF NOT EXISTS visitas (
  id BIGSERIAL PRIMARY KEY, ip TEXT, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, visitor_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_visitas_created ON visitas("createdAt");

CREATE TABLE IF NOT EXISTS popups (
  id BIGSERIAL PRIMARY KEY, titulo TEXT, conteudo TEXT, ativo SMALLINT DEFAULT 1,
  imagem TEXT, link TEXT, texto_botao TEXT, publico TEXT NOT NULL DEFAULT 'todos',
  inicio TIMESTAMPTZ, fim TIMESTAMPTZ, frequencia TEXT NOT NULL DEFAULT 'uma_vez',
  visualizacoes BIGINT NOT NULL DEFAULT 0, cliques BIGINT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE popups ADD COLUMN IF NOT EXISTS imagem TEXT;
ALTER TABLE popups ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE popups ADD COLUMN IF NOT EXISTS texto_botao TEXT;
ALTER TABLE popups ADD COLUMN IF NOT EXISTS publico TEXT NOT NULL DEFAULT 'todos';
ALTER TABLE popups ADD COLUMN IF NOT EXISTS inicio TIMESTAMPTZ;
ALTER TABLE popups ADD COLUMN IF NOT EXISTS fim TIMESTAMPTZ;
ALTER TABLE popups ADD COLUMN IF NOT EXISTS frequencia TEXT NOT NULL DEFAULT 'uma_vez';
ALTER TABLE popups ADD COLUMN IF NOT EXISTS visualizacoes BIGINT NOT NULL DEFAULT 0;
ALTER TABLE popups ADD COLUMN IF NOT EXISTS cliques BIGINT NOT NULL DEFAULT 0;
UPDATE popups SET publico='todos' WHERE publico IS NULL;
UPDATE popups SET frequencia='uma_vez' WHERE frequencia IS NULL;

CREATE TABLE IF NOT EXISTS popups_vistos (
  id BIGSERIAL PRIMARY KEY, usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE,
  popup_id BIGINT REFERENCES popups(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(usuario_id,popup_id)
);

CREATE TABLE IF NOT EXISTS comunicados (
  id BIGSERIAL PRIMARY KEY, titulo TEXT, conteudo TEXT, tipo TEXT DEFAULT 'notificacao', imagem TEXT,
  link TEXT, texto_botao TEXT, publico TEXT NOT NULL DEFAULT 'todos', inicio TIMESTAMPTZ, fim TIMESTAMPTZ,
  frequencia TEXT NOT NULL DEFAULT 'uma_vez', ativo SMALLINT NOT NULL DEFAULT 1,
  visualizacoes BIGINT NOT NULL DEFAULT 0, cliques BIGINT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comunicados_vistos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  comunicado_id BIGINT NOT NULL REFERENCES comunicados(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(usuario_id,comunicado_id)
);
CREATE INDEX IF NOT EXISTS idx_comunicados_vistos_usuario ON comunicados_vistos(usuario_id,comunicado_id);

CREATE TABLE IF NOT EXISTS premium_historico (
  id BIGSERIAL PRIMARY KEY, usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plano VARCHAR(40) NOT NULL, estado VARCHAR(20) NOT NULL DEFAULT 'pendente', valor NUMERIC(14,2),
  moeda VARCHAR(8) NOT NULL DEFAULT 'AOA', inicio TIMESTAMPTZ, fim TIMESTAMPTZ,
  pagamento_ref TEXT UNIQUE, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id BIGSERIAL PRIMARY KEY, usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plano VARCHAR(40) NOT NULL DEFAULT 'premium_30d', metodo VARCHAR(40) NOT NULL, entidade TEXT, referencia_pagamento TEXT,
  referencia TEXT NOT NULL UNIQUE, valor NUMERIC(14,2) NOT NULL, moeda VARCHAR(8) NOT NULL DEFAULT 'AOA',
  status VARCHAR(20) NOT NULL DEFAULT 'pendente', premium_historico_id BIGINT REFERENCES premium_historico(id) ON DELETE SET NULL,
  comprovativo TEXT, criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, confirmado_em TIMESTAMPTZ,
  confirmado_por BIGINT REFERENCES usuarios(id) ON DELETE SET NULL, cancelado_em TIMESTAMPTZ,
  cancelado_por BIGINT REFERENCES usuarios(id) ON DELETE SET NULL, observacao TEXT
);
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS referencia_pagamento TEXT;
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_status ON pagamentos(usuario_id,status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);

CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGSERIAL PRIMARY KEY, admin_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  acao VARCHAR(100) NOT NULL, entidade VARCHAR(60), entidade_id BIGINT, detalhes TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id,"createdAt");

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_by BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS relatos_suporte (
  id BIGSERIAL PRIMARY KEY, usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo VARCHAR(40) NOT NULL, titulo VARCHAR(120) NOT NULL, descricao TEXT NOT NULL, email TEXT,
  anexo_nome TEXT, anexo_tipo VARCHAR(150), anexo_dados BYTEA,
  estado VARCHAR(20) NOT NULL DEFAULT 'novo', created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_relatos_suporte_created ON relatos_suporte(created_at DESC);

-- Registo da aceitação dos Termos de Uso e da Política de Privacidade
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS aceitou_termos BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS aceitou_termos_em TIMESTAMPTZ;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS versao_termos TEXT;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS versao_politica TEXT;