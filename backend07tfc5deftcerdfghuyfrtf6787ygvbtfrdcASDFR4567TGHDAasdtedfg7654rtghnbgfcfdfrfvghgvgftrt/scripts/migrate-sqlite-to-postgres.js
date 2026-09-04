require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const SERIAL_TABLES = [
  'usuarios','anuncios','comentarios','reacoes','seguidores','mensagens',
  'notificacoes','perfis_premium','avaliacoes','avaliacoes_denuncias',
  'denuncias','destaques','verificacoes_pendentes','sessoes_ativas','visitas',
  'popups','popups_vistos','comunicados','premium_historico','pagamentos','admin_logs'
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada.');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
  });

  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', ['ezny:migration']);
    const schema = fs.readFileSync(path.join(__dirname, '../../database/schema.postgres.sql'), 'utf8');
    const seed = fs.readFileSync(path.join(__dirname, '../../database/migration_seed.sql'), 'utf8');

    await client.query('BEGIN');
    try {
      console.log('[MIGRAÇÃO] A aplicar schema PostgreSQL...');
      await client.query(schema);
      console.log('[MIGRAÇÃO] A importar snapshot...');
      // O seed também é executável isoladamente e contém BEGIN/COMMIT.
      // Aqui removemos esse wrapper para manter schema + dados numa única transação.
      const seedSql = seed.replace(/^\s*BEGIN;\s*/i, '').replace(/\s*COMMIT;\s*$/i, '');
      await client.query(seedSql);

      for (const table of SERIAL_TABLES) {
        await client.query(`
          SELECT setval(
            pg_get_serial_sequence($1, 'id'),
            COALESCE((SELECT MAX(id) FROM ${table}), 1),
            EXISTS (SELECT 1 FROM ${table})
          )
        `, [table]);
      }

      await client.query('COMMIT');
      console.log('[MIGRAÇÃO] Concluída com sucesso.');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', ['ezny:migration']).catch(() => {});
    await client.end();
  }
}

main().catch(err => {
  console.error('[MIGRAÇÃO] FALHOU:', err.message);
  process.exit(1);
});
