
// ========================
// CONFIG DE CAMPOS POR CATEGORIA (ADMIN)
// ========================
const ADMIN_CATEGORIA_CONFIG = window.EZNY_CATEGORIAS;


let adminCategoriaAtual = null;

// ========================
// CONFIG
// ========================
const API_BASE = localStorage.getItem('apiEndpoint') || '/api';
const UPLOAD_BASE = API_BASE.replace('/api', '');
let currentPage = 'dashboard';
let allAds = [];
let allUsers = [];
let allDenuncias = [];
let allRelatos = [];
let allComunicados = [];
let allPopups = [];
let allPagamentos = [];
let allNotificacoes = [];
let comunicadosFilter = 'ativos';
let popupsFilter = 'ativos';
let deleteTarget = null;
let deleteType = null;
let banTarget = null;
let banType = 'permanente';
let uploadedFiles = [];
let visitsChartInstance = null;
let categoryChartInstance = null;
let growthChartInstance = null;
let statsData = null;
let activeUserIds = new Set();

// ========================
// AUTH
// ========================
function getToken() { return localStorage.getItem('token') || ''; }
function getAuthHeaders() {
  return { 'Authorization': 'Bearer ' + getToken(), 'Content-Type': 'application/json' };
}

// ========================
// NAVIGATION
// ========================
function navigateTo(page, el) {
  currentPage = page;
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  const titles = {
    dashboard: 'EZNY / Dashboard', 
    anuncios: 'EZNY / Anúncios', 
    usuarios: 'EZNY / Utilizadores',
    denuncias: 'EZNY / Denúncias', 
    relatos: 'EZNY / Relatos de problemas',
    comunicados: 'EZNY / Comunicados',
    notificacoes: 'EZNY / Notificações',
    pagamentos: 'EZNY / Pagamentos',
    estatisticas: 'EZNY / Estatísticas', 
    configuracoes: 'EZNY / Configurações',
    popups: 'EZNY / Popups',
    'enviar-comunicados': 'EZNY / Enviar Comunicados'
  };
  document.getElementById('breadcrumbText').textContent = titles[page] || 'EZNY';
  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
  if (page === 'anuncios') renderAdsTable();
  if (page === 'usuarios') {
  updateNavBadge('nav-badge-usuarios', 0);
  lastDataCounts.usuarios = statsData?.usuarios || allUsers.length;
  }
  if (page === 'denuncias') renderDenunciasTable();
  if (page === 'relatos') renderRelatosTable();
  if (page === 'comunicados') renderComunicadosTable();
  if (page === 'popups') renderPopupsTable();
  if (page === 'pagamentos') renderPagamentosTable();
  if (page === 'notificacoes') renderNotificacoesTable();
  if (page === 'estatisticas') renderEstatisticas();
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

// ========================
// API HELPERS (com logs de erro)
// ========================
async function apiGet(endpoint) {
  try {
    const res = await fetch(API_BASE + endpoint, { headers: { 'Authorization': 'Bearer ' + getToken() } });
    if (!res.ok) {
      console.error('GET ' + endpoint + ' ERRO HTTP:', res.status);
      const txt = await res.text();
      console.error('Resposta:', txt.substring(0, 200));
      throw new Error('HTTP ' + res.status);
    }
    return await res.json();
  } catch (e) {
    console.error('GET ' + endpoint + ' FALHOU:', e);
    return null;
  }
}

async function apiPost(endpoint, body, isFormData = false) {
  try {
    const opts = { method: 'POST', headers: { 'Authorization': 'Bearer ' + getToken() }, body: body };
    if (!isFormData) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const res = await fetch(API_BASE + endpoint, opts);
    if (!res.ok) {
      console.error('POST ' + endpoint + ' ERRO HTTP:', res.status);
      throw new Error('HTTP ' + res.status);
    }
    return await res.json();
  } catch (e) {
    console.error('POST ' + endpoint + ' FALHOU:', e);
    return null;
  }
}

async function apiDelete(endpoint) {
  try {
    const res = await fetch(API_BASE + endpoint, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + getToken() } });
    if (!res.ok) {
      console.error('DELETE ' + endpoint + ' ERRO HTTP:', res.status);
      throw new Error('HTTP ' + res.status);
    }

    async function apiPatch(endpoint, body) {
      try {
        const res = await fetch(API_BASE + endpoint, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          console.error('PATCH ' + endpoint + ' ERRO HTTP:', res.status);
          throw new Error('HTTP ' + res.status);
        }
        return await res.json();
      } catch (e) {
        console.error('PATCH ' + endpoint + ' FALHOU:', e);
        return null;
      }
    }
    return await res.json();
  } catch (e) {
    console.error('DELETE ' + endpoint + ' FALHOU:', e);
    return null;
  }
}

// ========================
// LOAD ALL DATA (REAL)
// ========================
async function loadAllData() {
  showLoading();
  console.log('A carregar dados...');

  // 1. Estatísticas
  statsData = await apiGet('/stats');
  console.log('Stats:', statsData);
  if (statsData) {
    document.getElementById('statVisitas').textContent = (statsData.visitas || 0).toLocaleString('pt-PT');
    document.getElementById('statUsers').textContent = (statsData.usuarios || 0).toLocaleString('pt-PT');
    document.getElementById('statAds').textContent = (statsData.anuncios || 0).toLocaleString('pt-PT');
    document.getElementById('statDenuncias').textContent = (statsData.denuncias || 0).toLocaleString('pt-PT');
    document.getElementById('statPagamentos').textContent = (statsData.pagamentosPendentes || 0).toLocaleString('pt-PT');
    document.getElementById('statComunicados').textContent = (statsData.comunicados || 0).toLocaleString('pt-PT');
    document.getElementById('statOnline').textContent = Number(statsData.online?.total || 0).toLocaleString('pt-PT');
    document.getElementById('statOnlineDetail').innerHTML = '<i class="ph ph-broadcast" style="font-size:14px"></i> ' + Number(statsData.online?.autenticados || 0) + ' autenticados · ' + Number(statsData.online?.visitantes || 0) + ' visitantes';
    document.getElementById('adsCountBadge').textContent = (statsData.anuncios || 0) + ' total';
    document.getElementById('usersCountBadge').textContent = (statsData.usuarios || 0) + ' registados';
    document.getElementById('denunciasCountBadge').textContent = (statsData.denuncias || 0) + ' pendentes';
    document.getElementById('pagamentosCountBadge').textContent = (statsData.pagamentosPendentes || 0) + ' pendentes';
    document.getElementById('notifBadge').textContent = (statsData.denuncias || 0) + (statsData.pagamentosPendentes || 0);
    updateTrends(statsData);
    initCategoryChart(statsData.anunciosPorCategoria || []);
  }

  // 2. Anúncios
  const ads = await apiGet('/anuncios/admin/todos');
  console.log('Anúncios:', ads);
  if (ads && Array.isArray(ads)) allAds = ads.map(a => ({...a, status: a.status || 'active'}));
  else allAds = [];

  // 3. Utilizadores — ESTA É A ROTA CRÍTICA
  const users = await apiGet('/auth/usuarios');
  console.log('Utilizadores:', users);
  if (users && Array.isArray(users)) {
    allUsers = users;
    preencherDestinatariosNotificacao();
    console.log('Users carregados:', allUsers.length);
  } else {
    allUsers = [];
    console.error('FALHA ao carregar utilizadores! Verifica se a rota /api/auth/usuarios existe.');
  }

  // 4. Denúncias
  const den = await apiGet('/denuncias/admin/todas');
  console.log('Denúncias:', den);
  if (den && Array.isArray(den)) allDenuncias = den;
  else allDenuncias = [];

  const relatos = await apiGet('/suporte/admin/relatos');
  if (relatos && Array.isArray(relatos)) allRelatos = relatos;
  else allRelatos = [];

  const settings = await apiGet('/admin/settings');
  if (settings && typeof settings === 'object') aplicarConfiguracoes(settings);

  // 5. Comunicados
  const com = await apiGet('/comunicados/todos');
  console.log('Comunicados:', com);
  if (com && Array.isArray(com)) allComunicados = com;
  else allComunicados = [];

  // 6. Popups
  const pops = await apiGet('/comunicados/popups/todos');
  console.log('Popups:', pops);
  if (pops && Array.isArray(pops)) allPopups = pops;
  else allPopups = [];

  // 7. Notificações
  const notifs = await apiGet('/notificacoes/todas');
  console.log('Notificações:', notifs);
  if (notifs && Array.isArray(notifs)) allNotificacoes = notifs;
  else allNotificacoes = [];

  // 8. Pagamentos
  const pags = await apiGet('/pagamentos/admin/lista');
  console.log('Pagamentos:', pags);
  if (pags && Array.isArray(pags)) allPagamentos = pags;
  else allPagamentos = [];

  renderRecentAds();
  await carregarAtivosAdmin();
  renderAdsTable();
  renderUsersTable();
  renderDenunciasTable();
  renderComunicadosTable();
  initVisitsChart(7);
  hideLoading();
}

function updateTrends(stats) {
  const hoje = new Date().toISOString().split('T')[0];
  const ontem = getYesterday();
  const vHoje = stats.visitas7d?.find(v => v.dia === hoje)?.total || 0;
  const vOntem = stats.visitas7d?.find(v => v.dia === ontem)?.total || 0;
  updateTrend('statVisitasChange', vHoje, vOntem);
  const aHoje = stats.anuncios7d?.find(v => v.dia === hoje)?.total || 0;
  const aOntem = stats.anuncios7d?.find(v => v.dia === ontem)?.total || 0;
  updateTrend('statAdsChange', aHoje, aOntem);
  updateTrend('statUsersChange', stats.novosUsuariosHoje || 0, 0);
  updateTrend('statComunicadosChange', 0, 0);
  updateTrend('statDenunciasChange', 0, 0, true);
}

function updateTrend(id, atual, anterior, neutral = false) {
  const el = document.getElementById(id);
  if (!el) return;
  if (neutral) { el.className = 'stat-change'; el.innerHTML = '<i class="ph ph-minus" style="font-size:14px"></i>—'; return; }
  const diff = anterior > 0 ? ((atual - anterior) / anterior * 100).toFixed(1) : (atual > 0 ? '100.0' : '0');
  const positive = atual >= anterior;
  el.className = 'stat-change ' + (positive ? 'positive' : 'negative');
  const sign = positive ? '+' : '';
  el.innerHTML = '<i class="ph ph-' + (positive ? 'trending_up' : 'trending_down') + '" style="font-size:14px"></i>' + sign + diff + '%';
}

function getYesterday() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function generateDateLabels(dias) {
  const arr = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    arr.push(d.toISOString().split('T')[0]);
  }
  return arr;
}

// ========================
// RENDER DASHBOARD RECENT ADS
// ========================
function renderRecentAds() {
  const container = document.getElementById('dashboardRecentAds');
  if (!allAds.length) { container.innerHTML = '<div class="empty-state"><i class="ph ph-tray"></i><h4>Sem anúncios</h4><p>Ainda não há anúncios registados.</p></div>'; return; }
  const recent = allAds.slice(0, 5);
  let html = '<table class="data-table"><thead><tr><th>Anúncio</th><th>Categoria</th><th>Preço</th><th>Data</th></tr></thead><tbody>';
  recent.forEach(a => {
    const img = a.imagem ? eznyImage(a.imagem) : 'imagens/placeholder.svg';
    html += '<tr><td><div class="cell-flex"><img src="' + img + '" class="cell-img" onerror="this.src=\'imagens/placeholder.svg\'"><div class="cell-info"><div class="title">' + (a.titulo || '-') + '</div><div class="subtitle">ID: #' + a.id + '</div></div></div></td>';
    html += '<td><span class="status-badge active">' + (a.categoria || '-') + '</span></td>';
    html += '<td class="price-tag">' + formatPrice(a.preco) + '</td>';
    html += '<td>' + formatDate(a.createdAt) + '</td></tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

// ========================
// RENDER ADS TABLE
// ========================
let adsPage = 1;
const adsPerPage = 10;

function renderAdsTable() {
  const tbody = document.getElementById('adsTableBody');

  const search =
    document.getElementById('adsSearch')?.value.toLowerCase() || '';

  const filter =
    document.getElementById('adsFilter')?.value || '';

  let filtered = allAds.filter(a => {

    const matchSearch =
      !search ||
      (a.titulo || '').toLowerCase().includes(search) ||
      (a.categoria || '').toLowerCase().includes(search) ||
      (a.codigo || '').toLowerCase().includes(search) ||
      (a.usuario_nome || '').toLowerCase().includes(search);

    const matchFilter =
      !filter ||
      a.status === filter;

    return matchSearch && matchFilter;
  });

  const totalPages =
    Math.ceil(filtered.length / adsPerPage) || 1;

  if (adsPage > totalPages)
    adsPage = totalPages;

  const start =
    (adsPage - 1) * adsPerPage;

  const pageData =
    filtered.slice(start, start + adsPerPage);

  if (!pageData.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <i class="ph ph-tray"></i>
            <h4>Sem anúncios</h4>
          </div>
        </td>
      </tr>
    `;

  } else {

    tbody.innerHTML = pageData.map(a => {

      const img =
        a.imagem
          ? eznyImage(a.imagem)
          : 'imagens/placeholder.svg';

      // Normalizar status (pendente, active, rejected, ou null)
      let statusClass = 'inactive';
      let statusText = 'Rejeitado';

      if (a.status === 'active') {
        statusClass = 'active';
        statusText = 'Ativo';
      } else if (a.status === 'pending' || a.status === 'pendente') {
        statusClass = 'pending';
        statusText = 'Pendente';
      } else if (!a.status) {
        statusClass = 'pending';
        statusText = 'Pendente';
      }

      let acoes = '';

      // Sempre mostrar botões de aprovar/rejeitar para pendentes (ou sem status)
      if (a.status === 'pending' || a.status === 'pendente' || !a.status) {

        acoes += `
          <button
            class="btn btn-icon btn-success"
            onclick="aprovarAnuncio(${a.id})"
            title="Aprovar">
            <i class="ph ph-check" style="font-size:16px"></i>
          </button>
        `;

        acoes += `
          <button
            class="btn btn-icon btn-warning"
            onclick="rejeitarAnuncio(${a.id})"
            title="Rejeitar">
            <i class="ph ph-prohibit" style="font-size:16px"></i>
          </button>
        `;
      }

      acoes += `
        <button
          class="btn btn-icon btn-danger"
          onclick="askDeleteAdmin(${a.id})"
          title="Eliminar">
          <i class="ph ph-trash" style="font-size:16px"></i>
        </button>
      `;

      return `
        <tr>

          <td>
            <div class="cell-flex">

              <img
                src="${img}"
                class="cell-img"
                onerror="this.src='imagens/placeholder.svg'">

              <div class="cell-info">

                <div class="title">
                  ${a.titulo || '-'}
                </div>

                <div class="subtitle">
                  ID: #${a.id}
                  <br>
                  Código:
                  ${a.codigo || '—'}
                </div>

              </div>

            </div>
          </td>

          <td>
            ${a.categoria || '-'}
          </td>

          <td class="price-tag">
            ${formatPrice(a.preco)}
          </td>

          <td>
            <div class="cell-info">
              <div class="title">${a.usuario_nome || 'Desconhecido'}</div>
              <div class="subtitle">ID: #${a.usuario_id || '—'}</div>
            </div>
          </td>

          <td>
            <span class="status-badge ${statusClass}">
              ${statusText}
            </span>
          </td>

          <td>
            ${formatDate(a.createdAt)}
          </td>

          <td style="text-align:right">
            <div class="row-actions">
              ${acoes}
            </div>
          </td>

        </tr>
      `;

    }).join('');
  }

  renderPagination(
    'adsPagination',
    adsPage,
    totalPages,
    p => {
      adsPage = p;
      renderAdsTable();
    }
  );
}

function filterAds() { adsPage = 1; renderAdsTable(); }

// ========================
// RENDER USERS TABLE (CORRIGIDO)
// ========================
let usersPage = 1;
const usersPerPage = 10;
function renderUsersTable() {
  const tbody = document.getElementById("usersTableBody");
  console.log("renderUsersTable chamado. Total users:", allUsers.length);

  const usersSemAdmin = allUsers.filter(function(u) { return u.tipo !== "admin"; });

  if (!usersSemAdmin.length) {
    tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><i class="ph ph-tray"></i><h4>Sem utilizadores</h4><p>Nenhum utilizador registado.</p></div></td></tr>';
    return;
  }

  const search = document.getElementById("usersSearch") ? document.getElementById("usersSearch").value.toLowerCase() : "";
  const filter = document.getElementById("usersFilter") ? document.getElementById("usersFilter").value : "";

  let filtered = usersSemAdmin.filter(function(u) {
    const matchSearch = !search || (u.nome || "").toLowerCase().includes(search) || (u.telefone || "").includes(search);
    let matchFilter = true;
    if (filter === "normal") matchFilter = u.tipo_conta === "normal";
    else if (filter === "premium") matchFilter = u.tipo_conta === "premium";
    else if (filter === "ativos") matchFilter = activeUserIds.has(Number(u.id));
    else if (filter === "suspendidos") matchFilter = u.banido === 1;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / usersPerPage) || 1;
  if (usersPage > totalPages) usersPage = totalPages;
  const start = (usersPage - 1) * usersPerPage;
  const pageData = filtered.slice(start, start + usersPerPage);

  const badge = document.getElementById("usersCountBadge");
  if (badge) {
    const label = filter === "normal" ? " normais" : filter === "premium" ? " premium" : filter === "ativos" ? " ativos" : filter === "suspendidos" ? " suspendidos" : " registados";
    badge.textContent = filtered.length + label;
  }

  if (!pageData.length) {
    tbody.innerHTML = '<tr><td colspan="5"><div class="empty-state"><i class="ph ph-tray"></i><h4>Nenhum resultado</h4><p>Tente ajustar os filtros.</p></div></td></tr>';
  } else {
    let html = "";
    pageData.forEach(function(u) {
      const initials = getInitials(u.nome || "User");
      const tipoContaClass = u.tipo_conta === "premium" ? "warning" : "active";
      const tipoContaText = u.tipo_conta === "premium" ? "Premium" : "Normal";
      const estadoClass = u.banido ? "banned" : "active";
      const estadoText = u.banido ? "Suspendido" : "Ativo";
      const verificadoBadge = u.verificado ? '<span style="display:inline-flex;align-items:center;gap:2px;margin-left:4px;color:var(--info);font-size:11px"><i class="ph ph-check-circle" style="font-size:12px"></i>Verif.</span>' : "";

      html += '<tr><td><div class="cell-flex"><div class="avatar-fallback">' + initials + '</div><div class="cell-info"><div class="title">' + (u.nome || "Sem nome") + verificadoBadge + '</div><div class="subtitle">ID: #' + u.id + " | Tel: " + (u.telefone || "-") + '</div></div></div></td>';
      html += '<td>' + (u.email || '-') + '</td>';
      html += '<td><span class="status-badge ' + tipoContaClass + '">' + tipoContaText + "</span></td>";
      html += '<td><span class="status-badge ' + estadoClass + '">' + estadoText + "</span></td>";
      html += "<td>" + formatDate(u.createdAt) + "</td>";
      html += '<td style="text-align:right"><div class="row-actions">';
      if (u.banido) {
        html += '<button class="btn btn-icon btn-success" onclick="desbanirUser(' + u.id + ')" title="Desbanir"><i class="ph ph-check-circle" style="font-size:16px"></i></button>';
      } else {
        const nomeSafe = (u.nome || "User").replace(/"/g, "&quot;");
        html += '<button class="btn btn-icon btn-danger" onclick="openBanModal(' + u.id + ', ' + "'" + nomeSafe + "'" + ')" title="Banir"><i class="ph ph-prohibit" style="font-size:16px"></i></button>';
      }
      html += '<button class="btn btn-icon btn-danger" onclick="askDelete(' + u.id + ', ' + "'" + "user" + "'" + ')" title="Apagar"><i class="ph ph-trash" style="font-size:16px"></i></button>';
      html += "</div></td></tr>";
    });
    tbody.innerHTML = html;
  }
  renderPagination("usersPagination", usersPage, totalPages, function(p) { usersPage = p; renderUsersTable(); });
}

function renderDenunciasTable() {
  const tbody = document.getElementById("denunciasTableBody");
  if (!allDenuncias.length) { 
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="ph ph-tray"></i><h4>Sem denúncias</h4></div></td></tr>';
    return; 
  }
  tbody.innerHTML = allDenuncias.map(d => {
    const alvo = d.reportado_nome || (d.anuncio_titulo ? `Anúncio: ${d.anuncio_titulo}` : '—');
    const status = d.status || 'pendente';
    return `<tr><td>#${d.id}</td><td>${escapeHtml(d.denunciante_nome || 'Utilizador removido')}</td><td>${escapeHtml(alvo)}</td><td><strong>${escapeHtml(d.tipo_denuncia || 'outro')}</strong><br>${escapeHtml(d.descricao || '—')}</td><td><select class="form-select" aria-label="Estado da denúncia ${Number(d.id)}" data-csp-handler="934ca3e7b82b012f" data-id="${Number(d.id)}"><option value="pendente" ${status === 'pendente' ? 'selected' : ''}>Pendente</option><option value="em_analise" ${status === 'em_analise' ? 'selected' : ''}>Em análise</option><option value="resolvida" ${status === 'resolvida' ? 'selected' : ''}>Resolvida</option><option value="rejeitada" ${status === 'rejeitada' ? 'selected' : ''}>Rejeitada</option></select></td><td>${formatDate(d.createdAt)}</td></tr>`;
  }).join('');
}

async function atualizarEstadoDenuncia(select) {
  const id = Number(select.dataset.id);
  const status = select.value;
  if (!Number.isInteger(id) || id <= 0) return;
  select.disabled = true;
  const result = await apiPost(`/denuncias/admin/${id}/status`, { status });
  select.disabled = false;
  if (!result || !result.sucesso) {
    showToast('error', 'Erro', result?.erro || 'Não foi possível atualizar a denúncia.');
    await loadAllData();
    return;
  }
  const denuncia = allDenuncias.find(item => Number(item.id) === id);
  if (denuncia) denuncia.status = status;
  showToast('success', 'Atualizado', 'Estado da denúncia atualizado.');
}

function renderRelatosTable() {
  const tbody = document.getElementById('relatosTableBody');
  if (!tbody) return;
  if (!allRelatos.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="ph ph-tray"></i><h4>Sem relatos recebidos</h4></div></td></tr>';
    return;
  }
  tbody.innerHTML = allRelatos.map(r => {
    const attachment = r.anexo_nome ? `<button class="btn btn-secondary" data-csp-handler="3866e99c117e4521" data-id="${Number(r.id)}">Descarregar</button>` : '—';
    return `<tr><td>#${r.id}</td><td>${escapeHtml(r.tipo || 'outro')}</td><td><strong>${escapeHtml(r.titulo)}</strong><br>${escapeHtml(r.descricao)}</td><td>${escapeHtml(r.nome || 'Utilizador removido')}<br>${escapeHtml(r.email || '')}</td><td>${attachment}</td><td>${formatDate(r.created_at)}</td></tr>`;
  }).join('');
}

function preencherDestinatariosNotificacao() {
  const select = document.getElementById('notifUsuarioId');
  if (!select) return;
  const previous = select.value;
  select.innerHTML = '<option value="">Selecione um utilizador...</option>' + allUsers
    .filter(user => user.tipo !== 'admin')
    .map(user => `<option value="${Number(user.id)}">${escapeHtml(user.nome || 'Utilizador')} — ${escapeHtml(user.telefone || '')} (#${Number(user.id)})</option>`)
    .join('');
  if (previous) select.value = previous;
}

async function descarregarAnexoRelato(id) {
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    const response = await fetch(`${API_BASE}/suporte/admin/relatos/${id}/anexo`, {
      headers: { Authorization: 'Bearer ' + getToken() }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relato-${id}`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[SUPORTE] Erro ao descarregar anexo:', error);
    showToast('error', 'Erro', 'Não foi possível descarregar o anexo.');
  }
}

// ========================
// RENDER COMUNICADOS
// ========================
function renderComunicadosTable() {
  const tbody=document.getElementById('comunicadosTableBody');
  const rows=allComunicados.filter(c=>comunicadosFilter==='todos'||(Number(c.ativo)===1)===(comunicadosFilter==='ativos'));
  if(!rows.length){tbody.innerHTML='<tr><td colspan="7"><div class="empty-state"><i class="ph ph-tray"></i><h4>Sem comunicados nesta lista</h4></div></td></tr>';return;}
  tbody.innerHTML=rows.map(c=>{
    const img=c.imagem?`<img src="${escapeHtml(eznyImage(c.imagem))}" class="table-thumb" alt="">`:'<img src="assets/logo.jpg" class="table-thumb" alt="EZNY">';
    const tipo=c.tipo==='popup'?'Visual':'Notificação';
    const publico=c.publico||'todos';
    const ativo=Number(c.ativo)===1;
    return `<tr><td>#${c.id}</td><td><div class="cell-info"><div style="display:flex;align-items:center;gap:9px">${img}<div><div class="title">${escapeHtml(c.titulo||'-')}</div><div class="subtitle">${tipo}</div></div></div></div></td><td>${escapeHtml((c.conteudo||'-').substring(0,80))}${(c.conteudo||'').length>80?'…':''}</td><td><span class="status-badge ${publico==='premium'?'warning':publico==='todos'?'active':'info'}">${escapeHtml(publico)}</span></td><td><span class="status-badge ${ativo?'active':'inactive'}">${ativo?'Activo':'Inactivo'}</span></td><td>${formatDate(c.createdAt)}</td><td style="text-align:right"><div class="row-actions"><button class="btn btn-sm ${ativo?'btn-secondary':'btn-success'}" data-csp-handler="a325b03aace45612" data-id="${Number(c.id)}" data-origem="comunicado" data-ativo="${ativo?0:1}" title="${ativo?'Desativar':'Reativar'}">${ativo?'Desativar':'Reativar'}</button><button class="btn btn-icon btn-danger" data-csp-handler="48e21d07e153d6f1" data-id="${Number(c.id)}" data-origem="comunicado" title="Eliminar permanentemente"><i class="ph ph-trash" style="font-size:16px"></i></button></div></td></tr>`;
  }).join('');
}

function alterarFiltroComunicados(select) {
  comunicadosFilter=select.value;
  renderComunicadosTable();
}

function alterarFiltroPopups(select) {
  popupsFilter=select.value;
  renderPopupsTable();
}

async function alterarEstadoComunicado(id, origem, ativo) {
  const idNumerico=Number(id);
  const ativoNumerico=Number(ativo);
  if(!Number.isInteger(idNumerico)||idNumerico<=0||![0,1].includes(ativoNumerico)) return;
  const endpoint=origem==='popup'?`/comunicados/popups/${idNumerico}/estado`:`/comunicados/${idNumerico}/estado`;
  const result=await apiPatch(endpoint,{ativo:ativoNumerico});
  if(result?.sucesso){
    showToast('success','Sucesso',ativoNumerico?'Item reativado.':'Item desativado.');
    await loadAllData();
  }else showToast('error','Erro','Não foi possível alterar o estado do item.');
}

// ========================
// RENDER PAGAMENTOS
// ========================
function renderPagamentosTable() {
  const tbody = document.getElementById("pagamentosTableBody");
  if (!allPagamentos.length) {
    tbody.innerHTML = "<tr><td colspan=\"7\"><div class=\"empty-state\"><i class=\"ph ph-tray\"></i><h4>Sem pagamentos</h4><p>Nenhum pagamento registado.</p></div></td></tr>";
    return;
  }
  let html = "";
  allPagamentos.forEach(function(p) {
    const statusClass = p.status === "pago" ? "active" : p.status === "pendente" ? "pending" : "inactive";
    const statusText = p.status === "pago" ? "Pago" : p.status === "pendente" ? "Pendente" : "Cancelado";
    html += "<tr><td>#" + p.id + "</td>";
    html += "<td>" + (p.nome || ('User #' + p.usuario_id)) + "</td>";
    html += "<td>" + (p.plano || "-") + "</td>";
    html += "<td>" + escapeHtml(p.referencia_pagamento || "—") + "<br><small>Pedido EZNY: " + escapeHtml(p.referencia || "-") + "</small></td>";
    html += "<td class=\"price-tag\">" + formatPrice(p.valor) + "</td>";
    html += "<td><span class=\"status-badge " + statusClass + "\">" + statusText + "</span></td>";
    html += "<td style=\"text-align:right\"><div class=\"row-actions\">";
    if (p.status === 'pendente') {
      html += "<button class=\"btn btn-sm btn-primary\" onclick=\"confirmarPagamentoAdmin(" + p.id + ")\" title=\"Confirmar pagamento\"><i class=\"ph ph-check\"></i> Confirmar</button>";
      html += "<button class=\"btn btn-icon btn-danger\" onclick=\"cancelarPagamentoAdmin(" + p.id + ")\" title=\"Cancelar\"><i class=\"ph ph-x\"></i></button>";
    }
    html += "</div></td></tr>";
  });
  tbody.innerHTML = html;
}

// ========================
// RENDER NOTIFICAÇÕES
// ========================
function renderNotificacoesTable() {
  const tbody = document.getElementById("notificacoesTableBody");
  if (!allNotificacoes || !allNotificacoes.length) {
    tbody.innerHTML = "<tr><td colspan=\"5\"><div class=\"empty-state\"><i class=\"ph ph-tray\"></i><h4>Sem notificações</h4><p>Nenhuma notificação enviada ainda.</p></div></td></tr>";
    return;
  }
  let html = "";
  allNotificacoes.forEach(function(n) {
    const tipoClass = n.tipo === "success" ? "active" : n.tipo === "error" ? "inactive" : n.tipo === "warning" ? "warning" : "info";
    const tipoText = n.tipo === "success" ? "Sucesso" : n.tipo === "error" ? "Erro" : n.tipo === "warning" ? "Aviso" : "Info";
    html += "<tr><td>#" + n.id + "</td>";
    html += "<td><div class=\"cell-info\"><div class=\"title\">" + (n.titulo || "-") + "</div><div class=\"subtitle\">" + (n.mensagem || "-").substring(0, 50) + "...</div></div></td>";
    html += "<td><span class=\"status-badge " + tipoClass + "\">" + tipoText + "</span></td>";
    html += "<td>" + (n.usuario_id ? "User #" + n.usuario_id : "Todos") + "</td>";
    html += "<td>" + formatDate(n.createdAt) + "</td></tr>";
  });
  tbody.innerHTML = html;
}

// ========================
// RENDER ESTATÍSTICAS
// ========================
async function renderEstatisticas() {
  if (!statsData) return;
  const totalAds = statsData.anuncios || 0;
  const totalVisits = statsData.visitas || 1;
  document.getElementById('statConversao').textContent = totalVisits > 0 ? ((totalAds / totalVisits) * 100).toFixed(2) + '%' : '0%';
  const diasAtivos = statsData.anuncios7d?.length || 1;
  const totalAds7d = statsData.anuncios7d?.reduce((a, b) => a + (b.total || 0), 0) || 0;
  document.getElementById('statAdsDia').textContent = (totalAds7d / diasAtivos).toFixed(1);
  const valorTotal = allAds.reduce((a, b) => a + (parseFloat(b.preco) || 0), 0);
  document.getElementById('statValorTotal').textContent = formatPrice(valorTotal);
  const precoMedio = totalAds > 0 ? valorTotal / totalAds : 0;
  document.getElementById('statPrecoMedio').textContent = formatPrice(precoMedio);
  const cresc = await apiGet('/stats/crescimento');
  initGrowthChart(cresc || { anuncios: [], visitas: [] });
}

async function confirmarPagamentoAdmin(id) {
  if (!confirm('Confirmar este pagamento e ativar o Premium?')) return;
  const r = await apiPost('/pagamentos/' + id + '/confirmar', {});
  if (r && r.sucesso) { toast('Pagamento confirmado e Premium ativado.', 'ok'); allPagamentos = await apiGet('/pagamentos/admin/lista') || []; renderPagamentosTable(); }
}
async function cancelarPagamentoAdmin(id) {
  const observacao = prompt('Indique o motivo da rejeição/cancelamento. Este motivo será enviado ao utilizador:');
  if (observacao === null) return;
  if (!observacao.trim()) {
    showToast('warning', 'Motivo obrigatório', 'Escreva o motivo para que o utilizador seja notificado.');
    return;
  }
  const r = await apiPost('/pagamentos/' + id + '/cancelar', { observacao });
  if (r && r.sucesso) { toast('Pagamento cancelado.', 'ok'); allPagamentos = await apiGet('/pagamentos/admin/lista') || []; renderPagamentosTable(); }
}

// ========================
// PAGINATION
// ========================
function renderPagination(containerId, current, total, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (total <= 1) { container.innerHTML = ''; return; }
  let html = '';
  html += '<button class="page-btn" ' + (current === 1 ? 'disabled' : '') + ' onclick="goPage(' + (current - 1) + ',\'' + containerId + '\')"><i class="ph ph-caret-left" style="font-size:16px"></i></button>';
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      html += '<button class="page-btn ' + (i === current ? 'active' : '') + '" onclick="goPage(' + i + ',\'' + containerId + '\')">' + i + '</button>';
    } else if (i === current - 2 || i === current + 2) {
      html += '<span style="color:var(--text-muted);padding:0 4px">...</span>';
    }
  }
  html += '<button class="page-btn" ' + (current === total ? 'disabled' : '') + ' onclick="goPage(' + (current + 1) + ',\'' + containerId + '\')"><i class="ph ph-caret-right" style="font-size:16px"></i></button>';
  container.innerHTML = html;
  window._pageCallbacks = window._pageCallbacks || {};
  window._pageCallbacks[containerId] = callback;
}

function goPage(page, containerId) {
  if (window._pageCallbacks && window._pageCallbacks[containerId]) {
    window._pageCallbacks[containerId](page);
  }
}

// ========================
// CHARTS
// ========================
async function initVisitsChart(periodoDias = 7) {
  const ctx = document.getElementById('visitsChart')?.getContext('2d');
  if (!ctx) return;
  if (visitsChartInstance) visitsChartInstance.destroy();
  const dados = await apiGet('/stats/visitas?dias=' + periodoDias);
  const labels = generateDateLabels(periodoDias);
  const data = labels.map(dia => { const f = (dados || []).find(d => d.dia === dia); return f ? f.total : 0; });
  visitsChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.map(d => d.slice(5)),
      datasets: [{
        label: 'Visitas',
        data: data,
        borderColor: '#00bec8',
        backgroundColor: 'rgba(0,190,200,0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#00bec8'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
      }
    }
  });
}

function initCategoryChart(dados) {
  const ctx = document.getElementById('categoryChart')?.getContext('2d');
  if (!ctx) return;
  if (categoryChartInstance) categoryChartInstance.destroy();
  const labels = dados.map(d => d.categoria || 'Outro');
  const data = dados.map(d => d.total);
  const colors = ['#00bec8', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 16, font: { size: 11 } } }
      },
      cutout: '70%'
    }
  });
}

function initGrowthChart(cresc) {
  const ctx = document.getElementById('growthChart')?.getContext('2d');
  if (!ctx) return;
  if (growthChartInstance) growthChartInstance.destroy();
  const meses = [];
  const anunciosData = [];
  const visitasData = [];
  const allMeses = new Set([...cresc.anuncios.map(a => a.mes), ...cresc.visitas.map(v => v.mes)]);
  const sorted = Array.from(allMeses).sort();
  sorted.forEach(m => {
    meses.push(m);
    anunciosData.push((cresc.anuncios.find(a => a.mes === m)?.total) || 0);
    visitasData.push((cresc.visitas.find(v => v.mes === m)?.total) || 0);
  });
  growthChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: meses,
      datasets: [
        { label: 'Anúncios', data: anunciosData, backgroundColor: 'rgba(0,190,200,0.7)', borderRadius: 4 },
        { label: 'Visitas', data: visitasData, backgroundColor: 'rgba(59,130,246,0.5)', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#9ca3af' } } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
      }
    }
  });
}

function setChartPeriod(dias, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  initVisitsChart(dias);
}

// ========================
// AÇÕES ADMIN
// ========================
/* ================================
   APROVAR ANÚNCIO (CORRIGIDO)
================================ */
async function aprovarAnuncio(id) {
  showLoading();
  const res = await apiPost('/admin/aprovar-anuncio/' + id, {});
  hideLoading();

  if (res && res.sucesso) {
    showToast('success', 'Sucesso', 'Anúncio aprovado');
    await loadAllData();
  } else {
    showToast('error', 'Erro', 'Não foi possível aprovar. Verifica consola.');
  }
}
async function rejeitarAnuncio(id) {
  const motivo = prompt('Motivo da rejeição (opcional):');
  if (motivo === null) return;

  showLoading();
  const res = await apiPost('/admin/rejeitar-anuncio/' + id, { motivo });
  hideLoading();

  if (res && res.sucesso) {
    showToast('success', 'Sucesso', 'Anúncio rejeitado. Notificação enviada ao utilizador.');
    await loadAllData();
  } else {
    showToast('error', 'Erro', 'Não foi possível rejeitar');
  }
}


async function desbanirUser(id) {
  showLoading();
  const res = await apiPost('/admin/desbloquear/' + id, {});
  hideLoading();
  if (res && res.sucesso) { showToast('success', 'Sucesso', 'Utilizador desbanido'); await loadAllData(); }
  else showToast('error', 'Erro', 'Não foi possível desbanir. Verifica consola.');
}

// ========================
// DELETE CONFIRM
// ========================
function askDelete(id, type) {
  deleteTarget = id;
  deleteType = type;
  const title=document.querySelector('#confirmOverlay h3');
  const message=document.querySelector('#confirmOverlay .confirm-dialog p');
  if(title) title.textContent='Eliminar permanentemente?';
  if(message) message.textContent='Este item será removido da lista e não poderá ser recuperado.';
  document.getElementById('confirmOverlay').classList.add('active');
}
function closeConfirm() {
  document.getElementById('confirmOverlay').classList.remove('active');
  deleteTarget = null; deleteType = null;
  const title=document.querySelector('#confirmOverlay h3');
  const message=document.querySelector('#confirmOverlay .confirm-dialog p');
  if(title) title.textContent='Confirmar Exclusão';
  if(message) message.textContent='Tem certeza que deseja eliminar este item? Esta ação não pode ser desfeita.';
}
function askDeleteAdmin(id) {
  deleteTarget = id;
  deleteType = 'ad_admin';
  document.getElementById('confirmOverlay').classList.add('active');
}

async function confirmDelete() {
  if (!deleteTarget || !deleteType) return;
  showLoading();
  let endpoint = '';
if (deleteType === 'ad') endpoint = '/anuncios/admin/' + deleteTarget;
  else if (deleteType === 'ad_admin') endpoint = '/anuncios/admin/' + deleteTarget;
  else if (deleteType === 'user') endpoint = '/auth/usuarios/' + deleteTarget;
  else if (deleteType === 'denuncia') endpoint = '/denuncias/' + deleteTarget;
  else if (deleteType === 'comunicado') endpoint = '/comunicados/' + deleteTarget;
  else if (deleteType === 'popup-comunicado') endpoint = '/comunicados/' + deleteTarget;
  else if (deleteType === 'popup-legado') endpoint = '/comunicados/popups/' + deleteTarget;
  else if (deleteType === 'pagamento') endpoint = '/pagamentos/' + deleteTarget;

  console.log('A apagar:', deleteType, 'ID:', deleteTarget, 'Endpoint:', endpoint);
  const res = await apiDelete(endpoint);
  hideLoading();
  closeConfirm();
  if (res && (res.sucesso || res.message)) { showToast('success', 'Sucesso', 'Item eliminado permanentemente'); await loadAllData(); }
  else showToast('error', 'Erro', 'Não foi possível eliminar. Verifica consola (F12).');
}

// ========================
// BAN MODAL
// ========================
function openBanModal(id, name) {
  banTarget = id;
  document.getElementById('banTargetName').textContent = name || 'utilizador';
  document.getElementById('banModalOverlay').classList.add('active');
}
function closeBanModal() {
  document.getElementById('banModalOverlay').classList.remove('active');
  banTarget = null;
  banType = 'permanente';
  document.getElementById('banOptPerm').classList.add('selected');
  document.getElementById('banOptTemp').classList.remove('selected');
  document.getElementById('banDateContainer').style.display = 'none';
}
function selectBanType(type, el) {
  banType = type;
  document.querySelectorAll('.ban-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('banDateContainer').style.display = type === 'temporario' ? 'block' : 'none';
}
async function confirmBan() {
  if (!banTarget) return;
  showLoading();
  const ate = banType === 'temporario' ? document.getElementById('banDateInput').value : null;
  console.log('A banir user ID:', banTarget, 'Tipo:', banType, 'Até:', ate);
  const res = await apiPost('/admin/bloquear/' + banTarget, { ate });
  hideLoading();
  closeBanModal();
  if (res && res.sucesso) { showToast('success', 'Sucesso', 'Utilizador banido'); await loadAllData(); }
  else showToast('error', 'Erro', 'Não foi possível banir. Verifica consola (F12).');
}



// ========================
// CATEGORIA DINÂMICA NO MODAL ADMIN
// ========================
function escapeHtml(value){const d=document.createElement('div');d.textContent=String(value ?? '');return d.innerHTML;}
function adminFieldId(campo) { return 'm' + campo.name.replace(/(^|_)([a-z])/g, (_, p, c) => c.toUpperCase()); }
function handleAdminCategoriaChange() {
  const categoria = document.getElementById('mCategoria').value;
  const wrap = document.getElementById('adminCamposDinamicos');
  if (!categoria || !ADMIN_CATEGORIA_CONFIG[categoria]) {
    wrap.innerHTML = '';
    document.getElementById('adminCategoriaBadge').style.display = 'none';
    adminCategoriaAtual = null;
    return;
  }
  adminCategoriaAtual = categoria;
  const config = ADMIN_CATEGORIA_CONFIG[categoria];
  document.getElementById('adminCategoriaBadge').style.display = 'inline-flex';
  document.getElementById('adminCategoriaLabel').textContent = config.label;
  const html = config.campos.map((campo, index) => {
    const id = adminFieldId(campo), required = campo.required ? ' *' : '';
    let inputTag = '';
    if (campo.type === 'textarea') inputTag = `<textarea class="form-input" id="${id}" placeholder="${campo.placeholder || ''}" ${campo.required ? 'required' : ''} style="min-height:100px;resize:vertical"></textarea>`;
    else if (campo.type === 'select') inputTag = `<select class="form-select" id="${id}" ${campo.required ? 'required' : ''}><option value="">${campo.placeholder || 'Selecionar'}</option>${(campo.options||[]).map(o=>`<option value="${o}">${o}</option>`).join('')}</select>`;
    else if (campo.type === 'checkbox') inputTag = `<label style="display:flex;align-items:center;gap:10px;min-height:42px"><input type="checkbox" id="${id}" style="width:18px;height:18px"><span>${campo.label}</span></label>`;
    else inputTag = `<input type="${campo.type}" class="form-input" id="${id}" placeholder="${campo.placeholder || ''}" ${campo.required ? 'required' : ''}${campo.min != null ? ` min="${campo.min}"` : ''}${campo.max != null ? ` max="${campo.max}"` : ''}${campo.step != null ? ` step="${campo.step}"` : ''}>`;
    return `<div class="form-group ${campo.type==='textarea' ? 'full-width':''}" style="animation:fadeIn .25s ease ${index*.03}s both"><label class="form-label">${campo.label}${required}</label>${inputTag}</div>`;
  }).join('');
  wrap.innerHTML = `<div class="form-grid" style="margin-top:16px">${html}</div>`;
}

function validarAdminFormulario() {
  if (!adminCategoriaAtual || !ADMIN_CATEGORIA_CONFIG[adminCategoriaAtual]) {
    showToast('error', 'Erro', 'Selecione uma categoria');
    return false;
  }
  
  const campos = ADMIN_CATEGORIA_CONFIG[adminCategoriaAtual].campos;
  for (const campo of campos) {
    if (campo.required) {
      const el = document.getElementById(campo.name);
      if (!el || (campo.type !== 'checkbox' && !String(el.value || '').trim())) {
        showToast('warning', 'Atenção', `O campo "${campo.label}" é obrigatório`);
        if (el) el.focus();
        return false;
      }
    }
  }
  return true;
}

// ========================
// MODAL CRIAR ANÚNCIO
// ========================
function openModal() {
  uploadedFiles = [];
  document.getElementById('mCategoria').value = '';
  document.getElementById('adminCamposDinamicos').innerHTML = '';
  document.getElementById('adminCategoriaBadge').style.display = 'none';
  document.getElementById('previewGrid').innerHTML = '';
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  uploadedFiles = [];
}
function handleFiles(files) {
  if (!files || !files.length) return;
  const restantes=4-uploadedFiles.length;
  if(restantes<=0){showToast('warning','Limite','Máximo de 4 imagens por anúncio.');return;}
  Array.from(files).slice(0,restantes).forEach(file=>{
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){showToast('warning','Imagem inválida','Use JPG, PNG ou WebP até 5 MB.');return;}
    uploadedFiles.push(file);
    const reader=new FileReader(); reader.onload=e=>{const div=document.createElement('div');div.className='preview-item';div.innerHTML='<img src="'+e.target.result+'" alt=""><button type="button" class="preview-remove">×</button>';div.querySelector('button').onclick=()=>{const idx=uploadedFiles.indexOf(file);if(idx>=0)uploadedFiles.splice(idx,1);div.remove();};document.getElementById('previewGrid').appendChild(div);};reader.readAsDataURL(file);
  });
}
async function criarAnuncio() {
  if (!validarAdminFormulario()) return;
  const formData = new FormData();
  const atributos = {};
  const campos = ADMIN_CATEGORIA_CONFIG[adminCategoriaAtual].campos;
  const legacy = new Set(['marca','estado','contacto','ano','quilometragem','combustivel','caixa','tracao','cor','portas','lotacao','versao','modelo','localizacao','negociavel','equipamentos']);
  campos.forEach(c => {
    const el = document.getElementById(adminFieldId(c));
    if (!el) return;
    const value = c.type === 'checkbox' ? !!el.checked : String(el.value || '').trim();
    if (value !== '' && value !== false) atributos[c.name] = value;
    if (c.name === 'title' || c.name === 'price' || c.name === 'descricao' || legacy.has(c.name)) formData.append(c.name, String(value));
  });
  formData.append('categoria', adminCategoriaAtual);
  formData.append('atributos', JSON.stringify(atributos));
  const ficheirosComprimidos=await Promise.all(uploadedFiles.map(f=>window.eznyCompressImage(f)));
  ficheirosComprimidos.forEach(f=>formData.append('imagens',f));
  showLoading();
  try {
    const res = await fetch(API_BASE + '/anuncios', {method:'POST',headers:{'Authorization':'Bearer '+getToken()},body:formData});
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data.erro || `HTTP ${res.status}`);
    showToast('success','Sucesso','Anúncio criado com a estrutura da categoria correta.');
    closeModal(); await loadAllData();
  } catch(e) { showToast('error','Erro',e.message || 'Erro ao criar anúncio'); }
  finally { hideLoading(); }
}

async function carregarAtivosAdmin(){
  const panel=document.getElementById('activeUsersPanel'); if(!panel) return;
  const data=await apiGet('/admin/utilizadores-ativos?minutos=2');
  if(!data){panel.innerHTML='<div class="empty-state"><i class="ph ph-warning"></i><h4>Não foi possível carregar</h4></div>';return;}
  const users=data.utilizadores||[];
  activeUserIds=new Set(users.map(u=>Number(u.usuario_id)));
  const filter=document.getElementById('usersFilter'); if(filter && filter.value==='ativos') renderUsersTable();
  if(!users.length){panel.innerHTML='<div class="empty-state"><i class="ph ph-users-three"></i><h4>Nenhum utilizador autenticado online</h4><p>Os visitantes anónimos não são listados individualmente.</p></div>';return;}
  panel.innerHTML='<div class="active-users-list">'+users.map(u=>{
    const nome=escapeHtml(u.nome||u.telefone||'Utilizador');
    const avatar=u.avatar?`<img src="${escapeHtml(eznyImage(u.avatar))}" alt="">`:`<span>${nome.charAt(0).toUpperCase()}</span>`;
    const tempo=u.ultima_atividade?new Date(u.ultima_atividade).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}):'agora';
    return `<div class="active-user-row"><div class="active-user-avatar">${avatar}</div><div><strong>${nome}</strong><small>${u.tipo_conta==='premium'?'Premium':'Normal'} · última atividade ${tempo}</small></div><span class="online-dot" title="Online"></span></div>`;
  }).join('')+'</div>';
}

// ========================
// UI HELPERS
// ========================
function showLoading() { document.getElementById('loadingOverlay').classList.add('active'); }
function hideLoading() { document.getElementById('loadingOverlay').classList.remove('active'); }
function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
  toast.innerHTML = '<div class="toast-icon"><i class="ph ph-' + icons[type] + '"></i></div><div class="toast-content"><div class="toast-title">' + title + '</div><div class="toast-message">' + message + '</div></div>';
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, 4000);
}

/* =========================
   RESET VISITAS
========================= */
async function resetVisitas() {
  if (!confirm('Tem certeza que deseja apagar TODAS as estatísticas de visitas?\n\nEsta ação não pode ser desfeita.')) return;

  showLoading();
  const res = await apiPost('/stats/visitas/reset', {});
  hideLoading();

  if (res && res.sucesso) {
    showToast('success', 'Sucesso', res.apagadas + ' visitas apagadas');
    await loadAllData();
  } else {
    showToast('error', 'Erro', 'Não foi possível resetar as visitas');
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  window.location.href = 'auth.html';
}

async function refreshAll() {
  showLoading();
  await loadAllData();
  showToast('success', 'Atualizado', 'Dados recarregados com sucesso');
  hideLoading();
  // Reinicia o auto-refresh após refresh manual
  startAutoRefresh();
}

function openComunicadoModal() {
  ['comTitulo','comConteudo','comBotao','comLink','comInicio','comFim'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});
  document.getElementById('comTipo').value='popup'; document.getElementById('comPublico').value='todos'; document.getElementById('comFrequencia').value='uma_vez';
  document.getElementById('comImagem').value='';
  document.getElementById('comImagemPreview').src='assets/logo.jpg'; document.getElementById('campaignPreviewImg').src='assets/logo.jpg';
  atualizarPreviewComunicado();
  document.getElementById('comunicadoModalOverlay').classList.add('active');
}
function closeComunicadoModal() { document.getElementById('comunicadoModalOverlay').classList.remove('active'); }
function atualizarPreviewComunicado(){
  const title=document.getElementById('comTitulo')?.value.trim()||'Título do comunicado';
  const text=document.getElementById('comConteudo')?.value.trim()||'O conteúdo aparecerá aqui.';
  document.getElementById('campaignPreviewTitle').textContent=title;
  document.getElementById('campaignPreviewText').textContent=text;
  const file=document.getElementById('comImagem')?.files?.[0];
  if(file){const url=URL.createObjectURL(file);document.getElementById('comImagemPreview').src=url;document.getElementById('campaignPreviewImg').src=url;}
}
async function criarComunicado() {
  const titulo=document.getElementById('comTitulo').value.trim();
  const conteudo=document.getElementById('comConteudo').value.trim();
  if(!titulo||!conteudo){showToast('warning','Atenção','Título e conteúdo são obrigatórios.');return;}
  const fd=new FormData();
  fd.append('titulo',titulo); fd.append('conteudo',conteudo); fd.append('tipo',document.getElementById('comTipo').value);
  fd.append('publico',document.getElementById('comPublico').value); fd.append('frequencia',document.getElementById('comFrequencia').value);
  const botao=document.getElementById('comBotao').value.trim(), link=document.getElementById('comLink').value.trim();
  if(botao) fd.append('texto_botao',botao); if(link) fd.append('link',link);
  const inicio=document.getElementById('comInicio').value, fim=document.getElementById('comFim').value;
  if(inicio) fd.append('inicio',new Date(inicio).toISOString()); if(fim) fd.append('fim',new Date(fim).toISOString());
  const file=document.getElementById('comImagem').files[0]; if(file) fd.append('imagem',await window.eznyCompressImage(file,1200*1024));
  showLoading();
  try{
    const res=await fetch(API_BASE+'/comunicados',{method:'POST',headers:{'Authorization':'Bearer '+getToken()},body:fd});
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.erro||`HTTP ${res.status}`);
    closeComunicadoModal(); showToast('success','Publicado','O comunicado foi publicado com imagem e segmentação.'); await loadAllData();
  }catch(e){showToast('error','Erro',e.message||'Não foi possível publicar.');}finally{hideLoading();}
}

function aplicarConfiguracoes(settings) {
  document.getElementById('settingEmailNotifications')?.classList.toggle('active', settings.email_notifications === true);
  document.getElementById('settingMaintenance')?.classList.toggle('active', settings.maintenance_mode === true);
  document.getElementById('settingAutoApproval')?.classList.toggle('active', settings.auto_approve_ads === true);
}

async function saveSettings() {
  const endpoint = document.getElementById('apiEndpoint').value.trim();
  if (!endpoint.startsWith('/')) {
    showToast('error', 'Configuração inválida', 'O endpoint deve começar por /.');
    return;
  }
  const settings = {
    email_notifications: document.getElementById('settingEmailNotifications').classList.contains('active'),
    maintenance_mode: document.getElementById('settingMaintenance').classList.contains('active'),
    auto_approve_ads: document.getElementById('settingAutoApproval').classList.contains('active')
  };
  const saved = await apiPost('/admin/settings', settings);
  if (!saved || !saved.sucesso) {
    showToast('error', 'Erro', saved?.erro || 'Não foi possível guardar as definições.');
    return;
  }
  localStorage.setItem('apiEndpoint', endpoint);
  if (endpoint !== API_BASE) {
    window.location.reload();
    return;
  }
  showToast('success', 'Guardado', 'Configurações atualizadas.');
}







/* =========================
   ENVIAR NOTIFICAÇÕES PARA NOVOS UTILIZADORES
========================= */
async function enviarNotificacaoNovos() {
  const titulo = document.getElementById('notifNovosTitulo').value.trim();
  const mensagem = document.getElementById('notifNovosMensagem').value.trim();
  const dias = parseInt(document.getElementById('notifNovosDias').value) || 7;

  if (!titulo || !mensagem) {
    showToast('warning', 'Atenção', 'Preencha título e mensagem');
    return;
  }

  showLoading();
  const res = await apiPost('/auth/notificar-novos', { titulo, mensagem, dias });
  hideLoading();

  if (res && res.sucesso) {
    showToast('success', 'Sucesso', res.message);
    document.getElementById('notifNovosTitulo').value = '';
    document.getElementById('notifNovosMensagem').value = '';
    await loadAllData();
  } else {
    showToast('error', 'Erro', res?.erro || 'Não foi possível enviar');
  }
}

/* =========================
   ENVIAR NOTIFICAÇÕES PARA UTILIZADORES ANTIGOS
========================= */
async function enviarNotificacaoAntigos() {
  const titulo = document.getElementById('notifAntigosTitulo').value.trim();
  const mensagem = document.getElementById('notifAntigosMensagem').value.trim();
  const dias = parseInt(document.getElementById('notifAntigosDias').value) || 30;

  if (!titulo || !mensagem) {
    showToast('warning', 'Atenção', 'Preencha título e mensagem');
    return;
  }

  showLoading();
  const res = await apiPost('/auth/notificar-antigos', { titulo, mensagem, dias });
  hideLoading();

  if (res && res.sucesso) {
    showToast('success', 'Sucesso', res.message);
    document.getElementById('notifAntigosTitulo').value = '';
    document.getElementById('notifAntigosMensagem').value = '';
    await loadAllData();
  } else {
    showToast('error', 'Erro', res?.erro || 'Não foi possível enviar');
  }
}

async function enviarNotificacaoUtilizador() {
  const usuario_id = Number(document.getElementById('notifUsuarioId').value);
  const titulo = document.getElementById('notifUsuarioTitulo').value.trim();
  const mensagem = document.getElementById('notifUsuarioMensagem').value.trim();
  if (!Number.isInteger(usuario_id) || usuario_id <= 0 || !titulo || !mensagem) {
    showToast('warning', 'Atenção', 'Selecione o destinatário e preencha o título e a mensagem.');
    return;
  }
  showLoading();
  const result = await apiPost('/notificacoes/admin/enviar', { usuario_id, titulo, mensagem });
  hideLoading();
  if (!result || !result.sucesso) {
    showToast('error', 'Erro', result?.erro || 'Não foi possível enviar a notificação.');
    return;
  }
  showToast('success', 'Enviada', `Notificação enviada para ${result.destinatario}.`);
  document.getElementById('notifUsuarioTitulo').value = '';
  document.getElementById('notifUsuarioMensagem').value = '';
}

/* =========================
   ENVIAR POPUP PARA TODOS
========================= */
async function enviarPopupTodos() {
  const titulo = document.getElementById('popupTodosTitulo').value.trim();
  const conteudo = document.getElementById('popupTodosConteudo').value.trim();

  if (!titulo || !conteudo) {
    showToast('warning', 'Atenção', 'Preencha título e conteúdo');
    return;
  }

  showLoading();
  const res = await apiPost('/auth/enviar-popup-todos', { titulo, conteudo });
  hideLoading();

  if (res && res.sucesso) {
    showToast('success', 'Sucesso', 'Popup criado para todos os utilizadores!');
    document.getElementById('popupTodosTitulo').value = '';
    document.getElementById('popupTodosConteudo').value = '';
    await loadAllData(); // Recarrega para mostrar na tabela de popups
  } else {
    showToast('error', 'Erro', res?.erro || 'Não foi possível criar popup');
  }
}







function handleGlobalSearch(val) {
  if (!val) return;
  const v = val.toLowerCase();
  if (currentPage === 'anuncios') { document.getElementById('adsSearch').value = val; filterAds(); }
  if (currentPage === 'usuarios') { document.getElementById('usersSearch').value = val; filterUsers(); }
}

// ========================
// FORMAT HELPERS
// ========================
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatPrice(val) {
  if (!val || isNaN(val)) return '—';
  return parseFloat(val).toLocaleString('pt-PT') + ' Kz';
}
function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ========================
// POPUPS / COMUNICADOS TEMPO REAL
// ========================
function renderPopupsTable() {
  const tbody = document.getElementById("popupsTableBody");
  const rows=allPopups.filter(p=>popupsFilter==='todos'||(Number(p.ativo)===1)===(popupsFilter==='ativos'));
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="ph ph-tray"></i><h4>Sem popups</h4></div></td></tr>';
    return;
  }
  let html = "";
  rows.forEach(function(p) {
    const statusClass = p.ativo ? "active" : "inactive";
    const statusText = p.ativo ? "Activo" : "Inactivo";
    const origem = p.origem === 'popup' ? 'popup' : 'comunicado';
    html += '<tr><td>#' + Number(p.id) + "</td><td>" + escapeHtml(p.titulo || "-") + "</td><td>" + escapeHtml((p.conteudo || "-").substring(0, 60)) + "...</td>";
    html += '<td><span class="status-badge ' + statusClass + '">' + statusText + "</span></td>";
    html += "<td>" + formatDate(p.createdAt) + "</td>";
    html += '<td style="text-align:right"><div class="row-actions">';
    html += '<button class="btn btn-sm ' + (p.ativo?'btn-secondary':'btn-success') + '" data-csp-handler="a325b03aace45612" data-id="' + Number(p.id) + '" data-origem="' + origem + '" data-ativo="' + (p.ativo?0:1) + '" title="' + (p.ativo?'Desativar':'Reativar') + '">' + (p.ativo?'Desativar':'Reativar') + '</button>';
    html += '<button class="btn btn-icon btn-danger" data-csp-handler="48e21d07e153d6f1" data-id="' + Number(p.id) + '" data-origem="' + origem + '" title="Eliminar permanentemente"><i class="ph ph-trash" style="font-size:16px"></i></button>';
    html += "</div></td></tr>";
  });
  tbody.innerHTML = html;
}

function openPopupModal() {
  document.getElementById('popupTitulo').value = '';
  document.getElementById('popupConteudo').value = '';
  document.getElementById('popupModalOverlay').classList.add('active');
}

function closePopupModal() {
  document.getElementById('popupModalOverlay').classList.remove('active');
}

async function criarPopup() {
  const titulo = document.getElementById('popupTitulo').value.trim();
  const conteudo = document.getElementById('popupConteudo').value.trim();
  if (!titulo || !conteudo) {
    showToast('warning', 'Atenção', 'Preencha título e conteúdo');
    return;
  }
  showLoading();
  const res = await apiPost('/comunicados/popups', { titulo, conteudo });
  hideLoading();
  closePopupModal();
  if (res && res.sucesso) {
    showToast('success', 'Sucesso', 'Popup criado');
    await loadAllData();
  } else {
    showToast('error', 'Erro', 'Não foi possível criar popup');
  }
}

function askDeletePopup(id, origem) {
  deleteTarget = id;
  deleteType = origem === 'popup' ? 'popup-legado' : 'popup-comunicado';
  const title=document.querySelector('#confirmOverlay h3');
  const message=document.querySelector('#confirmOverlay .confirm-dialog p');
  if(title) title.textContent='Eliminar permanentemente?';
  if(message) message.textContent='Este popup será removido da lista e não poderá ser recuperado.';
  document.getElementById('confirmOverlay').classList.add('active');
}

// ========================
// INIT
// ========================
// ========================
// AUTO-REFRESH EM TEMPO REAL (a cada 4 segundos)
// ========================
let autoRefreshInterval = null;
let lastStatsHash = '';
let lastDataCounts = { usuarios: 0, denuncias: 0, anuncios: 0 };

function startAutoRefresh() {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  
  autoRefreshInterval = setInterval(async () => {
    try {
      // 1. Carrega estatísticas
      const newStats = await apiGet('/stats');
      if (newStats) {
        const newHash = JSON.stringify(newStats);
        const hasChanges = newHash !== lastStatsHash;
        
        if (hasChanges) {
          lastStatsHash = newHash;
          statsData = newStats;

          // Atualiza os cards de estatísticas
          updateStatValue('statVisitas', newStats.visitas || 0);
          updateStatValue('statUsers', newStats.usuarios || 0);
          updateStatValue('statAds', newStats.anuncios || 0);
          updateStatValue('statDenuncias', newStats.denuncias || 0);
          updateStatValue('statPagamentos', newStats.pagamentosPendentes || 0);
          updateStatValue('statComunicados', newStats.comunicados || 0);
          updateStatValue('statOnline', newStats.online?.total || 0);
          document.getElementById('statOnlineDetail').innerHTML = '<i class="ph ph-broadcast" style="font-size:14px"></i> ' + (newStats.online?.autenticados || 0) + ' autenticados · ' + (newStats.online?.visitantes || 0) + ' visitantes';

          document.getElementById('adsCountBadge').textContent = (newStats.anuncios || 0) + ' total';
          document.getElementById('usersCountBadge').textContent = (newStats.usuarios || 0) + ' registados';
          document.getElementById('denunciasCountBadge').textContent = (newStats.denuncias || 0) + ' pendentes';
          document.getElementById('pagamentosCountBadge').textContent = (newStats.pagamentosPendentes || 0) + ' pendentes';

          updateTrends(newStats);
          
          // Atualiza badges de novos dados na sidebar
          updateSidebarBadges(newStats);
          
          // Atualiza gráficos se necessário
          if (currentPage === 'dashboard') {
            carregarAtivosAdmin();
            initCategoryChart(newStats.anunciosPorCategoria || []);
          }
          
          showLiveIndicator();
        }
      }

      // 2. Atualiza listas conforme a página atual
      if (currentPage === 'usuarios') {
        const users = await apiGet('/auth/usuarios');
        if (users && Array.isArray(users)) {
          allUsers = users;
          renderUsersTable();
        }
      }
      else if (currentPage === 'anuncios') {
        const ads = await apiGet('/anuncios/admin/todos');
        if (ads && Array.isArray(ads)) {
          allAds = ads.map(a => ({...a, status: a.status || 'active'}));
          renderAdsTable();
          renderRecentAds();
        }
      }
      else if (currentPage === 'denuncias') {
        const den = await apiGet('/denuncias/admin/todas');
        if (den && Array.isArray(den)) {
          allDenuncias = den;
          renderDenunciasTable();
        }
        else if (currentPage === 'relatos') {
          const relatos = await apiGet('/suporte/admin/relatos');
          if (relatos && Array.isArray(relatos)) {
            allRelatos = relatos;
            renderRelatosTable();
          }
        }
      }
      else if (currentPage === 'comunicados') {
        const com = await apiGet('/comunicados/todos');
        if (com && Array.isArray(com)) {
          allComunicados = com;
          renderComunicadosTable();
        }
      }
      else if (currentPage === 'popups') {
        const pops = await apiGet('/comunicados/popups/todos');
        if (pops && Array.isArray(pops)) {
          allPopups = pops;
          renderPopupsTable();
        }
      }
      else if (currentPage === 'notificacoes') {
        const notifs = await apiGet('/notificacoes/todas');
        if (notifs && Array.isArray(notifs)) {
          allNotificacoes = notifs;
          renderNotificacoesTable();
        }
      }
      else if (currentPage === 'pagamentos') {
        const pags = await apiGet('/pagamentos/admin/lista');
        if (pags && Array.isArray(pags)) {
          allPagamentos = pags;
          renderPagamentosTable();
        }
      }
      
    } catch (e) {
      console.log('Auto-refresh falhou:', e);
    }
  }, 4000); // 4 segundos
}

function updateSidebarBadges(stats) {
  // Calcula novos dados desde o último refresh
  const novosUsuarios = Math.max(0, (stats.usuarios || 0) - lastDataCounts.usuarios);
  const novasDenuncias = Math.max(0, (stats.denuncias || 0) - lastDataCounts.denuncias);
  const novosAnuncios = Math.max(0, (stats.anuncios || 0) - lastDataCounts.anuncios);
  
  // Atualiza contadores de referência
  lastDataCounts.denuncias = stats.denuncias || 0;
  lastDataCounts.anuncios = stats.anuncios || 0;  
  // Atualiza badges na sidebar
  updateNavBadge('nav-badge-usuarios', novosUsuarios);
  updateNavBadge('nav-badge-denuncias', novasDenuncias);
  updateNavBadge('nav-badge-anuncios', novosAnuncios);
  
  // Atualiza badge de notificações no topbar
  const totalNotif = (stats.denuncias || 0) + (stats.pagamentosPendentes || 0);
  document.getElementById('notifBadge').textContent = totalNotif > 99 ? '99+' : totalNotif;
}

function updateNavBadge(elementId, count) {
  let badge = document.getElementById(elementId);
  if (!badge) return;
  
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}function updateStatValue(id, newValue) {
  const el = document.getElementById(id);
  if (!el) return;
  const currentText = el.textContent.replace(/[^\d]/g, '');
  const currentVal = parseInt(currentText) || 0;
  if (currentVal !== newValue) {
    el.textContent = newValue.toLocaleString('pt-PT');
    el.style.animation = 'pulse 0.5s ease';
    setTimeout(() => { el.style.animation = ''; }, 500);
  }
}

function showLiveIndicator() {
  const refreshBtn = document.querySelector('.icon-btn[title="Atualizar"]');
  if (refreshBtn) {
    refreshBtn.style.color = '#00bec8';
    setTimeout(() => { refreshBtn.style.color = ''; }, 1000);
  }
}

// Adicionar animação pulse no CSS via JS
const pulseStyle = document.createElement('style');
pulseStyle.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); color: #00bec8; }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(pulseStyle);

document.addEventListener('DOMContentLoaded', () => {
  ['comTitulo','comConteudo','comTipo','comPublico','comBotao','comLink','comFrequencia'].forEach(id=>{const e=document.getElementById(id);if(e)e.addEventListener('input',atualizarPreviewComunicado);});
  const imgInput=document.getElementById('comImagem'); if(imgInput) imgInput.addEventListener('change',atualizarPreviewComunicado);
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = 'auth.html'; return; }
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  if (userData.nome) {
    document.getElementById('userName').textContent = userData.nome;
    document.getElementById('userAvatar').textContent = getInitials(userData.nome);
  }
  loadAllData().then(() => {
    // Inicializa contadores de referência após primeiro carregamento
    if (statsData) {
      lastDataCounts = {
        usuarios: statsData.usuarios || 0,
        denuncias: statsData.denuncias || 0,
        anuncios: statsData.anuncios || 0
      };
    }
    startAutoRefresh();
  });
});


// ===== FUNÇÕES ADICIONAIS - TEMA E MOBILE =====
function carregarTema() {
  const temaSalvo = localStorage.getItem('theme');
  const isDark = temaSalvo !== 'light';
  document.body.classList.toggle('light-theme', !isDark);
}

function alternarTema() {
  const isDark = !document.body.classList.contains('light-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  document.body.classList.toggle('light-theme', !isDark);
}

function setMobileNavActive(el) {
  document.querySelectorAll('.mobile-nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
}

// Sobrescrever toggleSidebar para incluir overlay
const originalToggleSidebar = toggleSidebar;
toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  } else if (originalToggleSidebar) {
    originalToggleSidebar();
  }
};

// Inicializar tema
carregarTema();
