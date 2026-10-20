# EZNY — Migração SQLite → PostgreSQL

A persistência de produção usa PostgreSQL via `pg` e `DATABASE_URL`.

## Migração recomendada

1. Crie uma base PostgreSQL no Neon.
2. Configure `DATABASE_URL` e `NODE_ENV=production`.
3. A partir da raiz do projeto:

```bash
npm install
npm run migrate --prefix backend07tfc5deftcerdfghuyfrtf6787ygvbtfrdcASDFR4567TGHDAasdtedfg7654rtghnbgfcfdfrfvghgvgftrt
npm run start
```

O script de migração:
- aplica `database/schema.postgres.sql`;
- importa `database/migration_seed.sql`;
- executa tudo numa transação;
- usa lock advisory para impedir duas migrações simultâneas;
- sincroniza todas as sequências `BIGSERIAL`.

**Importante:** o snapshot contém hashes de palavra-passe. Trate-o como material privado. Faça a migração numa base nova/vazia, ou valide previamente se os dados já existem.

## Verificação

```bash
cd backend07tfc5deftcerdfghuyfrtf6787ygvbtfrdcASDFR4567TGHDAasdtedfg7654rtghnbgfcfdfrfvghgvgftrt
node scripts/check-postgres.js
```

Depois:

```bash
npm start
```

Teste `GET /api/health`.

## Produção Vercel

Não dependa de SQLite nem de uploads locais. Configure:
- Neon para PostgreSQL;
- Vercel Blob para imagens;
- `JWT_SECRET`, `CORS_ORIGINS` e `CRON_SECRET`.

O EZNY continua a ser um marketplace de contacto: pagamentos entre utilizadores não passam pela plataforma. A área de pagamentos existente é exclusivamente para serviços Premium da própria EZNY.

## Atualizações do fluxo Premium e suporte

Para uma base já existente, execute `database/migrations/002-support-and-system-settings.sql` uma vez antes de publicar a versão que usa relatos de suporte, configurações administrativas e a referência Multicaixa separada. Para uma base nova, as tabelas e colunas também constam em `database/schema.postgres.sql`.

Configure no ambiente do backend `PAYMENT_ENTITY` e `PAYMENT_REFERENCE` com os dados oficiais da conta EZNY. Estes campos não devem ser guardados no código. A criação do pedido apenas apresenta os dados e grava uma referência interna única; o pagamento é feito fora do site, e um administrador deve verificar o recebimento e confirmar o pedido na área **Pagamentos**. A integração não recebe confirmação automática do Multicaixa Express.

Para envio de relatos por email, configure `SUPPORT_EMAIL_TO` e as variáveis `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM` a partir do modelo `.env.example`. Se o SMTP falhar ou não estiver configurado, o relato continua registado no painel e a resposta ao utilizador indica explicitamente que o email não foi enviado. Nunca publique as credenciais SMTP.
