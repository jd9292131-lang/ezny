const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verificarToken, requireAdmin } = require('../middleware/auth');
const { upload, tratarErroUpload } = require('../middleware/upload');
const { z } = require('zod');

const campaignSchema = z.object({
  titulo: z.string().trim().min(2).max(120),
  conteudo: z.string().max(5000).optional().default(''),
  tipo: z.enum(['notificacao','popup','publicidade','aviso']).default('popup'),
  imagem: z.string().max(1500).optional().nullable(),
  link: z.string().max(1500).optional().nullable(),
  texto_botao: z.string().max(60).optional().nullable(),
  publico: z.enum(['todos','normal','premium']).default('todos'),
  inicio: z.string().optional().nullable(),
  fim: z.string().optional().nullable(),
  frequencia: z.enum(['uma_vez','sempre','diario']).default('uma_vez'),
  ativo: z.boolean().optional().default(true)
});

const admin = [verificarToken, requireAdmin];

router.post('/', ...admin, upload.single('imagem'), tratarErroUpload, (req, res) => {
  const body = {...req.body};
  if (body.ativo !== undefined) body.ativo = body.ativo === true || body.ativo === 'true' || body.ativo === '1';
  if (req.file?.filename) body.imagem = req.file.filename;
  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) return res.status(400).json({erro:'Dados do comunicado inválidos',detalhes:parsed.error.issues});
  const x = parsed.data;
  db.run(`INSERT INTO comunicados
    (titulo,conteudo,tipo,imagem,link,texto_botao,publico,inicio,fim,frequencia,ativo)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [x.titulo,x.conteudo,x.tipo,x.imagem||null,x.link||null,x.texto_botao||null,x.publico,x.inicio||null,x.fim||null,x.frequencia,x.ativo?1:0],
    function(err){
      if(err) return res.status(500).json({erro:'Erro ao criar comunicado'});
      const comunicadoId=this.lastID;
      db.run('INSERT INTO admin_logs (admin_id,acao,entidade,entidade_id,detalhes) VALUES (?,?,?,?,?)',[req.user.id,'CRIAR_COMUNICADO','comunicado',comunicadoId,x.titulo]);
      if (x.tipo === 'notificacao' || x.tipo === 'aviso') {
        const sql=x.publico==='todos'
          ? `INSERT INTO notificacoes (usuario_id,tipo,titulo,mensagem,lida) SELECT u.id,?,?,?,0 FROM usuarios u WHERE u.banido=0`
          : `INSERT INTO notificacoes (usuario_id,tipo,titulo,mensagem,lida) SELECT u.id,?,?,?,0 FROM usuarios u WHERE u.banido=0 AND u.tipo_conta = ?`;
        const finalParams=x.publico==='todos'?['info',x.titulo,x.conteudo]:['info',x.titulo,x.conteudo,x.publico];
        db.query(sql,finalParams).catch(e=>console.error('[COMUNICADO] Falha ao distribuir notificações:',e.message));
      }
      res.status(201).json({sucesso:true,id:comunicadoId,imagem:x.imagem||null});
    });
});

router.get('/todos', ...admin, (req,res) => db.all('SELECT * FROM comunicados ORDER BY id DESC',[],(e,r)=>e?res.status(500).json({erro:'Erro ao listar comunicados'}):res.json(r||[])));

router.get('/ativos', verificarToken, (req,res) => {
  const publico = req.user.tipo_conta === 'premium' ? 'premium' : 'normal';
  db.all(`SELECT * FROM comunicados
    WHERE ativo=1 AND (publico='todos' OR publico=?)
      AND (inicio IS NULL OR inicio<=CURRENT_TIMESTAMP)
      AND (fim IS NULL OR fim>=CURRENT_TIMESTAMP)
    ORDER BY id DESC`,[publico],(e,r)=>e?res.status(500).json({erro:'Erro ao carregar comunicados'}):res.json(r||[]));
});

/* Feed de popups: novas campanhas profissionais + popups legados. */
router.get('/popups', verificarToken, (req,res) => {
  const publico = req.user.tipo_conta === 'premium' ? 'premium' : 'normal';
  db.query(`
    SELECT c.id, c.titulo, c.conteudo, c.imagem, c.link, c.texto_botao, c.publico,
           c.inicio, c.fim, c.frequencia, c."createdAt", 'comunicado' AS origem
      FROM comunicados c
     WHERE c.ativo=1 AND c.tipo='popup'
       AND (c.publico='todos' OR c.publico=$1)
       AND (c.inicio IS NULL OR c.inicio<=CURRENT_TIMESTAMP)
       AND (c.fim IS NULL OR c.fim>=CURRENT_TIMESTAMP)
       AND (c.frequencia='sempre' OR NOT EXISTS (SELECT 1 FROM comunicados_vistos cv WHERE cv.comunicado_id=c.id AND cv.usuario_id=$2) OR (c.frequencia='diario' AND NOT EXISTS (SELECT 1 FROM comunicados_vistos cv WHERE cv.comunicado_id=c.id AND cv.usuario_id=$2 AND cv."createdAt"::date=CURRENT_DATE)))
    UNION ALL
    SELECT p.id, p.titulo, p.conteudo, p.imagem, p.link, p.texto_botao, p.publico,
           p.inicio, p.fim, p.frequencia, p."createdAt", 'popup' AS origem
      FROM popups p
     WHERE p.ativo=1
       AND (p.publico='todos' OR p.publico=$1)
       AND (p.inicio IS NULL OR p.inicio<=CURRENT_TIMESTAMP)
       AND (p.fim IS NULL OR p.fim>=CURRENT_TIMESTAMP)
       AND NOT EXISTS (SELECT 1 FROM popups_vistos pv WHERE pv.popup_id=p.id AND pv.usuario_id=$2)
    ORDER BY "createdAt" DESC
    LIMIT 5`,[publico,req.user.id])
    .then(r=>res.json(r.rows||[])).catch(e=>res.status(500).json({erro:'Erro ao carregar popups'}));
});

router.get('/popups/todos', ...admin, (req,res) => db.query(`
  SELECT id,titulo,conteudo,imagem,link,texto_botao,publico,inicio,fim,frequencia,ativo,"createdAt",'comunicado' AS origem
    FROM comunicados WHERE tipo='popup'
  UNION ALL
  SELECT id,titulo,conteudo,imagem,link,texto_botao,publico,inicio,fim,frequencia,ativo,"createdAt",'popup' AS origem
    FROM popups
  ORDER BY "createdAt" DESC`,[]).then(r=>res.json(r.rows||[])).catch(e=>res.status(500).json({erro:'Erro ao listar popups'})));

router.post('/popups/:id/visto', verificarToken, (req,res) => {
  const id=Number(req.params.id);
  if(!Number.isInteger(id)||id<=0) return res.status(400).json({erro:'Popup inválido'});
  const origem=req.body?.origem === 'popup' ? 'popup' : 'comunicado';
  if(origem==='popup') return db.run('INSERT INTO popups_vistos (usuario_id,popup_id) VALUES (?,?) ON CONFLICT(usuario_id,popup_id) DO NOTHING',[req.user.id,id],e=>e?res.status(500).json({erro:'Erro ao marcar popup'}):res.json({sucesso:true}));
  db.run('INSERT INTO comunicados_vistos (usuario_id,comunicado_id) VALUES (?,?) ON CONFLICT(usuario_id,comunicado_id) DO UPDATE SET "createdAt"=CURRENT_TIMESTAMP',[req.user.id,id],e=>e?res.status(500).json({erro:'Erro ao marcar comunicado'}):res.json({sucesso:true}));
});

router.post('/:id/visto', verificarToken, (req,res) => {
  const id=Number(req.params.id);
  db.run('INSERT INTO comunicados_vistos (usuario_id,comunicado_id) VALUES (?,?) ON CONFLICT(usuario_id,comunicado_id) DO NOTHING',[req.user.id,id],()=>res.json({sucesso:true}));
  db.run('UPDATE comunicados SET visualizacoes=COALESCE(visualizacoes,0)+1 WHERE id=?',[id]);
});
router.post('/:id/clique', verificarToken, (req,res) => { db.run('UPDATE comunicados SET cliques=COALESCE(cliques,0)+1 WHERE id=?',[req.params.id]); res.json({sucesso:true}); });
router.delete('/:id', ...admin, (req,res) => db.run('UPDATE comunicados SET ativo=0 WHERE id=?',[req.params.id],function(e){
  if(e)return res.status(500).json({erro:'Erro ao desativar'});
  db.run('INSERT INTO admin_logs (admin_id,acao,entidade,entidade_id) VALUES (?,?,?,?)',[req.user.id,'DESATIVAR_COMUNICADO','comunicado',req.params.id]);
  res.json({sucesso:true,alterados:this.changes});
}));

/* Mantém criação simples de popup legado para compatibilidade, mas o novo painel usa comunicados. */
router.post('/popups', ...admin, upload.single('imagem'), tratarErroUpload, (req,res)=>{
  const titulo=String(req.body.titulo||'').trim(), conteudo=String(req.body.conteudo||'').trim();
  if(!titulo) return res.status(400).json({erro:'Título obrigatório'});
  db.run('INSERT INTO popups (titulo,conteudo,imagem,link,texto_botao,publico,inicio,fim,frequencia,ativo) VALUES (?,?,?,?,?,?,?,?,?,1)',
    [titulo,conteudo,req.file?.filename||null,req.body.link||null,req.body.texto_botao||null,req.body.publico||'todos',req.body.inicio||null,req.body.fim||null,req.body.frequencia||'uma_vez'],
    function(e){if(e)return res.status(500).json({erro:'Erro ao criar popup'});res.status(201).json({sucesso:true,id:this.lastID});});
});
router.delete('/popups/:id', ...admin, (req,res)=>db.run('UPDATE popups SET ativo=0 WHERE id=?',[req.params.id],function(e){if(e)return res.status(500).json({erro:'Erro ao desativar popup'});res.json({sucesso:true,alterados:this.changes});}));

module.exports=router;
