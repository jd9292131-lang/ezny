

const CONFIG = {
  STORAGE: { USER:'userData', TOKEN:'token', THEME:'theme' },
  ANIM: { TOAST:3000 }
};

const API_URL = window.location.origin + '/api';

let userData = null;
let toastTimer = null;

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  carregarTema();
  verificarAuth();
  carregarPerfil();
  carregarBadges();
  carregarBadgeNotificacoes();

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      fecharEditar();
      fecharModalLogout();
    }
  });
});

/* ============================================================
   AUTH
   ============================================================ */

function getUser() {
  try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE.USER)); } catch { return null; }
}
function getToken() { return localStorage.getItem(CONFIG.STORAGE.TOKEN); }
function isAuth() { return !!(getUser() && getToken()); }

function verificarAuth() {
  if (!isAuth()) {
    toast('Precisa iniciar sessão');
    setTimeout(() => { window.location.href = 'auth.html'; }, 2000);
    return false;
  }
  return true;
}

/* ============================================================
   CARREGAR PERFIL
   ============================================================ */

async function carregarPerfil() {
  if (!verificarAuth()) return;

  const token = getToken();
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem(CONFIG.STORAGE.USER);
        localStorage.removeItem(CONFIG.STORAGE.TOKEN);
        toast('Sessão expirada');
        setTimeout(() => { window.location.href = 'auth.html'; }, 1500);
        return;
      }
      throw new Error('Erro ao carregar');
    }

    userData = await res.json();
    localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(userData));

    renderizarPerfil();

    document.getElementById('loading').style.display = 'none';
    document.getElementById('conteudo').style.display = 'block';

  } catch (err) {
    console.error('Erro:', err);
    toast('Erro ao carregar perfil');
    // Usar dados do localStorage como fallback
    userData = getUser();
    if (userData) {
      renderizarPerfil();
      document.getElementById('loading').style.display = 'none';
      document.getElementById('conteudo').style.display = 'block';
    }
  }
}

/* ============================================================
   RENDERIZAR PERFIL
   ============================================================ */

function renderizarPerfil() {
  if (!userData) return;

  const isPremium = userData.tipo_conta === 'premium';
  const nome = userData.nome || userData.telefone || 'Utilizador';
  const inicial = nome.charAt(0).toUpperCase();

  // Avatar
  const avatarWrap = document.getElementById('avatarWrap');
  if (userData.avatar) {
    avatarWrap.innerHTML = `<img src="${eznyImage(userData.avatar)}" class="perfil-avatar" alt="" onerror="this.style.display='none';document.getElementById('avatarPlaceholder').style.display='flex';">` +
      `<div class="perfil-avatar-placeholder" id="avatarPlaceholder" style="display:none;">${inicial}</div>`;
  } else {
    avatarWrap.innerHTML = `<div class="perfil-avatar-placeholder">${inicial}</div>`;
  }

  // Nome e badge
  const nomeEl = document.getElementById('perfilNome');
  nomeEl.innerHTML = esc(nome) + ' ';
  if (isPremium) {
    nomeEl.innerHTML += '<span class="perfil-badge-premium"><i class="ph-fill ph-crown" style="font-size:10px;"></i> Premium</span>';
  } else {
    nomeEl.innerHTML += '<span class="perfil-badge-normal">Normal</span>';
  }

  // Email
  document.getElementById('perfilEmail').textContent = userData.email || userData.telefone || '';

  // Stats
  document.getElementById('statAnuncios').textContent = userData.total_anuncios || 0;
  const avaliacao = userData.avaliacao_media ? parseFloat(userData.avaliacao_media).toFixed(1) : '—';
  document.getElementById('statAvaliacao').textContent = avaliacao;

  // Membro desde
  let membroDesde = '—';
  if (userData.created_at) {
    const data = new Date(userData.created_at);
    membroDesde = data.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' });
  }
  document.getElementById('statMembro').textContent = membroDesde;

  // Ações
  const acoesEl = document.getElementById('perfilAcoes');
  const secaoUpgrade = document.getElementById('secaoUpgrade');
  const menuProf = document.getElementById('menuProfissional');

  if (isPremium) {
    acoesEl.innerHTML =
      `<a href="perfil-profissional.html" class="perfil-btn perfil-btn-prof">` +
      `<i class="ph-fill ph-user-gear"></i> Ver Perfil Profissional</a>` +
      `<button class="perfil-btn perfil-btn-editar" onclick="abrirEditar()">` +
      `<i class="ph-fill ph-pencil-simple"></i> Editar</button>`;
    secaoUpgrade.style.display = 'none';
    menuProf.style.display = 'flex';
  } else {
    acoesEl.innerHTML =
      `<button class="perfil-btn perfil-btn-premium" onclick="irUpgrade()">` +
      `<i class="ph-fill ph-crown"></i> Tornar Premium</button>` +
      `<button class="perfil-btn perfil-btn-editar" onclick="abrirEditar()">` +
      `<i class="ph-fill ph-pencil-simple"></i> Editar</button>`;
    secaoUpgrade.style.display = 'block';
    menuProf.style.display = 'none';
  }

  // Preencher formulário de edição
  document.getElementById('editNome').value = userData.nome || '';
  document.getElementById('editTelefone').value = userData.telefone || '';
  document.getElementById('editEmail').value = userData.email || '';
  document.getElementById('editLocalizacao').value = userData.localizacao || '';
  document.getElementById('editBio').value = userData.bio || '';
}

/* ============================================================
   EDITAR PERFIL
   ============================================================ */

function abrirEditar() {
  document.getElementById('modalEditar').classList.add('visivel');
  document.body.style.overflow = 'hidden';
}

function fecharEditar(e) {
  if (e && e.target !== e.currentTarget && e.type === 'click') return;
  document.getElementById('modalEditar').classList.remove('visivel');
  document.body.style.overflow = '';
}

async function salvarPerfil() {
  const dados = {
    nome: document.getElementById('editNome').value.trim(),
    telefone: document.getElementById('editTelefone').value.trim(),
    email: document.getElementById('editEmail').value.trim(),
    localizacao: document.getElementById('editLocalizacao').value.trim(),
    bio: document.getElementById('editBio').value.trim()
  };

  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/auth/perfil`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    if (res.ok) {
      const data = await res.json();
      userData = { ...userData, ...dados };
      localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(userData));
      renderizarPerfil();
      fecharEditar();
      toast('Perfil atualizado com sucesso!', 'success');
    } else {
      const data = await res.json();
      toast(data.erro || 'Erro ao atualizar');
    }
  } catch (e) {
    toast('Erro ao guardar. Tente novamente.');
  }
}

function editarAvatar() {
  let input = document.getElementById('inputAvatar');
  if (!input) {
    input = document.createElement('input');
    input.type = 'file';
    input.id = 'inputAvatar';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.addEventListener('change', uploadAvatar);
    document.body.appendChild(input);
  }
  input.click();
}

async function uploadAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/auth/avatar`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      userData.avatar = data.avatar;
      localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(userData));
      renderizarPerfil();
      toast('Foto atualizada!', 'success');
    } else {
      toast('Erro ao enviar foto');
    }
  } catch (e) {
    toast('Erro ao enviar foto');
  }
}

/* ============================================================
   LOGOUT
   ============================================================ */

function abrirModalLogout() {
  document.getElementById('modalLogout').classList.add('visivel');
  document.body.style.overflow = 'hidden';
}

function fecharModalLogout(e) {
  if (e && e.target !== e.currentTarget && e.type === 'click') return;
  document.getElementById('modalLogout').classList.remove('visivel');
  document.body.style.overflow = '';
}

function confirmarLogout() {
  localStorage.removeItem(CONFIG.STORAGE.USER);
  localStorage.removeItem(CONFIG.STORAGE.TOKEN);
  fecharModalLogout();
  toast('Sessão terminada');
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
}

/* ============================================================
   UPGRADE
   ============================================================ */

function irUpgrade() {
  window.location.href = 'upgrade.html';
}

/* ============================================================
   BADGES
   ============================================================ */

async function carregarBadges() {
  const token = getToken();
  if (!token) return;

  try {
    // Anúncios
    const resAnun = await fetch(`${API_URL}/anuncios/meus`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (resAnun.ok) {
      const anuncios = await resAnun.json();
      const badge = document.getElementById('badgeAnuncios');
      if (anuncios.length > 0) {
        badge.textContent = anuncios.length > 99 ? '99+' : anuncios.length;
        badge.style.display = 'inline-block';
      }
    }

    // Mensagens não lidas
    const resMsg = await fetch(`${API_URL}/mensagens/nao-lidas`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (resMsg.ok) {
      const msgs = await resMsg.json();
      const badge = document.getElementById('badgeMensagens');
      const total = msgs.total || 0;
      if (total > 0) {
        badge.textContent = total > 99 ? '99+' : total;
        badge.style.display = 'inline-block';
      }
    }
  } catch (e) {}
}

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

/* ============================================================
   TEMA
   ============================================================ */

function carregarTema() {
  const temaSalvo = localStorage.getItem(CONFIG.STORAGE.THEME);
  const isDark = temaSalvo !== 'light';
  document.body.classList.toggle('light-theme', !isDark);
  atualizarIconTema(isDark);
}

function toggleTema() {
  const isDark = !document.body.classList.contains('light-theme');
  localStorage.setItem(CONFIG.STORAGE.THEME, isDark ? 'light' : 'dark');
  document.body.classList.toggle('light-theme', isDark);
  atualizarIconTema(!isDark);
}

function atualizarIconTema(isDark) {
  const icon = document.getElementById('iconTema');
  if (icon) icon.className = isDark ? 'ph ph-moon' : 'ph ph-sun';
}

/* ============================================================
   TOAST
   ============================================================ */

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
/* ============================================================
   UTILS
   ============================================================ */

function esc(t) {
  if (t == null) return '';
  const d = document.createElement('div');
  d.textContent = String(t);
  return d.innerHTML;
}
