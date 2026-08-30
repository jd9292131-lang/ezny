/* backend/routes/mensagens.js */
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verificarToken } = require("../middleware/auth");

/* =========================
   ENVIAR MENSAGEM
========================= */
router.post("/enviar", verificarToken, (req, res) => {
  const { destinatario_id, conteudo, imagem, localizacao } = req.body;
  const remetenteId = req.user.id;

  const destinatarioId = Number(destinatario_id);
  if (!Number.isInteger(destinatarioId) || destinatarioId <= 0) {
    return res.status(400).json({ erro: "Destinatário inválido" });
  }
  if (destinatarioId === remetenteId) {
    return res.status(400).json({ erro: "Não pode enviar uma mensagem para si mesmo" });
  }

  const texto = typeof conteudo === 'string' ? conteudo.trim().slice(0, 4000) : '';
  const imagemUrl = typeof imagem === 'string' ? imagem.trim().slice(0, 1000) : null;
  const localizacaoTexto = typeof localizacao === 'string' ? localizacao.trim().slice(0, 500) : null;

  if (!texto && !imagemUrl && !localizacaoTexto) {
    return res.status(400).json({ erro: "Mensagem vazia" });
  }

  // Verificar se pode enviar (normal só pode enviar para premium)
  db.get("SELECT tipo_conta FROM usuarios WHERE id = ?", [remetenteId], (err, remetente) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });

    db.get("SELECT tipo_conta FROM usuarios WHERE id = ?", [destinatarioId], (err, destinatario) => {
      if (err) return res.status(500).json({ erro: "Erro no servidor" });
      if (!destinatario) return res.status(404).json({ erro: "Destinatário não encontrado" });

      // Regra: Normal só pode iniciar chat com PREMIUM
      if (remetente.tipo_conta === "normal" && destinatario.tipo_conta !== "premium") {
        return res.status(403).json({ erro: "Utilizadores normais só podem contactar páginas PREMIUM" });
      }

      db.run(`
        INSERT INTO mensagens (remetente_id, destinatario_id, conteudo, imagem, localizacao)
        VALUES (?, ?, ?, ?, ?)
      `, [remetenteId, destinatarioId, texto || null, imagemUrl || null, localizacaoTexto || null], function(err) {
        if (err) {
          console.error("[MENSAGENS] Erro ao enviar:", err.message);
          return res.status(500).json({ erro: "Erro ao enviar mensagem" });
        }

        const msgId = this.lastID;

        // Criar notificação para o destinatário
        db.run(`
          INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, lida)
          VALUES (?, 'info', 'Nova Mensagem', ?, 0)
        `, [destinatarioId, `Recebeu uma nova mensagem de ${req.user.nome}`]);

        res.json({ sucesso: true, id: msgId, message: "Mensagem enviada" });
      });
    });
  });
});

/* =========================
   LISTAR CONVERSAS DO UTILIZADOR
========================= */
router.get("/conversas", verificarToken, (req, res) => {
  const usuarioId = req.user.id;

  // Subquery no FROM para evitar referenciar alias do SELECT em subqueries
  db.all(`
    SELECT 
      m.contacto_id,
      u.nome as contacto_nome,
      u.avatar as contacto_avatar,
      u.tipo_conta as contacto_tipo,
      MAX(m.createdAt) as ultima_mensagem_data,
      (SELECT COALESCE(conteudo,
               CASE WHEN imagem IS NOT NULL THEN 'Imagem'
                    WHEN localizacao IS NOT NULL THEN 'Localização'
                    ELSE '' END)
       FROM mensagens
       WHERE ((remetente_id = ? AND destinatario_id = m.contacto_id) OR (remetente_id = m.contacto_id AND destinatario_id = ?))
       ORDER BY createdAt DESC LIMIT 1) as ultima_mensagem,
      (SELECT COUNT(*) FROM mensagens WHERE destinatario_id = ? AND remetente_id = m.contacto_id AND lida = 0) as nao_lidas
    FROM (
      SELECT 
        CASE WHEN remetente_id = ? THEN destinatario_id ELSE remetente_id END as contacto_id,
        createdAt
      FROM mensagens
      WHERE remetente_id = ? OR destinatario_id = ?
    ) m
    JOIN usuarios u ON u.id = m.contacto_id
    GROUP BY m.contacto_id
    ORDER BY ultima_mensagem_data DESC
  `, [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId], (err, rows) => {
    if (err) {
      console.error("[MENSAGENS] Erro ao listar conversas:", err.message);
      return res.status(500).json({ erro: "Erro ao listar conversas" });
    }
    res.json(rows || []);
  });
});

/* =========================
   LISTAR MENSAGENS DE UMA CONVERSA
========================= */
router.get("/conversa/:contactoId", verificarToken, (req, res) => {
  const usuarioId = req.user.id;
  const contactoId = Number(req.params.contactoId);
  if (!Number.isInteger(contactoId) || contactoId <= 0 || contactoId === usuarioId) {
    return res.status(400).json({ erro: "Contacto inválido" });
  }

  // Marcar como lidas
  db.run(`
    UPDATE mensagens SET lida = 1 
    WHERE destinatario_id = ? AND remetente_id = ? AND lida = 0
  `, [usuarioId, contactoId]);

  db.all(`
    SELECT m.*, 
           ur.nome as remetente_nome, ur.avatar as remetente_avatar,
           ud.nome as destinatario_nome, ud.avatar as destinatario_avatar
    FROM mensagens m
    JOIN usuarios ur ON m.remetente_id = ur.id
    JOIN usuarios ud ON m.destinatario_id = ud.id
    WHERE (m.remetente_id = ? AND m.destinatario_id = ?) 
       OR (m.remetente_id = ? AND m.destinatario_id = ?)
    ORDER BY m.createdAt ASC
  `, [usuarioId, contactoId, contactoId, usuarioId], (err, rows) => {
    if (err) {
      console.error("[MENSAGENS] Erro ao buscar mensagens:", err.message);
      return res.status(500).json({ erro: "Erro ao buscar mensagens" });
    }
    res.json(rows || []);
  });
});

/* =========================
   MARCAR COMO LIDA
========================= */
router.post("/ler/:mensagemId", verificarToken, (req, res) => {
  db.run("UPDATE mensagens SET lida = 1 WHERE id = ? AND destinatario_id = ?", 
    [req.params.mensagemId, req.user.id], function(err) {
    if (err) return res.status(500).json({ erro: "Erro ao marcar como lida" });
    res.json({ sucesso: true });
  });
});

/* =========================
   CONTAR MENSAGENS NÃO LIDAS
========================= */
router.get("/nao-lidas", verificarToken, (req, res) => {
  db.get("SELECT COUNT(*) as total FROM mensagens WHERE destinatario_id = ? AND lida = 0", 
    [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    res.json({ total: row ? row.total : 0 });
  });
});

module.exports = router;