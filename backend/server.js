const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
require('dotenv').config();

const db = require('./config/db');
const { verificarToken, requireAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, cb) {
    if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Origem não autorizada'));
  },
  credentials: false
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: 'draft-8', legacyHeaders: false }));

const visitasRecentes = new Map();

// Vercel Cron: a eliminação agendada não pode depender de setInterval numa função serverless.
app.get('/api/cron/cleanup-accounts', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(503).json({ erro: 'CRON_SECRET não configurado' });
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${secret}`) return res.status(401).json({ erro: 'Não autorizado' });

  try {
    const result = await db.query(`
      DELETE FROM usuarios
      WHERE eliminacao_agendada = 1
        AND eliminacao_ate IS NOT NULL
        AND eliminacao_ate <= CURRENT_TIMESTAMP
      RETURNING id
    `);
    const sessions = await db.query(`DELETE FROM sessoes_ativas WHERE "ultima_atividade" < CURRENT_TIMESTAMP - INTERVAL '24 hours'`);
    res.json({ sucesso: true, eliminadas: result.rowCount, sessoes_expiradas: sessions.rowCount });
  } catch (err) {
    console.error('[CRON] Erro ao eliminar contas:', err.message);
    res.status(500).json({ erro: 'Erro ao executar limpeza' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, service: 'EZNY API', database: 'postgresql', environment: process.env.NODE_ENV || 'development' });
  } catch (err) {
    res.status(503).json({ ok: false, service: 'EZNY API', database: 'unavailable' });
  }
});

app.use((req, res, next) => {
  const isApi = req.path.startsWith('/api/');
  const isStatic = req.path.startsWith('/uploads/') || /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/i.test(req.path);
  if (req.method === 'GET' && !isApi && !isStatic) {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const now = Date.now();
    const last = visitasRecentes.get(ip);
    if (!last || now - last > 5 * 60 * 1000) {
      visitasRecentes.set(ip, now);
      db.run('INSERT INTO visitas (ip) VALUES (?)', [ip], () => {});
    }
  }
  next();
});

// API — cada router é montado uma única vez.
app.use('/api/auth', require('./routes/auth'));
app.use('/api/anuncios', require('./routes/anuncios'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/comunicados', require('./routes/comunicados'));
app.use('/api/mensagens', require('./routes/mensagens'));
app.use('/api/avaliacoes', require('./routes/avaliacoes'));
app.use('/api/premium', require('./routes/premium'));
app.use('/api/destaques', require('./routes/destaques'));
app.use('/api/pagamentos', require('./routes/pagamentos'));
app.use('/api/denuncias', require('./routes/denuncias'));
app.use('/api/notificacoes', require('./routes/notificacoes'));

// Upload local apenas para desenvolvimento. Em produção, migrar para armazenamento externo.
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
app.get(['/mensagens', '/mensagens/'], (req, res) => res.sendFile(path.join(__dirname, '../frontend/mensagens.html')));
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/stats', verificarToken, requireAdmin, (req, res) => {
  const stats = {};
  const q = [
    ['visitas', 'SELECT COUNT(*)::int AS total FROM visitas'],
    ['usuarios', 'SELECT COUNT(*)::int AS total FROM usuarios'],
    ['anuncios', 'SELECT COUNT(*)::int AS total FROM anuncios'],
    ['denuncias', 'SELECT COUNT(*)::int AS total FROM denuncias'],
    ['comunicados', 'SELECT COUNT(*)::int AS total FROM comunicados'],
    ['pagamentosPendentes', "SELECT COUNT(*)::int AS total FROM pagamentos WHERE status = 'pendente'"]
  ];
  Promise.all(q.map(([key, sql]) => db.query(sql).then(r => { stats[key] = r.rows[0]?.total || 0; })))
    .then(() => Promise.all([
      db.query(`SELECT DATE("createdAt") AS dia, COUNT(*)::int AS total FROM visitas WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days' GROUP BY DATE("createdAt") ORDER BY dia`),
      db.query(`SELECT categoria, COUNT(*)::int AS total FROM anuncios GROUP BY categoria`),
      db.query(`SELECT DATE("createdAt") AS dia, COUNT(*)::int AS total FROM anuncios WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days' GROUP BY DATE("createdAt") ORDER BY dia`),
      db.query(`SELECT COUNT(*)::int AS total FROM usuarios WHERE DATE("createdAt") = CURRENT_DATE`),
      db.query(`SELECT COUNT(*)::int AS total FROM anuncios WHERE DATE("createdAt") = CURRENT_DATE`),
      db.query(`SELECT COUNT(DISTINCT sessao_id)::int AS total, COUNT(DISTINCT CASE WHEN usuario_id IS NOT NULL THEN sessao_id END)::int AS autenticados, COUNT(DISTINCT CASE WHEN usuario_id IS NULL THEN sessao_id END)::int AS visitantes FROM sessoes_ativas WHERE "ultima_atividade" >= CURRENT_TIMESTAMP - INTERVAL '2 minutes'`)
    ]))
    .then(([vis7, cat, an7, nu, na, online]) => {
      stats.visitas7d = vis7.rows; stats.anunciosPorCategoria = cat.rows; stats.anuncios7d = an7.rows;
      stats.novosUsuariosHoje = nu.rows[0]?.total || 0; stats.novosAnunciosHoje = na.rows[0]?.total || 0;
      stats.online = online.rows[0] || {total:0,autenticados:0,visitantes:0};
      res.json(stats);
    })
    .catch(err => { console.error('[STATS]', err); res.status(500).json({ erro: 'Erro ao obter estatísticas' }); });
});

app.get('/api/stats/visitas', verificarToken, requireAdmin, async (req, res) => {
  const dias = Math.min(365, Math.max(1, Number.parseInt(req.query.dias, 10) || 7));
  try {
    const r = await db.query(`SELECT DATE("createdAt") AS dia, COUNT(*)::int AS total FROM visitas WHERE "createdAt" >= CURRENT_DATE - ($1::int * INTERVAL '1 day') GROUP BY DATE("createdAt") ORDER BY dia`, [dias]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ erro: 'Erro ao buscar visitas' }); }
});

app.post('/api/stats/visitas/reset', verificarToken, requireAdmin, (req, res) => {
  db.run('DELETE FROM visitas', [], function(err) {
    if (err) return res.status(500).json({ erro: 'Erro ao limpar visitas' });
    res.json({ sucesso: true, apagadas: this.changes });
  });
});

app.get('/api/stats/crescimento', verificarToken, requireAdmin, async (req, res) => {
  try {
    const [a, v] = await Promise.all([
      db.query(`SELECT to_char("createdAt", 'YYYY-MM') AS mes, COUNT(*)::int AS total FROM anuncios WHERE "createdAt" >= CURRENT_DATE - INTERVAL '12 months' GROUP BY 1 ORDER BY 1`),
      db.query(`SELECT to_char("createdAt", 'YYYY-MM') AS mes, COUNT(*)::int AS total FROM visitas WHERE "createdAt" >= CURRENT_DATE - INTERVAL '12 months' GROUP BY 1 ORDER BY 1`)
    ]);
    res.json({ anuncios: a.rows, visitas: v.rows });
  } catch (e) { res.status(500).json({ erro: 'Erro ao obter crescimento' }); }
});

function gerarSessaoId(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const ua = req.headers['user-agent'] || 'unknown';
  return crypto.createHash('sha256').update(ip + ua).digest('hex');
}

app.post('/api/visit', (req, res) => {
  const visitorId = String(req.body?.visitorId || '').slice(0, 128);
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const key = visitorId || ip;
  const now = Date.now();
  const last = visitasRecentes.get(key);
  if (last && now - last <= 5 * 60 * 1000) return res.json({ sucesso: false, motivo: 'Visita já registada recentemente' });
  visitasRecentes.set(key, now);
  db.run('INSERT INTO visitas (ip, visitor_id) VALUES (?, ?)', [ip, visitorId || null], function(err) {
    if (err) return res.status(500).json({ erro: 'Erro ao registar visita' });
    res.json({ sucesso: true });
  });
});

app.post('/api/sessao/heartbeat', async (req, res) => {
  const sessaoId = String(req.body?.sessao_id || gerarSessaoId(req)).slice(0, 128);
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const userAgent = String(req.headers['user-agent'] || 'unknown').slice(0, 500);

  // Nunca confiar em usuario_id enviado pelo browser: um visitante poderia
  // falsificar a atividade de outra conta. O ID autenticado é obtido do JWT.
  let usuarioId = null;
  const authorization = String(req.headers.authorization || '');
  if (/^Bearer\s+.+$/i.test(authorization)) {
    try {
      const token = authorization.replace(/^Bearer\s+/i, '');
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'EZNY', audience: 'EZNY-web' });
      const id = Number(decoded.id);
      if (Number.isInteger(id) && id > 0) usuarioId = id;
    } catch (_) {
      // Heartbeat de visitante continua permitido; token inválido não autentica ninguém.
    }
  }

  try {
    await db.query(`INSERT INTO sessoes_ativas (sessao_id, usuario_id, ip, user_agent, "ultima_atividade") VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT(sessao_id) DO UPDATE SET "ultima_atividade"=EXCLUDED."ultima_atividade", usuario_id=COALESCE(EXCLUDED.usuario_id, sessoes_ativas.usuario_id), ip=EXCLUDED.ip, user_agent=EXCLUDED.user_agent`,
      [sessaoId, usuarioId, ip, userAgent]);
    res.json({ sucesso: true, sessao_id: sessaoId });
  } catch (err) {
    console.error('[SESSAO] Erro:', err.message);
    res.status(500).json({ erro: 'Erro ao registar atividade' });
  }
});

app.get('/api/utilizadores/ativos', async (req, res) => {
  const minutos = Math.min(60, Math.max(1, Number.parseInt(req.query.minutos, 10) || 2));
  try {
    const r = await db.query(`SELECT COUNT(DISTINCT sessao_id)::int AS total_ativos,
      COUNT(DISTINCT CASE WHEN usuario_id IS NOT NULL THEN sessao_id END)::int AS autenticados,
      COUNT(DISTINCT CASE WHEN usuario_id IS NULL THEN sessao_id END)::int AS visitantes
      FROM sessoes_ativas WHERE "ultima_atividade" >= CURRENT_TIMESTAMP - ($1::int * INTERVAL '1 minute')`, [minutos]);
    const row = r.rows[0];
    res.json({ total: row.total_ativos || 0, autenticados: row.autenticados || 0, visitantes: row.visitantes || 0, limite_minutos: minutos, timestamp: new Date().toISOString() });
  } catch (e) { res.status(500).json({ erro: 'Erro ao contar utilizadores' }); }
});


app.get('/api/admin/utilizadores-ativos', verificarToken, requireAdmin, async (req,res) => {
  const minutos = Math.min(15, Math.max(1, Number.parseInt(req.query.minutos,10) || 2));
  try {
    const r = await db.query(`SELECT s.usuario_id, u.nome, u.telefone, u.tipo_conta, u.avatar,
      MAX(s."ultima_atividade") AS ultima_atividade
      FROM sessoes_ativas s JOIN usuarios u ON u.id=s.usuario_id
      WHERE s.usuario_id IS NOT NULL AND s."ultima_atividade" >= CURRENT_TIMESTAMP - ($1::int * INTERVAL '1 minute')
      GROUP BY s.usuario_id,u.nome,u.telefone,u.tipo_conta,u.avatar
      ORDER BY ultima_atividade DESC`,[minutos]);
    const v = await db.query(`SELECT COUNT(DISTINCT sessao_id)::int AS total, COUNT(DISTINCT CASE WHEN usuario_id IS NOT NULL THEN sessao_id END)::int AS autenticados, COUNT(DISTINCT CASE WHEN usuario_id IS NULL THEN sessao_id END)::int AS visitantes FROM sessoes_ativas WHERE "ultima_atividade" >= CURRENT_TIMESTAMP - ($1::int * INTERVAL '1 minute')`,[minutos]);
    res.json({minutos, resumo:v.rows[0]||{total:0,autenticados:0,visitantes:0}, utilizadores:r.rows||[], timestamp:new Date().toISOString()});
  } catch(e) { console.error('[ADMIN][ATIVOS]',e); res.status(500).json({erro:'Erro ao carregar utilizadores ativos'}); }
});

app.use((req, res) => res.status(404).json({ erro: 'Endpoint não encontrado' }));
app.use((err, req, res, next) => {
  console.error('[EZNY]', err.message);
  res.status(err.status || 500).json({ erro: process.env.NODE_ENV === 'production' ? 'Erro interno' : 'Erro interno: ' + err.message });
});

if (require.main === module) app.listen(PORT, () => console.log(`EZNY API em http://localhost:${PORT}`));
module.exports = app;
