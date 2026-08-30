/* backend/routes/denuncias.js */
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verificarToken } = require("../middleware/auth");

// 📌 CRIAR DENÚNCIA
router.post("/criar", verificarToken, (req, res) => {
  const { tipo_denuncia, descricao, usuario_reportado_id, anuncio_id } = req.body;
  const denuncianteId = req.user.id;

  if (!descricao || !descricao.trim()) {
    return res.status(400).json({ erro: "Descreva a denúncia" });
  }

  // Impedir auto-denúncia
  if (usuario_reportado_id && parseInt(usuario_reportado_id) === denuncianteId) {
    return res.status(400).json({ erro: "Não pode denunciar-se a si mesmo" });
  }

  const sql = `
    INSERT INTO denuncias (denunciante_id, usuario_reportado_id, anuncio_id, tipo_denuncia, descricao, status)
    VALUES (?, ?, ?, ?, ?, 'pendente')
  `;

  db.run(sql, [denuncianteId, usuario_reportado_id || null, anuncio_id || null, tipo_denuncia || 'outro', descricao.trim()], function(err) {
    if (err) {
      console.error("[DENUNCIAS] Erro ao criar:", err.message);
      return res.status(500).json({ erro: "Erro ao enviar denúncia" });
    }

    res.json({
      sucesso: true,
      message: "Denúncia enviada com sucesso. Analisaremos em breve.",
      id: this.lastID
    });
  });
});

// 📌 LISTAR MINHAS DENÚNCIAS
router.get("/minhas", verificarToken, (req, res) => {
  db.all(
    "SELECT * FROM denuncias WHERE denunciante_id = ? ORDER BY createdAt DESC",
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error("[DENUNCIAS] Erro ao listar:", err.message);
        return res.status(500).json({ erro: "Erro ao buscar denúncias" });
      }
      res.json(rows || []);
    }
  );
});

// 📌 LISTAR TODAS AS DENÚNCIAS (ADMIN)
router.get("/admin/todas", verificarToken, (req, res) => {
  if (req.user.tipo !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  db.all(`
    SELECT d.*, 
           ud.nome as denunciante_nome, 
           ur.nome as reportado_nome,
           a.titulo as anuncio_titulo
    FROM denuncias d
    LEFT JOIN usuarios ud ON d.denunciante_id = ud.id
    LEFT JOIN usuarios ur ON d.usuario_reportado_id = ur.id
    LEFT JOIN anuncios a ON d.anuncio_id = a.id
    ORDER BY d.createdAt DESC
  `, [], (err, rows) => {
    if (err) {
      console.error("[DENUNCIAS] Erro ao listar admin:", err.message);
      return res.status(500).json({ erro: "Erro ao buscar denúncias" });
    }
    res.json(rows || []);
  });
});

// 📌 ATUALIZAR STATUS DA DENÚNCIA (ADMIN)
router.post("/admin/:id/status", verificarToken, (req, res) => {
  if (req.user.tipo !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  const { status, resposta_admin } = req.body;
  const validStatus = ['pendente', 'em_analise', 'resolvida', 'rejeitada'];

  if (!status || !validStatus.includes(status)) {
    return res.status(400).json({ erro: "Status inválido" });
  }

  db.run(
    "UPDATE denuncias SET status = ?, resposta_admin = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
    [status, resposta_admin || null, req.params.id],
    function(err) {
      if (err) {
        console.error("[DENUNCIAS] Erro ao atualizar:", err.message);
        return res.status(500).json({ erro: "Erro ao atualizar denúncia" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ erro: "Denúncia não encontrada" });
      }
      res.json({ sucesso: true, message: "Denúncia atualizada" });
    }
  );
});

// 📌 ELIMINAR DENÚNCIA (ADMIN ou próprio)
router.delete("/:id", verificarToken, (req, res) => {
  db.get("SELECT * FROM denuncias WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    if (!row) return res.status(404).json({ erro: "Denúncia não encontrada" });

    // Só admin ou o próprio denunciante pode eliminar
    if (req.user.tipo !== "admin" && row.denunciante_id !== req.user.id) {
      return res.status(403).json({ erro: "Sem permissão" });
    }

    db.run("DELETE FROM denuncias WHERE id = ?", [req.params.id], function(err) {
      if (err) return res.status(500).json({ erro: "Erro ao eliminar" });
      res.json({ sucesso: true });
    });
  });
});

module.exports = router;