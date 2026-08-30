require('dotenv').config();
const db = require('../config/db');
(async () => {
  const expected = ['usuarios','anuncios','comentarios','reacoes','seguidores','mensagens','notificacoes','perfis_premium','avaliacoes','avaliacoes_denuncias','denuncias','destaques','verificacoes_pendentes','sessoes_ativas','visitas','popups','popups_vistos','comunicados','premium_historico','pagamentos','admin_logs'];
  try {
    const r = await db.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename = ANY($1::text[]) ORDER BY tablename`, [expected]);
    const found = r.rows.map(x=>x.tablename);
    const missing = expected.filter(x=>!found.includes(x));
    console.log(JSON.stringify({ok: missing.length===0, found, missing}, null, 2));
    process.exitCode = missing.length ? 1 : 0;
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await db.pool.end(); }
})();
