

const API_URL = window.location.origin + '/api';
let metodoPagamento = 'multicaixa';
let planoSelecionado = 'premium_30d';
const PLANOS = { premium_15d: { valor: 2500, dias: 15 }, premium_30d: { valor: 5000, dias: 30 } };
let toastTimer = null;
let userId = null;
let pagamentoPendente = false;

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  carregarTema();
  verificarEstado();
  carregarBadgeNotificacoes();
  gerarReferencia();
  atualizarPlanoUI();
  carregarEstadoPremiumDetalhado();

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModal();
  });
});

/* ============================================================
   AUTH & ESTADO
   ============================================================ */

function getUser() {
  try { return JSON.parse(localStorage.getItem('userData')); } catch { return null; }
}
function getToken() { return localStorage.getItem('token'); }

async function verificarEstado() {
  const user = getUser();
  const token = getToken();

  if (!user || !token) {
    toast('Inicie sessão primeiro', 'erro');
    setTimeout(() => { window.location.href = 'auth.html'; }, 1500);
    return;
  }

  userId = user.id;

  // Verificar se já é premium
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.tipo_conta === 'premium') {
        document.getElementById('conteudo').style.display = 'none';
        document.getElementById('jaPremium').style.display = 'block';
        // Atualizar localStorage
        user.tipo_conta = 'premium';
        localStorage.setItem('userData', JSON.stringify(user));
        return;
      }
    }
  } catch (e) {}

  document.getElementById('conteudo').style.display = 'block';
}


async function carregarEstadoPremiumDetalhado(){
  const token=getToken(); if(!token) return;
  const el=document.getElementById('premiumStatus'); if(!el) return;
  try{
    const [statusRes,pagRes]=await Promise.all([
      fetch(`${API_URL}/premium/status`,{headers:{Authorization:'Bearer '+token}}),
      fetch(`${API_URL}/pagamentos/me`,{headers:{Authorization:'Bearer '+token}})
    ]);
    const status=statusRes.ok?await statusRes.json():null;
    const pagamentos=pagRes.ok?await pagRes.json():[];
    const pendente=Array.isArray(pagamentos)?pagamentos.find(p=>p.status==='pendente'):null;
    if(status?.tipo_conta==='premium'){
      el.innerHTML=`<i class="ph-fill ph-crown" style="color:var(--premium)"></i> Premium ativo${status.premium_ate?` até ${new Date(status.premium_ate).toLocaleDateString('pt-PT')}`:''}`;
      el.style.color='#ffd58a';
    }else if(pendente){
      mostrarDadosPagamento(pendente);
      el.innerHTML=`<i class="ph ph-clock" style="color:#f59e0b"></i> Pagamento pendente de validação · Pedido ${pendente.referencia}`;
      el.style.color='#ffd58a';
      const btn=document.getElementById('btnAtivar'); if(btn){btn.innerHTML='<i class="ph ph-receipt"></i> Ver pedido pendente';btn.onclick=()=>{abrirPagamento();};}
    }else{
      el.innerHTML='<i class="ph ph-shield-check" style="color:#12d9e7"></i> Ativação manual após confirmação do pagamento';
    }
  }catch{el.innerHTML='<i class="ph ph-info"></i> Escolha um plano para criar o seu pedido Premium';}
}


function selecionarPlano(plano, btn){
  if(!PLANOS[plano]) return;
  planoSelecionado=plano;
  document.querySelectorAll('.premium-plan-option').forEach(b=>b.classList.toggle('selecionado', b===btn));
  atualizarPlanoUI();
}
function atualizarPlanoUI(){
  const p=PLANOS[planoSelecionado]||PLANOS.premium_30d;
  const preco=document.getElementById('planoPreco');
  if(preco) preco.innerHTML=`${p.valor.toLocaleString('pt-PT')} <span>Kz / ${p.dias} dias</span>`;
  const sub=document.getElementById('modalPlanoSub');
  if(sub) sub.textContent=`Escolha como quer pagar os ${p.valor.toLocaleString('pt-PT')} Kz`;
  const refValor=document.getElementById('refValor');
  if(refValor) refValor.textContent=`${p.valor.toLocaleString('pt-PT')},00 Kz`;
  const refDesc=document.getElementById('refDescritivo');
  if(refDesc && !refDesc.textContent.trim()) refDesc.textContent='A referência será gerada ao criar o pedido';
}

/* ============================================================
   BADGE NOTIFICAÇÕES
   ============================================================ */

async function carregarBadgeNotificacoes() {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(`${API_URL}/notificacoes/nao-lidas`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      const data = await res.json();
      const total = data.total || 0;
      const badge = document.getElementById('navBadgeNotif');
      if (total > 0) {
        badge.textContent = total > 99 ? '99+' : total;
        badge.style.display = 'flex';
      }
    }
  } catch (e) {}
}

/* ============================================================
   FAQ
   ============================================================ */

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const aberto = item.classList.contains('aberto');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('aberto'));
  if (!aberto) item.classList.add('aberto');
}

/* ============================================================
   PAGAMENTO
   ============================================================ */

function gerarReferencia() {
  document.getElementById('refEntidade').textContent = '—';
  document.getElementById('refBanco').textContent = '—';
  document.getElementById('refPedido').textContent = '—';
}

async function carregarDadosMulticaixa() {
  const token=getToken();
  if(!token) return;
  const refNumero=document.getElementById('refNumero');
  if(refNumero) refNumero.textContent='A carregar dados de pagamento…';
  try {
    const res=await fetch(`${API_URL}/pagamentos/dados`,{headers:{Authorization:'Bearer '+token}});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.erro||`Falha ao carregar dados de pagamento (HTTP ${res.status}).`);
    document.getElementById('refEntidade').textContent=data.entidade;
    document.getElementById('refBanco').textContent=data.referencia_pagamento;
    document.getElementById('refPedido').textContent='Será gerado ao criar o pedido';
    document.getElementById('refNumero').textContent=`Entidade ${data.entidade} · Referência ${data.referencia_pagamento}`;
    const plano=PLANOS[planoSelecionado]||PLANOS.premium_30d;
    document.getElementById('refValor').textContent=`${plano.valor.toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2})} Kz`;
  } catch(error) {
    console.error('[PREMIUM] Não foi possível carregar os dados Multicaixa:',error);
    if(refNumero) refNumero.textContent=error.message||'Dados de pagamento indisponíveis.';
  }
}

function mostrarDadosPagamento(pagamento) {
  pagamentoPendente = pagamento.status === 'pendente';
  if (PLANOS[pagamento.plano]) {
    planoSelecionado = pagamento.plano;
    document.querySelectorAll('.premium-plan-option').forEach(option => {
      option.classList.toggle('selecionado', option.dataset.plan === pagamento.plano);
      option.disabled = pagamentoPendente;
    });
    atualizarPlanoUI();
  }
  document.getElementById('refEntidade').textContent = pagamento.entidade || 'Não configurada';
  document.getElementById('refBanco').textContent = pagamento.referencia_pagamento || 'Não configurada';
  document.getElementById('refPedido').textContent = pagamento.referencia_pedido || pagamento.referencia || '—';
  document.getElementById('refNumero').textContent = pagamento.entidade && pagamento.referencia_pagamento
    ? `${pagamento.entidade} / ${pagamento.referencia_pagamento}`
    : 'Dados de pagamento indisponíveis';
  document.getElementById('refValor').textContent = `${Number(pagamento.valor || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz`;
  const btn = document.getElementById('btnConfirmarPagamento');
  btn.disabled = pagamentoPendente;
  btn.innerHTML = pagamentoPendente
    ? '<i class="ph ph-clock"></i> A aguardar validação'
    : '<i class="ph ph-check"></i> Criar pedido e mostrar dados';
}

function selecionarPagamento(btn, metodo) {
  metodoPagamento = metodo;
  document.querySelectorAll('.pag-opcao').forEach(b => {
    b.classList.remove('selecionado');
    b.querySelector('.pag-opcao-check').innerHTML = '';
  });
  btn.classList.add('selecionado');
  btn.querySelector('.pag-opcao-check').innerHTML = '<i class="ph ph-check"></i>';

  // Atualizar referência conforme método
  carregarDadosMulticaixa();
}

function abrirPagamento() {
  document.getElementById('modalPagamento').classList.add('visivel');
  document.body.style.overflow = 'hidden';
  if(!pagamentoPendente) carregarDadosMulticaixa();
}

function fecharModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('modalPagamento').classList.remove('visivel');
  document.body.style.overflow = '';
}

function copiarReferencia() {
  const entidade = document.getElementById('refEntidade').textContent;
  const referencia = document.getElementById('refBanco').textContent;
  const codigoPedido = document.getElementById('refPedido').textContent;
  const plano=PLANOS[planoSelecionado]||PLANOS.premium_30d;
  const texto = `EZNY Premium\nEntidade: ${entidade}\nReferência Multicaixa: ${referencia}\nValor: ${plano.valor.toLocaleString('pt-PT')} Kz\nCódigo do pedido EZNY: ${codigoPedido}\nDuração: ${plano.dias} dias`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(texto).then(() => {
      toast('Dados copiados!', 'ok');
    });
  } else {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = texto;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast('Dados copiados!', 'ok');
  }
}

async function confirmarPagamento() {
  if (pagamentoPendente) return;
  const btn = document.getElementById('btnConfirmarPagamento');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> A criar pedido...';
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/pagamentos/criar`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ metodo: metodoPagamento, plano: planoSelecionado })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const p = data.pagamento;
      mostrarDadosPagamento({ ...p, referencia_pedido: p.referencia_pedido || p.referencia });
      document.getElementById('premiumStatus').textContent = 'Pedido criado. Efetue o pagamento fora do EZNY e aguarde a validação manual.';
      const activateButton = document.getElementById('btnAtivar');
      activateButton.innerHTML = '<i class="ph ph-receipt"></i> Ver pedido pendente';
      activateButton.onclick = () => abrirPagamento();
      toast('Pedido criado. O Premium será ativado após validação manual do pagamento.', 'ok');
      return;
    }
    if (res.status === 409 && data.pagamento_id) {
      const pedidosRes = await fetch(`${API_URL}/pagamentos/me`, { headers: { Authorization: 'Bearer ' + token } });
      const pedidos = pedidosRes.ok ? await pedidosRes.json() : [];
      const pendente = Array.isArray(pedidos) ? pedidos.find(p => p.status === 'pendente') : null;
      if (pendente) {
        mostrarDadosPagamento(pendente);
        toast('Já existe um pedido pendente. Os dados foram carregados.', 'info');
        return;
      }
    }
    throw new Error(data.erro || `Não foi possível criar o pedido (HTTP ${res.status}).`);
  } catch (e) {
    console.error('[PREMIUM] Erro ao criar pedido:', e);
    toast(e.message || 'Erro de rede. Tente novamente.', 'erro');
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-check"></i> Criar pedido e mostrar dados';
  }
}
/* ============================================================
   TEMA
   ============================================================ */

function carregarTema() {
  const tema = localStorage.getItem('theme');
  document.body.classList.toggle('light-theme', tema === 'light');
}

/* ============================================================
   TOAST
   ============================================================ */

function toast(msg, tipo) {
  const t = document.getElementById('toast');
  if (toastTimer) clearTimeout(toastTimer);
  const classe = tipo === 'erro' ? 'toast-erro' : tipo === 'ok' ? 'toast-ok' : 'toast-info';
  t.className = 'toast ' + classe + ' visivel';
  t.innerHTML = '<i class="ph-fill ph-' + (tipo === 'erro' ? 'warning-circle' : tipo === 'ok' ? 'check-circle' : 'info') + '"></i> <span>' + msg + '</span>';
  toastTimer = setTimeout(() => t.classList.remove('visivel'), 3500);
}
