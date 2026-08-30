/* =========================
   notificacoes.js — Script reutilizável para badge e notificações
========================= */

const API_URL_NOTIF = (typeof API_BASE !== 'undefined') ? API_BASE : '/api';

/* =========================
   UTILS
========================= */
function getToken() {
  return localStorage.getItem('token') || '';
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('userData')); } catch { return null; }
}

function isAuth() {
  return !!(getUser() && getToken());
}

function getAuthHeaders() {
  return { 'Authorization': 'Bearer ' + getToken() };
}

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function formatarDataNotif(dataStr) {
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

/* =========================
   API HELPERS
========================= */
async function apiGetNotif(endpoint) {
  try {
    const res = await fetch(API_URL_NOTIF + endpoint, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.error('Notificações GET erro:', e);
    return null;
  }
}

async function apiPostNotif(endpoint, body = {}) {
  try {
    const res = await fetch(API_URL_NOTIF + endpoint, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.error('Notificações POST erro:', e);
    return null;
  }
}

/* =========================
   BADGE — NÃO LIDAS
========================= */
let _notifBadgeEl = null;
let _notifCountEl = null;

function initNotificacoesBadge() {
  if (!isAuth()) return;
  _notifBadgeEl = document.getElementById('notifBadge');
  _notifCountEl = document.getElementById('notifCount');
  atualizarBadgeNaoLidas();
  // Atualizar a cada 30 segundos
  setInterval(atualizarBadgeNaoLidas, 30000);
}

async function atualizarBadgeNaoLidas() {
  if (!isAuth()) return;
  const data = await apiGetNotif('/notificacoes/nao-lidas');
  if (!data || typeof data.total !== 'number') return;

  const total = data.total;

  // Suporte para IDs do notificacoes.js original
  if (_notifCountEl) {
    _notifCountEl.textContent = total;
    _notifCountEl.style.display = total > 0 ? 'flex' : 'none';
  }

  // Suporte para IDs do index.html / outras páginas
  const sidebarBadge = document.getElementById('sidebarNotifBadge');
  if (sidebarBadge) {
    sidebarBadge.textContent = total;
    sidebarBadge.style.display = total > 0 ? 'inline-block' : 'none';
  }

  const menuBadge = document.getElementById('menuNotifBadge');
  if (menuBadge) {
    menuBadge.textContent = total > 99 ? '99+' : total;
    menuBadge.style.display = total > 0 ? 'inline-block' : 'none';
  }

  // Badge na bottom nav
  const navBadge = document.getElementById('navNotifBadge');
  if (navBadge) {
    navBadge.textContent = total > 99 ? '99+' : total;
    navBadge.style.display = total > 0 ? 'inline-block' : 'none';
  }
}

/* =========================
   LISTAR NOTIFICAÇÕES (para páginas que incluem este script)
========================= */
async function carregarNotificacoesLista(containerId) {
  const container = document.getElementById(containerId || 'notificacoesList');
  if (!container) return;

  if (!isAuth()) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
        <i class="ph ph-sign-in" style="font-size:48px;margin-bottom:12px;display:block;opacity:0.5;"></i>
        <h3>Inicia sessão</h3>
        <p style="font-size:0.85rem;margin-top:8px;">Entra na tua conta para veres as tuas notificações.</p>
      </div>`;
    return;
  }

  const notifs = await apiGetNotif('/notificacoes');

  if (!notifs || !Array.isArray(notifs)) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
        <i class="ph ph-wifi-x" style="font-size:48px;margin-bottom:12px;display:block;opacity:0.5;"></i>
        <h3>Erro ao carregar</h3>
      </div>`;
    return;
  }

  if (notifs.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
        <i class="ph ph-bell-slash" style="font-size:64px;margin-bottom:16px;display:block;opacity:0.5;"></i>
        <h3>Sem notificações</h3>
        <p style="font-size:0.85rem;max-width:280px;margin:8px auto 0;">Quando os teus anúncios forem aprovados ou rejeitados, verás aqui.</p>
      </div>`;
    return;
  }

  container.innerHTML = notifs.map(n => renderNotifItem(n)).join('');
  atualizarBadgeNaoLidas();
}

function renderNotifItem(n) {
  const iconMap = {
    success: { icon: 'ph-check-circle', class: 'success' },
    error: { icon: 'ph-x-circle', class: 'error' },
    warning: { icon: 'ph-warning', class: 'warning' },
    info: { icon: 'ph-info', class: 'info' }
  };
  const icone = iconMap[n.tipo] || iconMap.info;
  const opacity = n.lida ? 'opacity:0.6;' : '';

  return `
    <div class="notif-item ${n.lida ? 'lida' : ''}" data-id="${n.id}" onclick="verAnuncioNotif(${n.anuncio_id})" style="${opacity}">
      <div class="notif-icon ${icone.class}">
        <i class="ph ${icone.icon}"></i>
      </div>
      <div class="notif-content">
        <div class="notif-titulo">${escapeHtml(n.titulo || 'Notificação')}</div>
        <div class="notif-mensagem">${escapeHtml(n.mensagem || '')}</div>
        <div class="notif-data">${formatarDataNotif(n.createdAt)}</div>
        ${!n.lida ? `
        <div class="notif-actions">
          <button class="btn-marcar" onclick="event.stopPropagation(); marcarLidaNotif(${n.id})">
            Marcar como lida
          </button>
        </div>` : ''}
      </div>
    </div>
  `;
}

/* =========================
   AÇÕES
========================= */
async function marcarLidaNotif(id) {
  const res = await apiPostNotif('/notificacoes/' + id + '/lida');
  if (res && res.sucesso) {
    const container = document.getElementById('notificacoesList');
    if (container) carregarNotificacoesLista('notificacoesList');
    atualizarBadgeNaoLidas();
  }
}

async function marcarTodasLidasNotif() {
  const res = await apiPostNotif('/notificacoes/todas-lidas');
  if (res && res.sucesso) {
    const container = document.getElementById('notificacoesList');
    if (container) carregarNotificacoesLista('notificacoesList');
    atualizarBadgeNaoLidas();
    mostrarToastNotif('Todas as notificações marcadas como lidas', 'success');
  }
}

function verAnuncioNotif(id) {
  if (id) window.location.href = 'anuncio.html?id=' + id;
}

/* =========================
   TOAST
========================= */
function mostrarToastNotif(mensagem, tipo) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const cores = {
    success: 'background:rgba(16,185,129,0.95);color:white;',
    error: 'background:rgba(239,68,68,0.95);color:white;',
    info: 'background:rgba(0,190,200,0.95);color:white;'
  };
  const icones = { success: 'ph-check-circle', error: 'ph-warning-circle', info: 'ph-info' };

  toast.style.cssText = `
    ${cores[tipo] || cores.info}
    padding: 14px 22px;
    border-radius: 14px;
    font-weight: 600;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    transform: translateX(120%);
    transition: transform 0.4s ease;
    cursor: pointer;
  `;
  toast.innerHTML = `<i class="ph ${icones[tipo] || 'ph-info'}"></i>${escapeHtml(mensagem)}`;

  container.appendChild(toast);
  requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });

  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);

  toast.onclick = () => toast.remove();
}

/* =========================
   INIT AUTO
========================= */
document.addEventListener('DOMContentLoaded', () => {
  if (isAuth()) {
    initNotificacoesBadge();
  }
});