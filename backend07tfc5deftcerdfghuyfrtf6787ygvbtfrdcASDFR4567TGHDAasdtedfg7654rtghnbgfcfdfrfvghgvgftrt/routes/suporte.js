const express = require('express');
const multer = require('multer');
const path = require('path');
const { z } = require('zod');
const db = require('../config/db');
const { verificarToken, requireAdmin } = require('../middleware/auth');
const { enviarEmail } = require('../services/email');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    const allowed = new Set([
      'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
      'text/plain', 'application/zip', 'application/x-zip-compressed'
    ]);
    if (!allowed.has(file.mimetype)) return callback(new Error('Formato de anexo não permitido.'));
    callback(null, true);
  }
});
const reportSchema = z.object({
  tipo: z.enum(['bug', 'feature', 'security', 'account', 'anuncio', 'payment', 'other']),
  titulo: z.string().trim().min(5).max(120),
  descricao: z.string().trim().min(20).max(2000),
  email: z.union([z.string().trim().email().max(254), z.literal('')]).optional()
});

async function enviarEmailSuporte(relato) {
  return enviarEmail({
    subject: `[EZNY] Relato #${relato.id}: ${relato.titulo}`,
    replyTo: relato.email || undefined,
    text: [
      `Relato #${relato.id}`,
      `Utilizador: ${relato.nome} (ID ${relato.usuario_id})`,
      `Tipo: ${relato.tipo}`,
      `Contacto: ${relato.email || 'não indicado'}`,
      '',
      relato.titulo,
      '',
      relato.descricao
    ].join('\n')
  });
}

router.post('/relatar', verificarToken, (req, res, next) => {
  upload.single('anexo')(req, res, err => {
    if (!err) return next();
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    return res.status(400).json({ erro: tooLarge ? 'O anexo excede o limite de 5 MB.' : err.message || 'Anexo inválido.' });
  });
}, async (req, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Verifique o tipo, título, descrição e email do relato.', detalhes: parsed.error.issues });
  }
  const report = parsed.data;
  try {
    const id = await db.transaction(async tx => {
      const created = await tx.run(
        `INSERT INTO relatos_suporte
          (usuario_id,tipo,titulo,descricao,email,anexo_nome,anexo_tipo,anexo_dados)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          req.user.id, report.tipo, report.titulo, report.descricao,
          report.email || null, req.file?.originalname || null,
          req.file?.mimetype || null, req.file?.buffer || null
        ]
      );
      await tx.run(
        `INSERT INTO notificacoes (usuario_id,tipo,titulo,mensagem,lida)
         SELECT id,'info','Novo relato de suporte',?,0 FROM usuarios WHERE tipo='admin'`,
        [`${report.titulo} (relato #${created.lastID})`]
      );
      return created.lastID;
    });
    const email = await enviarEmailSuporte({
      id,
      usuario_id: req.user.id,
      nome: req.user.nome,
      tipo: report.tipo,
      titulo: report.titulo,
      descricao: report.descricao,
      email: report.email || ''
    });
    res.status(201).json({
      sucesso: true,
      id,
      email_enviado: email.enviado,
      email_estado: email.estado,
      mensagem: email.enviado
        ? 'Relato registado e enviado à equipa por email.'
        : 'Relato registado e enviado para o painel administrativo; o email não foi entregue.'
    });
  } catch (err) {
    console.error('[SUPORTE] Erro ao registar relato:', err.message);
    res.status(500).json({ erro: 'Não foi possível registar o relato. Tente novamente.' });
  }
});

router.get('/admin/relatos', verificarToken, requireAdmin, (req, res) => {
  db.all(
    `SELECT r.id,r.usuario_id,r.tipo,r.titulo,r.descricao,r.email,r.anexo_nome,r.estado,r.created_at,u.nome
       FROM relatos_suporte r LEFT JOIN usuarios u ON u.id=r.usuario_id
      ORDER BY r.created_at DESC LIMIT 500`,
    [],
    (err, rows) => {
      if (err) {
        console.error('[SUPORTE] Erro ao listar relatos:', err.message);
        return res.status(500).json({ erro: 'Não foi possível carregar os relatos.' });
      }
      res.json(rows || []);
    }
  );
});

router.get('/admin/relatos/:id/anexo', verificarToken, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ erro: 'ID de relato inválido.' });
  db.get('SELECT anexo_nome,anexo_tipo,anexo_dados FROM relatos_suporte WHERE id=?', [id], (err, row) => {
    if (err) {
      console.error('[SUPORTE] Erro ao ler anexo:', err.message);
      return res.status(500).json({ erro: 'Não foi possível descarregar o anexo.' });
    }
    if (!row || !row.anexo_dados) return res.status(404).json({ erro: 'Anexo não encontrado.' });
    const filename = path.basename(String(row.anexo_nome || `relato-${id}`).replace(/\\/g, '/')).replace(/[\r\n"]/g, '_');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(row.anexo_dados);
  });
});

module.exports = router;
