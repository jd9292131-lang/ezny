
// =========================
// CONFIG
// =========================
const API_URL = window.location.origin + '/api';  
const MAX_IMAGENS = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// =========================
// CAMPOS POR CATEGORIA — Alinhados com o backend
// =========================
const CATEGORIA_CONFIG = window.EZNY_CATEGORIAS;

// =========================
// ESTADO
// =========================
let categoriaAtual = null;
let imagensSelecionadas = [];
let userData = null;
let isPremium = false;

// =========================
// INIT
// =========================
document.addEventListener('DOMContentLoaded', () => {
  if (!protegerPagina()) return;

  carregarDadosUtilizador();

  const catSalva = localStorage.getItem('categoriaAnuncio');
  if (catSalva && CATEGORIA_CONFIG[catSalva]) {
    document.getElementById('categoria').value = catSalva;
    handleCategoriaChange();
  }
});

// =========================
// CARREGAR DADOS DO UTILIZADOR
// =========================
function carregarDadosUtilizador() {
  try {
    const raw = localStorage.getItem('userData');
    if (raw) {
      userData = JSON.parse(raw);
      isPremium = userData.tipo_conta === 'premium';

      // Atualizar preview com dados do utilizador
      atualizarPreviewUser();

      // Atualizar texto do botão
      const btnTexto = document.getElementById('btnTexto');
      if (isPremium) {
        btnTexto.textContent = 'Publicar Anúncio';
      } else {
        btnTexto.textContent = 'Enviar para Aprovação';
      }
    }
  } catch (e) {
    console.error('Erro ao carregar dados do utilizador:', e);
  }
}

function atualizarPreviewUser() {
  if (!userData) return;

  const nome = userData.nome || userData.telefone || 'Utilizador';
  const inicial = nome.charAt(0).toUpperCase();

  document.getElementById('previewUserNome').innerHTML = 
    esc(nome) + ' <span class="preview-user-tipo ' + (isPremium ? 'premium' : 'normal') + '">' + 
    (isPremium ? 'Premium' : 'Normal') + '</span>';

  const avatarWrap = document.getElementById('previewAvatarWrap');
  if (userData.avatar) {
    avatarWrap.innerHTML = '<img src="' + eznyImage(userData.avatar) + '" class="preview-avatar" alt="" onerror="this.style.display=\'none\';var p=document.getElementById(\'previewAvatarPlaceholder\');if(p)p.style.display=\'flex\';">' +
      '<div class="preview-avatar-placeholder" id="previewAvatarPlaceholder" style="display:none;">' + inicial + '</div>';
  } else {
    avatarWrap.innerHTML = '<div class="preview-avatar-placeholder">' + inicial + '</div>';
  }

  const statusEl = document.getElementById('previewStatus');
  if (isPremium) {
    statusEl.className = 'preview-status-badge publicado';
    statusEl.innerHTML = '<i class="ph ph-check-circle"></i> Publicado direto';
  } else {
    statusEl.className = 'preview-status-badge pendente';
    statusEl.innerHTML = '<i class="ph ph-clock"></i> Pendente de aprovação';
  }
}

// =========================
// PROTEGER PÁGINA
// =========================
function protegerPagina() {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');

  if (!token || !userData) {
    mostrarToast('Precisa iniciar sessão para aceder a esta página', 'error');
    setTimeout(() => { window.location.href = 'auth.html'; }, 2000);
    return false;
  }
  return true;
}

function getToken() {
  return localStorage.getItem('token');
}

// =========================
// CATEGORIA CHANGE
// =========================
function handleCategoriaChange() {
  const categoria = document.getElementById('categoria').value;

  if (!categoria || !CATEGORIA_CONFIG[categoria]) {
    document.getElementById('camposDinamicos').innerHTML = '';
    document.getElementById('categoriaBadge').style.display = 'none';
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('previewCard').classList.remove('visivel');
    categoriaAtual = null;
    localStorage.removeItem('categoriaAnuncio');
    atualizarSteps(1);
    return;
  }

  categoriaAtual = categoria;
  localStorage.setItem('categoriaAnuncio', categoria);

  const config = CATEGORIA_CONFIG[categoria];

  document.getElementById('categoriaBadge').style.display = 'inline-flex';
  document.getElementById('categoriaLabel').textContent = config.label;

  renderizarCampos(config.campos);

  // Mostrar seção de upload
  document.getElementById('uploadSection').style.display = 'block';

  // Mostrar preview card
  document.getElementById('previewCard').classList.add('visivel');

  // Atualizar steps
  atualizarSteps(2);

  // Atualizar preview
  atualizarPreview();
}

function renderizarCampos(campos) {
  const html = campos.map((campo, index) => {
    const required = campo.required ? ' *' : '';
    const id = campo.name;
    let inputTag;
    if (campo.type === 'textarea') {
      inputTag = `<textarea id="${id}" placeholder="${esc(campo.placeholder || '')}" ${campo.required ? 'required' : ''} oninput="atualizarPreview()"></textarea>`;
    } else if (campo.type === 'select') {
      inputTag = `<select id="${id}" ${campo.required ? 'required' : ''} onchange="atualizarPreview()"><option value="">${esc(campo.placeholder || 'Selecionar')}</option>${(campo.options || []).map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select>`;
    } else if (campo.type === 'checkbox') {
      inputTag = `<label class="checkbox-field"><input type="checkbox" id="${id}" onchange="atualizarPreview()"><span>${esc(campo.label)}</span></label>`;
    } else {
      inputTag = `<input type="${campo.type}" id="${id}" placeholder="${esc(campo.placeholder || '')}" ${campo.required ? 'required' : ''}${campo.min != null ? ` min="${campo.min}"` : ''}${campo.max != null ? ` max="${campo.max}"` : ''}${campo.step != null ? ` step="${campo.step}"` : ''} oninput="atualizarPreview()">`;
    }
    return `<div class="form-group ${campo.type === 'textarea' ? 'full-width' : ''}" style="animation-delay:${index * .03}s"><label>${esc(campo.label)}${required}</label>${inputTag}</div>`;
  }).join('');
  document.getElementById('camposDinamicos').innerHTML = `<div class="dynamic-fields-grid">${html}</div>`;
}

function getCamposCategoria() {
  return categoriaAtual && CATEGORIA_CONFIG[categoriaAtual] ? CATEGORIA_CONFIG[categoriaAtual].campos : [];
}

// =========================
// ATUALIZAR STEPS
// =========================
function atualizarSteps(passo) {
  // Reset all steps
  for (let i = 1; i <= 4; i++) {
    document.getElementById('step' + i).classList.remove('ativo', 'completo');
    if (i < 4) document.getElementById('line' + i).classList.remove('completo');
  }

  // Mark completed steps
  for (let i = 1; i < passo; i++) {
    document.getElementById('step' + i).classList.add('completo');
    if (i < 4) document.getElementById('line' + i).classList.add('completo');
  }

  // Mark active step
  document.getElementById('step' + passo).classList.add('ativo');
}

// =========================
// ATUALIZAR PREVIEW EM TEMPO REAL
// =========================
function atualizarPreview() {
  const campos = getCamposCategoria();

  // Título
  const titleEl = document.getElementById('title');
  document.getElementById('previewTitulo').textContent = titleEl && titleEl.value.trim() 
    ? titleEl.value.trim() 
    : 'Título do anúncio';

  // Preço
  const priceEl = document.getElementById('price');
  const preco = priceEl && priceEl.value ? parseFloat(priceEl.value) : 0;
  document.getElementById('previewPreco').textContent = formatarPreco(preco);

  // Categoria
  const config = CATEGORIA_CONFIG[categoriaAtual];
  if (config) {
    document.getElementById('previewCategoria').innerHTML = 
      '<i class="ph ' + config.icon + '"></i> ' + config.label;
  }

  // Descrição
  const descEl = document.getElementById('descricao');
  document.getElementById('previewDescricao').textContent = descEl && descEl.value.trim() 
    ? descEl.value.trim() 
    : 'Descrição do anúncio...';

  // Especificações: apenas campos realmente definidos para esta categoria.
  let metaHtml = '';
  for (const campo of campos) {
    if (['title','price','descricao','negociavel'].includes(campo.name)) continue;
    const el = document.getElementById(campo.name);
    if (!el) continue;
    const value = campo.type === 'checkbox' ? (el.checked ? 'Sim' : '') : String(el.value || '').trim();
    if (value) metaHtml += '<div class="preview-meta-item"><strong>' + esc(campo.label) + ':</strong> ' + esc(value) + '</div>';
  }
  document.getElementById('previewMetaGrid').innerHTML = metaHtml;

  // Imagem preview
  if (imagensSelecionadas.length > 0) {
    const imgEl = document.getElementById('previewImagem');
    imgEl.src = imagensSelecionadas[0].preview;
    imgEl.style.display = 'block';
  }

  // Atualizar steps baseado no preenchimento
  if (imagensSelecionadas.length > 0) {
    atualizarSteps(4);
  } else if (titleEl && titleEl.value.trim() && priceEl && priceEl.value) {
    atualizarSteps(3);
  }
}

// =========================
// UPLOAD DE IMAGENS
// =========================
function handleImageUpload(files) {
  if (!files || files.length === 0) return;

  const restante = MAX_IMAGENS - imagensSelecionadas.length;
  if (restante <= 0) {
    mostrarToast('Limite de ' + MAX_IMAGENS + ' imagens atingido', 'error');
    return;
  }

  const arquivosValidos = Array.from(files).slice(0, restante).filter(file => {
    if (!file.type.startsWith('image/')) {
      mostrarToast('"' + file.name + '" não é uma imagem válida', 'error');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      mostrarToast('"' + file.name + '" excede 5MB', 'error');
      return false;
    }
    return true;
  });

  if (arquivosValidos.length === 0) return;
arquivosValidos.forEach(file => {
  const preview = URL.createObjectURL(file);

  imagensSelecionadas.push({
    file: file,
    preview: preview,
    name: file.name
  });

  renderizarPreviews();
  atualizarPreview();
});
}

function renderizarPreviews() {
  const grid = document.getElementById('previewGrid');
  const area = document.getElementById('uploadArea');
  const counter = document.getElementById('uploadCounter');

  if (imagensSelecionadas.length === 0) {
    grid.innerHTML = '';
    area.classList.remove('has-files');
    counter.textContent = '';
    document.getElementById('previewImagem').style.display = 'none';
    return;
  }

  area.classList.add('has-files');
  counter.textContent = imagensSelecionadas.length + '/' + MAX_IMAGENS + ' fotos';

  grid.innerHTML = imagensSelecionadas.map((img, index) => 
    '<div class="preview-item" style="animation: fadeIn 0.3s ease ' + (index * 0.05) + 's both;">' +
      '<img src="' + img.preview + '" alt="Preview ' + (index + 1) + '">' +
      '<button type="button" class="preview-remove" onclick="removerImagem(' + index + ')" title="Remover">' +
        '<i class="ph ph-x"></i>' +
      '</button>' +
      '<div class="preview-overlay">' + img.name + '</div>' +
    '</div>'
  ).join('');
}

function removerImagem(index) {
  const imagem = imagensSelecionadas[index];
  if (imagem?.preview?.startsWith('blob:')) {
    URL.revokeObjectURL(imagem.preview);
  }

  imagensSelecionadas.splice(index, 1);
  renderizarPreviews();
  atualizarPreview();
}
// =========================
// VALIDAR
// =========================
function validarFormulario() {
  const campos = getCamposCategoria();

  if (!categoriaAtual) {
    mostrarToast('Selecione uma categoria', 'error');
    return false;
  }

  for (const campo of campos) {
    if (campo.required) {
      const el = document.getElementById(campo.name);
      if (!el || !el.value.trim()) {
        mostrarToast('O campo "' + campo.label + '" é obrigatório', 'error');
        el.focus();
        return false;
      }
    }
  }

  return true;
}

// =========================
// CRIAR ANÚNCIO (FETCH)
// =========================
async function criarAnuncio() {
  const formData = new FormData();
  const atributos = {};
  const campos = getCamposCategoria();
  const legacyFields = new Set(['marca','estado','contacto','ano','quilometragem','combustivel','caixa','tracao','cor','portas','lotacao','versao','modelo','localizacao','negociavel','equipamentos']);
  for (const campo of campos) {
    const el = document.getElementById(campo.name);
    if (!el) continue;
    const value = campo.type === 'checkbox' ? !!el.checked : String(el.value || '').trim();
    if (value !== '' && value !== false) atributos[campo.name] = value;
    if (campo.name === 'title' || campo.name === 'price' || campo.name === 'descricao' || legacyFields.has(campo.name)) {
      formData.append(campo.name, String(value));
    }
  }
  formData.append('categoria', categoriaAtual);
  formData.append('atributos', JSON.stringify(atributos));
  const ficheirosComprimidos = await Promise.all(imagensSelecionadas.map(img => window.eznyCompressImage(img.file)));
  ficheirosComprimidos.forEach(file => formData.append('imagens', file));

  const res = await fetch(API_URL + '/anuncios', { method:'POST', headers:{'Authorization':'Bearer '+getToken()}, body:formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.erro || `Erro ao criar anúncio (HTTP ${res.status})`);
  return data;
}

// =========================
// PUBLICAR
// =========================
async function publicar() {
  if (!validarFormulario()) return;

  const btn = document.getElementById('publicarBtn');
  setLoading(btn, true);

  try {
    const resultado = await criarAnuncio();
    console.log('[FRONTEND] Anúncio criado com sucesso:', resultado);

    const msg = resultado.premium 
      ? 'Anúncio publicado com sucesso! Já está visível para todos.' 
      : 'Anúncio enviado para aprovação! Receberás uma notificação quando for publicado.';

    mostrarToast(msg, 'success');

    // Limpar estado
    imagensSelecionadas = [];
    localStorage.removeItem('categoriaAnuncio');

    setTimeout(() => { 
      window.location.href = resultado.premium ? 'index.html' : 'meus-anuncios.html'; 
    }, 2500);
  } catch (err) {
    console.error('[FRONTEND] Erro ao publicar:', err);
    mostrarToast(err.message || 'Erro ao publicar', 'error');
    setLoading(btn, false);
  }
}

// =========================
// UTILS
// =========================
function setLoading(botao, ativo) {
  if (ativo) {
    botao.classList.add('btn-loading');
    botao.disabled = true;
  } else {
    botao.classList.remove('btn-loading');
    botao.disabled = false;
  }
}

function mostrarToast(mensagem, tipo) {
  const toast = document.getElementById('toast');
  if (toast._timeout) clearTimeout(toast._timeout);

  toast.className = 'toast toast-' + tipo;
  toast.textContent = mensagem;
  toast.classList.add('show');

  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

function esc(t) {
  if (t == null) return '';
  const d = document.createElement('div');
  d.textContent = String(t);
  return d.innerHTML;
}

function formatarPreco(p) {
  if (p == null || isNaN(p) || p <= 0) return 'Sob consulta';
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0 }).format(p);
}

function carregarTema() {
  const temaSalvo = localStorage.getItem('theme');
  const isDark = temaSalvo !== 'light';
  document.body.classList.toggle('light-theme', !isDark);
}
document.addEventListener('DOMContentLoaded', carregarTema);
