
/**
 * ═══════════════════════════════════════════════════
 *  DEFINIÇÕES DA CONTA - EZNY
 *  Módulo de gestão de definições do utilizador
 * ═══════════════════════════════════════════════════
 */

// ─── Constantes ───────────────────────────────────
const STORAGE_KEY = 'userData';
const TOKEN_KEY = 'token';
const REDIRECT_UNAUTH = 'auth.html';
const REDIRECT_HOME = 'index.html';
const REDIRECT_SETTINGS = 'settings.html';

// ─── Estado da Aplicação ──────────────────────────
const AppState = {
  userData: null,
  isModalOpen: false
};

// ─── DOM Elements Cache ───────────────────────────
const DOM = {
  avatar: document.getElementById('avatar'),
  nomeUser: document.getElementById('nomeUser'),
  emailUser: document.getElementById('emailUser'),
  nome: document.getElementById('nome'),
  telefone: document.getElementById('telefone'),
  email: document.getElementById('email'),
  dataCriacao: document.getElementById('dataCriacao'),
  statusVerificacao: document.getElementById('statusVerificacao'),
  verificadoBadge: document.getElementById('verificadoBadge'),
  modalLogout: document.getElementById('modalLogout'),
  modalEditar: document.getElementById('modalEditar'),
  modalPassword: document.getElementById('modalPassword'),
  toast: document.getElementById('toast'),
  toastText: document.getElementById('toastText'),
  editNome: document.getElementById('editNome'),
  editEmail: document.getElementById('editEmail'),
  editTelefone: document.getElementById('editTelefone'),
  btnSalvarPerfil: document.getElementById('btnSalvarPerfil'),
  btnSalvarPassword: document.getElementById('btnSalvarPassword')
};

// ═══════════════════════════════════════════════════
//  INICIALIZAÇÃO
// ═══════════════════════════════════════════════════

(function init() {
  carregarDadosUtilizador();
  preencherInterface();
  configurarEventos();
})();

// ═══════════════════════════════════════════════════
//  FUNÇÕES PRINCIPAIS
// ═══════════════════════════════════════════════════

/**
 * Carrega os dados do utilizador do localStorage
 * Redireciona para auth se não autenticado
 */
function carregarDadosUtilizador() {
  try {
    const dados = localStorage.getItem(STORAGE_KEY);

    if (!dados) {
      mostrarToast('Sessão expirada. Redirecionando...', 'error', 2000);
      setTimeout(() => redirecionar(REDIRECT_UNAUTH), 2000);
      return;
    }

    AppState.userData = JSON.parse(dados);
  } catch (erro) {
    console.error('Erro ao carregar dados do utilizador:', erro);
    mostrarToast('Erro ao carregar dados. Por favor, inicie sessão novamente.', 'error');
    setTimeout(() => redirecionar(REDIRECT_UNAUTH), 2000);
  }
}

/**
 * Preenche todos os campos da interface com os dados do utilizador
 */
function preencherInterface() {
  if (!AppState.userData) return;

  const { nome, telefone, email, createdAt, verificado } = AppState.userData;

  // Atualizar elementos do perfil
  DOM.nomeUser.textContent = nome || 'Utilizador';
  DOM.emailUser.textContent = email || 'Sem email';

  // Avatar com inicial do nome
  const inicial = nome ? nome.charAt(0).toUpperCase() : 'U';
  DOM.avatar.innerHTML = `
    <span style="font-size:1.8rem;font-weight:700">${inicial}</span>
    <div class="avatar-edit">
      <span class="material-icons" style="font-size:1.2rem;color:white">photo_camera</span>
    </div>
  `;

  // Atualizar informações
  atualizarCampo(DOM.nome, nome);
  atualizarCampo(DOM.telefone, telefone);
  atualizarCampo(DOM.email, email);

  // Data de criação
  if (createdAt) {
    const data = new Date(createdAt);
    DOM.dataCriacao.textContent = data.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } else {
    DOM.dataCriacao.textContent = 'N/A';
  }

  // Badge de verificado
  if (verificado) {
    DOM.verificadoBadge.style.display = 'inline-flex';
    DOM.statusVerificacao.textContent = 'Verificado';
    DOM.statusVerificacao.style.color = 'var(--success)';
  } else {
    DOM.verificadoBadge.style.display = 'none';
    DOM.statusVerificacao.textContent = 'Pendente';
    DOM.statusVerificacao.style.color = 'var(--warning)';
  }

  // Preencher modal de edição
  DOM.editNome.value = nome || '';
  DOM.editEmail.value = email || '';
  DOM.editTelefone.value = telefone || '';
}

/**
 * Atualiza um campo de informação, gerindo o estado vazio
 */
function atualizarCampo(elemento, valor) {
  const temValor = valor && String(valor).trim() !== '';
  elemento.textContent = temValor ? valor : '-';
  elemento.classList.toggle('info-row__value--empty', !temValor);
}

/**
 * Configura eventos globais (teclado, cliques fora do modal, etc.)
 */
function configurarEventos() {
  // Fechar modal com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && AppState.isModalOpen) {
      fecharTodosModais();
    }
  });

  // Fechar modal ao clicar fora
  [DOM.modalLogout, DOM.modalEditar, DOM.modalPassword].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) fecharTodosModais();
    });
  });
}

// ═══════════════════════════════════════════════════
//  MODAIS
// ═══════════════════════════════════════════════════

function abrirModal(modal) {
  AppState.isModalOpen = true;
  modal.classList.add('modal--visible');
  document.body.style.overflow = 'hidden';
}

function fecharModal(modal) {
  AppState.isModalOpen = false;
  modal.classList.remove('modal--visible');
  document.body.style.overflow = '';
}

function fecharTodosModais() {
  fecharModal(DOM.modalLogout);
  fecharModal(DOM.modalEditar);
  fecharModal(DOM.modalPassword);
}

function abrirModalEditar() {
  abrirModal(DOM.modalEditar);
  DOM.editNome.focus();
}

function fecharModalEditar() {
  fecharModal(DOM.modalEditar);
}

function abrirModalPassword() {
  abrirModal(DOM.modalPassword);
  document.getElementById('currentPassword').focus();
}

function fecharModalPassword() {
  fecharModal(DOM.modalPassword);
  document.getElementById('formPassword').reset();
}

// ═══════════════════════════════════════════════════
//  AÇÕES DO UTILIZADOR
// ═══════════════════════════════════════════════════

/**
 * Salva alterações do perfil
 */
async function salvarPerfil(evento) {
  evento.preventDefault();

  const nome = DOM.editNome.value.trim();
  const email = DOM.editEmail.value.trim();
  const telefone = DOM.editTelefone.value.trim();

  if (!nome || !telefone) {
    mostrarToast('Nome e telefone são obrigatórios', 'error');
    return;
  }

  // Loading
  DOM.btnSalvarPerfil.classList.add('loading');
  DOM.btnSalvarPerfil.disabled = true;

  try {
    // Simular envio (substituir pelo endpoint real)
    // const token = localStorage.getItem(TOKEN_KEY);
    // const resposta = await fetch('/api/user/update', {
    //   method: 'PUT',
    //   headers: { 
    //     'Content-Type': 'application/json',
    //     'Authorization': 'Bearer ' + token 
    //   },
    //   body: JSON.stringify({ nome, email, telefone })
    // });

    await new Promise(r => setTimeout(r, 1000));

    // Atualizar localStorage
    AppState.userData = { ...AppState.userData, nome, email, telefone };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState.userData));

    // Atualizar UI
    preencherInterface();
    fecharModalEditar();
    mostrarToast('Perfil atualizado com sucesso!', 'success');

  } catch (erro) {
    console.error('Erro ao atualizar perfil:', erro);
    mostrarToast('Erro ao atualizar perfil. Tente novamente.', 'error');
  } finally {
    DOM.btnSalvarPerfil.classList.remove('loading');
    DOM.btnSalvarPerfil.disabled = false;
  }
}

/**
 * Salva nova palavra-passe
 */
async function salvarPassword(evento) {
  evento.preventDefault();

  const atual = document.getElementById('currentPassword').value;
  const nova = document.getElementById('newPassword').value;
  const confirmar = document.getElementById('confirmPassword').value;

  if (nova.length < 6) {
    mostrarToast('A palavra-passe deve ter pelo menos 6 caracteres', 'error');
    return;
  }

  if (nova !== confirmar) {
    mostrarToast('As palavras-passe não coincidem', 'error');
    return;
  }

  // Loading
  DOM.btnSalvarPassword.classList.add('loading');
  DOM.btnSalvarPassword.disabled = true;

  try {
    // Simular envio
    await new Promise(r => setTimeout(r, 1000));

    fecharModalPassword();
    mostrarToast('Palavra-passe alterada com sucesso!', 'success');

  } catch (erro) {
    console.error('Erro ao alterar password:', erro);
    mostrarToast('Erro ao alterar palavra-passe', 'error');
  } finally {
    DOM.btnSalvarPassword.classList.remove('loading');
    DOM.btnSalvarPassword.disabled = false;
  }
}

/**
 * Abre o modal de confirmação de logout
 */
function logout() {
  abrirModal(DOM.modalLogout);
  const cancelBtn = DOM.modalLogout.querySelector('.btn--cancel');
  if (cancelBtn) cancelBtn.focus();
}

function fecharModalLogout() {
  fecharModal(DOM.modalLogout);
}

function confirmarLogout() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    mostrarToast('Sessão terminada com sucesso', 'success');
    setTimeout(() => redirecionar(REDIRECT_HOME), 800);
  } catch (erro) {
    console.error('Erro ao terminar sessão:', erro);
    redirecionar(REDIRECT_HOME);
  }
}

/**
 * Elimina a conta do utilizador (com confirmação dupla)
 */
async function eliminarConta() {
  const confirmacao1 = confirm(
    "⚠️ Esta ação é irreversível.\n\nDeseja eliminar a sua conta?"
  );
  if (!confirmacao1) return;

  const confirmacao2 = confirm(
    "Todos os seus anúncios e dados serão removidos.\n\nContinuar?"
  );
  if (!confirmacao2) return;

  try {
    const token = localStorage.getItem(TOKEN_KEY);

    // const resposta = await fetch("/api/auth/delete-account", { 
    //   method: "DELETE",
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    // const data = await resposta.json();
    // if (data.erro) { mostrarToast(data.erro, 'error'); return; }

    await new Promise(r => setTimeout(r, 500));

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    mostrarToast('Conta eliminada com sucesso', 'success');
    setTimeout(() => redirecionar('auth.html'), 1000);

  } catch (erro) {
    console.error(erro);
    mostrarToast('Erro ao comunicar com o servidor', 'error');
  }
}

/**
 * Editar avatar (placeholder)
 */
function editarAvatar() {
  mostrarToast('Funcionalidade de avatar em desenvolvimento');
}

// ═══════════════════════════════════════════════════
//  UTILITÁRIOS
// ═══════════════════════════════════════════════════

/**
 * Redireciona para uma página com segurança
 */
function redirecionar(url) {
  window.location.href = url;
}

/**
 * Mostra uma notificação toast temporária
 */
function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
  DOM.toastText.textContent = mensagem;
  DOM.toast.className = `toast toast--visible toast-${tipo}`;

  const icones = {
    success: 'check_circle',
    error: 'error',
    info: 'info'
  };
  DOM.toast.querySelector('.material-icons').textContent = icones[tipo] || 'info';

  setTimeout(() => {
    DOM.toast.classList.remove('toast--visible');
  }, duracao);
}
