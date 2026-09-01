const { Pool, types } = require('pg');

// PostgreSQL BIGINT/BIGSERIAL chega como string no pg por defeito.
// Os IDs do EZNY são seguros como Number e o frontend/backend comparam-nos como números.
types.setTypeParser(20, value => Number(value));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL não configurada. Configure a ligação PostgreSQL antes de iniciar o EZNY.');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PG_POOL_MAX || 5),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

function normalizeSql(sql) {
  let q = String(sql)
    .replace(/\bINSERT\s+OR\s+IGNORE\b/ig, 'INSERT')
    .replace(/datetime\(\s*'now'\s*\)/ig, 'CURRENT_TIMESTAMP')
    .replace(/datetime\(\s*now\s*\)/ig, 'CURRENT_TIMESTAMP')
    .replace(/datetime\(\s*([A-Za-z_][A-Za-z0-9_.]*)\s*\)/ig, '$1')
    .replace(/datetime\(\s*'now'\s*,\s*'-(\d+)\s+minutes'\s*\)/ig, "CURRENT_TIMESTAMP - INTERVAL '$1 minutes'")
    .replace(/date\(\s*'now'\s*\)/ig, 'CURRENT_DATE')
    .replace(/date\(\s*'now'\s*,\s*'-(\d+)\s+days'\s*\)/ig, "CURRENT_DATE - INTERVAL '$1 days'")
    .replace(/strftime\(\s*'%Y-%m'\s*,\s*([A-Za-z_][A-Za-z0-9_.]*)\s*\)/ig, "to_char($1, 'YYYY-MM')")
    .replace(/date\(\s*createdAt\s*\)/ig, 'DATE("createdAt")')
    .replace(/\b([A-Za-z_][A-Za-z0-9_]*)\.createdAt\b/g, '$1."createdAt"')
    .replace(/\b([A-Za-z_][A-Za-z0-9_]*)\.updatedAt\b/g, '$1."updatedAt"')
    .replace(/(?<![".])\bcreatedAt\b(?!["])/g, '"createdAt"')
    .replace(/(?<![".])\bupdatedAt\b(?!["])/g, '"updatedAt"')
    .replace(/\bvisitor_id\b/g, 'visitor_id');

  // SQLite uses ? placeholders; PostgreSQL uses $1, $2...
  let i = 0;
  q = q.replace(/\?/g, () => `$${++i}`);

// SQLite's INSERT OR IGNORE equivalent.
// Só ignorar conflitos quando o SQL original pediu explicitamente OR IGNORE.
if (/^\s*INSERT\s+OR\s+IGNORE\b/i.test(String(sql)) && !/\bON\s+CONFLICT\b/i.test(q)) {
  q = `${q.trim()} ON CONFLICT DO NOTHING`;
}
  return q;
}

function adaptRows(rows) {
  return rows.map(row => {
    // Keep the API shape expected by the existing frontend.
    return row;
  });
}

const db = {
  query(sql, params = []) {
    return pool.query(normalizeSql(sql), params);
  },

  get(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(normalizeSql(sql), params || [])
      .then(result => cb && cb(null, result.rows[0] || undefined))
      .catch(err => cb && cb(err));
  },

  all(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(normalizeSql(sql), params || [])
      .then(result => cb && cb(null, adaptRows(result.rows)))
      .catch(err => cb && cb(err));
  },

  run(sql, params, cb) {
    if (typeof params === 'function') { cb = params; params = []; }
    let query = normalizeSql(sql);
    const isInsert = /^\s*INSERT\b/i.test(query);
    if (isInsert && /\bRETURNING\b/i.test(query) === false) query += ' RETURNING id';

    pool.query(query, params || [])
      .then(result => {
        const context = {
          changes: result.rowCount || 0,
          lastID: result.rows?.[0]?.id ?? undefined
        };
        if (cb) cb.call(context, null);
      })
      .catch(err => { if (cb) cb.call({ changes: 0, lastID: undefined }, err); });
  },

  async transaction(work) {
    const client = await pool.connect();
    const txdb = {
      get: async (sql, params = []) => {
        const r = await client.query(normalizeSql(sql), params);
        return r.rows[0];
      },
      all: async (sql, params = []) => {
        const r = await client.query(normalizeSql(sql), params);
        return r.rows;
      },
      run: async (sql, params = []) => {
        let q = normalizeSql(sql);
        const isInsert = /^\s*INSERT\b/i.test(q);
        if (isInsert && !/\bRETURNING\b/i.test(q)) q += ' RETURNING id';
        const r = await client.query(q, params);
        return { changes: r.rowCount || 0, lastID: r.rows?.[0]?.id };
      }
    };
    try {
      await client.query('BEGIN');
      const result = await work(txdb);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  pool,
  normalizeSql
};

pool.on('error', err => console.error('[EZNY][PostgreSQL] Pool error:', err.message));

module.exports = db;
