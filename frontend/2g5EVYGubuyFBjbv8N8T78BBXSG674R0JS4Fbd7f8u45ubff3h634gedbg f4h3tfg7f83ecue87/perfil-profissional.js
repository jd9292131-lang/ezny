

const CONFIG = {
  STORAGE: { USER:'userData', TOKEN:'token' },
  ANIM: { TOAST:3000 }
};

const API_URL = window.location.origin + '/api';

let perfilId = null;
let perfilData = null;
let estrelasSelecionadas = 0;
let tabAtual = 'publicacoes';
let anuncioAtual = null;
let imagemAnuncioIndex = 0;
let anuncioImagens = [];
let anunciosCache = [];
let capaFile = null;
let avatarFile = null;
let denunciaTipo = 'perfil'; // 'perfil' ou 'anuncio'
let denunciaAlvoId = null;
let comentariosCache = [];

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  perfilId = params.get('id');

  if (!perfilId) {
    const user = getUser();
    if (user && user.id) {
      perfilId = user.id;
    } else {
      mostrarErro();
      return;
    }
  }

  carregarPerfil();
});

/* ============================================================
   SESSÃO
   ============================================================ */

function getUser() {
  try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE.USER)); } catch { return null; }
}
function getToken() { return localStorage.getItem(CONFIG.STORAGE.TOKEN); }
function isAuth() { return !!(getUser() && getToken()); }
function getUserId() {
  const u = getUser();
  return u ? u.id : null;
}
function isMeuPerfil() {
  return getUserId() == perfilId;
}

/* ============================================================
   CARREGAR PERFIL
   ============================================================ */

async function carregarPerfil() {
  try {
    const res = await fetch(`${API_URL}/premium/perfil/${perfilId}`);
    if (!res.ok) {
      if (res.status === 404) { mostrarErro(); return; }
      throw new Error('Erro ao carregar');
    }

    const data = await res.json();
    console.log('[PERFIL] Resposta do backend07tfc5deftcerdfghuyfrtf6787ygvbtfrdcASDFR4567TGHDAasdtedfg7654rtghnbgfcfdfrfvghgvgftrt:', data);

    perfilData = data.perfil;
    const publicacoes = data.publicacoes || [];
    anunciosCache = publicacoes;

    if (!perfilData || perfilData.tipo_conta !== 'premium') {
      mostrarErro();
      return;
    }

    document.getElementById('profLoading').style.display = 'none';
    document.getElementById('profConteudo').style.display = 'block';

    renderizarPerfil(perfilData, publicacoes);
    renderizarAnuncios(publicacoes);
    carregarAvaliacoes();
    verificarSeguindo();

  } catch (err) {
    console.error('Erro:', err);
    mostrarErro();
  }
}

/* ============================================================
   RENDERIZAR PERFIL
   ============================================================ */

function renderizarPerfil(p, publicacoes) {
  // Capa
  const capaEl = document.getElementById('profCapa');
  if (p.foto_capa) {
    capaEl.innerHTML = `<img src="${eznyImage(p.foto_capa)}" alt="" onerror="this.style.display='none'">` + capaEl.innerHTML;
  }

  // Avatar
  const avatarWrap = document.getElementById('profAvatarWrap');
  const inicial = (p.nome || p.telefone || 'U').charAt(0).toUpperCase();
  if (p.avatar) {
    avatarWrap.innerHTML = `<img src="${eznyImage(p.avatar)}" class="prof-avatar" alt="" onerror="this.style.display='none';document.getElementById('profAvatarPlaceholder').style.display='flex';">` +
      `<div class="prof-avatar-placeholder" id="profAvatarPlaceholder" style="display:none;">${inicial}</div>`;
  } else {
    avatarWrap.innerHTML = `<div class="prof-avatar-placeholder">${inicial}</div>`;
  }

  // Nome + Badges
  const nomeEl = document.getElementById('profNome');
  let nomeHtml = esc(p.nome || p.telefone || 'Utilizador');

  if (p.verificado) {
    nomeHtml += ' <span class="verificado-badge" title="Conta verificada" onclick="mostrarInfoVerificado()"><i class="ph-fill ph-check"></i></span>';
  }

  if (p.tipo_conta === 'premium') {
    nomeHtml += ' <span class="premium-badge">Premium</span>';
  }

  nomeEl.innerHTML = nomeHtml;

  // Bio
  const bioEl = document.getElementById('profBio');
  if (p.descricao) {
    bioEl.textContent = p.descricao;
    bioEl.style.display = 'block';
  } else {
    bioEl.style.display = 'none';
  }

  // Meta
  const metaEl = document.getElementById('profMeta');
  let metaHtml = '';
  if (p.localizacao) metaHtml += `<span><i class="ph-fill ph-map-pin"></i> ${esc(p.localizacao)}</span>`;
  if (p.premium_desde) metaHtml += `<span><i class="ph-fill ph-crown"></i> Premium desde ${formatarData(p.premium_desde)}</span>`;
  if (p.telefone_whatsapp) metaHtml += `<span><i class="ph-fill ph-phone"></i> ${esc(p.telefone_whatsapp)}</span>`;
  metaEl.innerHTML = metaHtml;

  // ===== STATS REAIS COM FALLBACK =====
  const totalAnuncios = (p.total_publicacoes !== undefined && p.total_publicacoes !== null) 
    ? parseInt(p.total_publicacoes) 
    : (publicacoes ? publicacoes.length : 0);

  const totalSeguidores = (p.total_seguidores !== undefined && p.total_seguidores !== null) 
    ? parseInt(p.total_seguidores) 
    : 0;

  const totalSeguindo = (p.total_seguindo !== undefined && p.total_seguindo !== null) 
    ? parseInt(p.total_seguindo) 
    : 0;

  const avaliacao = (p.media_avaliacoes !== undefined && p.media_avaliacoes !== null) 
    ? parseFloat(p.media_avaliacoes).toFixed(1) 
    : '—';

  console.log('[STATS] Anúncios:', totalAnuncios, 'Seguidores:', totalSeguidores, 'Seguindo:', totalSeguindo, 'Avaliação:', avaliacao);

  document.getElementById('statAnuncios').textContent = totalAnuncios.toLocaleString('pt-PT');
  document.getElementById('statSeguidores').textContent = totalSeguidores.toLocaleString('pt-PT');
  document.getElementById('statSeguindo').textContent = totalSeguindo.toLocaleString('pt-PT');
  document.getElementById('statAvaliacao').textContent = avaliacao;

  // Ações
  const acoesEl = document.getElementById('profAcoes');
  const btnMenu = document.getElementById('btnMenu');

  if (isMeuPerfil()) {
    acoesEl.innerHTML = `<button class="prof-btn prof-btn-editar" onclick="abrirModalEditar()">` +
      `<i class="ph-fill ph-pencil-simple"></i> Editar perfil</button>` +
      `<button class="prof-btn prof-btn-copiar" onclick="copiarLinkPerfil()" title="Copiar link">` +
      `<i class="ph-fill ph-link"></i></button>`;
    btnMenu.style.display = 'flex';
    document.getElementById('wrapAvaliar').style.display = 'none';
  } else {
    acoesEl.innerHTML =
      `<button class="prof-btn prof-btn-seguir" id="btnSeguir" onclick="toggleSeguir()">` +
      `<i class="ph-fill ph-user-plus"></i> Seguir</button>` +
      `<button class="prof-btn prof-btn-msg" onclick="iniciarChat()">` +
      `<i class="ph-fill ph-chat-circle-text"></i> Mensagem</button>` +
      `<button class="prof-btn prof-btn-denunciar" onclick="abrirDenunciaPerfil()" title="Denunciar">` +
      `<i class="ph-fill ph-warning-circle"></i></button>` +
      `<button class="prof-btn prof-btn-copiar" onclick="copiarLinkPerfil()" title="Copiar link">` +
      `<i class="ph-fill ph-link"></i></button>`;
    btnMenu.style.display = 'none';
    if (isAuth()) {
      document.getElementById('wrapAvaliar').style.display = 'block';
    }
  }

  // Sobre
  renderizarSobre(p);
}

function renderizarSobre(p) {
  const sobreEl = document.getElementById('sobreConteudo');

  const items = [];
  if (p.nome) items.push({ icon: 'ph ph-user', label: 'Nome', valor: p.nome });
  if (p.telefone_whatsapp) items.push({ icon: 'ph ph-phone', label: 'Telefone', valor: p.telefone_whatsapp });
  if (p.email) items.push({ icon: 'ph ph-envelope', label: 'Email', valor: p.email });
  if (p.localizacao) items.push({ icon: 'ph ph-map-pin', label: 'Localização', valor: p.localizacao });
  if (p.categoria_negocio) items.push({ icon: 'ph ph-storefront', label: 'Categoria', valor: p.categoria_negocio });
  if (p.website) items.push({ icon: 'ph ph-globe', label: 'Website', valor: `<a href="${esc(p.website)}" target="_blank">${esc(p.website)}</a>` });
  if (p.horario_funcionamento) items.push({ icon: 'ph ph-clock', label: 'Horário', valor: p.horario_funcionamento });
  if (p.premium_desde) items.push({ icon: 'ph ph-sketch-logo', label: 'Membro Premium desde', valor: formatarData(p.premium_desde) });
  if (p.redes_sociais) items.push({ icon: 'ph ph-share-network', label: 'Redes Sociais', valor: p.redes_sociais });

  if (items.length === 0) {
    sobreEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:0.85rem;">Sem informações adicionais.</div>';
    return;
  }

  sobreEl.innerHTML = items.map(item => `
    <div class="prof-sobre-item">
      <i class="${item.icon}"></i>
      <div>
        <div class="prof-sobre-item-label">${esc(item.label)}</div>
        <div class="prof-sobre-item-valor">${item.valor}</div>
      </div>
    </div>
  `).join('');
}

/* ============================================================
   ANÚNCIOS
   ============================================================ */

function renderizarAnuncios(anuncios) {
  const grid = document.getElementById('gridPublicacoes');

  if (!anuncios || anuncios.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);"><i class="ph ph-package" style="font-size:40px;margin-bottom:10px;display:block;opacity:0.5;"></i><p>Sem anúncios publicados</p></div>';
    return;
  }

  grid.innerHTML = anuncios.map((a, i) => {
    const img = a.imagem ? eznyImage(a.imagem) : 'imagens/placeholder.svg';
    const preco = formatarPreco(a.preco);
    const temGaleria = a.galeria && (Array.isArray(a.galeria) ? a.galeria.length > 1 : false);
    return `
    <div class="prof-anun-card" onclick="abrirModalAnuncio(${a.id})" style="animation: fadeInUp 0.5s ease ${i * 0.05}s both;">
      <div class="prof-anun-img-wrap">
        <img src="${img}" class="prof-anun-img" alt="${esc(a.titulo)}" loading="lazy" onerror="this.src='imagens/placeholder.svg'">
        ${temGaleria ? `<div class="prof-anun-badge"><i class="ph-fill ph-images"></i> ${Array.isArray(a.galeria) ? a.galeria.length : 1}</div>` : ''}
      </div>
      <div class="prof-anun-info">
        <div class="prof-anun-titulo">${esc(a.titulo)}</div>
        <div class="prof-anun-preco">${preco}</div>
        <div class="prof-anun-meta">
          <span><i class="ph-fill ph-eye"></i> ${a.total_reacoes || 0}</span>
          <span><i class="ph-fill ph-chat-circle"></i> ${a.total_comentarios || 0}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ============================================================
   MODAL ANÚNCIO — MÚLTIPLAS IMAGENS + COMENTÁRIOS + REAÇÕES
   ============================================================ */

async function abrirModalAnuncio(id) {
  let anuncio = anunciosCache.find(a => a.id == id);

  if (!anuncio) {
    try {
      const res = await fetch(`${API_URL}/anuncios/${id}`);
      if (res.ok) {
        anuncio = await res.json();
      }
    } catch (e) {
      console.error('[MODAL] Erro ao buscar anúncio:', e);
    }
  }

  if (!anuncio) {
    toast('Anúncio não encontrado');
    return;
  }

  console.log('[MODAL] Anúncio:', anuncio);

  anuncioAtual = anuncio;
  imagemAnuncioIndex = 0;
  anuncioImagens = [];

  // Resolver imagens
  if (anuncio.imagens && Array.isArray(anuncio.imagens) && anuncio.imagens.length > 0) {
    anuncioImagens = anuncio.imagens.map(img => img.startsWith('http') || img.startsWith('/') ? img : eznyImage(img));
  } else if (anuncio.imagens && typeof anuncio.imagens === 'string') {
    anuncioImagens = anuncio.imagens.split(',').map(s => s.trim()).filter(s => s).map(img => img.startsWith('http') || img.startsWith('/') ? img : eznyImage(img));
  } else if (anuncio.galeria && Array.isArray(anuncio.galeria) && anuncio.galeria.length > 0) {
    anuncioImagens = anuncio.galeria.map(img => img.startsWith('http') || img.startsWith('/') ? img : eznyImage(img));
  } else if (anuncio.imagem) {
    const img = anuncio.imagem;
    anuncioImagens = [img.startsWith('http') || img.startsWith('/') ? img : eznyImage(img)];
  } else {
    anuncioImagens = ['imagens/placeholder.svg'];
  }

  console.log('[MODAL] Imagens resolvidas:', anuncioImagens);

  document.getElementById('modalAnuncioNome').textContent = anuncio.titulo || 'Sem título';
  document.getElementById('modalAnuncioPreco').textContent = formatarPreco(anuncio.preco);
  document.getElementById('modalAnuncioDesc').textContent = anuncio.descricao || 'Sem descrição';

  // Meta
  const metaEl = document.getElementById('modalAnuncioMeta');
  const metaItems = [];

  if (anuncio.categoria) metaItems.push({ icon: 'ph-fill ph-tag', label: 'Categoria', valor: anuncio.categoria });
  if (anuncio.condicao || anuncio.estado) metaItems.push({ icon: 'ph-fill ph-shield-check', label: 'Condição', valor: anuncio.condicao || anuncio.estado });
  if (anuncio.localizacao) metaItems.push({ icon: 'ph-fill ph-map-pin', label: 'Localização', valor: anuncio.localizacao });
  if (anuncio.data || anuncio.createdAt) metaItems.push({ icon: 'ph-fill ph-calendar', label: 'Publicado', valor: formatarData(anuncio.data || anuncio.createdAt) });
  if (anuncio.codigo) metaItems.push({ icon: 'ph-fill ph-barcode', label: 'Ref.', valor: anuncio.codigo });

  metaEl.innerHTML = metaItems.map(m => `
    <div class="modal-anuncio-meta-item">
      <i class="${m.icon}"></i>
      <div>${m.label}<strong>${esc(m.valor)}</strong></div>
    </div>
  `).join('');

  // Vendedor
  const vendedorEl = document.getElementById('modalAnuncioVendedor');
  if (perfilData) {
    vendedorEl.style.display = 'flex';
    vendedorEl.href = `perfil-profissional.html?id=${perfilData.id}`;

    const avatarVend = document.getElementById('modalVendedorAvatar');
    const inicialVend = (perfilData.nome || 'U').charAt(0).toUpperCase();
    if (perfilData.avatar) {
      avatarVend.innerHTML = `<img src="${eznyImage(perfilData.avatar)}" alt="">`;
    } else {
      avatarVend.innerHTML = `<div class="modal-anuncio-vendedor-placeholder">${inicialVend}</div>`;
    }

    let nomeVend = esc(perfilData.nome || 'Utilizador');
    if (perfilData.verificado) {
      nomeVend += ' <span class="verificado-badge" style="width:16px;height:16px;font-size:10px;"><i class="ph-fill ph-check"></i></span>';
    }
    document.getElementById('modalVendedorNome').innerHTML = nomeVend;
    document.getElementById('modalVendedorLocal').textContent = perfilData.localizacao || 'Angola';
  } else {
    vendedorEl.style.display = 'none';
  }

  // Reações
  document.getElementById('countLike').textContent = anuncio.total_reacoes || 0;
  document.getElementById('countComentarios').textContent = anuncio.total_comentarios || 0;
  verificarReacaoUsuario(id);

  // Comentários
  carregarComentariosAnuncio(id);

  atualizarImagemAnuncio();

  const modal = document.getElementById('modalAnuncio');
  modal.classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function atualizarImagemAnuncio() {
  const imgEl = document.getElementById('modalAnuncioImg');
  const navEl = document.getElementById('modalAnuncioImgNav');
  const dotsEl = document.getElementById('modalAnuncioDots');

  if (!anuncioImagens.length) {
    imgEl.src = 'imagens/placeholder.svg';
    navEl.style.display = 'none';
    dotsEl.innerHTML = '';
    return;
  }

  imgEl.src = anuncioImagens[imagemAnuncioIndex];

  if (anuncioImagens.length > 1) {
    navEl.style.display = 'flex';
    dotsEl.innerHTML = anuncioImagens.map((_, i) => 
      `<span class="${i === imagemAnuncioIndex ? 'ativo' : ''}" onclick="event.stopPropagation();irParaImagem(${i})"></span>`
    ).join('');
  } else {
    navEl.style.display = 'none';
    dotsEl.innerHTML = '';
  }
}

function mudarImagemAnuncio(direcao) {
  if (!anuncioImagens.length) return;
  imagemAnuncioIndex += direcao;
  if (imagemAnuncioIndex < 0) imagemAnuncioIndex = anuncioImagens.length - 1;
  if (imagemAnuncioIndex >= anuncioImagens.length) imagemAnuncioIndex = 0;
  atualizarImagemAnuncio();
}

function irParaImagem(index) {
  if (!anuncioImagens.length) return;
  imagemAnuncioIndex = index;
  atualizarImagemAnuncio();
}

function fecharModalAnuncio(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('modalAnuncio').classList.remove('aberto');
  document.body.style.overflow = '';
  anuncioAtual = null;
  anuncioImagens = [];
}

function contactarWhatsApp() {
  if (!anuncioAtual || !perfilData) return;
  const tel = perfilData.telefone_whatsapp || perfilData.telefone;
  if (!tel) {
    toast('Vendedor sem contacto disponível');
    return;
  }
  const msg = `Olá! Vi o anúncio "${anuncioAtual.titulo}" no EZNY e tenho interesse.`;
  window.open(`https://wa.me/${tel.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
}

function partilharAnuncio() {
  if (!anuncioAtual) return;
  const url = `${window.location.origin}/perfil-profissional.html?id=${perfilId}&anuncio=${anuncioAtual.id}`;

  if (navigator.share) {
    navigator.share({
      title: anuncioAtual.titulo,
      text: anuncioAtual.descricao || '',
      url: url
    });
  } else {
    navigator.clipboard.writeText(url).then(() => toast('Link copiado!'));
  }
}

function copiarLinkPerfil() {
  const url = `${window.location.origin}/perfil-profissional.html?id=${perfilId}`;
  navigator.clipboard.writeText(url).then(() => toast('Link do perfil copiado!'));
}

function mostrarInfoVerificado() {
  toast('Esta conta foi verificada pela equipa EZNY');
}

/* ============================================================
   REAÇÕES
   ============================================================ */

async function verificarReacaoUsuario(anuncioId) {
  if (!isAuth()) return;
  try {
    const res = await fetch(`${API_URL}/anuncios/${anuncioId}/reacoes`);
    if (res.ok) {
      const data = await res.json();
      const likeData = data.find(r => r.tipo === 'like');
      const total = likeData ? likeData.total : 0;
      document.getElementById('countLike').textContent = total;
    }
  } catch (e) {}
}

async function toggleReacao() {
  if (!anuncioAtual) return;
  if (!isAuth()) { toast('Precisa iniciar sessão'); return; }

  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/anuncios/${anuncioAtual.id}/reagir`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'like' })
    });

    if (res.ok) {
      const data = await res.json();
      const btn = document.getElementById('btnLike');
      if (data.reagiu) {
        btn.classList.add('ativo');
        btn.innerHTML = '<i class="ph-fill ph-heart"></i> <span id="countLike">' + (parseInt(document.getElementById('countLike').textContent) + 1) + '</span>';
        toast('Gostaste!', 'success');
      } else {
        btn.classList.remove('ativo');
        btn.innerHTML = '<i class="ph ph-heart"></i> <span id="countLike">' + Math.max(0, parseInt(document.getElementById('countLike').textContent) - 1) + '</span>';
      }
    }
  } catch (e) {
    toast('Erro ao reagir');
  }
}

/* ============================================================
   COMENTÁRIOS
   ============================================================ */

async function carregarComentariosAnuncio(anuncioId) {
  const wrap = document.getElementById('modalComentariosWrap');
  const lista = document.getElementById('modalComentariosLista');
  const inputWrap = document.getElementById('wrapComentar');

  try {
    const res = await fetch(`${API_URL}/anuncios/${anuncioId}/comentarios`);
    if (!res.ok) throw new Error('Erro');
    const comentarios = await res.json();
    comentariosCache = comentarios;

    if (!comentarios || comentarios.length === 0) {
      lista.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:0.8rem;">Sem comentários ainda. Seja o primeiro!</div>';
    } else {
      lista.innerHTML = comentarios.map(c => renderComentario(c)).join('');
    }

    wrap.style.display = 'block';
    inputWrap.style.display = isAuth() ? 'flex' : 'none';
  } catch (e) {
    wrap.style.display = 'none';
  }
}

function renderComentario(c) {
  const avatar = c.autor_avatar ? eznyImage(c.autor_avatar) : null;
  const inicial = (c.autor_nome || 'U').charAt(0).toUpperCase();
  const avatarHtml = avatar
    ? `<img src="${avatar}" class="modal-comentario-avatar" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="modal-comentario-avatar-placeholder" style="display:none;">${inicial}</div>`
    : `<div class="modal-comentario-avatar-placeholder">${inicial}</div>`;

  let respostasHtml = '';
  if (c.respostas && c.respostas.length > 0) {
    respostasHtml = '<div style="margin-left:42px;margin-top:8px;">' + c.respostas.map(r => {
      const rAvatar = r.autor_avatar ? eznyImage(r.autor_avatar) : null;
      const rInicial = (r.autor_nome || 'U').charAt(0).toUpperCase();
      const rAvatarHtml = rAvatar
        ? `<img src="${rAvatar}" class="modal-comentario-avatar" alt="" style="width:28px;height:28px;" onerror="this.style.display='none'"><div class="modal-comentario-avatar-placeholder" style="display:none;width:28px;height:28px;font-size:10px;">${rInicial}</div>`
        : `<div class="modal-comentario-avatar-placeholder" style="width:28px;height:28px;font-size:10px;">${rInicial}</div>`;
      return `
        <div class="modal-comentario" style="margin-bottom:8px;">
          ${rAvatarHtml}
          <div class="modal-comentario-conteudo" style="padding:8px 10px;">
            <div class="modal-comentario-nome" style="font-size:0.75rem;">${esc(r.autor_nome || 'Utilizador')}</div>
            <div class="modal-comentario-texto" style="font-size:0.8rem;">${esc(r.conteudo)}</div>
            <div class="modal-comentario-tempo">${formatarTempo(r.createdAt)}</div>
          </div>
        </div>`;
    }).join('') + '</div>';
  }

  return `
    <div class="modal-comentario">
      ${avatarHtml}
      <div style="flex:1;">
        <div class="modal-comentario-conteudo">
          <div class="modal-comentario-nome">${esc(c.autor_nome || 'Utilizador')}</div>
          <div class="modal-comentario-texto">${esc(c.conteudo)}</div>
          <div class="modal-comentario-tempo">${formatarTempo(c.createdAt)}</div>
        </div>
        ${respostasHtml}
      </div>
    </div>`;
}

function focusComentario() {
  const input = document.getElementById('inputComentario');
  if (input) {
    input.focus();
    document.getElementById('modalAnuncioScroll').scrollTo({ top: document.getElementById('modalComentariosWrap').offsetTop - 20, behavior: 'smooth' });
  }
}

async function enviarComentario() {
  if (!anuncioAtual) return;
  if (!isAuth()) { toast('Precisa iniciar sessão'); return; }

  const input = document.getElementById('inputComentario');
  const conteudo = input.value.trim();
  if (!conteudo) return;

  const btn = document.getElementById('btnEnviarComentario');
  btn.disabled = true;

  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/anuncios/${anuncioAtual.id}/comentar`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo })
    });

    if (res.ok) {
      input.value = '';
      toast('Comentário enviado!', 'success');
      carregarComentariosAnuncio(anuncioAtual.id);
      // Atualizar contador
      const countEl = document.getElementById('countComentarios');
      countEl.textContent = parseInt(countEl.textContent) + 1;
    } else {
      const data = await res.json();
      toast(data.erro || 'Erro ao comentar');
    }
  } catch (e) {
    toast('Erro ao enviar comentário');
  } finally {
    btn.disabled = false;
  }
}

/* ============================================================
   AVALIAÇÕES
   ============================================================ */

async function carregarAvaliacoes() {
  const lista = document.getElementById('listaAvaliacoes');
  try {
    const res = await fetch(`${API_URL}/premium/avaliacoes/${perfilId}`);
    if (!res.ok) throw new Error('Erro');
    const avaliacoes = await res.json();

    if (!avaliacoes || avaliacoes.length === 0) {
      lista.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-muted);font-size:0.85rem;"><i class="ph ph-star" style="font-size:32px;display:block;margin-bottom:8px;opacity:0.5;"></i>Sem avaliações ainda.</div>';
      return;
    }

    lista.innerHTML = avaliacoes.map(av => {
      const avatar = av.avaliador_avatar ? eznyImage(av.avaliador_avatar) : null;
      const inicial = (av.avaliador_nome || 'U').charAt(0).toUpperCase();
      const avatarHtml = avatar
        ? `<img src="${avatar}" class="prof-avaliacao-avatar" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="prof-avaliacao-avatar-placeholder" style="display:none;">${inicial}</div>`
        : `<div class="prof-avaliacao-avatar-placeholder">${inicial}</div>`;

      const estrelas = Array(5).fill(0).map((_, i) =>
        `<i class="ph-${i < av.estrelas ? 'fill ph-star' : 'ph-star'}"></i>`
      ).join('');

      return `
      <div class="prof-avaliacao">
        <div class="prof-avaliacao-header">
          ${avatarHtml}
          <div>
            <div class="prof-avaliacao-nome">${esc(av.avaliador_nome || 'Utilizador')}</div>
            <div class="prof-avaliacao-estrelas">${estrelas}</div>
          </div>
        </div>
        <div class="prof-avaliacao-texto">${esc(av.comentario || '')}</div>
        <div class="prof-avaliacao-tempo">${formatarTempo(av.createdAt)}</div>
      </div>`;
    }).join('');

  } catch (err) {
    lista.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-muted);">Erro ao carregar avaliações.</div>';
  }
}

function setEstrela(n) {
  estrelasSelecionadas = n;
  const btns = document.querySelectorAll('#estrelasInput button');
  btns.forEach((btn, i) => {
    btn.classList.toggle('ativo', i < n);
  });
}

async function enviarAvaliacao() {
  if (!isAuth()) { toast('Precisa iniciar sessão'); return; }
  if (estrelasSelecionadas === 0) { toast('Selecione uma avaliação (1 a 5 estrelas)'); return; }
  if (isMeuPerfil()) { toast('Não pode avaliar-se a si mesmo'); return; }

  const texto = document.getElementById('inputAvaliacao').value.trim();

  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/premium/avaliar/${perfilId}`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estrelas: estrelasSelecionadas,
        comentario: texto
      })
    });

    if (res.ok) {
      toast('Avaliação enviada com sucesso!', 'success');
      document.getElementById('inputAvaliacao').value = '';
      setEstrela(0);
      carregarAvaliacoes();
      carregarPerfil();
    } else {
      const data = await res.json();
      toast(data.erro || 'Erro ao enviar avaliação');
    }
  } catch (e) {
    toast('Erro ao enviar. Tente novamente.');
  }
}

/* ============================================================
   SEGUIR
   ============================================================ */

async function verificarSeguindo() {
  if (!isAuth() || isMeuPerfil()) return;
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/premium/seguindo/${perfilId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      const data = await res.json();
      const btn = document.getElementById('btnSeguir');
      if (btn && data.seguindo) {
        btn.classList.add('seguindo');
        btn.innerHTML = '<i class="ph-fill ph-user-check"></i> Seguindo';
      }
    }
  } catch (e) {}
}

async function toggleSeguir() {
  if (!isAuth()) { toast('Precisa iniciar sessão para seguir'); return; }
  if (isMeuPerfil()) return;

  const btn = document.getElementById('btnSeguir');

  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/premium/seguir/${perfilId}`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.seguindo) {
        btn.classList.add('seguindo');
        btn.innerHTML = '<i class="ph-fill ph-user-check"></i> Seguindo';
        toast('A seguir!', 'success');
      } else {
        btn.classList.remove('seguindo');
        btn.innerHTML = '<i class="ph-fill ph-user-plus"></i> Seguir';
        toast('Deixou de seguir');
      }
      carregarPerfil();
    } else {
      const data = await res.json();
      toast(data.erro || 'Erro ao seguir');
    }
  } catch (e) {
    toast('Erro. Tente novamente.');
  }
}

/* ============================================================
   LISTAS (SEGUIDORES / SEGUINDO)
   ============================================================ */

async function mostrarListaSeguidores() {
  await mostrarLista('seguidores', 'Seguidores', `${API_URL}/premium/seguidores/${perfilId}`);
}

async function mostrarListaSeguindo() {
  await mostrarLista('seguindo', 'A seguir', `${API_URL}/premium/seguindo-lista/${perfilId}`);
}

async function mostrarLista(tipo, titulo, endpoint) {
  const modal = document.getElementById('modalLista');
  const scroll = document.getElementById('modalListaScroll');
  document.getElementById('modalListaTitulo').innerHTML = `<i class="ph ph-users" style="color:var(--primary);"></i> ${titulo}`;

  scroll.innerHTML = '<div class="prof-loading" style="padding:40px;"><i class="ph ph-spinner animate-spin"></i><p>A carregar...</p></div>';
  modal.classList.add('aberto');
  document.body.style.overflow = 'hidden';

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('Erro');
    const lista = await res.json();

    if (!lista || lista.length === 0) {
      scroll.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);"><i class="ph ph-users" style="font-size:40px;display:block;margin-bottom:10px;opacity:0.5;"></i><p>Sem ${titulo.toLowerCase()} ainda.</p></div>`;
      return;
    }

    scroll.innerHTML = lista.map(u => {
      const avatar = u.avatar ? eznyImage(u.avatar) : null;
      const inicial = (u.nome || 'U').charAt(0).toUpperCase();
      const avatarHtml = avatar
        ? `<img src="${avatar}" class="modal-lista-avatar" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="modal-lista-avatar-placeholder" style="display:none;">${inicial}</div>`
        : `<div class="modal-lista-avatar-placeholder">${inicial}</div>`;
      const tipoConta = u.tipo_conta === 'premium' ? '<span style="color:var(--premium);"><i class="ph-fill ph-crown" style="font-size:10px;"></i></span>' : '';

      return `
        <a href="perfil-profissional.html?id=${u.id}" class="modal-lista-item" onclick="fecharModalLista()">
          ${avatarHtml}
          <div class="modal-lista-info">
            <div class="modal-lista-nome">${esc(u.nome || 'Utilizador')} ${tipoConta}</div>
            <div class="modal-lista-tipo">${u.tipo_conta === 'premium' ? 'Conta Premium' : 'Conta Normal'}</div>
          </div>
          <i class="ph ph-caret-right" style="color:var(--text-muted);"></i>
        </a>
      `;
    }).join('');

  } catch (e) {
    scroll.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Erro ao carregar.</div>';
  }
}

function fecharModalLista(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('modalLista').classList.remove('aberto');
  document.body.style.overflow = '';
}

/* ============================================================
   DENÚNCIAS
   ============================================================ */

function abrirDenunciaPerfil() {
  denunciaTipo = 'perfil';
  denunciaAlvoId = perfilId;
  document.getElementById('denunciaSub').textContent = `Descreva o motivo da denúncia contra ${esc(perfilData.nome || 'este utilizador')}`;
  document.getElementById('modalDenuncia').classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function abrirDenunciaAnuncio() {
  if (!anuncioAtual) return;
  denunciaTipo = 'anuncio';
  denunciaAlvoId = anuncioAtual.id;
  document.getElementById('denunciaSub').textContent = `Descreva o motivo da denúncia do anúncio "${esc(anuncioAtual.titulo)}"`;
  document.getElementById('modalDenuncia').classList.add('aberto');
}

function fecharModalDenuncia(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('modalDenuncia').classList.remove('aberto');
  document.body.style.overflow = '';
  document.getElementById('inputDenuncia').value = '';
}

async function enviarDenuncia() {
  if (!isAuth()) { toast('Precisa iniciar sessão'); return; }

  const tipo = document.querySelector('input[name="tipoDenuncia"]:checked')?.value || 'outro';
  const descricao = document.getElementById('inputDenuncia').value.trim();

  if (!descricao) { toast('Descreva a denúncia'); return; }

  const btn = document.getElementById('btnEnviarDenuncia');
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> A enviar...';

  try {
    const token = getToken();
    const body = {
      tipo_denuncia: tipo,
      descricao: descricao,
      usuario_reportado_id: denunciaTipo === 'perfil' ? denunciaAlvoId : null,
      anuncio_id: denunciaTipo === 'anuncio' ? denunciaAlvoId : null
    };

    const res = await fetch(`${API_URL}/denuncias/criar`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      toast('Denúncia enviada com sucesso. Analisaremos em breve.', 'success');
      fecharModalDenuncia();
    } else {
      const data = await res.json();
      toast(data.erro || data.error || 'Erro ao enviar denúncia');
    }
  } catch (e) {
    toast('Erro ao enviar denúncia');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph-fill ph-paper-plane-right"></i> Enviar Denúncia';
  }
}

/* ============================================================
   CHAT
   ============================================================ */

function iniciarChat() {
  if (!isAuth()) { toast('Precisa iniciar sessão para enviar mensagem'); return; }
  if (isMeuPerfil()) { toast('Não pode enviar mensagem para si mesmo'); return; }
  window.location.href = `mensagens.html?novo=${perfilId}`;
}

/* ============================================================
   TABS
   ============================================================ */

function mudarTab(tab, el) {
  tabAtual = tab;
  document.querySelectorAll('.prof-tab').forEach(t => t.classList.remove('ativo'));
  document.querySelectorAll('.prof-tab-conteudo').forEach(t => t.classList.remove('ativo'));

  if (el) el.classList.add('ativo');
  else {
    const tabs = document.querySelectorAll('.prof-tab');
    if (tab === 'publicacoes') tabs[0].classList.add('ativo');
    if (tab === 'sobre') tabs[1].classList.add('ativo');
    if (tab === 'avaliacoes') tabs[2].classList.add('ativo');
  }

  document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('ativo');
}

/* ============================================================
   EDITAR PERFIL — UPLOAD REAL
   ============================================================ */

function abrirModalEditar() {
  if (!isMeuPerfil() || !perfilData) {
    toast('Apenas pode editar o seu próprio perfil');
    return;
  }

  const p = perfilData;

  document.getElementById('editarNome').value = p.nome || '';
  document.getElementById('editarBio').value = p.descricao || '';
  document.getElementById('editarLocal').value = p.localizacao || '';
  document.getElementById('editarTelefone').value = p.telefone_whatsapp || '';
  document.getElementById('editarEmail').value = p.email || '';
  document.getElementById('editarWebsite').value = p.website || '';
  document.getElementById('editarCategoria').value = p.categoria_negocio || '';
  document.getElementById('editarHorario').value = p.horario_funcionamento || '';

  const capaWrap = document.getElementById('editarCapaWrap');
  const capaPreview = document.getElementById('editarCapaPreview');
  if (p.foto_capa) {
    capaPreview.src = p.foto_capa.startsWith('http') ? p.foto_capa : eznyImage(p.foto_capa);
    capaPreview.style.display = 'block';
    capaWrap.classList.add('tem-imagem');
    document.getElementById('editarCapaIcon').style.display = 'none';
    document.getElementById('editarCapaText').style.display = 'none';
  } else {
    capaPreview.style.display = 'none';
    capaWrap.classList.remove('tem-imagem');
    document.getElementById('editarCapaIcon').style.display = 'block';
    document.getElementById('editarCapaText').style.display = 'block';
  }

  const avatarPreview = document.getElementById('editarAvatarPreview');
  const avatarPlaceholder = document.getElementById('editarAvatarPlaceholder');
  if (p.avatar) {
    avatarPreview.src = p.avatar.startsWith('http') ? p.avatar : eznyImage(p.avatar);
    avatarPreview.style.display = 'block';
    avatarPlaceholder.style.display = 'none';
  } else {
    avatarPreview.style.display = 'none';
    avatarPlaceholder.style.display = 'flex';
    avatarPlaceholder.textContent = (p.nome || 'U').charAt(0).toUpperCase();
  }

  capaFile = null;
  avatarFile = null;

  document.getElementById('modalEditar').classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function fecharModalEditar(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('modalEditar').classList.remove('aberto');
  document.body.style.overflow = '';
}

function previewCapa(input) {
  if (!input.files || !input.files[0]) return;
  capaFile = input.files[0];

  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('editarCapaPreview');
    preview.src = e.target.result;
    preview.style.display = 'block';
    document.getElementById('editarCapaWrap').classList.add('tem-imagem');
    document.getElementById('editarCapaIcon').style.display = 'none';
    document.getElementById('editarCapaText').style.display = 'none';
  };
  reader.readAsDataURL(capaFile);
}

function previewAvatar(input) {
  if (!input.files || !input.files[0]) return;
  avatarFile = input.files[0];

  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('editarAvatarPreview');
    preview.src = e.target.result;
    preview.style.display = 'block';
    document.getElementById('editarAvatarPlaceholder').style.display = 'none';
  };
  reader.readAsDataURL(avatarFile);
}

async function salvarPerfil() {
  const btn = document.getElementById('btnSalvarPerfil');
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> A salvar...';

  try {
    const token = getToken();
    if (!token) { toast('Sessão expirada'); btn.disabled = false; return; }

    const formData = new FormData();

    formData.append('nome', document.getElementById('editarNome').value.trim());
    formData.append('descricao', document.getElementById('editarBio').value.trim());
    formData.append('localizacao', document.getElementById('editarLocal').value.trim());
    formData.append('telefone_whatsapp', document.getElementById('editarTelefone').value.trim());
    formData.append('email', document.getElementById('editarEmail').value.trim());
    formData.append('website', document.getElementById('editarWebsite').value.trim());
    formData.append('categoria_negocio', document.getElementById('editarCategoria').value.trim());
    formData.append('horario_funcionamento', document.getElementById('editarHorario').value.trim());

    if (capaFile) formData.append('foto_capa', capaFile);
    if (avatarFile) formData.append('avatar', avatarFile);

    console.log('[UPLOAD] A enviar perfil...');

    const res = await fetch(`${API_URL}/premium/perfil`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      console.log('[UPLOAD] Sucesso:', data);
      toast('Perfil atualizado com sucesso!', 'success');
      fecharModalEditar();
      setTimeout(() => carregarPerfil(), 500);
    } else {
      const data = await res.json().catch(() => ({}));
      console.error('[UPLOAD] Erro:', data);
      toast(data.erro || 'Erro ao atualizar perfil');
    }
  } catch (e) {
    console.error('[UPLOAD] Exception:', e);
    toast('Erro ao salvar. Tente novamente.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph-fill ph-floppy-disk"></i> Salvar Alterações';
  }
}

/* ============================================================
   MENU / LISTAS
   ============================================================ */

function toggleMenu() {
  if (!isMeuPerfil()) return;
  abrirModalEditar();
}

/* ============================================================
   ERRO
   ============================================================ */

function mostrarErro() {
  document.getElementById('profLoading').style.display = 'none';
  document.getElementById('profConteudo').style.display = 'none';
  document.getElementById('profErro').style.display = 'block';
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

function formatarPreco(p) {
  if (p == null || p === 0) return 'Sob consulta';
  return new Intl.NumberFormat('pt-AO', { style:'currency', currency:'AOA', minimumFractionDigits:0 }).format(p);
}

function formatarData(dataStr) {
  if (!dataStr) return '';
  const d = new Date(dataStr);
  if (isNaN(d)) return String(dataStr);
  return d.toLocaleDateString('pt-PT', { day:'numeric', month:'long', year:'numeric' });
}

function formatarTempo(dataStr) {
  if (!dataStr) return 'Agora';
  const d = new Date(dataStr);
  if (isNaN(d)) return String(dataStr);
  const agora = new Date();
  const diff = Math.floor((agora - d) / 1000);
  if (diff < 60) return 'Agora';
  if (diff < 3600) return Math.floor(diff/60) + ' min atrás';
  if (diff < 86400) return Math.floor(diff/3600) + 'h atrás';
  if (diff < 604800) return Math.floor(diff/86400) + 'd atrás';
  return formatarData(dataStr);
}

// Fechar modais com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    fecharModalAnuncio();
    fecharModalEditar();
    fecharModalLista();
    fecharModalDenuncia();
  }
});
