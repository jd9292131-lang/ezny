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

/* =========================
   REGISTAR (sem opção premium — sempre normal)
========================= */
router.post("/register", authLimiter, async (req, res) => {
  const { nome, telefone, senha, data_nascimento } = req.body;
  if (!nome || !telefone || !senha || !data_nascimento) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  const nascimento = new Date(data_nascimento + "T00:00:00");
  if (isNaN(nascimento.getTime())) {
    return res.status(400).json({ erro: "Data de nascimento inválida" });
  }

  const idade = calcularIdade(data_nascimento);
  if (idade < 18) {
    return res.status(403).json({ erro: "Apenas maiores de 18 anos podem criar conta." });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const sql = `INSERT INTO usuarios (nome, telefone, senha, tipo, tipo_conta, data_nascimento) VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(sql, [nome, telefone, senhaHash, "user", "normal", data_nascimento], function (err) {
      if (err) {
        if (err.code === "23505" || /duplicate key|unique constraint/i.test(err.message)) {
          return res.status(409).json({ erro: "Telefone já registado" });
        }
        return res.status(500).json({ erro: "Erro no servidor" });
      }

      const userId = this.lastID;
      enviarNotificacoesBoasVindas(userId, nome);

      const token = gerarToken({ id: userId, nome, telefone, tipo: "user", tipo_conta: "normal" });
      res.json({ sucesso: true, token, nome, tipo_conta: "normal" });
    });
  } catch (error) {
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
    "SELECT id, nome, telefone, tipo, tipo_conta, banido, banido_ate, createdAt FROM usuarios ORDER BY id DESC",
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
   APAGAR UTILIZADOR (ADMIN)
========================= */
router.delete("/usuarios/:id", verificarToken, requireAdmin, (req, res) => {
  db.run("DELETE FROM usuarios WHERE id = ?", [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ erro: "Erro ao apagar" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ erro: "Não encontrado" });
    }
    res.json({ sucesso: true });
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
        if (err.code === '23505' || /unique/i.test(err.message)) {
          return res.status(409).json({ erro: "Telefone já registado" });
        }
        console.error("[AUTH] Erro ao atualizar perfil:", err.message);
        return res.status(500).json({ erro: "Erro ao atualizar perfil" });
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

  db.get("SELECT avatar FROM usuarios WHERE id = ?", [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ erro: "Erro ao consultar perfil" });
    if (!user) return res.status(404).json({ erro: "Utilizador não encontrado" });

    db.run("UPDATE usuarios SET avatar = ? WHERE id = ?", [req.file.filename, req.user.id], function (updateErr) {
      if (updateErr) return res.status(500).json({ erro: "Erro ao atualizar avatar" });
      if (user.avatar && !/^https?:\/\//i.test(user.avatar)) {
        const oldPath = path.join(__dirname, '..', 'uploads', path.basename(user.avatar));
        fs.unlink(oldPath, unlinkErr => {
          if (unlinkErr && unlinkErr.code !== 'ENOENT') console.warn("[AUTH] Não foi possível remover avatar antigo:", unlinkErr.message);
        });
      }
      res.json({ sucesso: true, avatar: req.file.filename });
    });
  });
});

/* =========================
   ELIMINAR CONTA PRÓPRIA (com eliminação de anúncios e dados PREMIUM)
========================= */
router.delete("/delete-account", verificarToken, (req, res) => {
  const userId = req.user.id;

  // PRIMEIRO: eliminar todos os anúncios e imagens do utilizador
  eliminarAnunciosDoUtilizador(userId, (errAnuncios) => {
    if (errAnuncios) {
      console.error("[AUTH] Erro ao eliminar anúncios:", errAnuncios.message);
    }

    // Eliminar dados PREMIUM
    db.run("DELETE FROM perfis_premium WHERE usuario_id = ?", [userId], (err) => {
      if (err) console.error("[AUTH] Erro ao eliminar perfil premium:", err.message);
    });
    db.run("DELETE FROM seguidores WHERE seguidor_id = ? OR seguido_id = ?", [userId, userId], (err) => {
      if (err) console.error("[AUTH] Erro ao eliminar seguidores:", err.message);
    });
    db.run("DELETE FROM avaliacoes WHERE avaliador_id = ? OR perfil_premium_id = ?", [userId, userId], (err) => {
      if (err) console.error("[AUTH] Erro ao eliminar avaliações:", err.message);
    });
    db.run("DELETE FROM mensagens WHERE remetente_id = ? OR destinatario_id = ?", [userId, userId], (err) => {
      if (err) console.error("[AUTH] Erro ao eliminar mensagens:", err.message);
    });
    db.run("DELETE FROM comentarios WHERE usuario_id = ?", [userId], (err) => {
      if (err) console.error("[AUTH] Erro ao eliminar comentários:", err.message);
    });
    db.run("DELETE FROM reacoes WHERE usuario_id = ?", [userId], (err) => {
      if (err) console.error("[AUTH] Erro ao eliminar reações:", err.message);
    });
    db.run("DELETE FROM verificacoes_pendentes WHERE usuario_id = ?", [userId], (err) => {
      if (err) console.error("[AUTH] Erro ao eliminar verificações:", err.message);
    });

    // DEPOIS: eliminar notificações do utilizador
    db.run("DELETE FROM notificacoes WHERE usuario_id = ?", [userId], (errNotif) => {
      if (errNotif) {
        console.error("[AUTH] Erro ao eliminar notificações:", errNotif.message);
      }

      // DEPOIS: eliminar popups_vistos
      db.run("DELETE FROM popups_vistos WHERE usuario_id = ?", [userId], (errPopup) => {
        if (errPopup) {
          console.error("[AUTH] Erro ao eliminar popups vistos:", errPopup.message);
        }

        // FINALMENTE: eliminar a conta do utilizador
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
  });
});

/* ============================================================
   NOVAS ROTAS: Enviar comunicados/notificações seletivas
============================================================ */

router.post('/notificar-novos', verificarToken, (req, res) => {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ erro: 'Acesso negado' });
  }

  const { titulo, mensagem, dias = 7 } = req.body;

  if (!titulo || !mensagem) {
    return res.status(400).json({ erro: 'Título e mensagem são obrigatórios' });
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

router.post('/notificar-antigos', verificarToken, (req, res) => {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ erro: 'Acesso negado' });
  }

  const { titulo, mensagem, dias = 30 } = req.body;

  if (!titulo || !mensagem) {
    return res.status(400).json({ erro: 'Título e mensagem são obrigatórios' });
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

router.post('/enviar-popup-todos', verificarToken, (req, res) => {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ erro: 'Acesso negado' });
  }

  const { titulo, conteudo } = req.body;

  if (!titulo || !conteudo) {
    return res.status(400).json({ erro: 'Título e conteúdo são obrigatórios' });
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