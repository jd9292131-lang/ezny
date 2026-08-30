/* backend/routes/anuncios.js */
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { upload, tratarErroUpload } = require("../middleware/upload");
const { verificarToken } = require("../middleware/auth");
const { isPremium } = require("../middleware/premium");
const fs = require('fs');
const path = require('path');


const CATEGORIA_REGRAS = {
  telefone: ['title','price','contacto'],
  carro: ['title','marca','modelo','price','contacto'],
  imovel: ['title','price','contacto','localizacao','descricao'],
  arrendamento: ['title','price','contacto','localizacao','descricao'],
  outro: ['title','price','contacto','descricao']
};
const CATEGORIAS_VALIDAS = new Set(Object.keys(CATEGORIA_REGRAS));
const CAMPOS_LEGADOS = ['marca','estado','contacto','ano','quilometragem','combustivel','caixa','tracao','cor','portas','lotacao','versao','modelo','localizacao','negociavel','equipamentos'];
function parseAtributos(raw) {
  if (!raw) return {};
  try { const value = typeof raw === 'string' ? JSON.parse(raw) : raw; return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  catch { return null; }
}
function toIntOrNull(value) { if (value === undefined || value === null || String(value).trim() === '') return null; const n=Number(value); return Number.isInteger(n) ? n : null; }
function toNumberOrNull(value) { if (value === undefined || value === null || String(value).trim() === '') return null; const n=Number(value); return Number.isFinite(n) ? n : null; }
function toBool(value) { return value === true || value === 1 || value === '1' || value === 'true' || value === 'on'; }

/* ============================================================
   FUNÇÃO AUXILIAR: Verificar se utilizador está banido
============================================================ */
function verificarBanimento(userId, callback) {
  db.get(
    "SELECT banido, banido_ate FROM usuarios WHERE id = ?",
    [userId],
    (err, user) => {
      if (err) return callback(err);
      if (!user) return callback(new Error("Utilizador não encontrado"));

      if (user.banido === 1 || user.banido === "1") {
        if (user.banido_ate) {
          const agora = new Date();
          const dataExpiracao = new Date(user.banido_ate);
          if (agora < dataExpiracao) {
            return callback(null, {
              banido: true,
              banido_ate: user.banido_ate,
              permanente: false
            });
          }
          // Banimento expirou — desbanir automaticamente
          db.run("UPDATE usuarios SET banido = 0, banido_ate = NULL WHERE id = ?", [userId]);
          return callback(null, { banido: false });
        }
        return callback(null, { banido: true, permanente: true });
      }
      callback(null, { banido: false });
    }
  );
}

/* ============================================================
   ROTAS ESPECÍFICAS PRIMEIRO (antes de /:id)
============================================================ */

/* =====================================================
   MEUS ANÚNCIOS — com verificação de banimento
   ⚠️ DEVE VIR ANTES DE /:id
===================================================== */
router.get("/meus", verificarToken, (req, res) => {

  // Verificar se o utilizador está banido
  verificarBanimento(req.user.id, (errBan, banStatus) => {
    if (errBan) {
      return res.status(500).json({ erro: "Erro no servidor" });
    }

    if (banStatus.banido) {
      if (banStatus.permanente) {
        return res.status(403).json({
          erro: "Conta Suspensa por violação das nossas regras e Condições. Contacte o suporte.",
          banido: true
        });
      }
      return res.status(403).json({
        erro: "Conta suspensa temporariamente até " + banStatus.banido_ate,
        banido: true,
        banido_ate: banStatus.banido_ate
      });
    }

    db.all(
      "SELECT * FROM anuncios WHERE usuario_id = ? ORDER BY id DESC",
      [req.user.id],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ erro: "Erro ao listar anúncios" });
        }

        res.json(rows);
      }
    );
  });
});

/* =====================================================
   ELIMINAR MEU PRÓPRIO ANÚNCIO
   ⚠️ DEVE VIR ANTES DE /:id
===================================================== */
router.delete("/meus/:id", verificarToken, (req, res) => {
  const anuncioId = parseInt(req.params.id);
  const usuarioId = req.user.id;

  // Verificar se o anúncio pertence ao utilizador
  db.get(
    "SELECT imagem, galeria, usuario_id FROM anuncios WHERE id = ?",
    [anuncioId],
    (err, anuncio) => {
      if (err) {
        return res.status(500).json({ erro: "Erro no servidor" });
      }
      if (!anuncio) {
        return res.status(404).json({ erro: "Anúncio não encontrado" });
      }
      if (anuncio.usuario_id !== usuarioId) {
        return res.status(403).json({ erro: "Não tem permissão para eliminar este anúncio" });
      }

      // Eliminar imagens do disco
      const uploadsDir = path.join(__dirname, '..', 'uploads');

      if (anuncio.imagem) {
        const imgPath = path.join(uploadsDir, anuncio.imagem);
        fs.unlink(imgPath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error(`[ANUNCIOS] Erro ao eliminar imagem ${anuncio.imagem}:`, err.message);
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
                console.error(`[ANUNCIOS] Erro ao eliminar imagem da galeria ${img}:`, err.message);
              }
            });
          });
        } catch (e) {
          console.error("[ANUNCIOS] Erro ao parsear galeria:", e.message);
        }
      }

      // Eliminar o anúncio da BD
      db.run(
        "DELETE FROM anuncios WHERE id = ? AND usuario_id = ?",
        [anuncioId, usuarioId],
        function (err) {
          if (err) return res.status(500).json({ erro: err.message });
          if (this.changes === 0) return res.status(404).json({ erro: "Anúncio não encontrado" });

          res.json({ sucesso: true, mensagem: "Anúncio eliminado com sucesso" });
        }
      );
    }
  );
});

/* =====================================================
   ADMIN — TODOS OS ANÚNCIOS
   ⚠️ DEVE VIR ANTES DE /:id
===================================================== */
router.get("/admin/todos", verificarToken, (req, res) => {

  if (req.user.tipo !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  db.all(
    `SELECT a.*, u.nome as usuario_nome, u.banido as usuario_banido, u.banido_ate
     FROM anuncios a
     LEFT JOIN usuarios u ON a.usuario_id = u.id
     ORDER BY a.id DESC`,
    [],
    (err, rows) => {

      if (err) {
        return res.status(500).json({ erro: "Erro ao carregar anúncios" });
      }

      res.json(rows);
    }
  );
});

/* =====================================================
   APROVAR ANÚNCIO
===================================================== */
router.post("/:id/aprovar", verificarToken, (req, res) => {

  if (req.user.tipo !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  db.run(
    "UPDATE anuncios SET status = 'active' WHERE id = ?",
    [req.params.id],
    function (err) {

      if (err) return res.status(500).json({ erro: err.message });
      if (this.changes === 0) return res.status(404).json({ erro: "Anúncio não encontrado" });

      db.get(
        "SELECT usuario_id, titulo FROM anuncios WHERE id = ?",
        [req.params.id],
        (err, anuncio) => {

          if (anuncio) {
            db.run(
              `INSERT INTO notificacoes
              (usuario_id, tipo, titulo, mensagem, anuncio_id, lida)
              VALUES (?, ?, ?, ?, ?, 0)`,
              [
                anuncio.usuario_id,
                "success",
                "Anúncio Aprovado",
                `O teu anúncio "${anuncio.titulo}" foi aprovado! Por favor, após concluir a venda elimine o anúncio`,
                req.params.id
              ]
            );
          }
        }
      );

      res.json({ sucesso: true });
    }
  );
});

/* =====================================================
   REJEITAR ANÚNCIO
===================================================== */
router.post("/:id/rejeitar", verificarToken, (req, res) => {

  if (req.user.tipo !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  const { motivo } = req.body;

  db.run(
    "UPDATE anuncios SET status = 'rejected' WHERE id = ?",
    [req.params.id],
    function (err) {

      if (err) return res.status(500).json({ erro: err.message });
      if (this.changes === 0) return res.status(404).json({ erro: "Anúncio não encontrado" });

      db.get(
        "SELECT usuario_id, titulo FROM anuncios WHERE id = ?",
        [req.params.id],
        (err, anuncio) => {

          if (anuncio) {
            db.run(
              `INSERT INTO notificacoes
              (usuario_id, tipo, titulo, mensagem, anuncio_id, lida)
              VALUES (?, ?, ?, ?, ?, 0)`,
              [
                anuncio.usuario_id,
                "error",
                "Anúncio Rejeitado",
                `O teu anúncio "${anuncio.titulo}" foi rejeitado.${motivo ? " Motivo: " + motivo : ""}`,
                req.params.id
              ]
            );
          }
        }
      );

      res.json({ sucesso: true });
    }
  );
});

/* =====================================================
   ELIMINAR (ADMIN)
===================================================== */
router.delete("/admin/:id", verificarToken, (req, res) => {

  if (req.user.tipo !== "admin") {
    return res.status(403).json({ erro: "Acesso negado" });
  }

  // Primeiro buscar as imagens para eliminar do disco
  db.get(
    "SELECT imagem, galeria FROM anuncios WHERE id = ?",
    [req.params.id],
    (err, anuncio) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }

      // Eliminar imagens do disco
      if (anuncio) {
        const uploadsDir = path.join(__dirname, '..', 'uploads');

        if (anuncio.imagem) {
          const imgPath = path.join(uploadsDir, anuncio.imagem);
          fs.unlink(imgPath, (err) => {
            if (err && err.code !== 'ENOENT') {
              console.error(`[ANUNCIOS] Erro ao eliminar imagem ${anuncio.imagem}:`, err.message);
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
                  console.error(`[ANUNCIOS] Erro ao eliminar imagem da galeria ${img}:`, err.message);
                }
              });
            });
          } catch (e) {
            console.error("[ANUNCIOS] Erro ao parsear galeria:", e.message);
          }
        }
      }

      // Eliminar o anúncio da BD
      db.run(
        "DELETE FROM anuncios WHERE id = ?",
        [req.params.id],
        function (err) {

          if (err) return res.status(500).json({ erro: err.message });
          if (this.changes === 0) return res.status(404).json({ erro: "Anúncio não encontrado" });

          res.json({ sucesso: true });
        }
      );
    }
  );
});

/* ============================================================
   ROTAS COM PARÂMETROS DINÂMICOS (DEPOIS das específicas)
============================================================ */

/* =========================
   ADICIONAR COMENTÁRIO (só em anúncios PREMIUM) + NOTIFICAR AUTOR
========================= */
router.post("/:id/comentar", verificarToken, (req, res) => {
  const { conteudo } = req.body;
  const anuncioId = parseInt(req.params.id);

  if (!conteudo || !conteudo.trim()) {
    return res.status(400).json({ erro: "Comentário não pode estar vazio" });
  }

  // Verificar se o anúncio é de um utilizador PREMIUM
  db.get(`
    SELECT u.tipo_conta, a.usuario_id, a.titulo 
    FROM anuncios a 
    JOIN usuarios u ON a.usuario_id = u.id 
    WHERE a.id = ?
  `, [anuncioId], (err, row) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    if (!row) return res.status(404).json({ erro: "Anúncio não encontrado" });

    if (row.tipo_conta !== "premium") {
      return res.status(403).json({ erro: "Comentários apenas em publicações PREMIUM" });
    }

    db.run(`
      INSERT INTO comentarios (anuncio_id, usuario_id, conteudo, resposta_id)
      VALUES (?, ?, ?, NULL)
    `, [anuncioId, req.user.id, conteudo.trim()], function(err) {
      if (err) {
        console.error("[ANUNCIOS] Erro ao comentar:", err.message);
        return res.status(500).json({ erro: "Erro ao adicionar comentário" });
      }

      const comentarioId = this.lastID;

      // NOTIFICAR o autor do anúncio (se não for ele próprio a comentar)
      if (row.usuario_id !== req.user.id) {
        db.run(`
          INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, anuncio_id, referencia_id, referencia_tipo, lida)
          VALUES (?, 'info', 'Novo Comentário', ?, ?, ?, 'comentario', 0)
        `, [
          row.usuario_id,
          `${req.user.nome || 'Alguém'} comentou no teu anúncio "${row.titulo}"`,
          anuncioId,
          comentarioId
        ], (errNotif) => {
          if (errNotif) console.error("[NOTIFICAÇÃO] Erro:", errNotif.message);
        });
      }

      res.json({ sucesso: true, id: comentarioId, message: "Comentário adicionado" });
    });
  });
});

/* =========================
   RESPONDER A UM COMENTÁRIO
========================= */
router.post("/:id/comentar/:comentarioId/responder", verificarToken, (req, res) => {
  const { conteudo } = req.body;
  const anuncioId = parseInt(req.params.id);
  const comentarioId = parseInt(req.params.comentarioId);

  if (!conteudo || !conteudo.trim()) {
    return res.status(400).json({ erro: "Resposta não pode estar vazia" });
  }

  // Verificar se o comentário original existe
  db.get(`
    SELECT c.*, a.titulo, a.usuario_id as autor_anuncio_id, u.nome as autor_nome
    FROM comentarios c
    JOIN anuncios a ON c.anuncio_id = a.id
    JOIN usuarios u ON c.usuario_id = u.id
    WHERE c.id = ? AND c.anuncio_id = ?
  `, [comentarioId, anuncioId], (err, comentarioPai) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    if (!comentarioPai) return res.status(404).json({ erro: "Comentário não encontrado" });

    db.run(`
      INSERT INTO comentarios (anuncio_id, usuario_id, conteudo, resposta_id)
      VALUES (?, ?, ?, ?)
    `, [anuncioId, req.user.id, conteudo.trim(), comentarioId], function(err) {
      if (err) {
        console.error("[ANUNCIOS] Erro ao responder:", err.message);
        return res.status(500).json({ erro: "Erro ao adicionar resposta" });
      }

      const respostaId = this.lastID;

      // Notificar o autor do comentário original (se não for ele mesmo)
      if (comentarioPai.usuario_id !== req.user.id) {
        db.run(`
          INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, anuncio_id, referencia_id, referencia_tipo, lida)
          VALUES (?, 'info', 'Nova Resposta', ?, ?, ?, 'resposta', 0)
        `, [
          comentarioPai.usuario_id,
          `${req.user.nome || 'Alguém'} respondeu ao teu comentário em "${comentarioPai.titulo}"`,
          anuncioId,
          respostaId
        ]);
      }

      // Notificar também o autor do anúncio (se for diferente dos dois)
      if (comentarioPai.autor_anuncio_id !== req.user.id && comentarioPai.autor_anuncio_id !== comentarioPai.usuario_id) {
        db.run(`
          INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, anuncio_id, referencia_id, referencia_tipo, lida)
          VALUES (?, 'info', 'Nova Atividade', ?, ?, ?, 'resposta', 0)
        `, [
          comentarioPai.autor_anuncio_id,
          `Nova resposta num comentário do teu anúncio "${comentarioPai.titulo}"`,
          anuncioId,
          respostaId
        ]);
      }

      res.json({ sucesso: true, id: respostaId, message: "Resposta adicionada" });
    });
  });
});

/* =========================
   LISTAR COMENTÁRIOS DE UM ANÚNCIO (com respostas aninhadas)
========================= */
router.get("/:id/comentarios", (req, res) => {
  const anuncioId = parseInt(req.params.id);

  // Buscar comentários principais (sem resposta_id)
  db.all(`
    SELECT c.*, u.nome as autor_nome, u.avatar as autor_avatar, u.tipo_conta as autor_tipo
    FROM comentarios c
    JOIN usuarios u ON c.usuario_id = u.id
    WHERE c.anuncio_id = ? AND c.resposta_id IS NULL
    ORDER BY c.createdAt DESC
  `, [anuncioId], (err, comentarios) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });

    if (!comentarios || comentarios.length === 0) {
      return res.json([]);
    }

    // Para cada comentário, buscar respostas
    let pendentes = comentarios.length;
    const resultado = [];

    comentarios.forEach(c => {
      db.all(`
        SELECT c.*, u.nome as autor_nome, u.avatar as autor_avatar, u.tipo_conta as autor_tipo
        FROM comentarios c
        JOIN usuarios u ON c.usuario_id = u.id
        WHERE c.resposta_id = ?
        ORDER BY c.createdAt ASC
      `, [c.id], (err2, respostas) => {
        c.respostas = respostas || [];
        resultado.push(c);
        pendentes--;
        if (pendentes === 0) {
          // Ordenar pelo id original para manter ordem
          resultado.sort((a, b) => b.id - a.id);
          res.json(resultado);
        }
      });
    });
  });
});

/* =========================
   ADICIONAR/REMOVER REAÇÃO
========================= */
router.post("/:id/reagir", verificarToken, (req, res) => {
  const anuncioId = parseInt(req.params.id);
  const usuarioId = req.user.id;
  const { tipo } = req.body;

  db.get("SELECT id FROM reacoes WHERE anuncio_id = ? AND usuario_id = ?", [anuncioId, usuarioId], (err, row) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });

    if (row) {
      db.run("DELETE FROM reacoes WHERE anuncio_id = ? AND usuario_id = ?", [anuncioId, usuarioId], function(err) {
        if (err) return res.status(500).json({ erro: "Erro ao remover reação" });
        res.json({ sucesso: true, reagiu: false });
      });
    } else {
      db.run("INSERT INTO reacoes (anuncio_id, usuario_id, tipo) VALUES (?, ?, ?)", 
        [anuncioId, usuarioId, tipo || 'like'], function(err) {
        if (err) return res.status(500).json({ erro: "Erro ao adicionar reação" });
        res.json({ sucesso: true, reagiu: true });
      });
    }
  });
});

/* =========================
   LISTAR REAÇÕES
========================= */
router.get("/:id/reacoes", (req, res) => {
  db.all("SELECT tipo, COUNT(*) as total FROM reacoes WHERE anuncio_id = ? GROUP BY tipo", 
    [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    res.json(rows || []);
  });
});/* =========================
   DETALHE DE UM ANÚNCIO (com todos os campos + tipo_conta do autor)
========================= */
router.get("/:id", (req, res) => {
  db.get(
    `SELECT a.*, u.nome as usuario_nome, u.telefone as usuario_telefone, 
            u.tipo_conta as usuario_tipo_conta, u.avatar as usuario_avatar, 
            u.verificado as usuario_verificado, u.localizacao as usuario_localizacao,
            u.banido as usuario_banido, u.banido_ate
     FROM anuncios a
     LEFT JOIN usuarios u ON a.usuario_id = u.id
     WHERE a.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ erro: "Erro ao buscar anúncio" });
      }
      if (!row) {
        return res.status(404).json({ erro: "Anúncio não encontrado" });
      }

      // Verificar banimento
      const estaBanido = row.usuario_banido === 1 || row.usuario_banido === "1";
      if (estaBanido && row.banido_ate) {
        const agora = new Date();
        const dataExpiracao = new Date(row.banido_ate);
        if (agora < dataExpiracao) {
          return res.status(403).json({ erro: "Anúncio indisponível — conta do vendedor suspensa" });
        }
      } else if (estaBanido) {
        return res.status(403).json({ erro: "Anúncio indisponível — conta do vendedor suspensa" });
      }

      // Parse galeria
      if (row.galeria) {
        try { row.galeria = Array.isArray(row.galeria) ? row.galeria : JSON.parse(row.galeria); } catch (e) { row.galeria = []; }
      }

      // Remover dados sensíveis
      delete row.usuario_banido;
      delete row.banido_ate;

      // Buscar comentários, reações e AVALIAÇÕES do vendedor se for PREMIUM
      if (row.usuario_tipo_conta === "premium") {
        // Comentários principais com respostas
        db.all(`
          SELECT c.*, u.nome as autor_nome, u.avatar as autor_avatar
          FROM comentarios c
          JOIN usuarios u ON c.usuario_id = u.id
          WHERE c.anuncio_id = ? AND c.resposta_id IS NULL
          ORDER BY c.createdAt DESC
          LIMIT 10
        `, [req.params.id], (err2, comentarios) => {

          let comentariosProcessados = [];
          if (comentarios && comentarios.length > 0) {
            let pendentes = comentarios.length;
            comentarios.forEach(c => {
              db.all(`
                SELECT c.*, u.nome as autor_nome, u.avatar as autor_avatar
                FROM comentarios c
                JOIN usuarios u ON c.usuario_id = u.id
                WHERE c.resposta_id = ?
                ORDER BY c.createdAt ASC
              `, [c.id], (err3, respostas) => {
                c.respostas = respostas || [];
                comentariosProcessados.push(c);
                pendentes--;
                if (pendentes === 0) {
                  comentariosProcessados.sort((a, b) => b.id - a.id);
                  continuar();
                }
              });
            });
          } else {
            continuar();
          }

          function continuar() {
            db.all("SELECT tipo, COUNT(*) as total FROM reacoes WHERE anuncio_id = ? GROUP BY tipo", 
              [req.params.id], (err3, reacoes) => {

              // Buscar avaliações média do vendedor (perfil premium)
              db.get(`
                SELECT AVG(a.estrelas) as media, COUNT(*) as total 
                FROM avaliacoes a
                JOIN perfis_premium p ON a.perfil_premium_id = p.id
                WHERE p.usuario_id = ?
              `, [row.usuario_id], (err4, avaliacao) => {

                row.comentarios = comentariosProcessados;
                row.reacoes = reacoes || [];
                row.avaliacao = {
                  media: avaliacao && avaliacao.media ? parseFloat(avaliacao.media).toFixed(1) : 0,
                  total: avaliacao ? avaliacao.total : 0
                };
                res.json(row);
              });
            });
          }
        });
      } else {
        res.json(row);
      }    }
  );
});
/* =====================================================
   CRIAR ANÚNCIO — PREMIUM publica direto, NORMAL fica pendente
   Com todos os campos do modal de detalhe
===================================================== */
router.post(
  "/",
  verificarToken,
  upload.array("imagens", 4), // limite técnico por anúncio; não limita a quantidade de anúncios do utilizador
  tratarErroUpload,
  (req, res) => {

    // Verificar se o utilizador está banido antes de criar anúncio
    verificarBanimento(req.user.id, (errBan, banStatus) => {
      if (errBan) {
        console.error("[ANUNCIOS] Erro ao verificar banimento:", errBan.message);
        return res.status(500).json({ erro: "Erro no servidor" });
      }

      if (banStatus.banido) {
        if (banStatus.permanente) {
          return res.status(403).json({
            erro: "Conta Suspensa por violação das nossas regras e Condições. Contacte o suporte.",
            banido: true
          });
        }
        return res.status(403).json({
          erro: "Conta suspensa temporariamente até " + banStatus.banido_ate,
          banido: true,
          banido_ate: banStatus.banido_ate
        });
      }

      // Verificar tipo de conta para definir status
      db.get("SELECT tipo_conta FROM usuarios WHERE id = ?", [req.user.id], (errTipo, userRow) => {
        if (errTipo) {
          console.error("[ANUNCIOS] Erro ao verificar tipo_conta:", errTipo.message);
          return res.status(500).json({ erro: "Erro no servidor" });
        }

        // O plano NORMAL não tem limite comercial de anúncios.
        // A única diferença de publicação é a aprovação prévia: PREMIUM publica diretamente.
        const contaPremium = req.user.tipo === 'admin' || (userRow && userRow.tipo_conta === 'premium');
        const status = contaPremium ? 'active' : 'pendente';
        const mensagem = contaPremium
          ? 'Anúncio publicado com sucesso!'
          : 'Anúncio enviado para aprovação';

        // Log para debug
        console.log("[ANUNCIOS] Dados recebidos:", req.body);
        console.log("[ANUNCIOS] Ficheiros recebidos:", req.files ? req.files.length : 0);
        console.log("[ANUNCIOS] Tipo conta:", userRow ? userRow.tipo_conta : 'normal', "=> Status:", status);

        const { title, descricao, price, categoria, ...rest } = req.body;
        const categoriaNormalizada = String(categoria || '').trim().toLowerCase();
        if (!CATEGORIAS_VALIDAS.has(categoriaNormalizada)) {
          return res.status(400).json({ erro: 'Categoria inválida. Escolha uma categoria disponível.' });
        }

        const atributos = parseAtributos(req.body.atributos);
        if (atributos === null) return res.status(400).json({ erro: 'Dados específicos da categoria inválidos.' });
        const titulo = String(title || '').trim();
        const preco = toNumberOrNull(price);
        if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório' });
        if (preco === null || preco <= 0) return res.status(400).json({ erro: 'Preço válido é obrigatório (deve ser maior que 0)' });

        // O backend é a última barreira: os campos obrigatórios são definidos pela categoria,
        // independentemente de qual frontend enviou o formulário.
        for (const campo of CATEGORIA_REGRAS[categoriaNormalizada]) {
          const value = campo === 'title' ? titulo : campo === 'price' ? preco : (req.body[campo] ?? atributos[campo]);
          if (value === undefined || value === null || String(value).trim() === '') {
            return res.status(400).json({ erro: `O campo "${campo}" é obrigatório para a categoria selecionada.` });
          }
        }

        const marca = String(req.body.marca || atributos.marca || '').trim();
        const estado = String(req.body.estado || atributos.estado || '').trim();
        const contacto = String(req.body.contacto || atributos.contacto || '').trim();
        const ano = toIntOrNull(req.body.ano ?? atributos.ano);
        const quilometragem = toIntOrNull(req.body.quilometragem ?? atributos.quilometragem);
        const combustivel = String(req.body.combustivel || atributos.combustivel || '').trim();
        const caixa = String(req.body.caixa || atributos.caixa || '').trim();
        const tracao = String(req.body.tracao || atributos.tracao || '').trim();
        const cor = String(req.body.cor || atributos.cor || '').trim();
        const portas = toIntOrNull(req.body.portas ?? atributos.portas);
        const lotacao = toIntOrNull(req.body.lotacao ?? atributos.lotacao);
        const versao = String(req.body.versao || atributos.versao || '').trim();
        const modelo = String(req.body.modelo || atributos.modelo || '').trim();
        const localizacao = String(req.body.localizacao || atributos.localizacao || '').trim();
        const negociavel = toBool(req.body.negociavel ?? atributos.negociavel) ? 1 : 0;
        const equipamentos = String(req.body.equipamentos || atributos.equipamentos || '').trim();
        const descricaoCompleta = String(descricao || atributos.descricao || '').trim();

        // Guardar sempre o contrato de categoria completo no JSONB; os campos legados acima
        // permanecem preenchidos para compatibilidade com páginas antigas.
        atributos.title = titulo;
        atributos.price = preco;
        atributos.contacto = contacto;
        atributos.descricao = descricaoCompleta;
        atributos.negociavel = !!negociavel;
        atributos.categoria = categoriaNormalizada;

        let imagem = null;
        let galeria = [];

        if (req.files && req.files.length > 0) {
          imagem = req.files[0].filename;
          if (req.files.length > 1) {
            galeria = req.files.map(f => f.filename);
          }
        }

        const sql = `
          INSERT INTO anuncios 
          (titulo, descricao, preco, categoria, imagem, galeria, marca, estado, contacto, usuario_id, status,
           ano, quilometragem, combustivel, caixa, tracao, cor, portas, lotacao, versao, modelo, localizacao, 
           negociavel, equipamentos, descricao_completa, atributos)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(
          sql,
          [
            titulo,
            descricao || "",
            preco,
            categoriaNormalizada,
            imagem,
            JSON.stringify(galeria),
            marca || "",
            estado || "",
            contacto || "",
            req.user.id,
            status,
            // NOVOS CAMPOS
            ano ? parseInt(ano) : null,
            quilometragem ? parseInt(quilometragem) : null,
            combustivel || "",
            caixa || "",
            tracao || "",
            cor || "",
            portas ? parseInt(portas) : null,
            lotacao ? parseInt(lotacao) : null,
            versao || "",
            modelo || "",
            localizacao || "",
            negociavel ? 1 : 0,
            equipamentos || "",
            descricaoCompleta,
            JSON.stringify(atributos),
          ],
          function (err) {
            if (err) {
              console.error("[ANUNCIOS] Erro ao criar anúncio:", err.message);
              return res.status(500).json({ erro: "Erro ao criar anúncio: " + err.message });
            }

            const anuncioId = this.lastID;

            // GERAR CÓDIGO ÚNICO
            const codigo = `LAO-${new Date().getFullYear()}-${String(anuncioId).padStart(6, "0")}`;

            db.run(
              "UPDATE anuncios SET codigo = ? WHERE id = ?",
              [codigo, anuncioId],
              function(err2) {
                if (err2) {
                  console.error("[ANUNCIOS] Erro ao gerar código:", err2.message);
                }
              }
            );

            // Premium: avisar seguidores de uma nova publicação. A notificação
            // é assíncrona para não atrasar a resposta ao vendedor.
            if (contaPremium) {
              db.query(`INSERT INTO notificacoes (usuario_id,tipo,titulo,mensagem,anuncio_id,lida)
                SELECT s.seguidor_id,'info','Nova publicação',?, ?,0
                FROM seguidores s WHERE s.seguido_id=?`,
                [`O perfil que segue publicou um novo anúncio: ${titulo}`, anuncioId, req.user.id]
              ).catch(e => console.error('[ANUNCIOS] Falha ao notificar seguidores:', e.message));
            }

            res.json({
              sucesso: true,
              id: anuncioId,
              codigo,
              status: status,
              premium: contaPremium,
              mensagem: mensagem
            });
          }
        );
      });
    });
  }
);/* =====================================================
   LISTAR PÚBLICO (SÓ APROVADOS + não banidos)
   ⚠️ DEVE VIR POR ÚLTIMO (rota raiz "/")
===================================================== */
router.get("/", (req, res) => {

  const { categoria } = req.query;

  // Listar apenas anúncios 'active' cujo utilizador NÃO está banido
  let sql = `
    SELECT a.* FROM anuncios a
    LEFT JOIN usuarios u ON a.usuario_id = u.id
    WHERE a.status = 'active'
    AND (u.banido IS NULL OR u.banido = 0 OR (u.banido = 1 AND u.banido_ate IS NOT NULL AND u.banido_ate < CURRENT_TIMESTAMP))
    ORDER BY a.id DESC
  `;
  let params = [];

  if (categoria) {
    sql = `
      SELECT a.* FROM anuncios a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      WHERE a.status = 'active'
      AND a.categoria = ?
      AND (u.banido IS NULL OR u.banido = 0 OR (u.banido = 1 AND u.banido_ate IS NOT NULL AND u.banido_ate < CURRENT_TIMESTAMP))
      ORDER BY a.id DESC
    `;
    params.push(categoria);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("[ANUNCIOS] Erro ao listar anúncios:", err.message);
      return res.status(500).json({ erro: "Erro ao listar anúncios" });
    }

    console.log("[ANUNCIOS] Listados", rows.length, "anúncios ativos");

    const result = rows.map(r => {
      if (r.galeria) {
        try { r.galeria = Array.isArray(r.galeria) ? r.galeria : JSON.parse(r.galeria); } catch (e) { r.galeria = []; }
      }
      return r;
    });

    res.json(result);
  });
});

module.exports = router;