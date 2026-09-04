# EZNY — publicação Vercel + Neon

## Arquitetura de produção

- Frontend estático em `frontend/`.
- API Express em `api/index.js`, executada como função Vercel.
- PostgreSQL persistente em Neon através de `DATABASE_URL`.
- Imagens em produção no Cloudinary; uploads locais existem apenas em desenvolvimento.
- O EZNY não processa pagamentos entre compradores e vendedores. A tabela `pagamentos` refere-se apenas a subscrições/serviços Premium da plataforma.

## Configuração no Vercel

Defina estas variáveis no projeto:

```env
NODE_ENV=production
DATABASE_URL=<NEON_DATABASE_URL>
JWT_SECRET=<GERAR_SECRET_FORTE>
CORS_ORIGINS=https://seu-dominio.vercel.app
BLOB_READ_WRITE_TOKEN=<VERCEL_BLOB_TOKEN>
CRON_SECRET=uma-chave-aleatoria-com-pelo-menos-32-caracteres
```

O `vercel.json` já encaminha `/api/*` para a função e `/` para o frontend. A rota `/mensagens` também está configurada.

## Migração

Para uma base Neon nova:

```bash
npm install
npm run migrate --prefix backend07tfc5deftcerdfghuyfrtf6787ygvbtfrdcASDFR4567TGHDAasdtedfg7654rtghnbgfcfdfrfvghgvgftrt
```

O script aplica o schema, importa o snapshot e sincroniza as sequências `BIGSERIAL`.

Para uma base que já contenha tabelas EZNY, faça primeiro um backup e confirme o estado das tabelas. O schema é idempotente para as alterações atuais, mas o snapshot de dados deve ser importado apenas quando esses dados ainda não existirem.

## Imagens

Configure `BLOB_READ_WRITE_TOKEN` no projeto Vercel. O backend07tfc5deftcerdfghuyfrtf6787ygvbtfrdcASDFR4567TGHDAasdtedfg7654rtghnbgfcfdfrfvghgvgftrt envia JPG, PNG e WebP até 5 MB por ficheiro, com máximo de 10 imagens por anúncio.

Os nomes antigos guardados no snapshot (por exemplo `img-...jpg`) não têm os ficheiros correspondentes no ZIP. Esses quatro anúncios precisam que as imagens originais sejam recuperadas/uploadadas antes da publicação para ficarem visíveis em produção.

## Cron

A eliminação definitiva das contas que aguardaram os 4 dias é feita por `/api/cron/cleanup-accounts`. O agendamento está em `vercel.json`. Isto substitui o `setInterval` do processo Node, que não é fiável em serverless.
