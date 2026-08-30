const { getPlan } = require('../config/plans');
const db = require('../config/db');

function isAdmin(req){ return req.user?.tipo === 'admin'; }

async function verificarPremiumAtual(userId){
  const row = await db.query('SELECT tipo_conta,premium_ate FROM usuarios WHERE id=$1',[userId]);
  const user = row.rows?.[0];
  if(!user) return false;
  if(user.tipo_conta !== 'premium') return false;
  if(user.premium_ate && new Date(user.premium_ate).getTime() <= Date.now()){
    await db.query("UPDATE usuarios SET tipo_conta='normal', premium_ate=NULL WHERE id=$1",[userId]);
    return false;
  }
  return true;
}

function isPremium(req){ return isAdmin(req) || req.user?.tipo_conta === 'premium'; }

function requirePremium(req,res,next){
  if(isAdmin(req)) return next();
  if(!req.user?.id) return res.status(401).json({erro:'Autenticação necessária.',codigo:'AUTH_REQUIRED'});
  verificarPremiumAtual(req.user.id).then(ok=>{
    if(ok) return next();
    return res.status(403).json({erro:'Este recurso é exclusivo para utilizadores PREMIUM.',codigo:'PREMIUM_REQUIRED'});
  }).catch(err=>{
    console.error('[PREMIUM] Falha ao validar plano:',err.message);
    return res.status(500).json({erro:'Não foi possível validar o plano Premium.'});
  });
}

function requirePremiumFeature(feature){
  return (req,res,next)=>requirePremium(req,res,next);
}

function attachPlan(req,res,next){
  req.plan=getPlan(req.user?.tipo_conta); next();
}
module.exports={requirePremium,requirePremiumFeature,attachPlan,isPremium,verificarPremiumAtual};
