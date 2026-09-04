
const CONFIG = { STORAGE: { USER:'userData', TOKEN:'token' } };

/* =========================
   TEMA
========================= */
function carregarTema() {
  const temaSalvo = localStorage.getItem('theme');
  const isDark = temaSalvo !== 'light';
  document.body.classList.toggle('light-theme', isDark);
  atualizarIconTema(isDark);
}

function alternarTema() {
  const isDark = !document.body.classList.contains('light-theme');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  document.body.classList.toggle('light-theme', isDark);
  atualizarIconTema(isDark);
}

function atualizarIconTema(isDark) {
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.className = isDark ? 'ph ph-sun' : 'ph ph-moon';
  }
}

/* =========================
   BANIMENTO
========================= */
const banInfo = JSON.parse(localStorage.getItem('banInfo') || '{}');

function atualizarInterface() {
  const msgEl = document.getElementById('msg');
  const cdWrap = document.getElementById('countdownWrap');

  if (banInfo.tipo_banimento === 'temporario' && banInfo.banido_ate) {
    msgEl.textContent = 'A sua conta foi suspensa temporariamente. Será reativada automaticamente quando o período de suspensão terminar.';
    cdWrap.classList.add('show');
    iniciarContagem(banInfo.banido_ate);
  } else {
    msgEl.textContent = 'A sua conta foi suspensa permanentemente por violação das nossas regras e condições de utilização. Contacte o suporte para mais informações.';
    cdWrap.classList.remove('show');
  }
}

function iniciarContagem(dataAlvo) {
  const alvo = new Date(dataAlvo).getTime();

  function atualizar() {
    const agora = new Date().getTime();
    const diff = alvo - agora;

    if (diff <= 0) {
      document.getElementById('cdDias').textContent = '00';
      document.getElementById('cdHoras').textContent = '00';
      document.getElementById('cdMin').textContent = '00';
      document.getElementById('cdSeg').textContent = '00';
      setTimeout(() => window.location.reload(), 2000);
      return;
    }

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const min = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seg = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById('cdDias').textContent = String(dias).padStart(2, '0');
    document.getElementById('cdHoras').textContent = String(horas).padStart(2, '0');
    document.getElementById('cdMin').textContent = String(min).padStart(2, '0');
    document.getElementById('cdSeg').textContent = String(seg).padStart(2, '0');
  }

  atualizar();
  setInterval(atualizar, 1000);
}

/* =========================
   SESSÃO
========================= */
function terminarSessao() {
  localStorage.removeItem(CONFIG.STORAGE.USER);
  localStorage.removeItem(CONFIG.STORAGE.TOKEN);
  localStorage.removeItem('banInfo');
  window.location.href = 'auth.html';
}

// Se não houver token, redirecionar
if (!localStorage.getItem(CONFIG.STORAGE.TOKEN)) {
  window.location.href = 'auth.html';
}

/* =========================
   INIT
========================= */
carregarTema();
atualizarInterface();
