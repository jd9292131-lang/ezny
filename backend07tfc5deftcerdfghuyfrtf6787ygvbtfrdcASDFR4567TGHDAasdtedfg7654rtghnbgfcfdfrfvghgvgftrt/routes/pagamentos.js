const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const db = require("../config/db");
const { verificarToken, requireAdmin } = require("../middleware/auth");

const PLANS = Object.freeze({
  premium_15d: { nome: "Premium 15 dias", dias: 15, valor: 2500 },
  premium_30d: { nome: "Premium 30 dias", dias: 30, valor: 5000 }
});

function gerarReferencia() {
  return `EZN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}
function normalizarPlano(plano) { return PLANS[plano] ? plano : "premium_30d"; }
function ativarPremium(pagamentoId, adminId, cb) {
  db.get(`SELECT p.*, u.tipo_conta, u.premium_ate FROM pagamentos p JOIN usuarios u ON u.id=p.usuario_id WHERE p.id=?`, [pagamentoId], (err, row) => {
    if (err) return cb(err);
    if (!row) return cb(Object.assign(new Error("Pagamento não encontrado"), { code: "NOT_FOUND" }));
    if (row.status === "pago") return cb(null, { already: true, usuario_id: row.usuario_id });
    if (row.status !== "pendente") return cb(Object.assign(new Error("Pagamento não está pendente"), { code: "INVALID_STATUS" }));
    const plan = PLANS[row.plano];
    const now = new Date();
    const base = row.premium_ate && new Date(row.premium_ate) > now ? new Date(row.premium_ate) : now;
    const fim = new Date(base.getTime() + plan.dias * 86400000).toISOString();
    db.transaction(async (tx) => {
      const p = await tx.run("UPDATE pagamentos SET status='pago', confirmado_em=CURRENT_TIMESTAMP, confirmado_por=? WHERE id=? AND status='pendente'", [adminId, pagamentoId]);
      if (p.changes !== 1) throw Object.assign(new Error("Pagamento deixou de estar pendente"), { code: "INVALID_STATUS" });
      await tx.run("UPDATE usuarios SET tipo_conta='premium', premium_desde=COALESCE(premium_desde,CURRENT_TIMESTAMP), premium_ate=? WHERE id=?", [fim, row.usuario_id]);
      await tx.run("UPDATE premium_historico SET estado='pago', inicio=CURRENT_TIMESTAMP, fim=? WHERE id=?", [fim, row.premium_historico_id]);
      await tx.run("INSERT INTO notificacoes (usuario_id,tipo,titulo,mensagem,lida) VALUES (?,?,?,?,0)", [row.usuario_id,"success","Premium ativado","O seu pagamento foi confirmado e a sua conta Premium está ativa."]);
      await tx.run("INSERT INTO admin_logs (admin_id,acao,entidade,entidade_id,detalhes) VALUES (?,?,?,?,?)", [adminId,"confirmar_pagamento","pagamento",pagamentoId,`Premium ativado para utilizador ${row.usuario_id}; fim=${fim}`]);
      return { usuario_id: row.usuario_id, premium_ate: fim };
    }).then(result => cb(null, result)).catch(err => cb(err));
  });
}

// O utilizador apenas cria um pedido de pagamento. Isto NÃO ativa Premium.
router.post("/criar", verificarToken, async (req, res) => {
  const planoId = normalizarPlano(req.body?.plano);
  const plan = PLANS[planoId];
  const metodo = String(req.body?.metodo || "transferencia").trim().toLowerCase();
  const metodos = ["multicaixa"];
  if (!metodos.includes(metodo)) return res.status(400).json({ erro: "Método de pagamento inválido" });
  const entidade = String(process.env.PAYMENT_ENTITY || "").trim();
  const referenciaPagamento = String(process.env.PAYMENT_REFERENCE || "").trim();
  if (!entidade || !referenciaPagamento) {
    return res.status(503).json({ erro: "Os dados Multicaixa do EZNY ainda não estão configurados." });
  }

  try {
    const result = await db.transaction(async tx => {
      const userResult = await tx.get("SELECT id,tipo_conta,premium_ate FROM usuarios WHERE id=?", [req.user.id]);
      if (!userResult) throw Object.assign(new Error("Utilizador não encontrado"), { code: "NOT_FOUND" });
      if (userResult.tipo_conta === "premium" && userResult.premium_ate && Date.parse(userResult.premium_ate) > Date.now()) {
        throw Object.assign(new Error("A sua conta já possui Premium ativo"), { code: "ALREADY_PREMIUM", premium_ate: userResult.premium_ate });
      }

      const pending = await tx.get("SELECT id FROM pagamentos WHERE usuario_id=? AND status='pendente' LIMIT 1", [req.user.id]);
      if (pending) throw Object.assign(new Error("Já existe um pedido de pagamento pendente"), { code: "PENDING", pagamento_id: pending.id });

      const referencia = gerarReferencia();
      const historico = await tx.run(
        "INSERT INTO premium_historico (usuario_id,plano,estado,valor,moeda,pagamento_ref) VALUES (?,?,?,?,?,?)",
        [req.user.id, planoId, "pendente", plan.valor, "AOA", referencia]
      );
      const pagamento = await tx.run(
        "INSERT INTO pagamentos (usuario_id,plano,metodo,entidade,referencia_pagamento,referencia,valor,moeda,status,premium_historico_id) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [req.user.id, planoId, metodo, entidade, referenciaPagamento, referencia, plan.valor, "AOA", "pendente", historico.lastID]
      );
      return { pagamentoId: pagamento.lastID, historicoId: historico.lastID, referencia };
    });

    return res.status(201).json({
      sucesso: true,
      pagamento: {
        id: result.pagamentoId,
        plano: planoId,
        nome_plano: plan.nome,
        dias: plan.dias,
        valor: plan.valor,
        moeda: "AOA",
        metodo,
        referencia: result.referencia,
        referencia_pedido: result.referencia,
        referencia_pagamento: referenciaPagamento,
        entidade,
        status: "pendente"
      },
      mensagem: "Pedido criado. O Premium só será ativado após confirmação do pagamento."
    });
  } catch (err) {
    if (err.code === "NOT_FOUND") return res.status(404).json({ erro: err.message });
    if (err.code === "ALREADY_PREMIUM") return res.status(409).json({ erro: err.message, premium_ate: err.premium_ate });
    if (err.code === "PENDING") return res.status(409).json({ erro: err.message, pagamento_id: err.pagamento_id });
    console.error("[PAGAMENTOS] Erro ao criar pedido:", err.message);
    return res.status(500).json({ erro: "Não foi possível criar o pedido de pagamento" });
  }
});

router.get("/me", verificarToken, (req,res)=>{
  db.all("SELECT id,plano,metodo,entidade,referencia_pagamento,referencia,valor,moeda,status,criado_em,confirmado_em,observacao FROM pagamentos WHERE usuario_id=? ORDER BY id DESC LIMIT 20",[req.user.id],(err,rows)=>{
    if(err) return res.status(500).json({erro:"Erro ao consultar pagamentos"});
    res.json(rows||[]);
  });
});

// Administração: lista somente com autenticação administrativa.
router.get("/admin/lista", verificarToken, requireAdmin, (req,res)=>{
  const status=String(req.query.status||"").trim();
  const allowed=["pendente","pago","cancelado"];
  const params=[]; let sql=`SELECT p.*,u.nome,u.telefone FROM pagamentos p JOIN usuarios u ON u.id=p.usuario_id`;
  if(allowed.includes(status)){sql+=" WHERE p.status=?";params.push(status);}
  sql+=" ORDER BY p.id DESC LIMIT 500";
  db.all(sql,params,(err,rows)=>{if(err)return res.status(500).json({erro:"Erro ao listar pagamentos"});res.json(rows||[]);});
});

router.get("/:id", verificarToken, (req,res)=>{
  const id=Number(req.params.id); if(!Number.isInteger(id)) return res.status(400).json({erro:"ID inválido"});
  db.get("SELECT * FROM pagamentos WHERE id=? AND usuario_id=?",[id,req.user.id],(err,row)=>{
    if(err) return res.status(500).json({erro:"Erro ao consultar pagamento"});
    if(!row) return res.status(404).json({erro:"Pagamento não encontrado"});
    res.json(row);
  });
});

// Apenas administrador pode confirmar. Nunca aceitar confirmação do cliente.
router.post("/:id/confirmar", verificarToken, requireAdmin, (req,res)=>{
  const id=Number(req.params.id); if(!Number.isInteger(id)) return res.status(400).json({erro:"ID inválido"});
  ativarPremium(id, req.user.id, (err,result)=>{
    if(err){ if(err.code==='NOT_FOUND') return res.status(404).json({erro:err.message}); if(err.code==='INVALID_STATUS') return res.status(409).json({erro:err.message}); console.error(err); return res.status(500).json({erro:"Erro ao confirmar pagamento"}); }
    res.json({sucesso:true, mensagem:result.already?"Pagamento já confirmado":"Pagamento confirmado e Premium ativado", ...result});
  });
});

router.post("/:id/cancelar", verificarToken, requireAdmin, (req,res)=>{
  const id=Number(req.params.id); if(!Number.isInteger(id)) return res.status(400).json({erro:"ID inválido"});
  const obs=String(req.body?.observacao||"").slice(0,500);
  db.run("UPDATE pagamentos SET status='cancelado', cancelado_em=CURRENT_TIMESTAMP, cancelado_por=?, observacao=? WHERE id=? AND status='pendente'",[req.user.id,obs,id],function(err){
    if(err) return res.status(500).json({erro:"Erro ao cancelar pagamento"});
    if(!this.changes) return res.status(404).json({erro:"Pagamento pendente não encontrado"});
    db.run("UPDATE premium_historico SET estado='cancelado' WHERE pagamento_ref=(SELECT referencia FROM pagamentos WHERE id=?)",[id]);
    res.json({sucesso:true,mensagem:"Pagamento cancelado"});
  });
});

module.exports=router;
