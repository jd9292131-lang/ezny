/* backend/routes/notificacoes.js */
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verificarToken } = require("../middleware/auth");

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