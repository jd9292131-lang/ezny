/* backend/routes/destaques.js */
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verificarToken } = require("../middleware/auth");
const { requirePremium } = require("../middleware/premium");


/* =========================
   ATIVAR DESTAQUE DO PRÓPRIO ANÚNCIO
   Exclusivo Premium. Não depende do frontend para autorização.
========================= */
router.post("/meu/:anuncioId", verificarToken, requirePremium, (req, res) => {
  const anuncioId = Number.parseInt(req.params.anuncioId, 10);
  if (!Number.isInteger(anuncioId) || anuncioId <= 0) return res.status(400).json({ erro: "Anúncio inválido" });

  db.get("SELECT id, usuario_id, status FROM anuncios WHERE id = ?", [anuncioId], (err, anuncio) => {
    if (err) return res.status(500).json({ erro: "Erro ao consultar anúncio" });
    if (!anuncio) return res.status(404).json({ erro: "Anúncio não encontrado" });
    if (anuncio.usuario_id !== req.user.id) return res.status(403).json({ erro: "Só pode destacar os seus próprios anúncios" });
    if (anuncio.status !== 'active') return res.status(409).json({ erro: "O anúncio precisa estar ativo para ser destacado" });

    db.run("UPDATE anuncios SET destaque = 1 WHERE id = ? AND usuario_id = ?", [anuncioId, req.user.id], function (updateErr) {
      if (updateErr) return res.status(500).json({ erro: "Erro ao ativar destaque" });
      db.run("UPDATE destaques SET ativo = 0 WHERE anuncio_id = ?", [anuncioId], () => {
        db.run(`INSERT INTO destaques (anuncio_id, tipo_destaque, patrocinado, ordem, ativo) VALUES (?, 'premium', 0, 0, 1)`, [anuncioId], function (insertErr) {
          if (insertErr) return res.status(500).json({ erro: "Erro ao registar destaque" });
          res.json({ sucesso: true, destaque: true, id: this.lastID });
        });
      });
    });
  });
});

/* Remover destaque do próprio anúncio */
router.delete("/meu/:anuncioId", verificarToken, requirePremium, (req, res) => {
  const anuncioId = Number.parseInt(req.params.anuncioId, 10);
  db.run("UPDATE anuncios SET destaque = 0 WHERE id = ? AND usuario_id = ?", [anuncioId, req.user.id], function (err) {
    if (err) return res.status(500).json({ erro: "Erro ao remover destaque" });
    if (!this.changes) return res.status(404).json({ erro: "Anúncio não encontrado" });
    db.run("UPDATE destaques SET ativo = 0 WHERE anuncio_id = ?", [anuncioId], () => {});
    res.json({ sucesso: true, destaque: false });
  });
});

/* =========================
   LISTAR DESTAQUES
   Anúncios de utilizadores PREMIUM que estão ativos
   Ordenados por destaque (patrocinados primeiro) e depois por data
========================= */
router.get("/", (req, res) => {
  const sql = `
    SELECT a.*, u.nome as usuario_nome, u.avatar as usuario_avatar, u.tipo_conta as usuario_tipo_conta
    FROM anuncios a
    LEFT JOIN usuarios u ON a.usuario_id = u.id
    WHERE a.status = 'active'
    AND u.tipo_conta = 'premium'
    AND (u.banido IS NULL OR u.banido = 0 OR (u.banido = 1 AND u.banido_ate IS NOT NULL AND u.banido_ate < CURRENT_TIMESTAMP))
    ORDER BY a.destaque DESC, a.id DESC
    LIMIT 10
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("[DESTAQUES] Erro ao listar:", err.message);
      return res.status(500).json({ erro: "Erro ao listar destaques" });
    }

    console.log("[DESTAQUES] Retornados", rows.length, "destaques");

    const result = rows.map(r => {
      if (r.galeria) {
        try { r.galeria = Array.isArray(r.galeria) ? r.galeria : JSON.parse(r.galeria); } catch (e) {}
      }
      return r;
    });

    res.json(result);
  });
});

module.exports = router;