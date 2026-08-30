BEGIN;
-- Snapshot gerado a partir da base SQLite original do EZNY.
-- Importar somente numa base PostgreSQL nova após schema.postgres.sql.

-- usuarios: 8
INSERT INTO usuarios (id, nome, telefone, senha, tipo, data_nascimento, banido, banido_ate, eliminacao_agendada, eliminacao_ate, tipo_conta, avatar, localizacao, verificado, premium_desde, premium_ate, "createdAt") VALUES (2, 'José', '912345678', '$2b$10$MS6nsqNRs3AVrIzWemkHY.QzQjKGof4Jt0acrt7/wYDfSWLWoJnh.', 'user', '2006-01-01', 0, NULL, 0, NULL, 'normal', NULL, NULL, 0, NULL, NULL, '2026-06-08 00:27:47');
INSERT INTO usuarios (id, nome, telefone, senha, tipo, data_nascimento, banido, banido_ate, eliminacao_agendada, eliminacao_ate, tipo_conta, avatar, localizacao, verificado, premium_desde, premium_ate, "createdAt") VALUES (4, 'ADMINISTRADOR', '935920606', '$2b$10$uvDOmAsL2YYKHDd/kd6gnOkvun/d21O.llqPYnh.H2euOnoyBbG1y', 'admin', '2007-04-09', 0, NULL, 0, NULL, 'normal', NULL, NULL, 0, NULL, NULL, '2026-06-09 21:16:15');
INSERT INTO usuarios (id, nome, telefone, senha, tipo, data_nascimento, banido, banido_ate, eliminacao_agendada, eliminacao_ate, tipo_conta, avatar, localizacao, verificado, premium_desde, premium_ate, "createdAt") VALUES (5, 'Filipe', '987654321', '$2b$10$p71b2hHgTup8zPQsLu9qlOh.4aJnZ1vH5nIxpZF2ZUuToOxDzm1ou', 'user', '2001-01-01', 0, NULL, 0, NULL, 'normal', NULL, NULL, 0, NULL, NULL, '2026-06-10 08:51:13');
INSERT INTO usuarios (id, nome, telefone, senha, tipo, data_nascimento, banido, banido_ate, eliminacao_agendada, eliminacao_ate, tipo_conta, avatar, localizacao, verificado, premium_desde, premium_ate, "createdAt") VALUES (6, 'Suzaltina', '934751687', '$2b$10$y1/oFoUmj0HASMLNgs7wRO2bGmT1rJJBub52jhd6zCH6Rq5R3QyFG', 'user', '2006-08-01', 0, NULL, 0, NULL, 'premium', NULL, NULL, 0, '2026-06-19T16:09:13.164Z', '2027-06-19T16:09:13.164Z', '2026-06-12 12:36:40');
INSERT INTO usuarios (id, nome, telefone, senha, tipo, data_nascimento, banido, banido_ate, eliminacao_agendada, eliminacao_ate, tipo_conta, avatar, localizacao, verificado, premium_desde, premium_ate, "createdAt") VALUES (7, 'MARCOS SANTOS', '955057842', '$2b$10$UHX3ONNW.lK4qymjEQewWuw1b4/8k8e.vCJMDWm3iCDO36MtzeP/C', 'user', '2008-04-10', 0, NULL, 0, NULL, 'normal', NULL, NULL, 0, NULL, NULL, '2026-06-12 21:42:41');
INSERT INTO usuarios (id, nome, telefone, senha, tipo, data_nascimento, banido, banido_ate, eliminacao_agendada, eliminacao_ate, tipo_conta, avatar, localizacao, verificado, premium_desde, premium_ate, "createdAt") VALUES (8, 'Black Bunny', '945849141', '$2b$10$GIpc.w4qmz1KSqeRC3agluGKjCoDVk7PZxiXg1X46izmZJXn.McV.', 'user', '2005-07-29', 0, NULL, 0, NULL, 'normal', NULL, NULL, 0, NULL, NULL, '2026-06-14 13:10:46');
INSERT INTO usuarios (id, nome, telefone, senha, tipo, data_nascimento, banido, banido_ate, eliminacao_agendada, eliminacao_ate, tipo_conta, avatar, localizacao, verificado, premium_desde, premium_ate, "createdAt") VALUES (9, 'MINGO BILLI', '947901227', '$2b$10$VCQX3TH.jkG67tcOEqXGteR3S.wzreOkTaKYApApE0NTbyi5qqUBm', 'user', '2000-01-09', 0, NULL, 0, NULL, 'normal', NULL, NULL, 0, NULL, NULL, '2026-06-18 01:08:42');
INSERT INTO usuarios (id, nome, telefone, senha, tipo, data_nascimento, banido, banido_ate, eliminacao_agendada, eliminacao_ate, tipo_conta, avatar, localizacao, verificado, premium_desde, premium_ate, "createdAt") VALUES (10, 'Adriano Marcial', '930806413', '$2b$10$9uyvRZgn6GUUPgGu01q5fO.oN65mHhkkzBmMc3DyxApDZVlbtN24.', 'user', '2005-08-06', 0, NULL, 0, NULL, 'normal', NULL, NULL, 0, NULL, NULL, '2026-08-07 19:03:04');

-- anuncios: 4
INSERT INTO anuncios (id, titulo, descricao, preco, marca, estado, contacto, categoria, imagem, galeria, usuario_id, status, codigo, ano, quilometragem, combustivel, caixa, tracao, cor, portas, lotacao, versao, modelo, localizacao, negociavel, equipamentos, descricao_completa, destaque, "createdAt") VALUES (8, 'SPORTAGE', '✔️ Motor selado 🔧
✔️ Caixa automática selada ⚙️
✔️ AC gela perfeitamente ❄️
✔️ Interior super limpo ✨
✔️ Exterior limpo e bem conservado 🎨
✔️ Série E
✔️ Carro pronto a rodar sem nada a fazer 👌', 10000000.0, 'KIA', '4500', '947901227', 'carro', 'img-1781278353912-410234234.jpg', '["img-1781278353912-410234234.jpg", "img-1781278356911-333302482.jpg", "img-1781278359975-717724388.jpg"]'::jsonb, 4, 'active', 'LAO-2026-000008', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, '2026-06-12 15:32:41');
INSERT INTO anuncios (id, titulo, descricao, preco, marca, estado, contacto, categoria, imagem, galeria, usuario_id, status, codigo, ano, quilometragem, combustivel, caixa, tracao, cor, portas, lotacao, versao, modelo, localizacao, negociavel, equipamentos, descricao_completa, destaque, "createdAt") VALUES (9, 'HYUNDAI I10', 'Motor selado, AC GELA.', 2000000.0, 'HYUNDAI', '120000', '900000000', 'carro', 'img-1781296867207-968165861.jpg', '["img-1781296867207-968165861.jpg", "img-1781296869249-730210786.jpg", "img-1781296871578-89130683.jpg"]'::jsonb, 2, 'active', 'LAO-2026-000009', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, '2026-06-12 20:41:12');
INSERT INTO anuncios (id, titulo, descricao, preco, marca, estado, contacto, categoria, imagem, galeria, usuario_id, status, codigo, ano, quilometragem, combustivel, caixa, tracao, cor, portas, lotacao, versao, modelo, localizacao, negociavel, equipamentos, descricao_completa, destaque, "createdAt") VALUES (12, 'SAMSUNG S22 ULTRA', 'RAM 12GB
ROM 256GB', 340000.0, 'SAMSUNG', 'NOVO', '945678923', 'telefone', 'img-1781619369950-831571351.jpg', '["img-1781619369950-831571351.jpg", "img-1781619369998-256249979.jpg"]'::jsonb, 2, 'active', 'LAO-2026-000012', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, '2026-06-16 14:16:10');
INSERT INTO anuncios (id, titulo, descricao, preco, marca, estado, contacto, categoria, imagem, galeria, usuario_id, status, codigo, ano, quilometragem, combustivel, caixa, tracao, cor, portas, lotacao, versao, modelo, localizacao, negociavel, equipamentos, descricao_completa, destaque, "createdAt") VALUES (16, 'sssssssssssssssssssssssss', 'sssssssssssssssssssssssss', 2222222.22, 'ssssssssssssssssssssss', 'sssssssssssssssssssssssssss', '22222222222222222222222', 'arrendamento', 'img-1781903666962-811246253.jpg', '["img-1781903666962-811246253.jpg", "img-1781903668265-397537044.jpg", "img-1781903668932-373630042.jpg"]'::jsonb, 6, 'active', 'LAO-2026-000016', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 0, '2026-06-19 21:14:29');

-- comentarios: 2
INSERT INTO comentarios (id, anuncio_id, usuario_id, conteudo, "createdAt", resposta_id) VALUES (1, 16, 9, 'good', '2026-06-24 20:03:46', NULL);
INSERT INTO comentarios (id, anuncio_id, usuario_id, conteudo, "createdAt", resposta_id) VALUES (2, 16, 6, 'yep', '2026-06-24 21:38:22', 1);

-- notificacoes: 49
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (1, 3, 'success', 'Anúncio Aprovado', 'O teu anúncio "IPHONE 14 PRO" foi aprovado e já está publicado!', 2, 1, '2026-06-08 10:52:04', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (2, 2, 'info', 'IMPORTANTE', 'Não existem nenhuma ação de pagamento dentro do site, o site serve apenas de intermediário entre o comprador e o vendedor. Qualquer solicitação de pagamento por parte de vendedores é classificada como FRAUDE.

Denuncie!', NULL, 1, '2026-06-08 20:43:19', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (3, 1, 'info', 'IMPORTANTE', 'Não existem nenhuma ação de pagamento dentro do site, o site serve apenas de intermediário entre o comprador e o vendedor. Qualquer solicitação de pagamento por parte de vendedores é classificada como FRAUDE.

Denuncie!', NULL, 0, '2026-06-08 20:43:19', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (4, 3, 'info', 'IMPORTANTE', 'Não existem nenhuma ação de pagamento dentro do site, o site serve apenas de intermediário entre o comprador e o vendedor. Qualquer solicitação de pagamento por parte de vendedores é classificada como FRAUDE.

Denuncie!', NULL, 1, '2026-06-08 20:43:19', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (5, 3, 'success', 'Anúncio Aprovado', 'O teu anúncio "Iphone 14 pro" foi aprovado!', 6, 0, '2026-06-09 19:01:22', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (6, 2, 'info', 'BEM-VINDO!', 'Seja bem-vindo ao LinkAO-Market O local mais fácil para procurar ou encontrar produtos, serviços ou clientes para os teus produtos e serviços!', NULL, 1, '2026-06-10 08:48:17', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (8, 3, 'info', 'BEM-VINDO!', 'Seja bem-vindo ao LinkAO-Market O local mais fácil para procurar ou encontrar produtos, serviços ou clientes para os teus produtos e serviços!', NULL, 0, '2026-06-10 08:48:18', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (9, 5, 'success', 'Anúncio Aprovado', 'O teu anúncio "Casa T3" foi aprovado!', 7, 1, '2026-06-10 10:12:22', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (10, 2, 'info', 'OLÁ!', 'Seja bem-vindo ao LinkAO-Market O local mais fácil para procurar ou encontrar produtos, serviços ou clientes para os teus produtos e serviços!', NULL, 1, '2026-06-11 20:24:39', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (12, 3, 'info', 'OLÁ!', 'Seja bem-vindo ao LinkAO-Market O local mais fácil para procurar ou encontrar produtos, serviços ou clientes para os teus produtos e serviços!', NULL, 0, '2026-06-11 20:24:39', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (13, 5, 'info', 'OLÁ!', 'Seja bem-vindo ao LinkAO-Market O local mais fácil para procurar ou encontrar produtos, serviços ou clientes para os teus produtos e serviços!', NULL, 0, '2026-06-11 20:24:39', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (15, 2, 'info', 'OLÁ!', 'Seja bem-vindo ao LinkAO-Market O local mais fácil para procurar ou encontrar produtos, serviços ou clientes para os teus produtos e serviços!', NULL, 1, '2026-06-12 20:21:26', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (18, 5, 'info', 'OLÁ!', 'Seja bem-vindo ao LinkAO-Market O local mais fácil para procurar ou encontrar produtos, serviços ou clientes para os teus produtos e serviços!', NULL, 0, '2026-06-12 20:21:27', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (19, 2, 'success', 'Anúncio Aprovado', 'O teu anúncio "HYUNDAI I10" foi aprovado!', 9, 1, '2026-06-12 20:50:06', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (20, 6, 'error', 'Anúncio Rejeitado', 'O teu anúncio "IPHONE 11 PRO" foi rejeitado. Motivo: Produto não identificado corretamente', 10, 0, '2026-06-12 21:03:49', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (21, 2, 'info', 'IMPORTANTE', 'Prefira sempre locais públicos(super mercados, hospitais, esquadra móvel, escolas, etc.) para a realização de trocas, a sua SEGURANÇA, É PRIORIDADE.', NULL, 1, '2026-06-12 21:54:51', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (22, 6, 'info', 'IMPORTANTE', 'Prefira sempre locais públicos(super mercados, hospitais, esquadra móvel, escolas, etc.) para a realização de trocas, a sua SEGURANÇA, É PRIORIDADE.', NULL, 0, '2026-06-12 21:54:52', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (24, 7, 'info', 'IMPORTANTE', 'Prefira sempre locais públicos(super mercados, hospitais, esquadra móvel, escolas, etc.) para a realização de trocas, a sua SEGURANÇA, É PRIORIDADE.', NULL, 1, '2026-06-12 21:54:52', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (25, 5, 'info', 'IMPORTANTE', 'Prefira sempre locais públicos(super mercados, hospitais, esquadra móvel, escolas, etc.) para a realização de trocas, a sua SEGURANÇA, É PRIORIDADE.', NULL, 0, '2026-06-12 21:54:52', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (26, 2, 'info', 'IMPORTANTE', 'Prefira sempre locais públicos para a realização de trocas, a SUA SEGURANÇA É PRIORIDADE', NULL, 1, '2026-06-14 13:21:46', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (27, 6, 'info', 'IMPORTANTE', 'Prefira sempre locais públicos para a realização de trocas, a SUA SEGURANÇA É PRIORIDADE', NULL, 0, '2026-06-14 13:21:46', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (29, 8, 'info', 'IMPORTANTE', 'Prefira sempre locais públicos para a realização de trocas, a SUA SEGURANÇA É PRIORIDADE', NULL, 1, '2026-06-14 13:21:47', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (30, 7, 'info', 'IMPORTANTE', 'Prefira sempre locais públicos para a realização de trocas, a SUA SEGURANÇA É PRIORIDADE', NULL, 0, '2026-06-14 13:21:47', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (31, 5, 'info', 'IMPORTANTE', 'Prefira sempre locais públicos para a realização de trocas, a SUA SEGURANÇA É PRIORIDADE', NULL, 0, '2026-06-14 13:21:47', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (32, 2, 'info', 'BEM-VINDO', 'NAVEGUE E ENCONTRE FACILMENTE O QUE VOCÊ DESEJA ADQUIRIR', NULL, 1, '2026-06-14 17:01:21', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (33, 5, 'info', 'BEM-VINDO', 'NAVEGUE E ENCONTRE FACILMENTE O QUE VOCÊ DESEJA ADQUIRIR', NULL, 0, '2026-06-14 17:01:21', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (34, 6, 'info', 'BEM-VINDO', 'NAVEGUE E ENCONTRE FACILMENTE O QUE VOCÊ DESEJA ADQUIRIR', NULL, 0, '2026-06-14 17:01:21', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (35, 7, 'info', 'BEM-VINDO', 'NAVEGUE E ENCONTRE FACILMENTE O QUE VOCÊ DESEJA ADQUIRIR', NULL, 0, '2026-06-14 17:01:22', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (36, 8, 'info', 'BEM-VINDO', 'NAVEGUE E ENCONTRE FACILMENTE O QUE VOCÊ DESEJA ADQUIRIR', NULL, 0, '2026-06-14 17:01:22', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (37, 2, 'success', 'Anúncio Aprovado', 'O teu anúncio "SAMSUNG S22 ULTRA" foi aprovado!', 12, 1, '2026-06-16 14:16:59', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (38, 2, 'error', 'Anúncio Rejeitado', 'O teu anúncio "SAMSUNG S22 ULTRA" foi rejeitado. Motivo: Anúncio já existente.', 11, 1, '2026-06-16 14:17:38', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (39, 5, 'info', 'NAVEGUE COM SEGURANÇA', 'NÃO PARTILHE INFORMAÇÕES PESSOAIS COMO: IBAN, NÚMERO DO BI OU OUTRAS INFORMAÇÕES NÃO MENSIONADAS NOS NOSSO TERMOS.

LEMBRE-SE: A SUA SEGURANÇA É PRIORIDADE!', NULL, 0, '2026-06-16 16:08:27', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (40, 6, 'info', 'NAVEGUE COM SEGURANÇA', 'NÃO PARTILHE INFORMAÇÕES PESSOAIS COMO: IBAN, NÚMERO DO BI OU OUTRAS INFORMAÇÕES NÃO MENSIONADAS NOS NOSSO TERMOS.

LEMBRE-SE: A SUA SEGURANÇA É PRIORIDADE!', NULL, 0, '2026-06-16 16:08:28', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (41, 7, 'info', 'NAVEGUE COM SEGURANÇA', 'NÃO PARTILHE INFORMAÇÕES PESSOAIS COMO: IBAN, NÚMERO DO BI OU OUTRAS INFORMAÇÕES NÃO MENSIONADAS NOS NOSSO TERMOS.

LEMBRE-SE: A SUA SEGURANÇA É PRIORIDADE!', NULL, 0, '2026-06-16 16:08:28', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (42, 8, 'info', 'NAVEGUE COM SEGURANÇA', 'NÃO PARTILHE INFORMAÇÕES PESSOAIS COMO: IBAN, NÚMERO DO BI OU OUTRAS INFORMAÇÕES NÃO MENSIONADAS NOS NOSSO TERMOS.

LEMBRE-SE: A SUA SEGURANÇA É PRIORIDADE!', NULL, 0, '2026-06-16 16:08:28', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (44, 6, 'info', 'NAVEGUE COM SEGURANÇA', 'NÃO PARTILHE INFORMAÇÕES PESSOAIS COMO: IBAN, NÚMERO DO BI O...', NULL, 0, '2026-06-18 19:43:44', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (45, 7, 'info', 'NAVEGUE COM SEGURANÇA', 'NÃO PARTILHE INFORMAÇÕES PESSOAIS COMO: IBAN, NÚMERO DO BI O...', NULL, 0, '2026-06-18 19:43:44', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (46, 8, 'info', 'NAVEGUE COM SEGURANÇA', 'NÃO PARTILHE INFORMAÇÕES PESSOAIS COMO: IBAN, NÚMERO DO BI O...', NULL, 0, '2026-06-18 19:43:44', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (48, 9, 'info', 'BEM-VINDO', 'O LinkAO Market é uma plataforma que visa ajudar os angolanos na procura e encontro de bens e serviços', NULL, 0, '2026-06-18 19:50:42', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (49, 2, 'info', 'OLÁ', 'Seja bem-vindo ao LinkAO-Market O local mais fácil para procurar ou encontrar produtos, serviços ou clientes para os teus produtos e serviços!', NULL, 0, '2026-06-18 19:52:47', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (50, 5, 'info', 'OLÁ', 'Seja bem-vindo ao LinkAO-Market O local mais fácil para procurar ou encontrar produtos, serviços ou clientes para os teus produtos e serviços!', NULL, 0, '2026-06-18 19:52:47', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (51, 6, 'info', 'OLÁ', 'Seja bem-vindo ao LinkAO-Market O local mais fácil para procurar ou encontrar produtos, serviços ou clientes para os teus produtos e serviços!', NULL, 0, '2026-06-18 19:52:47', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (52, 7, 'info', 'OLÁ', 'Seja bem-vindo ao LinkAO-Market O local mais fácil para procurar ou encontrar produtos, serviços ou clientes para os teus produtos e serviços!', NULL, 0, '2026-06-18 19:52:48', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (53, 6, 'error', 'Anúncio Rejeitado', 'O teu anúncio "dddddddddddddddddddddddddddddd" foi rejeitado. Motivo: Informações distorcidas', 14, 0, '2026-06-19 22:02:30', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (54, 9, 'info', 'Nova Resposta', 'Suzaltina respondeu ao teu comentário em "sssssssssssssssssssssssss"', 16, 0, '2026-06-24 21:38:22', 2, 'resposta');
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (55, 9, 'success', 'Anúncio Aprovado', 'O teu anúncio "bbbbbbbbbbbbbbbbbbbbbbbb" foi aprovado!', 17, 0, '2026-06-25 00:30:53', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (56, 10, 'info', 'Bem-vindo ao LinkAO! 🎉', 'Olá Adriano Marcial! A sua conta foi criada com sucesso. Explore anúncios, publique os seus produtos e aproveite a plataforma. Qualquer dúvida, estamos aqui para ajudar!', NULL, 0, '2026-08-07 19:03:04', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (57, 10, 'info', 'Dica: Como criar o seu primeiro anúncio', 'Clique em "Vender" no menu para criar o seu primeiro anúncio. É rápido e fácil! Adicione fotos, descrição e preço para alcançar mais compradores.', NULL, 0, '2026-08-07 19:03:04', NULL, NULL);
INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, anuncio_id, lida, "createdAt", referencia_id, referencia_tipo) VALUES (58, 10, 'info', 'Complete o seu perfil', 'Adicione uma foto e mais informações ao seu perfil para aumentar a confiança dos outros utilizadores.', NULL, 1, '2026-08-07 19:03:05', NULL, NULL);

-- sessoes_ativas: 2
INSERT INTO sessoes_ativas (id, sessao_id, usuario_id, ip, user_agent, "ultima_atividade", "createdAt") VALUES (3919, '83e1d60c-ce92-4645-ad59-d3a5650e83d3', NULL, '129.122.220.17', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-13T13:48:15.694Z', '2026-08-07 16:39:40');
INSERT INTO sessoes_ativas (id, sessao_id, usuario_id, ip, user_agent, "ultima_atividade", "createdAt") VALUES (4109, '20d16d68-8ade-421e-8602-09bfc901ecab', 9, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '2026-08-28T22:20:04.970Z', '2026-08-28 22:18:45');

-- visitas: 163
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4423, '102.215.180.214', '2026-06-25 00:43:15', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4424, '102.215.180.214', '2026-06-25 00:43:23', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4425, '102.215.180.214', '2026-06-25 00:43:40', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4426, '102.215.180.214', '2026-06-25 00:46:33', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4427, '102.215.180.214', '2026-06-25 00:48:29', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4428, '102.215.180.214', '2026-06-25 00:48:58', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4429, '66.249.93.9', '2026-06-25 00:49:29', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4430, '66.102.9.34', '2026-06-25 00:49:30', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4431, '66.102.9.35', '2026-06-25 00:49:31', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4432, '66.102.9.36', '2026-06-25 00:49:38', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4433, '74.125.208.201', '2026-06-25 00:53:27', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4434, '74.125.208.193', '2026-06-25 00:53:28', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4435, '66.102.9.32', '2026-06-25 00:53:28', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4436, '66.102.9.36', '2026-06-25 00:53:31', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4437, '102.215.180.214', '2026-06-25 20:34:54', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4438, '102.215.180.214', '2026-06-25 20:34:57', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4439, '102.215.180.214', '2026-06-25 20:35:47', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4440, '102.215.180.214', '2026-06-25 20:40:53', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4441, '102.215.180.214', '2026-06-25 20:40:55', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4442, '102.215.180.214', '2026-06-25 20:42:24', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4443, '102.215.180.214', '2026-06-25 20:49:06', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4444, '102.215.180.214', '2026-06-25 20:54:58', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4445, '102.215.180.214', '2026-06-25 20:54:59', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4446, '102.215.180.214', '2026-06-25 22:57:17', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4447, '102.215.180.214', '2026-06-25 22:57:23', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4448, '102.215.180.214', '2026-06-25 23:03:27', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4449, '102.215.180.214', '2026-06-25 23:04:33', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4450, '102.215.180.214', '2026-06-25 23:09:36', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4451, '102.215.180.214', '2026-06-25 23:09:37', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4452, '102.215.180.214', '2026-06-25 23:49:46', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4453, '102.215.180.214', '2026-06-25 23:49:47', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4454, '102.215.180.214', '2026-06-25 23:50:23', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4455, '102.215.180.214', '2026-06-25 23:57:57', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4456, '102.215.180.214', '2026-06-26 00:04:16', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4457, '102.215.180.214', '2026-06-26 00:04:18', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4458, '102.215.180.214', '2026-06-26 00:16:49', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4459, '102.215.180.214', '2026-06-26 00:16:52', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4460, '102.215.180.214', '2026-06-26 00:50:07', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4461, '::1', '2026-06-26 20:35:15', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4462, '::1', '2026-06-26 20:35:24', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4463, '102.215.180.214', '2026-06-26 20:48:06', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4464, '102.215.180.214', '2026-06-26 20:48:09', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4465, '102.215.180.214', '2026-06-26 21:21:22', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4466, '102.215.180.214', '2026-06-26 21:21:26', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4467, '102.215.180.214', '2026-06-26 21:25:32', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4468, '102.215.180.214', '2026-06-26 21:27:21', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4469, '102.215.180.214', '2026-06-26 21:32:25', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4470, '102.215.180.214', '2026-06-26 21:32:27', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4471, '102.215.180.214', '2026-06-26 21:38:01', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4472, '102.215.180.214', '2026-06-26 21:39:50', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4473, '102.215.180.214', '2026-06-26 21:44:37', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4474, '102.215.180.214', '2026-06-26 21:45:05', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4475, '102.215.180.214', '2026-06-26 21:49:52', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4476, '102.215.180.214', '2026-06-26 21:56:43', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4477, '102.215.180.214', '2026-06-26 21:56:44', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4478, '102.215.180.214', '2026-06-26 21:57:45', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4479, '102.215.180.214', '2026-06-26 22:02:01', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4480, '102.215.180.214', '2026-06-26 22:02:03', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4481, '102.215.180.214', '2026-06-26 22:27:57', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4482, '102.215.180.214', '2026-06-26 22:27:58', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4483, '102.215.180.214', '2026-06-26 22:33:23', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4484, '102.215.180.214', '2026-06-26 22:33:27', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4485, '102.215.180.214', '2026-06-26 22:45:02', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4486, '102.215.180.214', '2026-06-26 22:45:05', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4487, '102.215.180.214', '2026-06-26 22:56:20', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4488, '102.215.180.214', '2026-06-26 22:56:22', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4489, '102.215.180.214', '2026-06-26 23:01:22', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4490, '102.215.180.214', '2026-06-26 23:04:51', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4491, '102.215.180.214', '2026-06-26 23:06:28', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4492, '102.215.180.214', '2026-06-26 23:11:40', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4493, '102.215.180.214', '2026-06-26 23:17:10', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4494, '102.215.180.214', '2026-06-26 23:17:45', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4495, '102.215.180.214', '2026-06-26 23:19:21', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4496, '102.215.180.214', '2026-06-26 23:22:38', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4497, '102.215.180.214', '2026-07-02 17:21:48', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4498, '102.215.180.214', '2026-07-02 17:23:34', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4499, '102.215.180.214', '2026-07-02 17:24:59', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4500, '102.215.180.214', '2026-07-02 17:27:05', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4501, '102.215.180.214', '2026-07-02 17:30:14', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4502, '102.215.180.214', '2026-07-02 17:39:27', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4503, '102.215.180.214', '2026-07-02 18:45:06', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4504, '102.215.180.214', '2026-07-02 18:45:36', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4505, '129.122.220.17', '2026-07-27 20:06:12', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4506, '129.122.220.17', '2026-07-27 20:06:19', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4507, '129.122.220.17', '2026-07-27 20:07:58', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4508, '129.122.220.17', '2026-07-27 20:11:17', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4509, '129.122.220.17', '2026-07-27 20:11:50', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4510, '::1', '2026-08-01 12:56:09', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4511, '::1', '2026-08-01 12:56:21', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4512, '::1', '2026-08-01 23:19:06', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4513, '::1', '2026-08-01 23:24:15', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4514, '::1', '2026-08-01 23:29:55', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4515, '::1', '2026-08-01 23:36:22', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4516, '::1', '2026-08-01 23:36:26', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4517, '::1', '2026-08-01 23:42:30', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4518, '::1', '2026-08-01 23:42:30', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4519, '::1', '2026-08-07 15:53:58', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4520, '::1', '2026-08-07 16:00:00', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4521, '::1', '2026-08-07 16:05:30', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4522, '::1', '2026-08-07 16:05:32', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4523, '::1', '2026-08-07 16:17:07', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4524, '::1', '2026-08-07 16:17:38', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4525, '::1', '2026-08-07 16:31:09', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4526, '::1', '2026-08-07 16:31:17', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4527, '129.122.220.17', '2026-08-07 16:37:25', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4528, '129.122.220.17', '2026-08-07 16:39:41', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4529, '::1', '2026-08-07 16:42:26', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4530, '129.122.220.17', '2026-08-07 16:52:12', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4531, '129.122.220.17', '2026-08-07 16:52:26', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4532, '129.122.220.17', '2026-08-07 16:57:54', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4533, '129.122.220.17', '2026-08-07 17:01:39', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4534, '129.122.220.17', '2026-08-07 17:03:37', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4535, '129.122.220.17', '2026-08-07 17:08:48', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4536, '129.122.220.17', '2026-08-07 17:09:01', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4537, '2c0f:f888:a001:933d:4f66:1ada:f398:afcd', '2026-08-07 17:34:40', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4538, '2c0f:f888:a001:933d:4f66:1ada:f398:afcd', '2026-08-07 17:35:18', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4539, '129.122.220.17', '2026-08-07 18:16:31', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4540, '2c0f:f888:a001:933d:4f66:1ada:f398:afcd', '2026-08-07 18:25:18', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4541, '102.218.85.43', '2026-08-07 18:36:38', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4542, '102.218.85.43', '2026-08-07 18:37:19', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4543, '129.122.220.17', '2026-08-07 18:53:26', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4544, '129.122.220.17', '2026-08-07 18:53:57', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4545, '2c0f:f888:a001:933d:4f66:1ada:f398:afcd', '2026-08-07 18:57:10', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4546, '2c0f:f888:a001:933d:4f66:1ada:f398:afcd', '2026-08-07 18:57:21', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4547, '74.125.208.196', '2026-08-07 18:57:23', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4548, '74.125.208.192', '2026-08-07 18:57:23', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4549, '66.102.6.1', '2026-08-07 18:57:23', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4550, '74.125.208.192', '2026-08-07 18:57:26', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4551, '74.125.208.197', '2026-08-07 18:57:57', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4552, '66.102.9.32', '2026-08-07 18:57:57', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4553, '66.102.8.71', '2026-08-07 18:57:57', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4554, '66.102.8.70', '2026-08-07 18:58:01', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4555, '66.102.8.67', '2026-08-07 18:58:02', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4556, '2c0f:f888:a001:933d:4f66:1ada:f398:afcd', '2026-08-07 19:03:06', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4557, '2c0f:f888:a001:933d:4f66:1ada:f398:afcd', '2026-08-07 19:03:07', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4558, '2c0f:f888:a001:933d:4f66:1ada:f398:afcd', '2026-08-07 19:08:21', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4559, '66.249.93.5', '2026-08-07 19:08:24', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4560, '66.102.8.70', '2026-08-07 19:08:25', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4561, '66.102.8.65', '2026-08-07 19:08:25', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4562, '66.102.8.64', '2026-08-07 19:08:26', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4563, '66.102.8.71', '2026-08-07 19:08:28', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4564, '129.122.220.17', '2026-08-07 19:26:06', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4565, '129.122.220.17', '2026-08-07 19:41:42', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4566, '129.122.220.17', '2026-08-07 19:41:47', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4567, '::1', '2026-08-07 21:40:49', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4568, '::1', '2026-08-07 21:43:30', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4569, '::1', '2026-08-07 21:45:58', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4570, '129.122.220.17', '2026-08-07 21:48:13', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4571, '129.122.220.17', '2026-08-07 21:48:27', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4572, '129.122.220.17', '2026-08-07 21:53:55', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4573, '129.122.220.17', '2026-08-07 21:53:58', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4574, '::1', '2026-08-07 21:57:18', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4575, '129.122.220.17', '2026-08-11 22:37:08', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4576, '129.122.220.17', '2026-08-11 22:37:28', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4577, '129.122.220.17', '2026-08-11 22:42:24', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4578, '129.122.220.17', '2026-08-11 22:42:36', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4579, '129.122.220.17', '2026-08-13 12:22:08', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4580, '129.122.220.17', '2026-08-13 12:22:30', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4581, '129.122.220.17', '2026-08-13 13:41:22', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4582, '129.122.220.17', '2026-08-13 13:42:08', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4583, '::1', '2026-08-15 17:06:42', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4584, '::1', '2026-08-28 22:18:32', NULL);
INSERT INTO visitas (id, ip, "createdAt", visitor_id) VALUES (4585, '::1', '2026-08-28 22:18:45', NULL);

-- popups: 3
INSERT INTO popups (id, titulo, conteudo, ativo, "createdAt") VALUES (3, 'NAVEGUE COM SEGURANÇA', 'NÃO PARTILHE INFORMAÇÕES PESSOAIS PARA COMO: IBAN, NÚMERO DO BI, ETC.', 1, '2026-06-14 17:03:39');
INSERT INTO popups (id, titulo, conteudo, ativo, "createdAt") VALUES (4, 'NAVEGUE COM SEGURANÇA', 'NÃO PARTILHE INFORMAÇÕES PESSOAIS COMO: IBAN, NÚMERO DO BI OU OUTRAS INFORMAÇÕES NÃO MENSIONADAS NOS NOSSO TERMOS. LEMBRE-SE: A SUA SEGURANÇA É PRIORIDADE!', 1, '2026-06-16 16:12:53');
INSERT INTO popups (id, titulo, conteudo, ativo, "createdAt") VALUES (5, 'NAVEGUE COM SEGURANÇA', 'O site serve apenas como intermediário entre compradores e vendedores, não efetue nenhum pagamento a vendedores sem antes ter em posse o bem.', 1, '2026-06-18 19:46:30');

-- popups_vistos: 20
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (1, 2, 2, '2026-06-09 18:49:48');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (2, 3, 2, '2026-06-09 18:50:46');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (3, 2, 3, '2026-06-14 17:04:21');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (4, 5, 3, '2026-06-14 17:07:31');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (5, 4, 3, '2026-06-16 13:03:28');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (6, 5, 4, '2026-06-16 16:13:16');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (7, 6, 4, '2026-06-16 18:11:15');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (8, 6, 3, '2026-06-16 18:11:39');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (9, 2, 4, '2026-06-17 10:35:31');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (10, 9, 3, '2026-06-18 01:08:42');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (11, 9, 4, '2026-06-18 01:08:44');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (12, 9, 5, '2026-06-18 19:47:22');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (13, 2, 5, '2026-06-18 19:51:14');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (14, 4, 5, '2026-06-18 20:16:33');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (15, 4, 4, '2026-06-18 20:16:43');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (16, 6, 5, '2026-06-19 16:07:23');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (17, 9, 6, '2026-06-26 21:57:30');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (18, 10, 3, '2026-08-07 19:03:04');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (19, 10, 4, '2026-08-07 19:03:04');
INSERT INTO popups_vistos (id, usuario_id, popup_id, "createdAt") VALUES (20, 10, 5, '2026-08-07 19:03:04');

-- comunicados: 1
INSERT INTO comunicados (id, titulo, conteudo, tipo, "createdAt") VALUES (14, 'OLÁ!', 'Seja bem-vindo ao LinkAO-Market O local mais fácil para procurar ou encontrar produtos, serviços ou clientes para os teus produtos e serviços!', 'notificacao', '2026-06-12 20:21:26');

SELECT setval(pg_get_serial_sequence('usuarios','id'), COALESCE((SELECT MAX(id) FROM usuarios), 1), true);
SELECT setval(pg_get_serial_sequence('anuncios','id'), COALESCE((SELECT MAX(id) FROM anuncios), 1), true);
SELECT setval(pg_get_serial_sequence('comentarios','id'), COALESCE((SELECT MAX(id) FROM comentarios), 1), true);
SELECT setval(pg_get_serial_sequence('reacoes','id'), COALESCE((SELECT MAX(id) FROM reacoes), 1), true);
SELECT setval(pg_get_serial_sequence('seguidores','id'), COALESCE((SELECT MAX(id) FROM seguidores), 1), true);
SELECT setval(pg_get_serial_sequence('mensagens','id'), COALESCE((SELECT MAX(id) FROM mensagens), 1), true);
SELECT setval(pg_get_serial_sequence('notificacoes','id'), COALESCE((SELECT MAX(id) FROM notificacoes), 1), true);
SELECT setval(pg_get_serial_sequence('perfis_premium','id'), COALESCE((SELECT MAX(id) FROM perfis_premium), 1), true);
SELECT setval(pg_get_serial_sequence('avaliacoes','id'), COALESCE((SELECT MAX(id) FROM avaliacoes), 1), true);
SELECT setval(pg_get_serial_sequence('avaliacoes_denuncias','id'), COALESCE((SELECT MAX(id) FROM avaliacoes_denuncias), 1), true);
SELECT setval(pg_get_serial_sequence('denuncias','id'), COALESCE((SELECT MAX(id) FROM denuncias), 1), true);
SELECT setval(pg_get_serial_sequence('destaques','id'), COALESCE((SELECT MAX(id) FROM destaques), 1), true);
SELECT setval(pg_get_serial_sequence('verificacoes_pendentes','id'), COALESCE((SELECT MAX(id) FROM verificacoes_pendentes), 1), true);
SELECT setval(pg_get_serial_sequence('sessoes_ativas','id'), COALESCE((SELECT MAX(id) FROM sessoes_ativas), 1), true);
SELECT setval(pg_get_serial_sequence('visitas','id'), COALESCE((SELECT MAX(id) FROM visitas), 1), true);
SELECT setval(pg_get_serial_sequence('popups','id'), COALESCE((SELECT MAX(id) FROM popups), 1), true);
SELECT setval(pg_get_serial_sequence('popups_vistos','id'), COALESCE((SELECT MAX(id) FROM popups_vistos), 1), true);
SELECT setval(pg_get_serial_sequence('comunicados','id'), COALESCE((SELECT MAX(id) FROM comunicados), 1), true);
COMMIT;
