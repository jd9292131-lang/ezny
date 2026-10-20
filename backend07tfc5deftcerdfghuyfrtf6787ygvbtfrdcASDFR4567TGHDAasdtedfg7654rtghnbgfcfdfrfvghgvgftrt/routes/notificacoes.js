/* backend07tfc5deftcerdfghuyfrtf6787ygvbtfrdcASDFR4567TGHDAasdtedfg7654rtghnbgfcfdfrfvghgvgftrt/routes/notificacoes.js */
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verificarToken, requireAdmin } = require("../middleware/auth");

/* =========================
   LISTAR MINHAS NOTIFICAÇÕES
========================= */
router.get("/", verificarToken, (req, res) => {
  db.all(
    "SELECT * FROM notificacoes WHERE usuario_id = ? ORDER BY createdAt DESC",
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error("[NOTIFICAÇÕES] Erro ao listar:", err.message);
        return res.status(500).json({ erro: "Erro ao listar notificações" });
      }
      res.json(rows || []);
    }
  );
});

/* =========================
   CONTAR NÃO LIDAS
========================= */
router.get("/nao-lidas", verificarToken, (req, res) => {
  db.get(
    "SELECT COUNT(*) as total FROM notificacoes WHERE usuario_id = ? AND lida = 0",
    [req.user.id],
    (err, row) => {
      if (err) {
        console.error("[NOTIFICAÇÕES] Erro ao contar:", err.message);
        return res.status(500).json({ erro: "Erro ao contar notificações" });
      }
      res.json({ total: row ? row.total : 0 });
    }
  );
});

/* =========================
   MARCAR COMO LIDA
========================= */
router.post("/:id/lida", verificarToken, (req, res) => {
  db.run(
    "UPDATE notificacoes SET lida = 1 WHERE id = ? AND usuario_id = ?",
    [req.params.id, req.user.id],
    function(err) {
      if (err) {
        console.error("[NOTIFICAÇÕES] Erro ao marcar como lida:", err.message);
        return res.status(500).json({ erro: "Erro ao marcar como lida" });
      }
      res.json({ sucesso: true, alterado: this.changes });
    }
  );
});

/* =========================
   MARCAR TODAS COMO LIDAS
========================= */
router.post("/todas-lidas", verificarToken, (req, res) => {
  db.run(
    "UPDATE notificacoes SET lida = 1 WHERE usuario_id = ?",
    [req.user.id],
    function(err) {
      if (err) {
        console.error("[NOTIFICAÇÕES] Erro ao marcar todas:", err.message);
        return res.status(500).json({ erro: "Erro ao marcar todas como lidas" });
      }
      res.json({ sucesso: true, total: this.changes });
    }
  );
});

router.post("/admin/enviar", verificarToken, requireAdmin, async (req, res) => {
  const usuarioId = Number(req.body?.usuario_id);
  const titulo = String(req.body?.titulo || "").trim();
  const mensagem = String(req.body?.mensagem || "").trim();
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.status(400).json({ erro: "Selecione um utilizador válido" });
  }
  if (!titulo || titulo.length > 255 || !mensagem || mensagem.length > 2000) {
    return res.status(400).json({ erro: "Título e mensagem são obrigatórios (máximo 255 e 2000 caracteres)" });
  }
  try {
    const result = await db.transaction(async tx => {
      const user = await tx.get("SELECT id,nome,banido FROM usuarios WHERE id=?", [usuarioId]);
      if (!user) throw Object.assign(new Error("Utilizador não encontrado"), { code: "NOT_FOUND" });
      await tx.run(
        "INSERT INTO notificacoes (usuario_id,tipo,titulo,mensagem,lida) VALUES (?,?,?,?,0)",
        [usuarioId, "info", titulo, mensagem]
      );
      await tx.run(
        "INSERT INTO admin_logs (admin_id,acao,entidade,entidade_id,detalhes) VALUES (?,?,?,?,?)",
        [req.user.id, "ENVIAR_NOTIFICACAO", "utilizador", usuarioId, titulo]
      );
      return user;
    });
    res.status(201).json({ sucesso: true, destinatario: result.nome || `#${result.id}` });
  } catch (err) {
    if (err.code === "NOT_FOUND") return res.status(404).json({ erro: err.message });
    console.error("[NOTIFICAÇÕES] Erro ao enviar notificação administrativa:", err.message);
    res.status(500).json({ erro: "Não foi possível enviar a notificação" });
  }
});

/* =====================================================
   ELIMINAR NOTIFICAÇÃO (quem recebeu pode eliminar)
===================================================== */
router.delete("/:id", verificarToken, (req, res) => {
  db.run(
    "DELETE FROM notificacoes WHERE id = ? AND usuario_id = ?",
    [req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ erro: "Erro ao eliminar notificação" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ erro: "Notificação não encontrada" });
      }
      res.json({ sucesso: true });
    }
  );
});

/* =====================================================
   ELIMINAR TODAS AS NOTIFICAÇÕES LIDAS
===================================================== */
router.post("/limpar-lidas", verificarToken, (req, res) => {
  db.run(
    "DELETE FROM notificacoes WHERE usuario_id = ? AND lida = 1",
    [req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ erro: "Erro ao limpar notificações" });
      }
      res.json({ sucesso: true, total: this.changes });
    }
  );
});

module.exports = router;