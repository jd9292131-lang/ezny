/* backend/routes/premium.js */
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verificarToken } = require("../middleware/auth");
const { requirePremium } = require("../middleware/premium");

const { upload, tratarErroUpload } = require('../middleware/upload');

/* Plano e limites atuais */
router.get("/status", verificarToken, (req,res)=>{
  const { getPlan } = require("../config/plans");
  db.get("SELECT id,tipo_conta,premium_desde,premium_ate FROM usuarios WHERE id=?",[req.user.id],(err,user)=>{
    if(err) return res.status(500).json({erro:"Erro ao consultar plano"});
    if(!user) return res.status(404).json({erro:"Utilizador não encontrado"});
    const expired=user.tipo_conta==='premium' && user.premium_ate && Date.parse(user.premium_ate)<=Date.now();
    if(expired){ db.run("UPDATE usuarios SET tipo_conta='normal', premium_ate=NULL WHERE id=?",[user.id]); user.tipo_conta='normal'; }
    res.json({tipo_conta:user.tipo_conta||'normal',premium_desde:user.premium_desde||null,premium_ate:user.premium_ate||null,limites:getPlan(user.tipo_conta)});
  });
});

/* =========================
   ATUALIZAR PERFIL PREMIUM (PUT com upload)
========================= */
router.put("/perfil", verificarToken, requirePremium, upload.fields([
  { name: 'foto_capa', maxCount: 1 },
  { name: 'avatar', maxCount: 1 }
]), tratarErroUpload, (req, res) => {
  const usuarioId = req.user.id;
  const {
    nome, descricao, localizacao, telefone_whatsapp,
    email, website, categoria_negocio, horario_funcionamento, redes_sociais
  } = req.body;

  // Verificar se é premium
  db.get("SELECT tipo_conta, avatar FROM usuarios WHERE id = ?", [usuarioId], (err, user) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    if (!user) return res.status(404).json({ erro: "Utilizador não encontrado" });
    if (user.tipo_conta !== "premium") {
      return res.status(403).json({ erro: "Apenas PREMIUM" });
    }

    // Ficheiros enviados
    const fotoCapa = req.files && req.files['foto_capa'] ? req.files['foto_capa'][0].filename : null;
    const avatar = req.files && req.files['avatar'] ? req.files['avatar'][0].filename : null;

    // Atualizar avatar na tabela usuarios se foi enviado
    if (avatar) {
      db.run("UPDATE usuarios SET avatar = ? WHERE id = ?", [avatar, usuarioId]);
    }
    // Atualizar nome na tabela usuarios se foi enviado
    if (nome) {
      db.run("UPDATE usuarios SET nome = ? WHERE id = ?", [nome, usuarioId]);
    }

    // Construir query dinâmica para perfis_premium
    const campos = [];
    const valores = [];

    if (fotoCapa) { campos.push('foto_capa'); valores.push(fotoCapa); }
    if (nome) { campos.push('nome_comercial'); valores.push(nome); }
    if (descricao !== undefined) { campos.push('descricao'); valores.push(descricao); }
    if (localizacao !== undefined) { campos.push('localizacao'); valores.push(localizacao); }
    if (telefone_whatsapp !== undefined) { campos.push('telefone_whatsapp'); valores.push(telefone_whatsapp); }
    if (email !== undefined) { campos.push('email'); valores.push(email); }
    if (website !== undefined) { campos.push('website'); valores.push(website); }
    if (categoria_negocio !== undefined) { campos.push('categoria_negocio'); valores.push(categoria_negocio); }
    if (horario_funcionamento !== undefined) { campos.push('horario_funcionamento'); valores.push(horario_funcionamento); }
    if (redes_sociais !== undefined) { campos.push('redes_sociais'); valores.push(redes_sociais); }

    campos.push('updatedAt');

    // Verificar se já existe perfil
    db.get("SELECT id FROM perfis_premium WHERE usuario_id = ?", [usuarioId], (err, perfil) => {
      if (err) return res.status(500).json({ erro: "Erro no servidor" });

      if (perfil) {
        // UPDATE
        const setClause = campos.map(c => c === 'updatedAt' ? '"updatedAt" = CURRENT_TIMESTAMP' : `${c} = ?`).join(', ');
        valores.push(usuarioId);
        db.run(`UPDATE perfis_premium SET ${setClause} WHERE usuario_id = ?`, valores, function(err) {
          if (err) {
            console.error("[PREMIUM] Erro ao atualizar:", err.message);
            return res.status(500).json({ erro: "Erro ao atualizar perfil" });
          }
          res.json({ sucesso: true, message: "Perfil atualizado", avatar, foto_capa: fotoCapa });
        });
      } else {
        // INSERT
        const cols = ['usuario_id', ...campos].map(c => c === 'updatedAt' ? '"updatedAt"' : c);
        const placeholders = cols.map(c => c === 'updatedAt' ? 'CURRENT_TIMESTAMP' : '?').join(', ');
        const insertVals = [usuarioId, ...valores];
        db.run(`INSERT INTO perfis_premium (${cols.join(', ')}) VALUES (${placeholders})`, insertVals, function(err) {
          if (err) {
            console.error("[PREMIUM] Erro ao criar:", err.message);
            return res.status(500).json({ erro: "Erro ao criar perfil" });
          }
          res.json({ sucesso: true, message: "Perfil criado", avatar, foto_capa: fotoCapa });
        });
      }
    });
  });
});

/* =========================
   OBTER PERFIL PREMIUM PÚBLICO
========================= */
router.get("/perfil/:usuarioId", (req, res) => {
  const usuarioId = req.params.usuarioId;

  db.get(`
    SELECT u.id, u.nome, u.avatar, u.localizacao, u.verificado, u.tipo_conta, u.premium_desde, u.premium_ate, u.telefone,
           p.id AS perfil_id, p.usuario_id AS perfil_usuario_id, p.foto_capa, p.nome_comercial,
           p.categoria_negocio, p.descricao, p.telefone_whatsapp, p.email, p.localizacao AS perfil_localizacao,
           p.horario_funcionamento, p.website, p.redes_sociais, p."createdAt" AS perfil_created_at,
           p."updatedAt" AS perfil_updated_at,
           (SELECT COUNT(*) FROM seguidores WHERE seguido_id = u.id) as total_seguidores,
           (SELECT COUNT(*) FROM seguidores WHERE seguidor_id = u.id) as total_seguindo,
           (SELECT ROUND(AVG(estrelas), 1) FROM avaliacoes WHERE perfil_premium_id = u.id) as media_avaliacoes,
           (SELECT COUNT(*) FROM avaliacoes WHERE perfil_premium_id = u.id) as total_avaliacoes
    FROM usuarios u
    LEFT JOIN perfis_premium p ON u.id = p.usuario_id
    WHERE u.id = ? AND u.tipo_conta = 'premium'
  `, [usuarioId], (err, row) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    if (!row) return res.status(404).json({ erro: "Perfil premium não encontrado" });

    // Buscar publicações deste perfil
    db.all(`
      SELECT a.*, 
             (SELECT COUNT(*) FROM comentarios WHERE anuncio_id = a.id) as total_comentarios,
             (SELECT COUNT(*) FROM reacoes WHERE anuncio_id = a.id) as total_reacoes
      FROM anuncios a
      WHERE a.usuario_id = ? AND a.status = 'active'
      ORDER BY a.id DESC
    `, [usuarioId], (err2, anuncios) => {
      if (err2) console.error("[PREMIUM] Erro ao buscar anúncios:", err2.message);

      res.json({
        perfil: row,
        publicacoes: anuncios || []
      });
    });
  });
});

/* =========================
   SEGUIR / DEIXAR DE SEGUIR
========================= */
router.post("/seguir/:usuarioId", verificarToken, (req, res) => {
  const seguidorId = req.user.id;
  const seguidoId = parseInt(req.params.usuarioId);

  if (seguidorId === seguidoId) {
    return res.status(400).json({ erro: "Não pode seguir a si mesmo" });
  }

  db.get("SELECT tipo_conta FROM usuarios WHERE id = ?", [seguidoId], (err, user) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    if (!user) return res.status(404).json({ erro: "Utilizador não encontrado" });
    if (user.tipo_conta !== "premium") {
      return res.status(403).json({ erro: "Apenas pode seguir páginas PREMIUM" });
    }

    db.get("SELECT id FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?", [seguidorId, seguidoId], (err, seg) => {
      if (err) return res.status(500).json({ erro: "Erro no servidor" });

      if (seg) {
        db.run("DELETE FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?", [seguidorId, seguidoId], function(err) {
          if (err) return res.status(500).json({ erro: "Erro ao deixar de seguir" });
          res.json({ sucesso: true, seguindo: false, message: "Deixou de seguir" });
        });
      } else {
        db.run("INSERT INTO seguidores (seguidor_id, seguido_id) VALUES (?, ?)", [seguidorId, seguidoId], function(err) {
          if (err) return res.status(500).json({ erro: "Erro ao seguir" });
          res.json({ sucesso: true, seguindo: true, message: "A seguir" });
        });
      }
    });
  });
});

/* =========================
   VERIFICAR SE ESTOU A SEGUIR
========================= */
router.get("/seguindo/:usuarioId", verificarToken, (req, res) => {
  db.get("SELECT id FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?", 
    [req.user.id, req.params.usuarioId], (err, row) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    res.json({ seguindo: !!row });
  });
});

/* =========================
   LISTAR SEGUIDORES
========================= */
router.get("/seguidores/:usuarioId", (req, res) => {
  db.all(`
    SELECT u.id, u.nome, u.avatar, u.tipo_conta, s.createdAt
    FROM seguidores s
    JOIN usuarios u ON s.seguidor_id = u.id
    WHERE s.seguido_id = ?
    ORDER BY s.createdAt DESC
  `, [req.params.usuarioId], (err, rows) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    res.json(rows || []);
  });
});

/* =========================
   LISTAR A QUEM SIGO
========================= */
router.get("/seguindo-lista/:usuarioId", (req, res) => {
  db.all(`
    SELECT u.id, u.nome, u.avatar, u.tipo_conta, s.createdAt
    FROM seguidores s
    JOIN usuarios u ON s.seguido_id = u.id
    WHERE s.seguidor_id = ?
    ORDER BY s.createdAt DESC
  `, [req.params.usuarioId], (err, rows) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    res.json(rows || []);
  });
});

/* =========================
   CRIAR AVALIAÇÃO
========================= */
router.post("/avaliar/:usuarioId", verificarToken, (req, res) => {
  const { estrelas, comentario } = req.body;
  const avaliadorId = req.user.id;
  const perfilPremiumId = parseInt(req.params.usuarioId);

  if (!estrelas || estrelas < 1 || estrelas > 5) {
    return res.status(400).json({ erro: "Estrelas devem ser entre 1 e 5" });
  }

  if (avaliadorId === perfilPremiumId) {
    return res.status(400).json({ erro: "Não pode avaliar a si mesmo" });
  }

  db.get("SELECT tipo_conta FROM usuarios WHERE id = ?", [perfilPremiumId], (err, user) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    if (!user) return res.status(404).json({ erro: "Utilizador não encontrado" });
    if (user.tipo_conta !== "premium") {
      return res.status(403).json({ erro: "Apenas pode avaliar perfis PREMIUM" });
    }

    // Uma avaliação por pessoa para cada perfil. Evita avaliações duplicadas/falsas.
    db.get(
      "SELECT id FROM avaliacoes WHERE avaliador_id = ? AND perfil_premium_id = ?",
      [avaliadorId, perfilPremiumId],
      (checkErr, existente) => {
        if (checkErr) return res.status(500).json({ erro: "Erro ao validar avaliação" });
        if (existente) return res.status(409).json({ erro: "Já enviou uma avaliação para este perfil." });

        db.run(`
      INSERT INTO avaliacoes (avaliador_id, perfil_premium_id, estrelas, comentario)
      VALUES (?, ?, ?, ?)
    `, [avaliadorId, perfilPremiumId, estrelas, comentario || null], function(err) {
      if (err) {
        console.error("[PREMIUM] Erro ao avaliar:", err.message);
        return res.status(500).json({ erro: "Erro ao criar avaliação" });
      }
      res.json({ sucesso: true, id: this.lastID, message: "Avaliação enviada" });
        });
      }
    );
  });
});

/* =========================
   LISTAR AVALIAÇÕES DE UM PERFIL
========================= */
router.get("/avaliacoes/:usuarioId", (req, res) => {
  db.all(`
    SELECT a.*, u.nome as avaliador_nome, u.avatar as avaliador_avatar, u.tipo_conta as avaliador_tipo
    FROM avaliacoes a
    JOIN usuarios u ON a.avaliador_id = u.id
    WHERE a.perfil_premium_id = ?
    ORDER BY a.createdAt DESC
  `, [req.params.usuarioId], (err, rows) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    res.json(rows || []);
  });
});

/* =========================
   PEDIDO DE VERIFICAÇÃO
========================= */
router.post("/verificar", verificarToken, (req, res) => {
  const { bi_documento, nif_documento, empresa_documento } = req.body;
  const usuarioId = req.user.id;

  db.get("SELECT tipo_conta FROM usuarios WHERE id = ?", [usuarioId], (err, user) => {
    if (err) return res.status(500).json({ erro: "Erro no servidor" });
    if (!user || user.tipo_conta !== "premium") {
      return res.status(403).json({ erro: "Apenas PREMIUM pode pedir verificação" });
    }

    db.run(`
      INSERT INTO verificacoes_pendentes (usuario_id, bi_documento, nif_documento, empresa_documento, status)
      VALUES (?, ?, ?, ?, 'pendente')
      ON CONFLICT(usuario_id) DO UPDATE SET
        bi_documento = excluded.bi_documento,
        nif_documento = excluded.nif_documento,
        empresa_documento = excluded.empresa_documento,
        status = 'pendente',
        updatedAt = CURRENT_TIMESTAMP
    `, [usuarioId, bi_documento, nif_documento, empresa_documento], function(err) {
      if (err) {
        console.error("[PREMIUM] Erro ao pedir verificação:", err.message);
        return res.status(500).json({ erro: "Erro ao enviar documentos" });
      }
      res.json({ sucesso: true, message: "Documentos enviados para verificação" });
    });
  });
});

/* =========================
   LISTAR TODOS OS PERFIS PREMIUM
========================= */
router.get("/perfis", (req, res) => {
  const { categoria, search } = req.query;

  let sql = `
    SELECT u.id, u.nome, u.avatar, u.verificado, u.localizacao, u.premium_desde,
           p.nome_comercial, p.categoria_negocio, p.descricao,
           (SELECT COUNT(*) FROM seguidores WHERE seguido_id = u.id) as total_seguidores,
           (SELECT ROUND(AVG(estrelas), 1) FROM avaliacoes WHERE perfil_premium_id = u.id) as media_avaliacoes
    FROM usuarios u
    LEFT JOIN perfis_premium p ON u.id = p.usuario_id
    WHERE u.tipo_conta = 'premium'
  `;

  const params = [];

  if (categoria) {
    sql += " AND p.categoria_negocio = ?";
    params.push(categoria);
  }

  if (search) {
    sql += " AND (u.nome LIKE ? OR p.nome_comercial LIKE ? OR p.descricao LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  sql += " ORDER BY u.premium_desde DESC";

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("[PREMIUM] Erro ao listar perfis:", err.message);
      return res.status(500).json({ erro: "Erro ao listar perfis" });
    }
    res.json(rows || []);
  });
});

module.exports = router;