
// ========================= CONFIG =========================
const CONFIG = {
  STORAGE: { USER:'userData', TOKEN:'token', THEME:'theme', AVATAR:'userAvatar' },
  ROUTES: { AUTH:'auth.html', HOME:'index.html' },
  ANIM: { TOAST:3000, REDIRECT:800, LOGIN_REDIRECT:2500 }
};

const API_URL = window.location.origin + '/api';

let sidebarAberto = false, modalAberto = false, toastTimer = null;

// ========================= INIT =========================
document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('visitorId')) localStorage.setItem('visitorId', crypto.randomUUID());
  init();
  atualizarBadge();
  setTimeout(verificarPopups, 1000);
  setInterval(atualizarBadge, 30000);
});

function init() {
  renderUser();
  carregarTema();
  carregarAvatar();
  setupEvents();
}

// ========================= SESSÃO =========================
function getUser() { try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE.USER)); } catch { return null; } }
function getToken() { return localStorage.getItem(CONFIG.STORAGE.TOKEN); }
function isAuth() { return !!(getUser() && getToken()); }

function renderUser() {
  const u = getUser();
  if (u) {
    document.getElementById('userSidebar').textContent = u.nome || u.telefone || 'Utilizador';
    const nameEl = document.getElementById('profileName');
    if (nameEl) {
      const nome = u.nome || u.telefone || 'Utilizador';
      nameEl.innerHTML = esc(nome) + ' <i class="ph-fill ph-seal-check verified-badge"></i>';
    }
    const statusEl = document.getElementById('profileStatus');
    if (statusEl) statusEl.textContent = u.verificado ? 'Conta verificada' : 'Conta padrão';
    if (u.email) document.getElementById('emailDisplay').textContent = u.email;
    if (u.telefone) document.getElementById('phoneDisplay').textContent = u.telefone;
  } else {
    document.getElementById('userSidebar').textContent = 'Visitante';
    document.getElementById('profileStatus').textContent = 'Inicie sessão';
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.innerHTML = 'Visitante <i class="ph-fill ph-seal-check verified-badge"></i>';
    const emailEl = document.getElementById('emailDisplay');
    if (emailEl) emailEl.textContent = 'Não definido';
    const phoneEl = document.getElementById('phoneDisplay');
    if (phoneEl) phoneEl.textContent = 'Não definido';
  }
}

// ========================= AVATAR =========================
function carregarAvatar() {
  const saved = localStorage.getItem(CONFIG.STORAGE.AVATAR);
  const img = document.getElementById('profileAvatar');
  if (img && saved) img.src = saved;
}

function handleAvatarChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('Selecione uma imagem válida');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast('Imagem demasiado grande (máx 5MB)');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxSize = 400;
      let w = img.width, h = img.height;
      if (w > h && w > maxSize) { h = h * (maxSize / w); w = maxSize; }
      else if (h > maxSize) { w = w * (maxSize / h); h = maxSize; }
      canvas.width = w; canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      try {
        localStorage.setItem(CONFIG.STORAGE.AVATAR, dataUrl);
        carregarAvatar();
        toast('Foto de perfil atualizada');
      } catch (err) {
        toast('Erro ao guardar imagem. Tente uma mais pequena.');
      }
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

// ========================= SIDEBAR =========================
function toggleSidebar() {
  sidebarAberto = !sidebarAberto;
  document.getElementById('sidebar').classList.toggle('open', sidebarAberto);
  document.getElementById('overlay').classList.toggle('show', sidebarAberto);
  document.body.style.overflow = sidebarAberto ? 'hidden' : '';
}

// ========================= LOGOUT =========================
function logout() {
  if (sidebarAberto) toggleSidebar();
  modalAberto = true;
  document.getElementById('modalLogout').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function fecharModalLogout() {
  modalAberto = false;
  document.getElementById('modalLogout').classList.remove('show');
  document.body.style.overflow = '';
}

function confirmarLogout() {
  localStorage.removeItem(CONFIG.STORAGE.USER);
  localStorage.removeItem(CONFIG.STORAGE.TOKEN);
  fecharModalLogout();
  toast('Sessão terminada com sucesso');
  setTimeout(()=>{window.location.href=CONFIG.ROUTES.HOME;}, CONFIG.ANIM.REDIRECT);
}

// ========================= TEMA =========================
function carregarTema() {
  const temaSalvo = localStorage.getItem(CONFIG.STORAGE.THEME);
  const toggle = document.getElementById('darkModeToggle');
  const icon = document.getElementById('darkModeIcon');
  const text = document.getElementById('darkModeText');

  const isDark = temaSalvo !== 'light';

  if (toggle) toggle.checked = isDark;
  if (icon) icon.className = isDark ? 'ph ph-moon' : 'ph ph-sun';
  if (text) text.textContent = isDark ? 'Modo escuro' : 'Modo claro';

  document.body.classList.toggle('light-theme', !isDark);
}

function alternarTema() {
  const toggle = document.getElementById('darkModeToggle');
  const isDark = toggle.checked;

  localStorage.setItem(CONFIG.STORAGE.THEME, isDark ? 'dark' : 'light');

  const icon = document.getElementById('darkModeIcon');
  const text = document.getElementById('darkModeText');

  if (icon) icon.className = isDark ? 'ph ph-moon' : 'ph ph-sun';
  if (text) text.textContent = isDark ? 'Modo escuro' : 'Modo claro';

  document.body.classList.toggle('light-theme', !isDark);

  toast(isDark ? 'Modo escuro ativado' : 'Modo claro ativado');
}

// ========================= TOAST =========================
function toast(msg, tipo = 'erro') {

    const t = document.getElementById('toast');

    if (toastTimer) clearTimeout(toastTimer);

    t.style.setProperty('--toast-time', `${CONFIG.ANIM.TOAST}ms`);

    t.className = `toast toast-${tipo} visivel`;

    t.textContent = msg;

    toastTimer = setTimeout(() => {
        t.classList.remove('visivel');
    }, CONFIG.ANIM.TOAST);

}
// ========================= EVENTOS =========================
function setupEvents() {
  document.addEventListener('keydown', e=>{
    if (e.key==='Escape') {
      if (modalAberto) fecharModalLogout();
      else if (sidebarAberto) toggleSidebar();
    }
  });
  document.getElementById('modalLogout').addEventListener('click', e=>{
    if (e.target===document.getElementById('modalLogout')) fecharModalLogout();
  });
  let tx=0;
  document.addEventListener('touchstart', e=>{tx=e.touches[0].clientX;}, {passive:true});
  document.addEventListener('touchend', e=>{
    const dx = tx - e.changedTouches[0].clientX;
    if (dx>50 && sidebarAberto) toggleSidebar();
    if (dx<-50 && !sidebarAberto && tx<30 && isAuth()) toggleSidebar();
  }, {passive:true});
}

// ========================= BADGE NOTIFICAÇÕES =========================
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
      const badge = document.getElementById('navBadgeNotificacoes');
      if (total > 0) {
        badge.textContent = total > 99 ? '99+' : total;
        badge.style.display = 'flex';
      }
    }
  } catch (e) {}
}
function atualizarBadge() {
  carregarBadgeNotificacoes();
}

// ========================= POPUPS =========================
let popupAtual = null;

async function verificarPopups() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch(`${API_URL}/comunicados/popups`, { headers:{'Authorization':'Bearer '+token} });
    if (!res.ok) return;
    const popups = await res.json();
    if (popups && popups.length > 0) {
      popupAtual = popups[0];
      toast(popups[0].titulo || 'Comunicado');
    }
  } catch (e) {}
}

// ========================= UTILS =========================
function esc(t) {
  if (t == null) return '';
  const d = document.createElement('div');
  d.textContent = String(t);
  return d.innerHTML;
}
