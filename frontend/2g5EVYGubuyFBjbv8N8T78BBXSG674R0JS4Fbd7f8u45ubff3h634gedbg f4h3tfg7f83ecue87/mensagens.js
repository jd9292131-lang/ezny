const API_URL = window.location.origin + '/api';
const token = localStorage.getItem('token');
const user = (() => { try { return JSON.parse(localStorage.getItem('userData') || 'null'); } catch { return null; } })();

let conversations = [];
let currentContactId = null;
let pollTimer = null;
let loadingConversation = false;

function authHeaders(json = false) {
  const h = { Authorization: 'Bearer ' + token };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function initials(name) {
  const n = String(name || '?').trim();
  return esc(n ? n.charAt(0).toUpperCase() : '?');
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
}

function avatarHtml(url, name, className='avatar') {
  const safe = eznyImage(url);
  return safe
    ? `<div class="${className}"><img src="${esc(safe)}" alt=""></div>`
    : `<div class="${className}">${initials(name)}</div>`;
}

async function carregarConversas() {
  if (!token) {
    window.location.href = 'auth.html';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/mensagens/conversas`, { headers: authHeaders() });
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      window.location.href = 'auth.html';
      return;
    }
    if (!res.ok) throw new Error('Falha ao carregar');
    conversations = await res.json();
    renderConversas();
  } catch (e) {
    document.getElementById('conversationList').innerHTML = '<div class="list-empty">Não foi possível carregar as conversas.</div>';
  }
}

function renderConversas() {
  const list = document.getElementById('conversationList');
  if (!conversations.length) {
    list.innerHTML = '<div class="list-empty">Ainda não tens conversas.</div>';
    return;
  }

  list.innerHTML = conversations.map(c => {
    const active = Number(c.contacto_id) === Number(currentContactId) ? ' active' : '';
    const unread = Number(c.nao_lidas || 0);
    return `<button class="conversation${active}" data-contact="${Number(c.contacto_id)}">
      ${avatarHtml(c.contacto_avatar, c.contacto_nome)}
      <span class="conversation-main">
        <span class="conversation-top">
          <span class="conversation-name">${esc(c.contacto_nome || 'Utilizador')}</span>
          ${unread ? `<span class="unread">${unread > 99 ? '99+' : unread}</span>` : ''}
        </span>
        <span class="conversation-preview">${esc(c.ultima_mensagem || 'Nova conversa')}</span>
      </span>
    </button>`;
  }).join('');

  list.querySelectorAll('.conversation').forEach(btn => {
    btn.addEventListener('click', () => abrirConversa(Number(btn.dataset.contact)));
  });
}

function setContactHeader(contact) {
  const name = contact?.contacto_nome || 'Utilizador';
  const avatar = document.getElementById('contactAvatar');
  avatar.innerHTML = eznyImage(contact?.contacto_avatar)
    ? `<img src="${esc(eznyImage(contact.contacto_avatar))}" alt="">`
    : initials(name);
  document.getElementById('contactName').textContent = name;
  document.getElementById('contactType').textContent = contact?.contacto_tipo === 'premium' ? 'Perfil Premium' : 'Utilizador';
}

async function abrirConversa(contactId) {
  if (!Number.isInteger(contactId) || contactId <= 0 || loadingConversation) return;
  currentContactId = contactId;
  renderConversas();
  loadingConversation = true;
  try {
    const res = await fetch(`${API_URL}/mensagens/conversa/${contactId}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Falha ao abrir conversa');
    const messages = await res.json();
    const contact = conversations.find(c => Number(c.contacto_id) === contactId);
    setContactHeader(contact);
    document.getElementById('chatEmpty').hidden = true;
    document.getElementById('chatContent').hidden = false;
    renderMessages(messages);
    document.getElementById('messageInput').focus();
    await carregarConversas();
  } catch (e) {
    // Não apagar a conversa atual em caso de falha temporária.
  } finally {
    loadingConversation = false;
  }
}

function renderMessages(messages) {
  const box = document.getElementById('chatMessages');
  const wasNearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
  box.innerHTML = messages.length
    ? messages.map(m => {
        const mine = Number(m.remetente_id) === Number(user?.id);
        const body = m.conteudo || (m.localizacao ? `📍 ${m.localizacao}` : '');
        return `<article class="message${mine ? ' mine' : ''}">
          ${esc(body)}
          <span class="message-time">${formatDate(m.createdAt)}</span>
        </article>`;
      }).join('')
    : '<div class="list-empty">Inicia a conversa.</div>';
  if (wasNearBottom || messages.length <= 1) box.scrollTop = box.scrollHeight;
}

async function atualizarConversa() {
  if (!currentContactId || document.hidden) return;
  try {
    const res = await fetch(`${API_URL}/mensagens/conversa/${currentContactId}`, { headers: authHeaders() });
    if (!res.ok) return;
    renderMessages(await res.json());
  } catch {}
}

async function enviarMensagem(event) {
  event.preventDefault();
  const input = document.getElementById('messageInput');
  const button = document.getElementById('sendButton');
  const conteudo = input.value.trim();
  if (!conteudo || !currentContactId) return;

  button.disabled = true;
  try {
    const res = await fetch(`${API_URL}/mensagens/enviar`, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify({ destinatario_id: currentContactId, conteudo })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.erro || 'Não foi possível enviar a mensagem.');
      return;
    }
    input.value = '';
    await atualizarConversa();
    await carregarConversas();
  } catch {
    alert('Erro de ligação. Tenta novamente.');
  } finally {
    button.disabled = false;
    input.focus();
  }
}

async function iniciar() {
  document.getElementById('composer').addEventListener('submit', enviarMensagem);
  await carregarConversas();

  const params = new URLSearchParams(window.location.search);
  const para = Number(params.get('para') || params.get('novo') || 0);
  if (para > 0) {
    const existing = conversations.find(c => Number(c.contacto_id) === para);
    if (existing) {
      await abrirConversa(para);
    } else {
      // Contacto novo: mostrar o chat mesmo sem histórico.
      currentContactId = para;
      const res = await fetch(`${API_URL}/auth/public/${para}`);
      if (res.ok) {
        const data = await res.json();
        conversations.unshift({
          contacto_id: para,
          contacto_nome: data.nome || 'Utilizador',
          contacto_avatar: data.avatar || null,
          contacto_tipo: data.tipo_conta || 'normal',
          nao_lidas: 0,
          ultima_mensagem: 'Nova conversa'
        });
        renderConversas();
        await abrirConversa(para);
      }
    }
  }
}

iniciar();
pollTimer = setInterval(atualizarConversa, 5000);
