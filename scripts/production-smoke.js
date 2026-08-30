require('dotenv').config();
const db = require('../backend/config/db');

(async () => {
  const checks = [];
  async function check(name, sql) {
    try { const r = await db.query(sql); checks.push({name, ok:true, value:r.rows[0] || null}); }
    catch (e) { checks.push({name, ok:false, error:e.message}); }
  }
  await check('database', 'SELECT current_database() AS database, current_user AS user');
  await check('schema_usuarios', "SELECT to_regclass('public.usuarios') AS table_name");
  await check('schema_anuncios', "SELECT to_regclass('public.anuncios') AS table_name");
  await check('schema_premium', "SELECT to_regclass('public.pagamentos') AS table_name, to_regclass('public.premium_historico') AS premium_historico");
  await check('schema_comunicados', "SELECT to_regclass('public.comunicados') AS table_name, to_regclass('public.comunicados_vistos') AS vistos");
  await check('schema_jsonb', "SELECT pg_typeof(atributos)::text AS atributos_type FROM anuncios LIMIT 1");
  await check('sequences', "SELECT COUNT(*)::int AS total FROM pg_class WHERE relkind='S' AND relname LIKE '%_id_seq'");
  const failed = checks.filter(x=>!x.ok || (x.value && Object.values(x.value).some(v=>v===null)));
  console.log(JSON.stringify({ok:failed.length===0, checks}, null, 2));
  await db.pool.end();
  process.exit(failed.length ? 1 : 0);
})().catch(e=>{console.error(e);process.exit(1)});
