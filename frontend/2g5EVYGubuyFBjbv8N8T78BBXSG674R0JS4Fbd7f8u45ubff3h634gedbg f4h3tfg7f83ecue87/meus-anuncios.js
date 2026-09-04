
const API_URL = window.location.origin + '/api';
let meusAnuncios = [];
let debugLog = [];
let anuncioParaEliminar = null;

function getToken() { return localStorage.getItem('token'); }

function mostrarToast(msg, tipo) {
  const toast = document.getElementById('toast');
  toast.innerHTML = tipo === 'sucesso' 
    ? `<i class="ph-fill ph-check-circle"></i> ${msg}`
    : `<i class="ph-fill ph-warning-circle"></i> ${msg}`;
  toast.style.background = tipo === 'sucesso' ? 'rgba(16,185,129,0.95)' : 'rgba(255,68,68,0.95)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== NOTIFICAÇÕES - BADGE =====
async function carregarNotificacoes() {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/notificacoes/nao-lidas`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      const data = await res.json();
      const count = data.count || data.total || 0;
      atualizarBadgeNotificacoes(count);
    }
  } catch (err) {
    console.log('[NOTIFICAÇÕES] Erro ao carregar:', err);
  }
}

function atualizarBadgeNotificacoes(count) {
  const badge = document.getElementById('navBadge');
  if (!badge) return;

  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ===== MODAL =====
function abrirModalEliminar(id, event) {
  event.stopPropagation();
  anuncioParaEliminar = id;
  document.getElementById('modalEliminar').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function fecharModal(event) {
  if (event && event.target !== document.getElementById('modalEliminar')) return;
  document.getElementById('modalEliminar').classList.remove('active');
  document.body.style.overflow = '';
  anuncioParaEliminar = null;
}

async function confirmarEliminar() {
  if (!anuncioParaEliminar) return;

  const btn = document.getElementById('btnConfirmarEliminar');
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner" style="margin-right:6px; animation: spin 1s linear infinite;"></i> A eliminar...';

  try {
    const res = await fetch(`${API_URL}/anuncios/meus/${anuncioParaEliminar}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });

    const data = await res.json();

    if (res.ok && data.sucesso) {
      mostrarToast('Anúncio eliminado com sucesso!', 'sucesso');
      meusAnuncios = meusAnuncios.filter(a => a.id !== anuncioParaEliminar);
      filtrarMeusAnuncios();
    } else {
      mostrarToast(data.erro || 'Erro ao eliminar anúncio', 'erro');
    }
  } catch (err) {
    mostrarToast('Erro de conexão ao eliminar', 'erro');
    console.error('[ELIMINAR] Erro:', err);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph-fill ph-trash" style="margin-right:6px;"></i> Eliminar';
    fecharModal();
  }
}

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharModal();
});

// ===== TESTAR MÚLTIPLOS ENDPOINTS =====
async function tentarEndpoints() {
  const token = getToken();
  if (!token) {
    mostrarToast('Precisa iniciar sessão para ver os seus anúncios!');
    setTimeout(() => window.location.href = 'auth.html', 2000);
    return null;
  }

  const endpoints = [
    '/anuncios/meus',
    '/meus-anuncios',
    '/anuncios/usuario',
    '/anuncios/user',
    '/usuario/anuncios',
    '/user/anuncios',
    '/anuncios',
    '/premium/anuncios'
  ];

  debugLog = [];

  for (const endpoint of endpoints) {
    try {
      const url = `${API_URL}${endpoint}`;
      console.log(`[TESTE] A testar: ${url}`);

      const res = await fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      debugLog.push({
        endpoint: endpoint,
        status: res.status,
        ok: res.ok
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[SUCESSO] Endpoint ${endpoint} funcionou!`, data);
        return { endpoint, data };
      }
    } catch (err) {
      debugLog.push({
        endpoint: endpoint,
        status: 'ERRO',
        erro: err.message
      });
    }
  }

  return null;
}

async function carregarMeusAnuncios() {
  const resultado = await tentarEndpoints();

  if (resultado) {
    meusAnuncios = Array.isArray(resultado.data) ? resultado.data : 
                   (resultado.data.anuncios || resultado.data.publicacoes || []);
    console.log('[MEUS ANUNCIOS] Carregados:', meusAnuncios.length, meusAnuncios);
    filtrarMeusAnuncios();
  } else {
    mostrarDebug();

    document.getElementById('anunciosContainer').innerHTML = `
      <div class="vazio" style="grid-column: 1/-1;">
        <i class="ph ph-wifi-x"></i>
        <h3>Erro de conexão</h3>
        <p>Não foi possível carregar os seus anúncios. Verifique o painel de debug acima.</p>
      </div>
    `;
  }
}

function mostrarDebug() {
  const panel = document.getElementById('debugPanel');
  const output = document.getElementById('debugOutput');

  let html = `Base URL: ${API_URL}\n\n`;
  html += 'Endpoints testados:\n';
  html += '─'.repeat(50) + '\n';

  debugLog.forEach(log => {
    const status = log.ok ? '✅ OK' : `❌ ${log.status}`;
    html += `${log.endpoint.padEnd(25)} → ${status}\n`;
  });

  html += '\n' + '─'.repeat(50) + '\n';
  html += 'Nenhum endpoint funcionou.\n';
  html += 'Verifique se o backend tem uma rota para listar anúncios do utilizador logado.\n';
  html += 'Token presente: ' + (getToken() ? 'Sim' : 'Não');

  output.textContent = html;
  panel.style.display = 'block';
}

async function testarEndpointsManualmente() {
  document.getElementById('debugPanel').style.display = 'none';
  document.getElementById('anunciosContainer').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  await carregarMeusAnuncios();
}

function filtrarMeusAnuncios() {
  const filtro = document.getElementById('filtroStatus').value;
  let lista = meusAnuncios;

  if (filtro) {
    lista = meusAnuncios.filter(a => {
      const status = (a.status || 'pendente').toLowerCase();
      return status === filtro.toLowerCase();
    });
  }

  renderizarAnuncios(lista);
}

function renderizarAnuncios(lista) {
  const container = document.getElementById('anunciosContainer');
  const vazio = document.getElementById('vazio');

  if (!lista || lista.length === 0) {
    container.style.display = 'none';
    vazio.style.display = 'block';
    return;
  }

  container.style.display = 'grid';
  vazio.style.display = 'none';

  container.innerHTML = lista.map(a => {
    const imgPrincipal = a.imagem ? eznyImage(a.imagem) : 'imagens/placeholder.svg';

    let statusClass = 'status-pending';
    let statusText = 'Pendente';
    const status = (a.status || '').toLowerCase();

    if (status === 'active' || status === 'aprovado' || status === 'ativo') {
      statusClass = 'status-active';
      statusText = 'Aprovado';
    } else if (status === 'rejected' || status === 'rejeitado') {
      statusClass = 'status-rejected';
      statusText = 'Rejeitado';
    }

    return `
    <article class="anuncio-card" onclick="verAnuncio(${a.id})">
      <div class="anuncio-img-wrap">
        <img src="${imgPrincipal}" class="anuncio-img" alt="${escapeHtml(a.titulo)}" loading="lazy" onerror="this.src='imagens/placeholder.svg'">
        <button class="btn-eliminar-card" onclick="abrirModalEliminar(${a.id}, event)" title="Eliminar anúncio">
          <i class="ph-fill ph-trash" style="font-size:18px;"></i>
        </button>
      </div>
      <div class="anuncio-body">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span class="anuncio-categoria">${escapeHtml(a.categoria || 'Geral')}</span>
          <span class="anuncio-status ${statusClass}">${statusText}</span>
        </div>
        <h3 class="anuncio-titulo">${escapeHtml(a.titulo)}</h3>
        <div class="anuncio-local">
          <i class="ph-fill ph-clock" style="font-size:16px"></i>
          ${formatarData(a.createdAt)}
        </div>
        <div class="anuncio-footer">
          <span class="anuncio-preco">${formatarPreco(a.preco)}</span>
          <span style="font-size:0.8rem;color:var(--text-muted);">Código: ${a.codigo || '—'}</span>
        </div>
      </div>
    </article>
  `}).join('');
}

function verAnuncio(id) {
  window.location.href = `anuncio.html?id=${id}`;
}

function formatarPreco(preco) {
  if (preco == null || preco === '') return 'Preço sob consulta';
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0
  }).format(preco);
}

function formatarData(dataStr) {
  if (!dataStr) return 'Data desconhecida';
  const d = new Date(dataStr);
  if (isNaN(d)) return String(dataStr);
  return d.toLocaleDateString('pt-PT', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
}

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  carregarTema();
  carregarMeusAnuncios();
  carregarNotificacoes();
});

function carregarTema() {
  const temaSalvo = localStorage.getItem('theme');
  const isDark = temaSalvo !== 'light';
  document.body.classList.toggle('light-theme', !isDark);
}
