/* backend/routes/auth.js */
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { gerarToken, verificarToken, requireAdmin } = require("../middleware/auth");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false });
const fs = require('fs');
const path = require('path');
const { upload, tratarErroUpload } = require('../middleware/upload');

function calcularIdade(dataNascimento) {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento + "T00:00:00");
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

/* ============================================================
   FUNÇÃO AUXILIAR: Eliminar anúncios e imagens de um utilizador
   (usada quando o utilizador elimina a própria conta)
============================================================ */
function eliminarAnunciosDoUtilizador(userId, callback) {
  db.all(
    "SELECT id, imagem, galeria FROM anuncios WHERE usuario_id = ?",
    [userId],
    (err, anuncios) => {
      if (err) {
        console.error("[AUTH] Erro ao buscar anúncios do utilizador:", err.message);
        return callback(err);
      }

      // Eliminar ficheiros de imagem do disco
      const uploadsDir = path.join(__dirname, '..', 'uploads');

      anuncios.forEach(anuncio => {
        // Imagem principal
        if (anuncio.imagem) {
          const imgPath = path.join(uploadsDir, anuncio.imagem);
          fs.unlink(imgPath, (err) => {
            if (err && err.code !== 'ENOENT') {
              console.error(`[AUTH] Erro ao eliminar imagem ${anuncio.imagem}:`, err.message);
            }
          });
        }
        // Galeria
        if (anuncio.galeria) {
          try {
            const galeria = Array.isArray(anuncio.galeria) ? anuncio.galeria : JSON.parse(anuncio.galeria);
            galeria.forEach(img => {
              const imgPath = path.join(uploadsDir, img);
              fs.unlink(imgPath, (err) => {
                if (err && err.code !== 'ENOENT') {
                  console.error(`[AUTH] Erro ao eliminar imagem da galeria ${img}:`, err.message);
                }
              });
            });
          } catch (e) {
            console.error("[AUTH] Erro ao parsear galeria:", e.message);
          }
        }
      });

      // Eliminar registos da base de dados
      db.run(
        "DELETE FROM anuncios WHERE usuario_id = ?",
        [userId],
        function(err) {
          if (err) {
            console.error("[AUTH] Erro ao eliminar anúncios da BD:", err.message);
            return callback(err);
          }
          console.log(`[AUTH] ${this.changes} anúncio(s) eliminado(s) do utilizador ${userId}`);
          callback(null, this.changes);
        }
      );
    }
  );
}

/* ============================================================
   FUNÇÃO AUXILIAR: Limpeza completa de dados do utilizador
   (anúncios, premium, seguidores, avaliações, mensagens,
    comentários, reações, verificações, notificações, popups)
============================================================ */
function limparDadosUtilizador(userId, callback) {
  eliminarAnunciosDoUtilizador(userId, (errAnuncios) => {
    if (errAnuncios) {
      console.error("[AUTH] Erro ao eliminar anúncios:", errAnuncios.message);
    }

    const tarefas = [
      { sql: "DELETE FROM perfis_premium WHERE usuario_id = ?", params: [userId], nome: "perfil premium" },
      { sql: "DELETE FROM seguidores WHERE seguidor_id = ? OR seguido_id = ?", params: [userId, userId], nome: "seguidores" },
      { sql: "DELETE FROM avaliacoes WHERE avaliador_id = ? OR perfil_premium_id = ?", params: [userId, userId], nome: "avaliações" },
      { sql: "DELETE FROM mensagens WHERE remetente_id = ? OR destinatario_id = ?", params: [userId, userId], nome: "mensagens" },
      { sql: "DELETE FROM comentarios WHERE usuario_id = ?", params: [userId], nome: "comentários" },
      { sql: "DELETE FROM reacoes WHERE usuario_id = ?", params: [userId], nome: "reações" },
      { sql: "DELETE FROM verificacoes_pendentes WHERE usuario_id = ?", params: [userId], nome: "verificações" },
      { sql: "DELETE FROM notificacoes WHERE usuario_id = ?", params: [userId], nome: "notificações" },
      { sql: "DELETE FROM popups_vistos WHERE usuario_id = ?", params: [userId], nome: "popups vistos" }
    ];

    let pendentes = tarefas.length;
    let erroFinal = null;

    tarefas.forEach(t => {
      db.run(t.sql, t.params, (err) => {
        if (err) {
          console.error(`[AUTH] Erro ao eliminar ${t.nome}:`, err.message);
          erroFinal = erroFinal || err;
        }
        pendentes--;
        if (pendentes === 0) {
          callback(erroFinal);
        }
      });
    });
  });
}

/* ============================================================
   FUNÇÃO AUXILIAR: Enviar notificações de boas-vindas
============================================================ */
function enviarNotificacoesBoasVindas(userId, nome) {
  const notificacoes = [
    {
      titulo: 'Bem-vindo ao EZNY! 🎉',
      mensagem: `Olá ${nome || ''}! A sua conta foi criada com sucesso. Explore anúncios, publique os seus produtos e aproveite a plataforma. Qualquer dúvida, estamos aqui para ajudar!`,
      tipo: 'info'
    },
    {
      titulo: 'Dica: Como criar o seu primeiro anúncio',
      mensagem: 'Clique em "Vender" no menu para criar o seu primeiro anúncio. É rápido e fácil! Adicione fotos, descrição e preço para alcançar mais compradores.',
      tipo: 'info'
    },
    {
      titulo: 'Complete o seu perfil',
      mensagem: 'Adicione uma foto e mais informações ao seu perfil para aumentar a confiança dos outros utilizadores.',
      tipo: 'info'
    }
  ];


  notificacoes.forEach((notif, index) => {
    setTimeout(() => {
      db.run(
        'INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, lida) VALUES (?, ?, ?, ?, 0)',
        [userId, notif.tipo, notif.titulo, notif.mensagem],
        (err) => {
          if (err) {
            console.error(`[BOAS-VINDAS] Erro notificação #${index}:`, err);
          } else {
            console.log(`[BOAS-VINDAS] Notificação #${index} enviada para user ${userId}`);
          }
        }
      );
    }, index * 500);
  });

  db.all('SELECT id FROM popups WHERE ativo = 1', [], (err, popups) => {
    if (!err && popups && popups.length > 0) {
      Promise.all(popups.map(p => new Promise(resolve => {
        db.run(
          'INSERT INTO popups_vistos (usuario_id, popup_id) VALUES (?, ?) ON CONFLICT(usuario_id,popup_id) DO NOTHING',
          [userId, p.id],
          () => resolve()
        );
      }))).then(() => {
        console.log(`[BOAS-VINDAS] ${popups.length} popups antigos marcados como vistos para user ${userId}`);
      });
    }
  });

  console.log(`[BOAS-VINDAS] Notificações automáticas iniciadas para user ${userId}`);
}

/* ============================================================
   FUNÇÃO AUXILIAR: Distinguir duplicado telefone vs email
============================================================ */
function verificarDuplicado(err, telefone, email, callback) {
  // PostgreSQL unique violation
  if (err.code === '23505' || /unique constraint/i.test(err.message)) {
    // Tentar descobrir se é telefone ou email
    if (telefone) {
      db.get('SELECT id FROM usuarios WHERE telefone = ?', [telefone], (errTel, rowTel) => {
        if (!errTel && rowTel) {
          return callback(null, 'telefone');
        }
        if (email) {
          db.get('SELECT id FROM usuarios WHERE email = ?', [email], (errEmail, rowEmail) => {
            if (!errEmail && rowEmail) {
              return callback(null, 'email');
            }
            return callback(null, 'desconhecido');
          });
        } else {
          return callback(null, 'desconhecido');
        }
      });
    } else if (email) {
      db.get('SELECT id FROM usuarios WHERE email = ?', [email], (errEmail, rowEmail) => {
        if (!errEmail && rowEmail) {
          return callback(null, 'email');
        }
        return callback(null, 'desconhecido');
      });
    } else {
      return callback(null, 'desconhecido');
    }
  } else {
    return callback(null, null);
  }
}

/* =========================
   REGISTAR (sem opção premium — sempre normal)
========================= */
router.post("/register", authLimiter, async (req, res) => {
  const { nome, telefone, senha, data_nascimento, email } = req.body; 
  if (!nome || !telefone || !senha || !data_nascimento) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  // Validação de limites de texto
  if (nome.length > 120) {
    return res.status(400).json({ erro: "Nome demasiado longo (máx. 120 caracteres)" });
  }
  if (telefone.length > 40) {
    return res.status(400).json({ erro: "Telefone demasiado longo (máx. 40 caracteres)" });
  }
  if (email && email.length > 254) {
    return res.status(400).json({ erro: "Email demasiado longo (máx. 254 caracteres)" });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ erro: "Introduza um email válido." });
  }

  const nascimento = new Date(data_nascimento + "T00:00:00");
  if (isNaN(nascimento.getTime())) {
    return res.status(400).json({ erro: "Data de nascimento inválida" });
  }

  // Verificar data no futuro
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (nascimento > hoje) {
    return res.status(400).json({ erro: "Data de nascimento não pode ser no futuro" });
  }

  const idade = calcularIdade(data_nascimento);
  if (idade < 0 || idade > 150) {
    return res.status(400).json({ erro: "Idade inválida" });
  }
  if (idade < 18) {
    return res.status(403).json({ erro: "Apenas maiores de 18 anos podem criar conta." });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const sql = `INSERT INTO usuarios (nome, telefone, senha, email, tipo, tipo_conta, data_nascimento) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [nome, telefone, senhaHash, email || null, "user", "normal", data_nascimento], function (err) {
    if (err) {
        verificarDuplicado(err, telefone, email, (checkErr, campoDuplicado) => {
          if (campoDuplicado === 'telefone') {
            return res.status(409).json({ erro: "Telefone já registado" });
          }
          if (campoDuplicado === 'email') {
            return res.status(409).json({ erro: "Email já registado" });
          }
          console.error("[AUTH] Erro ao registar:", err.message);
          return res.status(500).json({ erro: "Erro no servidor" });
        });
        return;
      }

      const userId = this.lastID;
      enviarNotificacoesBoasVindas(userId, nome);

      const token = gerarToken({ id: userId, nome, telefone, tipo: "user", tipo_conta: "normal" });
      res.json({
        sucesso: true,
        token,
        nome,
        email: email || null,
        tipo_conta: "normal"
      });
    });
  } catch (error) {
    console.error("[AUTH] Erro ao processar senha:", error);
    return res.status(500).json({ erro: "Erro ao processar senha" });
  }
});

/* =========================
   LOGIN (com verificação de banimento)
========================= */
router.post("/login", authLimiter, async (req, res) => {
  const { telefone, senha } = req.body;
  if (!telefone || !senha) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  const sql = "SELECT * FROM usuarios WHERE telefone = ?";
  db.get(sql, [telefone], async (err, user) => {
    if (err) {
      return res.status(500).json({ erro: "Erro no servidor" });
    }
    if (!user) {
      return res.status(401).json({ erro: "Número incorreto ou Usuário inexistente" });
    }

    const estaBanido = user.banido === 1 || user.banido === "1";

    if (estaBanido) {
      if (user.banido_ate) {
        const agora = new Date();
        const dataExpiracao = new Date(user.banido_ate);

        if (agora < dataExpiracao) {
          return res.status(403).json({
            erro: "Conta suspensa temporariamente até " + user.banido_ate,
            banido: true,
            banido_ate: user.banido_ate,
            tipo_banimento: "temporario"
          });
        }

        db.run("UPDATE usuarios SET banido = 0, banido_ate = NULL WHERE id = ?", [user.id], function(updateErr) {
          if (updateErr) {
            console.error("Erro ao desbanir automaticamente:", updateErr.message);
          }
          fazerLogin(user, senha, res);
        });
        return;

      } else {
        return res.status(403).json({
          erro: "Conta Suspensa por violação das nossas regras e Condições. Contacte o suporte.",
          banido: true
        });
      }
    }

    fazerLogin(user, senha, res);
  });
});

async function fazerLogin(user, senha, res) {
  try {
    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: "Senha incorreta" });
    }

    // Iniciar sessão cancela a eliminação agendada da própria conta.
    if (user.eliminacao_agendada) {
      await new Promise(resolve => {
        db.run(
          "UPDATE usuarios SET eliminacao_agendada = 0, eliminacao_ate = NULL WHERE id = ?",
          [user.id],
          () => resolve()
        );
      });
    }

    const userTipo = user.tipo || "user";
    const userTipoConta = user.tipo_conta || "normal";

    const token = gerarToken({
      id: user.id,
      nome: user.nome,
      telefone: user.telefone,
      tipo: userTipo,
      tipo_conta: userTipoConta
    });

    res.json({
      sucesso: true,
      token,
      nome: user.nome,
      telefone: user.telefone,
      email: user.email || null,
      tipo: userTipo,
      tipo_conta: userTipoConta
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ erro: "Erro no servidor" });
  }
}

/* =========================
   LISTAR UTILIZADORES
========================= */
router.get("/usuarios", verificarToken, requireAdmin, (req, res) => {
  db.all(
    "SELECT id, nome, telefone, email, tipo, tipo_conta, banido, banido_ate, createdAt FROM usuarios ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        console.error("Erro ao listar utilizadores:", err.message);
        return res.status(500).json({ erro: "Erro ao listar utilizadores" });
      }
      res.json(rows);
    }
  );
});

/* =========================
   APAGAR UTILIZADOR (ADMIN) — com limpeza completa
========================= */
router.delete("/usuarios/:id", verificarToken, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ erro: "ID de utilizador inválido" });
  }

  // Impedir admin de se auto-eliminar
  if (id === req.user.id) {
    return res.status(403).json({ erro: "Não pode eliminar a sua própria conta via admin" });
  }

  limparDadosUtilizador(id, (errLimpeza) => {
    if (errLimpeza) {
      console.error("[AUTH] Erro na limpeza de dados do utilizador:", errLimpeza.message);
      // Continuar mesmo com erro parcial — tentar eliminar o utilizador
    }

    db.run("DELETE FROM usuarios WHERE id = ?", [id], function(err) {
      if (err) {
        console.error("[AUTH] Erro ao apagar utilizador:", err.message);
        return res.status(500).json({ erro: "Erro ao apagar utilizador" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ erro: "Utilizador não encontrado" });
      }
      res.json({ sucesso: true, mensagem: "Utilizador e todos os dados associados eliminados" });
    });
  });
});

/* =========================
   PERFIL
========================= */
router.get("/me", verificarToken, (req, res) => {
  const sql = `SELECT id, nome, telefone, email, bio, tipo, tipo_conta, avatar, localizacao,
    verificado, premium_desde, premium_ate, "createdAt" AS created_at,
    (SELECT COUNT(*) FROM anuncios WHERE usuario_id = usuarios.id) AS total_anuncios,
    (SELECT ROUND(AVG(estrelas), 1) FROM avaliacoes WHERE perfil_premium_id = usuarios.id) AS avaliacao_media
    FROM usuarios WHERE id = ?`;
  db.get(sql, [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ erro: "Erro no servidor" });
    }
    if (!user) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    res.json(user);
  });
});

/* =========================
   PERFIL PÚBLICO MÍNIMO (para iniciar contacto)
========================= */
router.get("/public/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ erro: "Utilizador inválido" });

  db.get(
    `SELECT id, nome, avatar, tipo_conta, localizacao
     FROM usuarios
     WHERE id = ? AND banido = 0`,
    [id],
    (err, user) => {
      if (err) return res.status(500).json({ erro: "Erro ao consultar utilizador" });
      if (!user) return res.status(404).json({ erro: "Utilizador não encontrado" });
      res.json(user);
    }
  );
});

/* =========================
   ATUALIZAR PERFIL BÁSICO
========================= */
router.put("/perfil", verificarToken, (req, res) => {
  const nome = String(req.body?.nome ?? '').trim().slice(0, 120);
  const telefone = String(req.body?.telefone ?? '').trim().slice(0, 40);
  const emailRaw = String(req.body?.email ?? '').trim().slice(0, 254);
  const bio = String(req.body?.bio ?? '').trim().slice(0, 2000);
  const localizacao = String(req.body?.localizacao ?? '').trim().slice(0, 255);

  if (!nome || !telefone) return res.status(400).json({ erro: "Nome e telefone são obrigatórios" });
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    return res.status(400).json({ erro: "Email inválido" });
  }

  db.run(
    `UPDATE usuarios SET nome = ?, telefone = ?, email = ?, bio = ?, localizacao = ? WHERE id = ?`,
    [nome, telefone, emailRaw || null, bio || null, localizacao || null, req.user.id],
    function (err) {
      if (err) {
        verificarDuplicado(err, telefone, emailRaw, (checkErr, campoDuplicado) => {
          if (campoDuplicado === 'telefone') {
            return res.status(409).json({ erro: "Telefone já registado" });
          }
          if (campoDuplicado === 'email') {
            return res.status(409).json({ erro: "Email já registado" });
          }
          console.error("[AUTH] Erro ao atualizar perfil:", err.message);
          return res.status(500).json({ erro: "Erro ao atualizar perfil" });
        });
        return;
      }
      if (!this.changes) return res.status(404).json({ erro: "Utilizador não encontrado" });
      res.json({ sucesso: true, nome, telefone, email: emailRaw || null, bio: bio || null, localizacao: localizacao || null });
    }
  );
});

/* =========================
   ATUALIZAR AVATAR
========================= */
router.post("/avatar", verificarToken, upload.single("avatar"), tratarErroUpload, (req, res) => {
  if (!req.file) return res.status(400).json({ erro: "Imagem não enviada" });

  const novaImagem = req.file.filename;
  const novaImagemPath = path.join(__dirname, '..', 'uploads', novaImagem);

  db.get("SELECT avatar FROM usuarios WHERE id = ?", [req.user.id], (err, user) => {
    if (err) {
      // Falha na consulta — remover nova imagem
      fs.unlink(novaImagemPath, () => {});
      return res.status(500).json({ erro: "Erro ao consultar perfil" });
    }
    if (!user) {
      // Utilizador não encontrado — remover nova imagem
      fs.unlink(novaImagemPath, () => {});
      return res.status(404).json({ erro: "Utilizador não encontrado" });
    }

    const avatarAntigo = user.avatar && !/^https?:\/\//i.test(user.avatar)
      ? path.join(__dirname, '..', 'uploads', path.basename(user.avatar))
      : null;

    db.run("UPDATE usuarios SET avatar = ? WHERE id = ?", [novaImagem, req.user.id], function (updateErr) {
      if (updateErr) {
        // Falha na atualização — remover nova imagem, manter antigo
        fs.unlink(novaImagemPath, () => {});
        console.error("[AUTH] Erro ao atualizar avatar:", updateErr.message);
        return res.status(500).json({ erro: "Erro ao atualizar avatar" });
      }

      // Sucesso — agora sim, remover avatar antigo
      if (avatarAntigo) {
        fs.unlink(avatarAntigo, unlinkErr => {
          if (unlinkErr && unlinkErr.code !== 'ENOENT') {
            console.warn("[AUTH] Não foi possível remover avatar antigo:", unlinkErr.message);
          }
        });
      }

      res.json({ sucesso: true, avatar: novaImagem });
    });
  });
});

/* =========================
   ELIMINAR CONTA PRÓPRIA (com eliminação de anúncios e dados PREMIUM)
   — mantido para compatibilidade; usa limpeza completa
========================= */
router.delete("/delete-account", verificarToken, (req, res) => {
  const userId = req.user.id;

  limparDadosUtilizador(userId, (errLimpeza) => {
    if (errLimpeza) {
      console.error("[AUTH] Erro na limpeza de dados:", errLimpeza.message);
      // Continuar mesmo com erro parcial
    }

    db.run("DELETE FROM usuarios WHERE id = ?", [userId], function(err) {
      if (err) {
        console.error("[AUTH] Erro ao eliminar conta:", err.message);
        return res.status(500).json({ erro: "Erro ao eliminar conta" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }
      res.json({ sucesso: true, mensagem: "Conta e todos os dados associados eliminados com sucesso" });
    });
  });
});

/* ============================================================
   NOVAS ROTAS: Enviar comunicados/notificações seletivas
============================================================ */

router.post('/notificar-novos', verificarToken, requireAdmin, (req, res) => {
  const { titulo, mensagem, dias = 7 } = req.body;

  if (!titulo || !mensagem) {
    return res.status(400).json({ erro: 'Título e mensagem são obrigatórios' });
  }

  if (String(titulo).length > 255 || String(mensagem).length > 2000) {
    return res.status(400).json({ erro: 'Título ou mensagem excedem o limite de caracteres' });
  }

  db.all(
    `SELECT id FROM usuarios
     WHERE "createdAt" >= CURRENT_DATE - (?::int * INTERVAL '1 day')
     AND tipo = 'user'`,
    [Math.min(3650, Math.max(0, Number.parseInt(dias, 10) || 7))],
    (err, usuarios) => {
      if (err) {
        console.error('Erro ao buscar novos utilizadores:', err);
        return res.status(500).json({ erro: 'Erro ao buscar utilizadores' });
      }

      if (!usuarios || usuarios.length === 0) {
        return res.json({ sucesso: true, message: 'Nenhum novo utilizador encontrado', total: 0 });
      }

      Promise.all(usuarios.map(user => new Promise(resolve => {
        db.run(
          'INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, lida) VALUES (?, ?, ?, ?, 0)',
          [user.id, 'info', titulo, mensagem],
          err => resolve(!err)
        );
      }))).then(results => {
        const enviadas = results.filter(Boolean).length;
        console.log(`[NOTIFICAR-NOVOS] ${enviadas} notificações enviadas para ${usuarios.length} novos utilizadores`);
        res.json({
          sucesso: true,
          total: usuarios.length,
          enviadas,
          message: `Notificação enviada para ${enviadas} novo(s) utilizador(es)`
        });
      });
    }
  );
});

router.post('/notificar-antigos', verificarToken, requireAdmin, (req, res) => {
  const { titulo, mensagem, dias = 30 } = req.body;

  if (!titulo || !mensagem) {
    return res.status(400).json({ erro: 'Título e mensagem são obrigatórios' });
  }

  if (String(titulo).length > 255 || String(mensagem).length > 2000) {
    return res.status(400).json({ erro: 'Título ou mensagem excedem o limite de caracteres' });
  }

  db.all(
    `SELECT id FROM usuarios
     WHERE "createdAt" < CURRENT_DATE - (?::int * INTERVAL '1 day')
     AND tipo = 'user'`,
    [Math.min(3650, Math.max(0, Number.parseInt(dias, 10) || 30))],
    (err, usuarios) => {
      if (err) {
        console.error('Erro ao buscar utilizadores antigos:', err);
        return res.status(500).json({ erro: 'Erro ao buscar utilizadores' });
      }

      if (!usuarios || usuarios.length === 0) {
        return res.json({ sucesso: true, message: 'Nenhum utilizador antigo encontrado', total: 0 });
      }

      Promise.all(usuarios.map(user => new Promise(resolve => {
        db.run(
          'INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, lida) VALUES (?, ?, ?, ?, 0)',
          [user.id, 'info', titulo, mensagem],
          err => resolve(!err)
        );
      }))).then(results => {
        const enviadas = results.filter(Boolean).length;
        console.log(`[NOTIFICAR-ANTIGOS] ${enviadas} notificações enviadas para ${usuarios.length} utilizadores antigos`);
        res.json({
          sucesso: true,
          total: usuarios.length,
          enviadas,
          message: `Notificação enviada para ${enviadas} utilizador(es) antigo(s)`
        });
      });
    }
  );
});

router.post('/enviar-popup-todos', verificarToken, requireAdmin, (req, res) => {
  const { titulo, conteudo } = req.body;

  if (!titulo || !conteudo) {
    return res.status(400).json({ erro: 'Título e conteúdo são obrigatórios' });
  }

  if (String(titulo).length > 255 || String(conteudo).length > 2000) {
    return res.status(400).json({ erro: 'Título ou conteúdo excedem o limite de caracteres' });
  }

  db.run(
    'INSERT INTO popups (titulo, conteudo, ativo) VALUES (?, ?, 1)',
    [titulo, conteudo],
    function(err) {
      if (err) {
        console.error('Erro ao criar popup:', err);
        return res.status(500).json({ erro: 'Erro ao criar popup' });
      }

      const popupId = this.lastID;
      console.log(`[POPUP-TODOS] Popup #${popupId} criado para todos os utilizadores`);

      res.json({
        sucesso: true,
        popupId: popupId,
        message: 'Popup criado e será mostrado a todos os utilizadores'
      });
    }
  );
});

/* =========================
   VERIFICAR ESTADO DE BANIMENTO (para o frontend verificar proativamente)
========================= */
router.get("/verificar-banimento", verificarToken, (req, res) => {
  // Se chegou aqui, não está banido (o middleware já bloqueia)
  res.json({ banido: false });
});

/* =========================
   ELIMINAR CONTA PRÓPRIA (com período de graça de 4 dias)
========================= */
router.delete("/conta", verificarToken, (req, res) => {
  const userId = req.user.id;
  const agora = new Date();
  const eliminacaoAte = new Date(agora.getTime() + 4 * 24 * 60 * 60 * 1000); // +4 dias

  db.run(
    "UPDATE usuarios SET eliminacao_agendada = 1, eliminacao_ate = ? WHERE id = ?",
    [eliminacaoAte.toISOString(), userId],
    function(err) {
      if (err) {
        console.error("[AUTH] Erro ao agendar eliminação:", err.message);
        return res.status(500).json({ erro: "Erro ao agendar eliminação" });
      }
      console.log(`[AUTH] Eliminação agendada para utilizador ${userId} até ${eliminacaoAte.toISOString()}`);
      res.json({
        sucesso: true,
        mensagem: "Conta será eliminada em 4 dias. Inicie sessão para cancelar.",
        eliminacao_ate: eliminacaoAte.toISOString()
      });
    }
  );
});


module.exports = router;