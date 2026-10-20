

// ========================= CONFIG =========================
const CONFIG = {
  STORAGE: { USER:'userData', TOKEN:'token', THEME:'theme' },
  ROUTES: { AUTH:'auth.html', HOME:'index.html' },
  ANIM: { TOAST:3000, REDIRECT:800, LOGIN_REDIRECT:2500 },
  RT: { INTERVAL: 4000 }
};

const API_URL = window.location.origin + '/api';

/* ============================================================
   INTERCEPTOR FETCH GLOBAL + VERIFICAÇÃO DE BANIMENTO
   ============================================================ */

(function() {
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    try {
      const response = await originalFetch.apply(this, args);
      if (response.status === 403) {
        const clone = response.clone();
        try {
          const data = await clone.json();
          if (data.banido === true) {
            localStorage.setItem('banInfo', JSON.stringify({
              tipo_banimento: data.tipo_banimento || 'permanente',
              banido_ate: data.banido_ate || null,
              erro: data.erro
            }));
            window.location.href = 'suspended.html';
            return response;
          }
        } catch (e) {}
      }
      return response;
    } catch (error) {
      throw error;
    }
  };
})();

// ========================= VARIÁVEIS GLOBAIS =========================
let sidebarAberto = false, modalAberto = false, toastTimer = null, slideAtual = 0;
let rtInterval = null;
let anuncioAtualModal = null;
let imagensModal = [];
let imgModalIdx = 0;
let equipamentosModal = [];
let equipamentosExpandido = false;
let modalToastTimer = null;
let lastAnunciosData = [];
let lastDestaquesData = [];

const slides = [
  { label:'Encontre o seu próximo', title:'Veículo ideal', desc:'O anúncio certo pode estar mais perto do que pensa.', btn:'Ver veículos', cat:'carro', img:'assets/hero-vehicle.jpg' },
  { label:'Descubra o seu', title:'Novo lar', desc:'Espaços para viver bem, anunciados em Angola.', btn:'Ver imóveis', cat:'imovel', img:'assets/hero-home.jpg' },
  { label:'Tecnologia de ponta', title:'Electrónicos', desc:'Compare, pergunte e combine diretamente.', btn:'Ver eletrónicos', cat:'telefone', img:'assets/hero-tech.jpg' },
  { label:'Tudo o que precisa', title:'Lazer e outros', desc:'Encontre o que procura sem complicar.', btn:'Explorar', cat:'outro', img:'assets/hero-lifestyle.jpg' }
];


// ========================= INIT =========================
document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('visitorId')) localStorage.setItem('visitorId', crypto.randomUUID());

  // Scroll horizontal com wheel no anun-grid
  const anunGrid = document.getElementById('anunGrid');
  if (anunGrid) {
    anunGrid.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        anunGrid.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  init();
  initCarousel();
  initSearch();
  carregarAnuncios();
  carregarDestaques();
  atualizarBadge();
  verificarBanimento();
  verificarEliminacaoAgendada();
  verificarPopups();
  iniciarAtualizacoesTempoReal();

  // Event listeners
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (modalAberto) fecharModalLogout();
      else if (sidebarAberto) toggleSidebar();
      else if (document.getElementById('modalAnuncioOverlay').classList.contains('aberto')) fecharModalAnuncio();
    }
  });

  document.getElementById('modalLogout').addEventListener('click', e => {
    if (e.target === document.getElementById('modalLogout')) fecharModalLogout();
  });

  // Swipe sidebar
  let tx = 0;
  document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, {passive:true});
  document.addEventListener('touchend', e => {
    const dx = tx - e.changedTouches[0].clientX;
    if (dx > 50 && sidebarAberto) toggleSidebar();
    if (dx < -50 && !sidebarAberto && tx < 30 && isAuth()) toggleSidebar();
  }, {passive:true});

  // Popup
  const btnPopup = document.getElementById('btnFecharPopup');
  if (btnPopup) btnPopup.addEventListener('click', fecharPopup);
  const ovPopup = document.getElementById('popupOverlay');
  const btnPopupTop = document.getElementById('btnFecharPopupTop');
  if (btnPopupTop) btnPopupTop.onclick = fecharPopup;
  if (ovPopup) ovPopup.addEventListener('click', e => { if(e.target === ovPopup) fecharPopup(); });

  // Visit
  fetch('/api/visit', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({visitorId:localStorage.getItem('visitorId')})
  }).catch(()=>{});
});

function init() {
  renderUser();
  carregarTema();
  atualizarSidebarPremium();
  atualizarNavPerfil();
}

// ========================= CAROUSEL =========================
function initCarousel() {
  document.querySelectorAll('.hero-dot').forEach((d,i) => d.addEventListener('click', () => setSlide(i)));
  setInterval(() => setSlide((slideAtual + 1) % slides.length), 5000);
}

function setSlide(idx) {
  slideAtual = idx;
  const s = slides[idx];
  const el = document.getElementById('heroSlide');
  const dots = document.querySelectorAll('.hero-dot');
  el.style.opacity = '0'; el.style.transition = 'opacity 0.3s';
  setTimeout(() => {
    el.querySelector('.hero-label').textContent = s.label;
    el.querySelector('.hero-title').textContent = s.title;
    el.querySelector('.hero-desc').textContent = s.desc;
    el.querySelector('.hero-btn').innerHTML = s.btn + ' <i class="ph ph-caret-right"></i>';
    el.querySelector('.hero-btn').onclick = () => irCategoria(s.cat);
    document.getElementById('heroImg').src = s.img;
    el.style.opacity = '1';
  }, 300);
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}

// ========================= SEARCH =========================
function initSearch() {
  const inp = document.getElementById('searchInput');
  if (inp) {
    inp.addEventListener('keypress', e => {
      if (e.key === 'Enter' && inp.value.trim()) {
        window.location.href = `anuncios.html?q=${encodeURIComponent(inp.value.trim())}`;
      }
    });
  }
}

// ========================= SESSÃO =========================
function getUser() { 
  try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE.USER)); } catch { return null; } 
}
function getToken() { return localStorage.getItem(CONFIG.STORAGE.TOKEN); }
function isAuth() { return !!(getUser() && getToken()); }

function getTipoConta() {
  const u = getUser();
  return u ? (u.tipo_conta || 'normal') : 'normal';
}

function renderUser() {
  const u = getUser(), t = getToken();
  const nameEl = document.getElementById('userName');
  if (u && t) {
    if (nameEl) nameEl.textContent = u.nome || u.telefone || 'Utilizador';
    document.getElementById('userSidebar').textContent = u.nome || u.telefone || 'Utilizador';
  } else {
    if (nameEl) nameEl.textContent = 'Visitante';
    document.getElementById('userSidebar').textContent = 'Visitante';
  }
}

// ========================= SIDEBAR PREMIUM =========================
function atualizarSidebarPremium() {
  const tipo = getTipoConta();
  const premiumBtn = document.getElementById('sidebarPremiumBtn');
  const profBtn = document.getElementById('sidebarProfBtn');
  if (!premiumBtn || !profBtn) return;

  if (tipo === 'premium') {
    premiumBtn.style.display = 'none';
    profBtn.style.display = 'flex';
  } else if (isAuth()) {
    premiumBtn.style.display = 'flex';
    profBtn.style.display = 'none';
  } else {
    premiumBtn.style.display = 'none';
    profBtn.style.display = 'none';
  }
}

// ========================= NAV PERFIL =========================
function atualizarNavPerfil() {
  const link = document.getElementById('navPerfilLink');
  if (!link) return;
  const tipo = getTipoConta();
  if (tipo === 'premium' && isAuth()) {
    link.href = 'perfil-profissional.html';
  } else {
    link.href = 'perfil.html';
  }
}

// ========================= SIDEBAR =========================
function toggleSidebar() {
  sidebarAberto = !sidebarAberto;
  document.getElementById('sidebar').classList.toggle('aberto', sidebarAberto);
  document.getElementById('overlay').classList.toggle('visivel', sidebarAberto);
  document.body.style.overflow = sidebarAberto ? 'hidden' : '';
}

// ========================= LOGOUT =========================
function logout() {
  if (sidebarAberto) toggleSidebar();
  modalAberto = true;
  document.getElementById('modalLogout').classList.add('visivel');
  document.body.style.overflow = 'hidden';
}

function fecharModalLogout() {
  modalAberto = false;
  document.getElementById('modalLogout').classList.remove('visivel');
  document.body.style.overflow = '';
}

function confirmarLogout() {
  localStorage.removeItem(CONFIG.STORAGE.USER);
  localStorage.removeItem(CONFIG.STORAGE.TOKEN);
  fecharModalLogout();
  toast('Sessão terminada com sucesso');
  setTimeout(() => { window.location.href = CONFIG.ROUTES.HOME; }, CONFIG.ANIM.REDIRECT);
}

// ========================= NAVEGAÇÃO =========================
function irCategoria(cat) {
  if (!isAuth()) { avisoLogin(); return; }
  window.location.href = `anuncios.html?categoria=${cat}`;
}

function verAnuncio(id) {
  if (!isAuth()) { avisoLogin(); return; }
  if (window.abrirModalAnuncio) {
    window.abrirModalAnuncio(id);
  } else {
    window.location.href = `anuncio.html?id=${id}`;
  }
}

function avisoLogin() {
  toast('Precisa iniciar sessão para aceder a esta funcionalidade');
  setTimeout(() => { window.location.href = CONFIG.ROUTES.AUTH; }, CONFIG.ANIM.LOGIN_REDIRECT);
}

// ========================= FAVORITOS =========================
function toggleFav(btn, id) {
  if (!isAuth()) { avisoLogin(); return; }
  const icon = btn.querySelector('i');
  let favs = JSON.parse(localStorage.getItem('favoritos') || '[]');
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
    btn.classList.remove('ativo');
    icon.className = 'ph ph-heart';
  } else {
    favs.push(id);
    btn.classList.add('ativo');
    icon.className = 'ph ph-heart';
  }
  localStorage.setItem('favoritos', JSON.stringify(favs));
}

// ========================= TEMA =========================
function carregarTema() {
  const temaSalvo = localStorage.getItem(CONFIG.STORAGE.THEME);
  const isDark = temaSalvo !== 'light';
  document.body.classList.toggle('light-theme', !isDark);
}

function alternarTema() {
  const toggle = document.getElementById('darkModeToggle');
  const isDark = toggle.checked;
  localStorage.setItem(CONFIG.STORAGE.THEME, isDark ? 'dark' : 'light');
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
// ========================= ATUALIZAÇÕES EM TEMPO REAL =========================
function iniciarAtualizacoesTempoReal() {
  rtInterval = setInterval(() => {
    atualizarDadosTempoReal();
  }, CONFIG.RT.INTERVAL);


  ['click', 'scroll', 'keydown', 'touchstart'].forEach(evento => {
    document.addEventListener(evento, () => {
      if (!window._lastInteraction || Date.now() - window._lastInteraction > 10000) {
        window._lastInteraction = Date.now();
            }
    }, { passive: true });
  });
}

function mostrarRTIndicator() {
  const ind = document.getElementById('rtIndicator');
  if (ind) {
    ind.classList.add('visivel');
    setTimeout(() => ind.classList.remove('visivel'), 1500);
  }
}

async function atualizarDadosTempoReal() {
  mostrarRTIndicator();
  await Promise.allSettled([
    carregarAnuncios(true),
    carregarDestaques(true),
    atualizarBadge(),
    verificarBanimento(),
    verificarEliminacaoAgendada(),
    verificarPopups()
  ]);
}

// ========================= CARREGAR ANÚNCIOS =========================

// ========================= HELPERS =========================
function formatarTempo(dataStr) {
  if (!dataStr) return 'Agora';
  const d = new Date(dataStr), agora = new Date();
  const diff = Math.floor((agora - d) / 1000);
  const dias = Math.floor(diff / 86400);
  if (dias === 0) {
    const horas = Math.floor(diff / 3600);
    if (horas === 0) {
      const mins = Math.floor(diff / 60);
      return mins === 0 ? 'Agora' : 'Há ' + mins + ' min';
    }
    return 'Há ' + horas + 'h';
  }
  if (dias === 1) return 'Ontem';
  if (dias < 7) return 'Há ' + dias + ' dias';
  if (dias < 30) return 'Há ' + Math.floor(dias / 7) + ' semanas';
  return 'Há ' + Math.floor(dias / 30) + ' meses';
}

function esc(t) {
  if (t == null) return '';
  const d = document.createElement('div');
  d.textContent = String(t);
  return d.innerHTML;
}

function formatarPreco(p) {
  if (p == null) return '0 Kz';
  return new Intl.NumberFormat('pt-AO').format(p) + ' Kz';
}

async function carregarAnuncios(silent = false) {
  const grid = document.getElementById('anunGrid');
  if (!grid) return;

  try {
    console.log('[ANUNCIOS] A carregar anúncios...');
    const res = await fetch(`${API_URL}/anuncios`);
    console.log('[ANUNCIOS] Resposta HTTP:', res.status);
    if (!res.ok) throw new Error('Erro ao carregar');
    const data = await res.json();
    console.log('[ANUNCIOS] Recebidos:', data.length, 'anúncios');
    if (data.length > 0) console.log('[ANUNCIOS] Primeiro anúncio:', data[0].id, data[0].titulo, 'status:', data[0].status);

    if (!data || data.length === 0) {
      if (!silent) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);"><i class="ph ph-magnifying-glass" style="font-size:40px;margin-bottom:10px;display:block;"></i><p>Nenhum anúncio encontrado</p></div>';
      }
      return;
    }

    const dataHash = JSON.stringify(data.slice(0, 8).map(a => a.id));
    const lastHash = JSON.stringify(lastAnunciosData.slice(0, 8).map(a => a.id));
    if (silent && dataHash === lastHash) return;

    lastAnunciosData = data;
    const favs = JSON.parse(localStorage.getItem('favoritos') || '[]');

    const anunciosVisiveis = data.slice(0, 6);

    grid.innerHTML = anunciosVisiveis.map((a, i) => {
      const img = a.imagem ? eznyImage(a.imagem) : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3QgZmlsbD0iIzFhMWQyNCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiLz48dGV4dCBmaWxsPSIjNGI1NTYzIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZHk9IjEwIiB4PSI1MCUiIHk9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+TtyBTZW0gaW1hZ2VtPC90ZXh0PjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJkMzEzOSIgc3Ryb2tlLXdpZHRoPSIyIiBkPSJNMTIwLDE4MCBMMTYwLDE0MCBMMjAwLDE4MCBMMjQwLDEyMCBMMjgwLDE4MCIvPjxjaXJjbGUgZmlsbD0iIzJkMzEzOSIgY3g9IjE2MCIgY3k9IjExMCIgcj0iMTUiLz48L3N2Zz4=';
      const isFav = favs.includes(a.id);
      const tempo = formatarTempo(a.createdAt);
      const preco = formatarPreco(a.preco);
      const loc = a.localizacao || a.local || 'Luanda';

      return `
      <div class="anun-card" onclick="verAnuncio(${a.id})" style="animation-delay:${i * 0.05}s">
        <div class="anun-img-wrap">
          <img src="${img}" class="anun-img" alt="${esc(a.titulo)}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3QgZmlsbD0iIzFhMWQyNCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiLz48dGV4dCBmaWxsPSIjNGI1NTYzIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZHk9IjEwIiB4PSI1MCUiIHk9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+TtyBTZW0gaW1hZ2VtPC90ZXh0PjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJkMzEzOSIgc3Ryb2tlLXdpZHRoPSIyIiBkPSJNMTIwLDE4MCBMMTYwLDE0MCBMMjAwLDE4MCBMMjQwLDEyMCBMMjgwLDE4MCIvPjxjaXJjbGUgZmlsbD0iIzJkMzEzOSIgY3g9IjE2MCIgY3k9IjExMCIgcj0iMTUiLz48L3N2Zz4='">
          <button class="anun-fav ${isFav ? 'ativo' : ''}" onclick="event.stopPropagation(); toggleFav(this,${a.id})">
            <i class="${isFav ? 'ph ph-heart' : 'ph ph-heart'}"></i>
          </button>
          <span class="anun-time">${tempo}</span>
        </div>
        <div class="anun-info">
          <div class="anun-title">${esc(a.titulo)}</div>
          <div class="anun-price">${preco}</div>
          <div class="anun-loc"><i class="ph ph-map-pin"></i> ${esc(loc)}</div>
        </div>
      </div>`;
    }).join('');

    atualizarContagens(data);

  } catch (err) {
    console.error('Erro:', err);
    if (!silent) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);"><i class="ph ph-wifi-x" style="font-size:40px;margin-bottom:10px;display:block;"></i><p>Erro ao carregar anúncios</p></div>';
    }
  }
}

// ========================= DESTAQUES =========================
async function carregarDestaques(silent = false) {
  const scroll = document.getElementById('destScroll');
  if (!scroll) return;

  try {
    const res = await fetch(`${API_URL}/destaques`);
    if (!res.ok) {
      console.error('[DESTAQUES] Erro HTTP:', res.status);
      throw new Error('Erro');
    }
    const data = await res.json();
    console.log('[DESTAQUES] Carregados:', data.length, 'destaques');

    const favs = JSON.parse(localStorage.getItem('favoritos') || '[]');

    const dataHash = JSON.stringify(data.slice(0, 5).map(a => a.id));
    const lastHash = JSON.stringify(lastDestaquesData.slice(0, 5).map(a => a.id));
    if (silent && dataHash === lastHash) return;

    lastDestaquesData = data;

    if (data.length === 0) {
      scroll.innerHTML = '<div style="padding:20px;color:var(--text-muted);font-size:0.85rem;text-align:center;width:100%;"><i class="ph ph-star" style="font-size:24px;display:block;margin-bottom:8px;opacity:0.5;"></i>Sem destaques disponíveis</div>';
      return;
    }

    scroll.innerHTML = data.slice(0, 5).map(a => {
      const img = a.imagem ? eznyImage(a.imagem) : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3QgZmlsbD0iIzFhMWQyNCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiLz48dGV4dCBmaWxsPSIjNGI1NTYzIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZHk9IjEwIiB4PSI1MCUiIHk9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+TtyBTZW0gaW1hZ2VtPC90ZXh0PjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJkMzEzOSIgc3Ryb2tlLXdpZHRoPSIyIiBkPSJNMTIwLDE4MCBMMTYwLDE0MCBMMjAwLDE4MCBMMjQwLDEyMCBMMjgwLDE4MCIvPjxjaXJjbGUgZmlsbD0iIzJkMzEzOSIgY3g9IjE2MCIgY3k9IjExMCIgcj0iMTUiLz48L3N2Zz4=';
      const isFav = favs.includes(a.id);
      const preco = a.preco ? new Intl.NumberFormat('pt-AO').format(a.preco) + ' Kz' : '';
      return `
      <div class="dest-card" onclick="verAnuncio(${a.id})">
        <div style="position:relative;">
          <img src="${img}" alt="${esc(a.titulo)}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3QgZmlsbD0iIzFhMWQyNCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiLz48dGV4dCBmaWxsPSIjNGI1NTYzIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZHk9IjEwIiB4PSI1MCUiIHk9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+TtyBTZW0gaW1hZ2VtPC90ZXh0PjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJkMzEzOSIgc3Ryb2tlLXdpZHRoPSIyIiBkPSJNMTIwLDE4MCBMMTYwLDE0MCBMMjAwLDE4MCBMMjQwLDEyMCBMMjgwLDE4MCIvPjxjaXJjbGUgZmlsbD0iIzJkMzEzOSIgY3g9IjE2MCIgY3k9IjExMCIgcj0iMTUiLz48L3N2Zz4='" style="width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:14px;">
          <button class="anun-fav ${isFav ? 'ativo' : ''}" onclick="event.stopPropagation(); toggleFav(this,${a.id})" style="top:6px;right:6px;width:28px;height:28px;">
            <i class="${isFav ? 'ph ph-heart-fill' : 'ph ph-heart'}"></i>
          </button>
          <span style="position:absolute;bottom:6px;left:6px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:3px 10px;border-radius:8px;font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
            <i class="ph ph-crown" style="margin-right:3px;"></i>Premium
          </span>
        </div>
        <div style="padding:10px 4px 4px;">
          <div style="font-size:0.8rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px;">${esc(a.titulo)}</div>
          <div style="font-size:0.85rem;font-weight:700;color:var(--primary);">${preco}</div>
        </div>
      </div>`;
    }).join('');

  } catch (err) {
    console.error('[DESTAQUES] Erro:', err);
    if (!silent) scroll.innerHTML = '<div style="padding:20px;color:var(--text-muted);font-size:0.85rem;text-align:center;width:100%;"><i class="ph ph-wifi-x" style="font-size:24px;display:block;margin-bottom:8px;opacity:0.5;"></i>Erro ao carregar destaques</div>';
  }
}

// ========================= CONTAGENS =========================
function atualizarContagens(anuncios) {
  const cats = { telefone:0, carro:0, imovel:0, arrendamento:0, casa:0, outro:0 };
  anuncios.forEach(a => {
    if (cats.hasOwnProperty(a.categoria)) cats[a.categoria]++;
  });
  const ids = { telefone:'catCount1', carro:'catCount2', imovel:'catCount3', arrendamento:'catCount4', casa:'catCount5', outro:'catCount6' };
  for (const [cat, id] of Object.entries(ids)) {
    const el = document.getElementById(id);
    if (el) el.textContent = `${cats[cat].toLocaleString('pt-PT')} anúncios`;
  }
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

// ========================= VERIFICAÇÕES =========================
async function verificarBanimento() {
  const token = localStorage.getItem(CONFIG.STORAGE.TOKEN);
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/auth/verificar-banimento`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 403) {
      const data = await res.json();
      if (data.banido === true) {
        localStorage.setItem('banInfo', JSON.stringify({
          tipo_banimento: data.tipo_banimento || 'permanente',
          banido_ate: data.banido_ate || null,
          erro: data.erro
        }));
        window.location.href = 'suspended.html';
      }
    }
  } catch (err) {
    console.error('[BAN] Erro ao verificar:', err);
  }
}

async function verificarEliminacaoAgendada() {
  const token = localStorage.getItem(CONFIG.STORAGE.TOKEN);
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.eliminacao_agendada === 1 && data.eliminacao_ate) {
        const dias = Math.ceil((new Date(data.eliminacao_ate) - new Date()) / (1000 * 60 * 60 * 24));
        mostrarAvisoEliminacao(dias);
      }
    }
  } catch (err) {
    console.error('[DEL] Erro:', err);
  }
}

function mostrarAvisoEliminacao(dias) {
  if (document.getElementById('aviso-eliminacao')) return;
  const aviso = document.createElement('div');
  aviso.id = 'aviso-eliminacao';
  aviso.style.cssText = 'position:fixed;top:12px;left:12px;right:12px;z-index:99999;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:14px 18px;border-radius:16px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(245,158,11,0.3);animation:slideDown 0.4s ease-out;font-size:0.85rem;';
  aviso.innerHTML = `
    <i class="ph ph-warning" style="font-size:20px;flex-shrink:0;"></i>
    <div style="flex:1;line-height:1.4;">
      <strong>Conta agendada para eliminação</strong><br>
      <span style="opacity:0.9;font-size:0.8rem;">Sua conta será eliminada em ${dias} dia(s). Inicie sessão para cancelar.</span>
    </div>
    <button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:0.75rem;font-weight:600;">OK</button>
  `;
  document.body.appendChild(aviso);
  setTimeout(() => { if (aviso.parentElement) aviso.remove(); }, 15000);
}

const avisoStyle = document.createElement('style');
avisoStyle.textContent = '@keyframes slideDown { from { transform:translateY(-100%); opacity:0; } to { transform:translateY(0); opacity:1; } }';
document.head.appendChild(avisoStyle);

// ========================= POPUPS =========================
let popupAtual = null;

async function verificarPopups() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch(`${API_URL}/comunicados/popups`, {headers:{'Authorization':'Bearer '+token}});
    if (!res.ok) return;
    const popups = await res.json();
    if (!popups?.length) return;
    popupAtual = popups[0];
    const ov=document.getElementById('popupOverlay');
    const tit=document.getElementById('popupTitulo');
    const cont=document.getElementById('popupConteudo');
    const img=document.getElementById('popupImagem');
    const link=document.getElementById('popupLink');
    const tipo=document.getElementById('popupTipo');
    if(tit) tit.textContent=popupAtual.titulo || 'Comunicado EZNY';
    if(cont) cont.textContent=popupAtual.conteudo || '';
    if(tipo) tipo.textContent=(popupAtual.tipo || 'informação').toUpperCase();
if(img){
  const temImagem = !!popupAtual.imagem;

  if(temImagem){
    img.src = eznyImage(popupAtual.imagem);
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }

  img.onerror = () => {
    img.style.display = 'none';
  };
}

const icon = document.getElementById('popupIcon');
if(icon){
  icon.style.display = popupAtual.imagem ? 'none' : 'block';
}  

if(link){
  if(popupAtual.link){
    link.href = popupAtual.link;
    link.textContent = popupAtual.texto_botao || 'Saber mais';
    link.style.display = 'inline-flex';
  } else {
    link.style.display = 'none';
  }
}

const btnOk = document.getElementById('btnFecharPopup');
if(btnOk){
  btnOk.style.display = popupAtual.link ? 'none' : 'inline-flex';
}

if(ov){ov.classList.add('visivel');ov.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
  } catch(e) { console.warn('[POPUP]',e); }
}

async function fecharPopup() {
  const ov=document.getElementById('popupOverlay');
  if(ov){ov.classList.remove('visivel');ov.setAttribute('aria-hidden','true');document.body.style.overflow='';}
  if(popupAtual){
    const token=localStorage.getItem('token');
if(token){
  try{
    await fetch(`${API_URL}/comunicados/popups/${popupAtual.id}/visto`,{
      method:'POST',
      headers:{
        'Authorization':'Bearer '+token,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({origem:popupAtual.origem})
    });

    setTimeout(verificarPopups, 300);
  }catch(e){}
}
    popupAtual=null;
  }
}

// ========================= MODAL DETALHE DO ANÚNCIO =========================

// Variáveis do modal (já declaradas nas globais, não repetir)
// anuncioAtualModal, imagensModal, imgModalIdx, modalToastTimer

const DOM = {
  overlay: document.getElementById('modalAnuncioOverlay'),
  loading: document.getElementById('modalAnuncioLoading'),
  body: document.getElementById('modalAnuncioBody'),
  imgPrincipal: document.getElementById('modalImgPrincipal'),
  imgCounter: document.getElementById('modalImgCounter'),
  thumbs: document.getElementById('modalThumbs'),
  badgeDestaque: document.getElementById('modalBadgeDestaque'),
  titulo: document.getElementById('modalTitulo'),
  subtitulo: document.getElementById('modalSubtitulo'),
  preco: document.getElementById('modalPreco'),
  negociavel: document.getElementById('modalNegociavel'),
  ano: document.getElementById('modalAno'),
  km: document.getElementById('modalKm'),
  combustivel: document.getElementById('modalCombustivel'),
  localizacao: document.getElementById('modalLocalizacao'),
  tempo: document.getElementById('modalTempo'),
  vendedorAvatar: document.getElementById('modalVendedorAvatar'),
  vendedorNome: document.getElementById('modalVendedorNome'),
  vendedorMembro: document.getElementById('modalVendedorMembro'),
  specs: document.getElementById('modalSpecs'),
  descricao: document.getElementById('modalDescricao'),
  equipamentos: document.getElementById('modalEquipamentos'),
  btnVerMaisEquip: document.getElementById('modalBtnVerMaisEquip'),
  equipamentosSection: document.getElementById('modalEquipamentosSection'),
  btnFav: document.getElementById('modalAnuncioBtnFav'),
  iconFav: document.getElementById('modalAnuncioIconFav'),
  toast: document.getElementById('modalAnuncioToast'),
  comentariosSection: document.getElementById('modalComentariosSection'),
  comentariosLista: document.getElementById('modalComentariosLista'),
  comentariosCount: document.getElementById('modalComentariosCount'),
  comentarioInput: document.getElementById('modalComentarioInput'),
  avaliacaoWrap: document.getElementById('modalAvaliacaoWrap'),
  avaliacaoEstrelas: document.getElementById('modalAvaliacaoEstrelas'),
  avaliacaoNum: document.getElementById('modalAvaliacaoNum'),
  avaliacaoCount: document.getElementById('modalAvaliacaoCount'),
};

window.abrirModalAnuncio = async function(id) {
  anuncioAtualModal = null;
  imagensModal = [];
  imgModalIdx = 0;
  equipamentosExpandido = false;

  if (DOM.overlay) DOM.overlay.classList.add('aberto');
  document.body.style.overflow = 'hidden';

  if (DOM.loading) DOM.loading.style.display = 'flex';
  if (DOM.body) DOM.body.style.display = 'none';

  try {
    const res = await fetch(`${API_URL}/anuncios/${id}`);
    if (!res.ok) throw new Error('Erro ' + res.status);
    const anuncio = await res.json();

    if (!anuncio || !anuncio.id) { mostrarErroModal('Anúncio não encontrado'); return; }

    anuncioAtualModal = anuncio;
    renderizarModal(anuncio);
    if (DOM.loading) DOM.loading.style.display = 'none';
    if (DOM.body) DOM.body.style.display = 'flex';
    verificarFavoritoModal();

  } catch (err) {
    console.error('Erro modal:', err);
    mostrarErroModal('Erro ao carregar anúncio. Verifique a conexão.');
  }
};

window.fecharModalAnuncio = function(e) {
  if (e && e.target !== e.currentTarget && e.type === 'click') return;
  if (DOM.overlay) DOM.overlay.classList.remove('aberto');
  document.body.style.overflow = '';
  anuncioAtualModal = null;
  imagensModal = [];
  imgModalIdx = 0;
};

function renderizarModal(a) {
  // ===== IMAGENS =====
  imagensModal = [];
  if (a.imagem) imagensModal.push(a.imagem);
  if (a.galeria) {
    try {
      const g = typeof a.galeria === 'string' ? JSON.parse(a.galeria) : a.galeria;
      if (Array.isArray(g)) g.forEach(img => { if (img && !imagensModal.includes(img)) imagensModal.push(img); });
    } catch (e) {}
  }
  if (imagensModal.length === 0) imagensModal = ['placeholder.jpg'];

  DOM.imgPrincipal.src = eznyImage(imagensModal[0]);
  DOM.imgCounter.textContent = '1 / ' + imagensModal.length;

  // Thumbnails
  DOM.thumbs.innerHTML = imagensModal.map((img, i) => 
    '<img src="' + eznyImage(img) + '" class="modal-anuncio-thumb ' + (i === 0 ? 'ativa' : '') + '" onclick="mudarImagemModal(' + i + ')" alt="" loading="lazy" onerror="this.src=\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3QgZmlsbD0iIzFhMWQyNCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiLz48dGV4dCBmaWxsPSIjNGI1NTYzIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZHk9IjEwIiB4PSI1MCUiIHk9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+TtyBTZW0gaW1hZ2VtPC90ZXh0PjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJkMzEzOSIgc3Ryb2tlLXdpZHRoPSIyIiBkPSJNMTIwLDE4MCBMMTYwLDE0MCBMMjAwLDE4MCBMMjQwLDEyMCBMMjgwLDE4MCIvPjxjaXJjbGUgZmlsbD0iIzJkMzEzOSIgY3g9IjE2MCIgY3k9IjExMCIgcj0iMTUiLz48L3N2Zz4=\'">'
  ).join('');

  // ===== BADGE DESTAQUE =====
  DOM.badgeDestaque.style.display = (a.destaque || a.usuario_tipo_conta === 'premium') ? 'inline-flex' : 'none';

  // ===== TÍTULO =====
  DOM.titulo.textContent = a.titulo || (a.marca + ' ' + a.modelo) || 'Anúncio';
  DOM.subtitulo.textContent = a.versao || a.descricao || '';

  // ===== PREÇO =====
  DOM.preco.textContent = formatarPrecoModal(a.preco);
  DOM.negociavel.style.display = (a.negociavel === 1 || a.negociavel === '1') ? 'inline-block' : 'none';

  // ===== INFO RÁPIDA =====
  DOM.ano.textContent = a.ano || '-';
  DOM.km.textContent = a.quilometragem ? formatarKm(a.quilometragem) : '-';
  DOM.combustivel.textContent = a.combustivel || '-';

  // ===== LOCALIZAÇÃO =====
  DOM.localizacao.textContent = a.localizacao || a.usuario_localizacao || 'Luanda';
  DOM.tempo.textContent = tempoRelativo(a.createdAt);

  // ===== VENDEDOR =====
  // ===== VENDEDOR =====
  const nome = a.usuario_nome || 'Utilizador';
  const iniciais = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  // FOTO DE PERFIL para premium, avatar para normal
  if (a.usuario_tipo_conta === 'premium' && a.usuario_avatar) {
    DOM.vendedorAvatar.innerHTML = '<img src="' + eznyImage(a.usuario_avatar) + '" alt="" style="width:100%;height:100%;object-fit:cover;">';
    DOM.vendedorAvatar.classList.add('premium-avatar');
  } else {
    DOM.vendedorAvatar.textContent = iniciais;
    DOM.vendedorAvatar.classList.remove('premium-avatar');
    DOM.vendedorAvatar.innerHTML = '';
  }

  const verif = (a.usuario_verificado === 1 || a.usuario_verificado === '1') 
    ? '<i class="ph ph-seal-check verificado"></i>' : '';
  
  // Badge PREMIUM no nome
  const badgePremium = (a.usuario_tipo_conta === 'premium') 
    ? '<span class="premium-badge">PREMIUM</span>' : '';
  
  DOM.vendedorNome.innerHTML = escModal(nome) + verif + badgePremium;
  DOM.vendedorMembro.textContent = a.usuario_tipo_conta === 'premium' ? 'Conta Premium' : 'Membro desde 2022';

  // ===== AVALIAÇÃO (só PREMIUM) =====
  if (a.usuario_tipo_conta === 'premium' && a.avaliacao) {
    DOM.avaliacaoWrap.style.display = 'flex';
    const media = parseFloat(a.avaliacao.media) || 0;
    const total = a.avaliacao.total || 0;
    DOM.avaliacaoNum.textContent = media.toFixed(1);
    DOM.avaliacaoCount.textContent = '(' + total + ' avaliações)';
    
    let estrelasHtml = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.round(media)) {
        estrelasHtml += '<i class="ph ph-star-fill"></i>';
      } else {
        estrelasHtml += '<i class="ph ph-star"></i>';
      }
    }
    DOM.avaliacaoEstrelas.innerHTML = estrelasHtml;
  } else {
    DOM.avaliacaoWrap.style.display = 'none';
  }



  // ===== ESPECIFICAÇÕES =====
  const specs = [
    { icon: 'ph-car', label: 'Marca', value: a.marca },
    { icon: 'ph-car', label: 'Modelo', value: a.modelo },
    { icon: 'ph-package', label: 'Versão', value: a.versao },
    { icon: 'ph-calendar-blank', label: 'Ano', value: a.ano },
    { icon: 'ph-gauge', label: 'Quilometragem', value: formatarKm(a.quilometragem) },
    { icon: 'ph-gas-pump', label: 'Combustível', value: a.combustivel },
    { icon: 'ph-users', label: 'Caixa', value: a.caixa },
    { icon: 'ph-gear', label: 'Tração', value: a.tracao },
    { icon: 'ph-paint-brush', label: 'Cor', value: a.cor },
    { icon: 'ph-door', label: 'Portas', value: a.portas },
    { icon: 'ph-users-three', label: 'Lotação', value: a.lotacao },
    { icon: 'ph-check-circle', label: 'Estado', value: a.estado },
  ];

  DOM.specs.innerHTML = specs.filter(s => s.value).map(s => 
    '<div class="modal-spec-linha">' +
      '<div class="modal-spec-label"><i class="ph ' + s.icon + '"></i> ' + escModal(s.label) + '</div>' +
      '<div class="modal-spec-valor">' + escModal(s.value) + '</div>' +
    '</div>'
  ).join('');

  // ===== DESCRIÇÃO =====
  DOM.descricao.textContent = a.descricao_completa || a.descricao || 'Sem descrição.';

  // ===== EQUIPAMENTOS =====
  if (a.equipamentos) {
    equipamentosModal = a.equipamentos.split(',').map(e => e.trim()).filter(e => e);
    renderizarEquipamentosModal();
    DOM.equipamentosSection.style.display = 'block';
  } else {
    DOM.equipamentosSection.style.display = 'none';
  }

  // ===== COMENTÁRIOS (só para PREMIUM) =====
  if (a.usuario_tipo_conta === 'premium' && DOM.comentariosSection) {
    DOM.comentariosSection.style.display = 'block';
    renderizarComentariosModal(a.comentarios || []);
  } else if (DOM.comentariosSection) {
    DOM.comentariosSection.style.display = 'none';
  }
}

function renderizarEquipamentosModal() {
  const max = equipamentosExpandido ? equipamentosModal.length : 8;
  const visiveis = equipamentosModal.slice(0, max);
  
  DOM.equipamentos.innerHTML = visiveis.map(e => 
    '<div class="modal-equip-tag"><i class="ph ph-check-circle"></i> ' + escModal(e) + '</div>'
  ).join('');

  DOM.btnVerMaisEquip.style.display = (equipamentosModal.length > 8) ? 'inline-block' : 'none';
  DOM.btnVerMaisEquip.textContent = equipamentosExpandido ? 'Ver menos' : 'Ver mais';
}

window.toggleEquipamentosModal = function() {
  equipamentosExpandido = !equipamentosExpandido;
  renderizarEquipamentosModal();
};

window.mudarImagemModal = function(idx) {
  if (idx < 0 || idx >= imagensModal.length) return;
  imgModalIdx = idx;
  DOM.imgPrincipal.style.opacity = '0';
  setTimeout(() => {
    DOM.imgPrincipal.src = eznyImage(imagensModal[idx]);
    DOM.imgPrincipal.style.opacity = '1';
  }, 200);
  DOM.imgCounter.textContent = (idx + 1) + ' / ' + imagensModal.length;
  
  document.querySelectorAll('.modal-anuncio-thumb').forEach((t, i) => {
    t.classList.toggle('ativa', i === idx);
  });
};

// Swipe nas imagens
document.addEventListener('DOMContentLoaded', () => {
  const imgWrap = document.getElementById('modalImgWrap');
  if (!imgWrap) return;
  let tsX = 0;
  imgWrap.addEventListener('touchstart', e => { tsX = e.touches[0].clientX; }, { passive: true });
  imgWrap.addEventListener('touchend', e => {
    const diff = tsX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) window.mudarImagemModal((imgModalIdx + 1) % imagensModal.length);
      else window.mudarImagemModal((imgModalIdx - 1 + imagensModal.length) % imagensModal.length);
    }
  }, { passive: true });
});

// ===== AÇÕES =====
window.enviarMensagemModal = function() {
  if (!anuncioAtualModal) return;
  if (!isAuth()) { avisoLogin(); return; }
  window.location.href = '/mensagens?para=' + anuncioAtualModal.usuario_id + '&anuncio=' + anuncioAtualModal.id;
};

window.ligarVendedorModal = function() {
  if (!anuncioAtualModal?.usuario_telefone) {
    mostrarToastModal('Telefone não disponível', 'error');
    return;
  }
  window.location.href = 'tel:' + anuncioAtualModal.usuario_telefone;
};

window.whatsappVendedorModal = function() {
  if (!anuncioAtualModal?.usuario_telefone) {
    mostrarToastModal('Telefone não disponível', 'error');
    return;
  }
  const tel = anuncioAtualModal.usuario_telefone.replace(/\D/g, '');
  const msg = 'Olá! Vi o teu anúncio do ' + anuncioAtualModal.titulo + ' no EZNY.';
  window.open('https://wa.me/244' + tel + '?text=' + encodeURIComponent(msg), '_blank');
};

window.irPerfilVendedor = function() {
  if (!anuncioAtualModal) return;
  window.location.href = '/perfil/' + anuncioAtualModal.usuario_id;
};
window.enviarComentarioModal = async function() {
  if (!anuncioAtualModal || !DOM.comentarioInput) return;
  const conteudo = DOM.comentarioInput.value.trim();
  if (!conteudo) return;

  const token = localStorage.getItem('token');
  if (!token) { mostrarToastModal('Faça login para comentar', 'error'); return; }

  try {
    const res = await fetch(API_URL + '/anuncios/' + anuncioAtualModal.id + '/comentar', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo })
    });

    if (res.ok) {
      DOM.comentarioInput.value = '';
      mostrarToastModal('Comentário adicionado!', 'success');
      abrirModalAnuncio(anuncioAtualModal.id);
    } else {
      const data = await res.json();
      mostrarToastModal(data.erro || 'Erro ao comentar', 'error');
    }
  } catch (err) {
    mostrarToastModal('Erro de rede', 'error');
  }
};


window.toggleFavModal = function() {
  if (!anuncioAtualModal) return;
  const id = anuncioAtualModal.id;
  let favs = JSON.parse(localStorage.getItem('favoritos') || '[]');
  const isFav = favs.includes(id);
  
  if (isFav) {
    favs = favs.filter(f => f !== id);
    DOM.iconFav.className = 'ph ph-heart';
    DOM.btnFav.classList.remove('fav-ativo');
    mostrarToastModal('Removido dos favoritos', 'info');
  } else {
    favs.push(id);
    DOM.iconFav.className = 'ph ph-heart-fill';
    DOM.btnFav.classList.add('fav-ativo');
    mostrarToastModal('Adicionado aos favoritos', 'success');
  }
  localStorage.setItem('favoritos', JSON.stringify(favs));
  
  // Sincronizar nos cards
  document.querySelectorAll('.anun-fav').forEach(btn => {
    if (btn.dataset.cspItemId === String(id)) btn.classList.toggle('ativo', !isFav);
  });
};

function verificarFavoritoModal() {
  if (!anuncioAtualModal || !DOM.iconFav) return;
  const favs = JSON.parse(localStorage.getItem('favoritos') || '[]');
  const isFav = favs.includes(anuncioAtualModal.id);
  DOM.iconFav.className = isFav ? 'ph ph-heart-fill' : 'ph ph-heart';
  DOM.btnFav.classList.toggle('fav-ativo', isFav);
}

window.partilharAnuncioModal = function() {
  if (!anuncioAtualModal) return;
  const url = window.location.origin + '/anuncio.html?id=' + anuncioAtualModal.id;
  if (navigator.share) {
    navigator.share({ title: anuncioAtualModal.titulo, url });
  } else {
    navigator.clipboard.writeText(url);
    mostrarToastModal('Link copiado!', 'success');
  }
};

function mostrarErroModal(msg) {
  if (DOM.loading) DOM.loading.style.display = 'none';
  if (DOM.body) {
    DOM.body.style.display = 'flex';
    DOM.body.innerHTML = '<div class="modal-anuncio-erro" style="width:100%;"><i class="ph ph-warning-circle"></i><h3>' + escModal(msg) + '</h3><button onclick="fecharModalAnuncio()" class="modal-btn-msg" style="margin-top:16px;">Voltar</button></div>';
  }
}

function mostrarToastModal(msg, tipo) {
  if (modalToastTimer) clearTimeout(modalToastTimer);
  const cores = { success: 'rgba(16,185,129,0.95)', error: 'rgba(239,68,68,0.95)', info: 'rgba(59,130,246,0.95)' };
  const icones = { success: 'ph-check-circle', error: 'ph-warning-circle', info: 'ph-info' };
  if (DOM.toast) {
    DOM.toast.style.background = cores[tipo] || cores.info;
    DOM.toast.innerHTML = '<i class="ph ' + (icones[tipo] || icones.info) + '"></i> <span>' + escModal(msg) + '</span>';
    DOM.toast.classList.add('visivel');
    modalToastTimer = setTimeout(() => DOM.toast.classList.remove('visivel'), 2500);
  }
}

// ===== HELPERS =====

function renderizarComentariosModal(comentarios) {
  if (!DOM.comentariosLista) return;

  const total = (comentarios || []).reduce((acc, c) => acc + 1 + (c.respostas ? c.respostas.length : 0), 0);
  DOM.comentariosCount.textContent = '(' + total + ')';

  if (!comentarios || comentarios.length === 0) {
    DOM.comentariosLista.innerHTML = '<div style="text-align:center;padding:16px 0;color:#9ca3af;font-size:0.85rem;"><i class="ph ph-chat-circle" style="font-size:24px;display:block;margin-bottom:6px;opacity:0.5;"></i>Sem comentários ainda. Seja o primeiro!</div>';
    return;
  }

  const user = getUser();
  const userId = user ? user.id : null;

  DOM.comentariosLista.innerHTML = comentarios.map(c => {
    const inicial = (c.autor_nome || 'U').charAt(0).toUpperCase();
    const isPremium = c.autor_tipo === 'premium';
    const avatarClass = isPremium ? 'modal-comentario-avatar premium-avatar-small' : 'modal-comentario-avatar';
    
    let avatarHtml = '';
    if (c.autor_avatar) {
      avatarHtml = '<img src="' + eznyImage(c.autor_avatar) + '" class="' + avatarClass + '" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';"><div class="modal-comentario-avatar-placeholder" style="display:none;">' + inicial + '</div>';
    } else {
      avatarHtml = '<div class="modal-comentario-avatar-placeholder">' + inicial + '</div>';
    }

    // Verificar se o utilizador atual é o autor do anúncio (pode responder)
    const podeResponder = anuncioAtualModal && userId && anuncioAtualModal.usuario_id === userId && !c.resposta_id;
    const btnResponder = podeResponder 
      ? '<button class="modal-comentario-btn-responder" onclick="prepararRespostaModal(' + c.id + ')"><i class="ph ph-arrow-bend-up-left"></i> Responder</button>' 
      : '';

    const respostasHtml = (c.respostas || []).map(r => {
      const rInicial = (r.autor_nome || 'U').charAt(0).toUpperCase();
      const rIsPremium = r.autor_tipo === 'premium';
      const rAvatarClass = rIsPremium ? 'modal-comentario-avatar premium-avatar-small' : 'modal-comentario-avatar';
      
      let rAvatarHtml = '';
      if (r.autor_avatar) {
        rAvatarHtml = '<img src="' + eznyImage(r.autor_avatar) + '" class="' + rAvatarClass + '" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';"><div class="modal-comentario-avatar-placeholder" style="display:none;">' + rInicial + '</div>';
      } else {
        rAvatarHtml = '<div class="modal-comentario-avatar-placeholder">' + rInicial + '</div>';
      }
      
      return '<div class="modal-comentario-resposta">' + rAvatarHtml + 
        '<div class="modal-comentario-conteudo"><div class="modal-comentario-autor">' + esc(r.autor_nome || 'Utilizador') + (rIsPremium ? ' <span style="color:#fbbf24;font-size:0.6rem;">★</span>' : '') + '</div><div class="modal-comentario-texto">' + esc(r.conteudo) + '</div><div class="modal-comentario-tempo">' + formatarTempo(r.createdAt) + '</div></div></div>';
    }).join('');

    const respostasWrap = respostasHtml 
      ? '<div class="modal-comentario-respostas">' + respostasHtml + '</div>' 
      : '';

    // Input de resposta (escondido por padrão)
    const inputResposta = podeResponder 
      ? '<div class="modal-resposta-input-wrap" id="respostaInput_' + c.id + '" style="display:none;"><input type="text" class="modal-resposta-input" id="respostaText_' + c.id + '" placeholder="Escreva uma resposta..."><button class="modal-resposta-btn-enviar" onclick="enviarRespostaModal(' + c.id + ')"><i class="ph ph-paper-plane-right"></i></button></div>' 
      : '';

    return '<div class="modal-comentario" id="comentario_' + c.id + '">' + avatarHtml + 
      '<div class="modal-comentario-conteudo"><div class="modal-comentario-autor">' + esc(c.autor_nome || 'Utilizador') + (isPremium ? ' <span style="color:#fbbf24;font-size:0.6rem;">★</span>' : '') + '</div><div class="modal-comentario-texto">' + esc(c.conteudo) + '</div><div class="modal-comentario-acoes"><span class="modal-comentario-tempo">' + formatarTempo(c.createdAt) + '</span>' + btnResponder + '</div>' + respostasWrap + inputResposta + '</div></div>';
  }).join('');
}

window.prepararRespostaModal = function(comentarioId) {
  // Esconder todos os inputs de resposta
  document.querySelectorAll('[id^="respostaInput_"]').forEach(el => el.style.display = 'none');
  // Mostrar o input deste comentário
  const inputWrap = document.getElementById('respostaInput_' + comentarioId);
  if (inputWrap) {
    inputWrap.style.display = 'flex';
    const input = document.getElementById('respostaText_' + comentarioId);
    if (input) input.focus();
  }
};

window.enviarRespostaModal = async function(comentarioId) {
  if (!anuncioAtualModal) return;
  const input = document.getElementById('respostaText_' + comentarioId);
  if (!input) return;
  
  const conteudo = input.value.trim();
  if (!conteudo) return;

  const token = localStorage.getItem('token');
  if (!token) { mostrarToastModal('Faça login para responder', 'error'); return; }

  try {
    const res = await fetch(API_URL + '/anuncios/' + anuncioAtualModal.id + '/comentar/' + comentarioId + '/responder', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo })
    });

    if (res.ok) {
      input.value = '';
      const inputWrap = document.getElementById('respostaInput_' + comentarioId);
      if (inputWrap) inputWrap.style.display = 'none';
      mostrarToastModal('Resposta enviada!', 'success');
      // Recarregar comentários
      abrirModalAnuncio(anuncioAtualModal.id);
    } else {
      const data = await res.json();
      mostrarToastModal(data.erro || 'Erro ao responder', 'error');
    }
  } catch (err) {
    mostrarToastModal('Erro de rede', 'error');
  }
};
function formatarPrecoModal(p) {
  if (p == null) return '0 Kz';
  return new Intl.NumberFormat('pt-AO').format(p) + ' Kz';
}

function formatarKm(valor) {
  if (!valor) return '0 km';
  return new Intl.NumberFormat('pt-AO').format(valor) + ' km';
}

function tempoRelativo(dataStr) {
  if (!dataStr) return 'Recente';
  const d = new Date(dataStr), agora = new Date();
  const diff = Math.floor((agora - d) / 1000);
  const dias = Math.floor(diff / 86400);
  
  if (dias === 0) {
    const horas = Math.floor(diff / 3600);
    if (horas === 0) {
      const mins = Math.floor(diff / 60);
      return mins === 0 ? 'Agora' : 'Há ' + mins + ' min';
    }
    return 'Há ' + horas + 'h';
  }
  if (dias === 1) return 'Ontem';
  if (dias < 7) return 'Há ' + dias + ' dias';
  if (dias < 30) return 'Há ' + Math.floor(dias / 7) + ' semanas';
  return 'Há ' + Math.floor(dias / 30) + ' meses';
}

function escModal(t) {
  if (t == null) return '';
  const d = document.createElement('div');
  d.textContent = String(t);
  return d.innerHTML;
}
