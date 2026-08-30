# EZNY

Marketplace onde compradores e vendedores entram em contacto diretamente.

## Modelo

- Sem taxas ou comissões sobre transações entre utilizadores.
- A EZNY não processa pagamentos entre compradores e vendedores.
- O sistema de pagamentos existente é apenas para serviços Premium da plataforma.

## Stack

- Frontend: HTML/CSS/JavaScript.
- API: Node.js + Express.
- Produção: Vercel.
- Base de dados: PostgreSQL/Neon.
- Imagens: Cloudinary.

## Arranque local

```bash
npm install
cp .env.example .env
npm start
```

Configure pelo menos `DATABASE_URL` e `JWT_SECRET`.

Consulte `VERCEL.md` para publicação e `database/MIGRACAO_POSTGRES.md` para a migração.

## Produção Vercel + Neon

Para a versão de produção, execute `database/schema.postgres.sql` na base Neon e configure as variáveis no projeto Vercel conforme `.env.example`. A aplicação usa PostgreSQL em runtime; imagens de utilizadores/anúncios/comunicados usam armazenamento externo configurado por Cloudinary. Consulte `AUDITORIA_FASE4_PRODUCAO.md` para as alterações de produção e categorias.

## Produção Vercel + Neon

- PostgreSQL: Neon via `DATABASE_URL`.
- Ficheiros: Vercel Blob via `BLOB_READ_WRITE_TOKEN`.
- Não usar disco local como armazenamento persistente em produção.
- O EZNY não processa pagamentos entre compradores e vendedores; Premium é um serviço separado da plataforma.
