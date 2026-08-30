
const API_URL = window.location.origin + '/api';

function getToken() { return localStorage.getItem('token') || ''; }
function getUser() {
  try { return JSON.parse(localStorage.getItem('userData')); } catch { return null; }
}
function isAuth() { return !!(getUser() && getToken()); }
function getAuthHeaders() {
  return { 'Authorization': 'Bearer ' + getToken() };
}

let notificacoesCache = [];

/* =========================
   INIT
========================= */
document.addEventListener('DOMContentLoaded', () => {
  if (!isAuth()) {
    document.getElementById('notifLoading').style.display = 'none';
    document.getElementById('notifVazio').style.display = 'block';
    document.getElementById('notifVazio').innerHTML = `
      <i class="ph ph-sign-in"></i>
      <h3>Inicia sessão</h3>
      <p>Entra na tua conta para veres as tuas notificações.</p>
      <a href="login.html" style="display:inline-block;margin-top:16px;padding:10px 24px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:white;border-radius:12px;text-decoration:none;font-weight:600;font-size:0.9rem;">Iniciar Sessão</a>
    `;
    return;
  }
  carregarNotificacoes();
});

/* =========================
   CARREGAR NOTIFICAÇÕES
========================= */
async function carregarNotificacoes() {
  const loading = document.getElementById('notifLoading');
  const lista = document.getElementById('notifLista');
  const vazio = document.getElementById('notifVazio');

  loading.style.display = 'flex';
  lista.style.display = 'none';
  vazio.style.display = 'none';

  try {
    const res = await fetch(API_URL + '/notificacoes', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const notifs = await res.json();
    notificacoesCache = notifs;

    loading.style.display = 'none';

    if (!notifs || notifs.length === 0) {
      vazio.style.display = 'block';
      return;
    }

    lista.style.display = 'block';
    renderizarNotificacoes(notifs);
  } catch (e) {
    console.error('Erro:', e);
    loading.style.display = 'none';
    lista.style.display = 'block';
    lista.innerHTML = '<div class="notif-vazio"><i class="ph ph-wifi-x"></i><h3>Erro ao carregar</h3><p>Não foi possível carregar as notificações. Tenta novamente.</p></div>';
  }
}

function renderizarNotificacoes(notifs) {
  const lista = document.getElementById('notifLista');

  lista.innerHTML = notifs.map((n, i) => {
    const iconMap = {
      success: { icon: 'ph-check-circle', class: 'success' },
      error: { icon: 'ph-x-circle', class: 'error' },
      warning: { icon: 'ph-warning', class: 'warning' },
      info: { icon: 'ph-info', class: 'info' }
    };
    const icone = iconMap[n.tipo] || iconMap.info;
    const lidaClass = n.lida ? 'lida' : '';

    return `
      <div class="notif-item ${lidaClass}" data-id="${n.id}" style="animation: fadeInUp 0.4s ease ${i * 0.05}s both;">
        <div class="notif-icon ${icone.class}">
          <i class="ph ${icone.icon}"></i>
        </div>
        <div class="notif-conteudo" onclick="abrirNotificacao(${n.id}, ${n.anuncio_id || 'null'})">
          <div class="notif-titulo">${esc(n.titulo || 'Notificação')}</div>
          <div class="notif-mensagem">${esc(n.mensagem || '')}</div>
          <div class="notif-meta">
            <span class="notif-data">${formatarData(n.createdAt)}</span>
            <div class="notif-acoes">
              ${!n.lida ? `<button class="notif-acao-btn ler" onclick="event.stopPropagation(); marcarLida(${n.id})">Marcar lida</button>` : ''}
              <button class="notif-acao-btn eliminar" onclick="event.stopPropagation(); eliminarNotif(${n.id})">Eliminar</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* =========================
   AÇÕES
========================= */
async function marcarLida(id) {
  try {
    const res = await fetch(API_URL + '/notificacoes/' + id + '/lida', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const item = document.querySelector(`.notif-item[data-id="${id}"]`);
      if (item) {
        item.classList.add('lida');
        const btn = item.querySelector('.notif-acao-btn.ler');
        if (btn) btn.remove();
      }
      toast('Marcada como lida');
    }
  } catch (e) {
    toast('Erro ao marcar como lida', 'erro');
  }
}

async function marcarTodasLidas() {
  try {
    const res = await fetch(API_URL + '/notificacoes/todas-lidas', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      toast('Todas as notificações marcadas como lidas');
      carregarNotificacoes();
    }
  } catch (e) {
    toast('Erro ao marcar todas', 'erro');
  }
}

async function eliminarNotif(id) {
  if (!confirm('Eliminar esta notificação?')) return;
  try {
    const res = await fetch(API_URL + '/notificacoes/' + id, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const item = document.querySelector(`.notif-item[data-id="${id}"]`);
      if (item) {
        item.style.transform = 'translateX(100%)';
        item.style.opacity = '0';
        setTimeout(() => item.remove(), 300);
      }
      toast('Notificação eliminada');
      // Verificar se ficou vazio
      setTimeout(() => {
        if (document.querySelectorAll('.notif-item').length === 0) {
          document.getElementById('notifLista').style.display = 'none';
          document.getElementById('notifVazio').style.display = 'block';
        }
      }, 350);
    }
  } catch (e) {
    toast('Erro ao eliminar', 'erro');
  }
}

async function limparLidas() {
  try {
    const res = await fetch(API_URL + '/notificacoes/limpar-lidas', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      toast('Notificações lidas eliminadas');
      carregarNotificacoes();
    }
  } catch (e) {
    toast('Erro ao limpar', 'erro');
  }
}

function abrirNotificacao(id, anuncioId) {
  // Marcar como lida ao abrir
  marcarLida(id);
  if (anuncioId) {
    window.location.href = 'anuncio.html?id=' + anuncioId;
  }
}

/* =========================
   TOAST
========================= */
function toast(msg, tipo = 'erro') {

    const t = document.getElementById('toast');

    if (toastTimer) clearTimeout(toastTimer);

    t.style.setProperty('--toast-time', `${CONFIG.ANIM.TOAST}ms`);

    t.className = `toast toast-${tipo} visivel`;

    t.textContent = msg;

    toastTimer = setTimeout(() => {
        t.classList.remove('visivel');
    }, CONFIG.ANIM.TOAST);

}/* =========================
   UTILS
========================= */
function esc(t) {
  if (t == null) return '';
  const d = document.createElement('div');
  d.textContent = String(t);
  return d.innerHTML;
}

function formatarData(dataStr) {
  if (!dataStr) return '';
  const d = new Date(dataStr);
  if (isNaN(d)) return dataStr;
  const agora = new Date();
  const diff = Math.floor((agora - d) / 1000);
  if (diff < 60) return 'Agora';
  if (diff < 3600) return Math.floor(diff / 60) + ' min atrás';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h atrás';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd atrás';
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
