/* backend07tfc5deftcerdfghuyfrtf6787ygvbtfrdcASDFR4567TGHDAasdtedfg7654rtghnbgfcfdfrfvghgvgftrt/routes/admin.js */
const express = require('express');
const router = express.Router();
const db = require("../config/db");
const { verificarToken, requireAdmin } = require("../middleware/auth");
router.use(verificarToken, requireAdmin);

/* ============================================================
   FUNÇÃO AUXILIAR: Eliminar anúncios de um utilizador
============================================================ */
function eliminarAnunciosDoUtilizador(userId, callback) {
  db.all(
    "SELECT id, imagem, galeria FROM anuncios WHERE usuario_id = ?",
    [userId],
    (err, anuncios) => {
      if (err) {
        console.error("[ADMIN] Erro ao buscar anúncios do utilizador:", err.message);
        return callback(err);
      }

      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(__dirname, '..', 'uploads');

      anuncios.forEach(anuncio => {
        if (anuncio.imagem) {
          const imgPath = path.join(uploadsDir, anuncio.imagem);
          fs.unlink(imgPath, (err) => {
            if (err && err.code !== 'ENOENT') {
              console.error(`[ADMIN] Erro ao eliminar imagem ${anuncio.imagem}:`, err.message);
            }
          });
        }
        if (anuncio.galeria) {
          try {
            const galeria = Array.isArray(anuncio.galeria) ? anuncio.galeria : JSON.parse(anuncio.galeria);
            galeria.forEach(img => {
              const imgPath = path.join(uploadsDir, img);
              fs.unlink(imgPath, (err) => {
                if (err && err.code !== 'ENOENT') {
                  console.error(`[ADMIN] Erro ao eliminar imagem da galeria ${img}:`, err.message);
                }
              });
            });
          } catch (e) {
            console.error("[ADMIN] Erro ao parsear galeria:", e.message);
          }
        }
      });

      db.run(
        "DELETE FROM anuncios WHERE usuario_id = ?",
        [userId],
        function(err) {
          if (err) {
            console.error("[ADMIN] Erro ao eliminar anúncios da BD:", err.message);
            return callback(err);
          }
          console.log(`[ADMIN] ${this.changes} anúncio(s) eliminado(s) do utilizador ${userId}`);
          callback(null, this.changes);
        }
      );
    }
  );
}

/* ============================================================
   FUNÇÃO AUXILIAR: Suspender anúncios de um utilizador
============================================================ */
function suspenderAnunciosDoUtilizador(userId, callback) {
  db.run(
    "UPDATE anuncios SET status = 'suspended' WHERE usuario_id = ? AND status IN ('active', 'pendente')",
    [userId],
    function(err) {
      if (err) {
        console.error("[ADMIN] Erro ao suspender anúncios:", err.message);
        return callback(err);
      }
      console.log(`[ADMIN] ${this.changes} anúncio(s) suspenso(s) do utilizador ${userId}`);
      callback(null, this.changes);
    }
  );
}

/* ============================================================
   FUNÇÃO AUXILIAR: Reativar anúncios de um utilizador
============================================================ */
function reativarAnunciosDoUtilizador(userId, callback) {
  db.run(
    "UPDATE anuncios SET status = 'active' WHERE usuario_id = ? AND status = 'suspended'",
    [userId],
    function(err) {
      if (err) {
        console.error("[ADMIN] Erro ao reativar anúncios:", err.message);
        return callback(err);
      }
      console.log(`[ADMIN] ${this.changes} anúncio(s) reativado(s) do utilizador ${userId}`);
      callback(null, this.changes);
    }
  );
}

/* =========================
   LISTAR VENDEDORES (UTILIZADORES)
========================= */
router.get('/vendedores', (req, res) => {
  db.all("SELECT id, nome, telefone, tipo, tipo_conta, banido, banido_ate, verificado, createdAt FROM usuarios ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ erro: "Erro ao listar" });
    res.json(rows);
  });
});

/* =========================
   BLOQUEAR / BANIR
========================= */
router.post("/bloquear/:id", (req, res) => {
  const targetId = parseInt(req.params.id);

  if (targetId === req.user.id) {
    return res.status(403).json({ erro: "Não podes banir a tua própria conta" });
  }

  db.get("SELECT tipo FROM usuarios WHERE id = ?", [targetId], (err, user) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    if (!user) return res.status(404).json({ erro: "Utilizador não encontrado" });
    if (user.tipo === 'admin') {
      return res.status(403).json({ erro: "Não é permitido banir administradores" });
    }

    const { ate } = req.body;
    db.run(
      "UPDATE usuarios SET banido = 1, banido_ate = ? WHERE id = ?",
      [ate || null, targetId],
      function(err) {
        if (err) {
          console.error("Erro ao bloquear:", err.message);
          return res.status(500).json({ erro: "Erro ao bloquear" });
        }
        if (this.changes === 0) {
          return res.status(404).json({ erro: "Utilizador não encontrado" });
        }

        suspenderAnunciosDoUtilizador(targetId, (errAnuncios, count) => {
          if (errAnuncios) {
            console.error("[ADMIN] Erro ao suspender anúncios:", errAnuncios.message);
          }

          res.json({
            sucesso: true,
            message: "Utilizador bloqueado",
            anunciosSuspensos: count || 0
          });
        });
      }
    );
  });
});

/* =========================
   DESBLOQUEAR / DESBANIR
========================= */
router.post("/desbloquear/:id", (req, res) => {
  const targetId = parseInt(req.params.id);

  db.run(
    "UPDATE usuarios SET banido = 0, banido_ate = NULL WHERE id = ?",
    [targetId],
    function(err) {
      if (err) {
        console.error("Erro ao desbloquear:", err.message);
        return res.status(500).json({ erro: "Erro ao desbloquear" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ erro: "Utilizador não encontrado" });
      }

      reativarAnunciosDoUtilizador(targetId, (errAnuncios, count) => {
        if (errAnuncios) {
          console.error("[ADMIN] Erro ao reativar anúncios:", errAnuncios.message);
        }

        res.json({
          sucesso: true,
          message: "Utilizador desbloqueado",
          anunciosReativados: count || 0
        });
      });
    }
  );
});

/* =========================
   ELIMINAR UTILIZADOR (ADMIN)
========================= */
router.delete("/usuarios/:id", (req, res) => {
  const targetId = parseInt(req.params.id);

  if (targetId === req.user.id) {
    return res.status(403).json({ erro: "Não podes eliminar a tua própria conta" });
  }

  db.get("SELECT tipo FROM usuarios WHERE id = ?", [targetId], (err, user) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    if (!user) return res.status(404).json({ erro: "Utilizador não encontrado" });
    if (user.tipo === 'admin') {
      return res.status(403).json({ erro: "Não é permitido eliminar administradores" });
    }

    eliminarAnunciosDoUtilizador(targetId, (errAnuncios) => {
      if (errAnuncios) {
        console.error("[ADMIN] Erro ao eliminar anúncios:", errAnuncios.message);
      }

      db.run("DELETE FROM perfis_premium WHERE usuario_id = ?", [targetId], (err) => {
        if (err) console.error(`[ADMIN] Erro perfil premium ${targetId}:`, err.message);
      });
      db.run("DELETE FROM seguidores WHERE seguidor_id = ? OR seguido_id = ?", [targetId, targetId], (err) => {
        if (err) console.error(`[ADMIN] Erro seguidores ${targetId}:`, err.message);
      });
      db.run("DELETE FROM avaliacoes WHERE avaliador_id = ? OR perfil_premium_id = ?", [targetId, targetId], (err) => {
        if (err) console.error(`[ADMIN] Erro avaliações ${targetId}:`, err.message);
      });
      db.run("DELETE FROM mensagens WHERE remetente_id = ? OR destinatario_id = ?", [targetId, targetId], (err) => {
        if (err) console.error(`[ADMIN] Erro mensagens ${targetId}:`, err.message);
      });
      db.run("DELETE FROM comentarios WHERE usuario_id = ?", [targetId], (err) => {
        if (err) console.error(`[ADMIN] Erro comentários ${targetId}:`, err.message);
      });
      db.run("DELETE FROM reacoes WHERE usuario_id = ?", [targetId], (err) => {
        if (err) console.error(`[ADMIN] Erro reações ${targetId}:`, err.message);
      });
      db.run("DELETE FROM verificacoes_pendentes WHERE usuario_id = ?", [targetId], (err) => {
        if (err) console.error(`[ADMIN] Erro verificações ${targetId}:`, err.message);
      });
      db.run("DELETE FROM destaques WHERE anuncio_id IN (SELECT id FROM anuncios WHERE usuario_id = ?)", [targetId], (err) => {
        if (err) console.error(`[ADMIN] Erro destaques ${targetId}:`, err.message);
      });

      db.run("DELETE FROM notificacoes WHERE usuario_id = ?", [targetId], (errNotif) => {
        if (errNotif) {
          console.error("[ADMIN] Erro ao eliminar notificações:", errNotif.message);
        }

        db.run("DELETE FROM popups_vistos WHERE usuario_id = ?", [targetId], (errPopup) => {
          if (errPopup) {
            console.error("[ADMIN] Erro ao eliminar popups vistos:", errPopup.message);
          }

          db.run("DELETE FROM usuarios WHERE id = ?", [targetId], function(err) {
            if (err) {
              console.error("[ADMIN] Erro ao eliminar utilizador:", err.message);
              return res.status(500).json({ erro: "Erro ao eliminar utilizador" });
            }
            if (this.changes === 0) {
              return res.status(404).json({ erro: "Utilizador não encontrado" });
            }
            res.json({ sucesso: true, message: "Utilizador e todos os dados associados eliminados" });
          });
        });
      });
    });
  });
});

/* =========================
   LISTAR PEDIDOS DE VERIFICAÇÃO PREMIUM
========================= */
router.get("/verificacoes", (req, res) => {
  if (req.user.tipo !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  db.all(`
    SELECT v.*, u.nome, u.telefone, u.premium_desde
    FROM verificacoes_pendentes v
    JOIN usuarios u ON v.usuario_id = u.id
    WHERE v.status = 'pendente'
    ORDER BY v.createdAt DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ erro: "Erro ao listar" });
    res.json(rows || []);
  });
});

/* =========================
   APROVAR VERIFICAÇÃO
========================= */
router.post("/verificar/:id", (req, res) => {
  if (req.user.tipo !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  db.run("UPDATE usuarios SET verificado = 1 WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ erro: "Erro ao verificar" });

    db.run("UPDATE verificacoes_pendentes SET status = 'aprovado', admin_observacao = ? WHERE usuario_id = ?", 
      [req.body.observacao || null, req.params.id]);

    db.run(`
      INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, lida)
      VALUES (?, 'success', 'Conta Verificada', 'A sua conta PREMIUM foi verificada! Selo ✔ Verificado atribuído.', 0)
    `, [req.params.id]);

    res.json({ sucesso: true, message: "Utilizador verificado" });
  });
});

/* =========================
   REJEITAR VERIFICAÇÃO
========================= */
router.post("/verificar/:id/rejeitar", (req, res) => {
  if (req.user.tipo !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  const { motivo } = req.body;

  db.run("UPDATE verificacoes_pendentes SET status = 'rejeitado', admin_observacao = ? WHERE usuario_id = ?", 
    [motivo || null, req.params.id]);

  db.run(`
    INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, lida)
    VALUES (?, 'error', 'Verificação Rejeitada', ?, 0)
  `, [req.params.id, `O seu pedido de verificação foi rejeitado.${motivo ? ' Motivo: ' + motivo : ''}`]);

  res.json({ sucesso: true, message: "Verificação rejeitada" });
});

/* =========================
   PROMOVER PARA PREMIUM
========================= */
router.post("/promover/:id", (req, res) => {
  if (req.user.tipo !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  db.run("UPDATE usuarios SET tipo_conta = 'premium', premium_desde = CURRENT_TIMESTAMP WHERE id = ?", 
    [req.params.id], function(err) {
    if (err) return res.status(500).json({ erro: "Erro ao promover" });
    if (this.changes === 0) return res.status(404).json({ erro: "Utilizador não encontrado" });

    db.run(`
      INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, lida)
      VALUES (?, 'success', 'Conta PREMIUM', 'A sua conta foi promovida para PREMIUM! Aproveite todos os benefícios.', 0)
    `, [req.params.id]);

    res.json({ sucesso: true, message: "Utilizador promovido para PREMIUM" });
  });
});

/* =========================
   REVOGAR PREMIUM
========================= */
router.post("/revogar-premium/:id", (req, res) => {
  if (req.user.tipo !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  db.run("UPDATE usuarios SET tipo_conta = 'normal', verificado = 0, premium_ate = CURRENT_TIMESTAMP WHERE id = ?", 
    [req.params.id], function(err) {
    if (err) return res.status(500).json({ erro: "Erro ao revogar" });

    db.run(`
      INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, lida)
      VALUES (?, 'warning', 'Conta Normal', 'A sua conta PREMIUM foi revertida para normal.', 0)
    `, [req.params.id]);

    res.json({ sucesso: true, message: "Premium revogado" });
  });
});

/* =========================
   APROVAR ANÚNCIO COM DESTAQUE AUTOMÁTICO
========================= */
router.post("/aprovar-anuncio/:id", (req, res) => {
  if (req.user.tipo !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  const anuncioId = parseInt(req.params.id);

  db.run(
    "UPDATE anuncios SET status = 'active' WHERE id = ?",
    [anuncioId],
    function (err) {
      if (err) return res.status(500).json({ erro: err.message });
      if (this.changes === 0) return res.status(404).json({ erro: "Anúncio não encontrado" });

      db.get(
        "SELECT usuario_id, titulo FROM anuncios WHERE id = ?",
        [anuncioId],
        (err, anuncio) => {
          if (err || !anuncio) return;

          db.run(
            `INSERT INTO notificacoes
            (usuario_id, tipo, titulo, mensagem, anuncio_id, lida)
            VALUES (?, ?, ?, ?, ?, 0)`,
            [
              anuncio.usuario_id,
              "success",
              "Anúncio Aprovado",
              `O teu anúncio "${anuncio.titulo}" foi aprovado!`,
              anuncioId
            ]
          );

          db.get("SELECT tipo FROM usuarios WHERE id = ?", [anuncio.usuario_id], (err2, autor) => {
            if (err2 || !autor) return;

            if (autor.tipo === 'admin') {
              db.run(`
                INSERT INTO destaques (anuncio_id, tipo_destaque, patrocinado, ordem, ativo)
                VALUES (?, 'admin', 1, 0, 1)
              `, [anuncioId], function(err3) {
                if (err3) {
                  console.error("[ADMIN] Erro ao criar destaque automático:", err3.message);
                } else {
                  console.log(`[ADMIN] ✅ Destaque automático criado para anúncio #${anuncioId} (admin)`);
                }
              });
            }
          });
        }
      );

      res.json({ sucesso: true, message: "Anúncio aprovado" });
    }
  );
});

/* =========================
   REJEITAR ANÚNCIO
========================= */
router.post("/rejeitar-anuncio/:id", (req, res) => {
  if (req.user.tipo !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  const anuncioId = parseInt(req.params.id);
  const { motivo } = req.body;

  db.run(
    "UPDATE anuncios SET status = 'rejected' WHERE id = ?",
    [anuncioId],
    function (err) {
      if (err) return res.status(500).json({ erro: err.message });
      if (this.changes === 0) return res.status(404).json({ erro: "Anúncio não encontrado" });

      db.get(
        "SELECT usuario_id, titulo FROM anuncios WHERE id = ?",
        [anuncioId],
        (err, anuncio) => {
          if (err || !anuncio) return;

          db.run(
            `INSERT INTO notificacoes
            (usuario_id, tipo, titulo, mensagem, anuncio_id, lida)
            VALUES (?, ?, ?, ?, ?, 0)`,
            [
              anuncio.usuario_id,
              "error",
              "Anúncio Rejeitado",
              `O teu anúncio "${anuncio.titulo}" foi rejeitado.${motivo ? ' Motivo: ' + motivo : ''}`,
              anuncioId
            ]
          );
        }
      );

      res.json({ sucesso: true, message: "Anúncio rejeitado" });
    }
  );
});

module.exports = router;