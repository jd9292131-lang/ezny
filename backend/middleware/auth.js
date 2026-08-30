const jwt = require("jsonwebtoken");
const db = require("../config/db");

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET ausente ou demasiado curto. Configure uma chave aleatória com pelo menos 32 caracteres.");
  return secret;
}
function gerarToken(user) {
  return jwt.sign({ id:user.id, nome:user.nome, telefone:user.telefone, tipo:user.tipo||"user", tipo_conta:user.tipo_conta||"normal" }, getSecret(), { expiresIn:"7d", issuer:"EZNY", audience:"EZNY-web" });
}
function verificarToken(req,res,next){
  const h=req.headers.authorization||"";
  if(!/^Bearer\s+.+$/i.test(h)) return res.status(401).json({erro:"Autenticação obrigatória"});
  let decoded; try { decoded=jwt.verify(h.replace(/^Bearer\s+/i,""),getSecret(),{issuer:"EZNY",audience:"EZNY-web"}); } catch { return res.status(401).json({erro:"Token inválido ou expirado"}); }
  db.get("SELECT id,nome,telefone,tipo,tipo_conta,banido,banido_ate,eliminacao_agendada FROM usuarios WHERE id=?",[decoded.id],(err,user)=>{
    if(err) return next(err); if(!user) return res.status(401).json({erro:"Utilizador não encontrado"});
    if(user.banido===1){ const until=user.banido_ate?Date.parse(user.banido_ate):NaN; if(!Number.isNaN(until)&&Date.now()>=until){ db.run("UPDATE usuarios SET banido=0,banido_ate=NULL WHERE id=?",[user.id]); } else return res.status(403).json({erro:"Conta suspensa",banido:true,banido_ate:user.banido_ate||null}); }
    const premiumAt = user.premium_ate ? Date.parse(user.premium_ate) : NaN;
    if ((user.tipo_conta || "normal") === "premium" && (!Number.isNaN(premiumAt) && premiumAt <= Date.now())) {
      db.run("UPDATE usuarios SET tipo_conta='normal', premium_desde=NULL, premium_ate=NULL WHERE id=?", [user.id]);
      user.tipo_conta = "normal";
    }
    req.user={id:user.id,nome:user.nome,telefone:user.telefone,tipo:user.tipo||"user",tipo_conta:user.tipo_conta||"normal"}; next();
  });
}
function requireAdmin(req,res,next){ if(req.user?.tipo!=="admin") return res.status(403).json({erro:"Acesso reservado à administração"}); next(); }
module.exports={gerarToken,verificarToken,requireAdmin};
