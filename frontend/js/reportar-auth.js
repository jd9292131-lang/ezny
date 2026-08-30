
/**
 * ═══════════════════════════════════════════════════
 *  REPORTAR PROBLEMA - EZNY
 *  Formulário de reporte de bugs e problemas
 * ═══════════════════════════════════════════════════
 */

// ─── Estado ───────────────────────────────────────
let tipoSelecionado = null;
let ficheiroSelecionado = null;

const DOM = {
  form: document.getElementById('reportForm'),
  tipoProblema: document.getElementById('tipoProblema'),
  statusMessage: document.getElementById('statusMessage'),
  statusText: document.getElementById('statusText'),
  btnEnviar: document.getElementById('btnEnviar'),
  fileUpload: document.getElementById('fileUpload'),
  fileName: document.getElementById('fileName'),
  toast: document.getElementById('toast'),
  toastText: document.getElementById('toastText')
};

// ═══════════════════════════════════════════════════
//  FUNÇÕES
// ═══════════════════════════════════════════════════

/**
 * Seleciona o tipo de problema via cards
 */
function selecionarTipo(elemento) {
  // Remover seleção anterior
  document.querySelectorAll('.issue-type').forEach(el => el.classList.remove('selected'));

  // Adicionar seleção ao clicado
  elemento.classList.add('selected');

  // Atualizar select
  const tipo = elemento.dataset.type;
  DOM.tipoProblema.value = tipo;
  tipoSelecionado = tipo;
}

/**
 * Sincroniza cards com select
 */
DOM.tipoProblema.addEventListener('change', function() {
  const valor = this.value;
  document.querySelectorAll('.issue-type').forEach(el => {
    el.classList.toggle('selected', el.dataset.type === valor);
  });
});

/**
 * Handler de seleção de ficheiro
 */
function handleFileSelect(input) {
  const file = input.files[0];
  if (!file) return;

  // Validar tamanho (5MB)
  if (file.size > 5 * 1024 * 1024) {
    mostrarStatus('O ficheiro excede o limite de 5MB.', 'error');
    input.value = '';
    return;
  }

  ficheiroSelecionado = file;
  DOM.fileUpload.classList.add('has-file');
  DOM.fileName.textContent = `✓ ${file.name} (${formatarTamanho(file.size)})`;
  mostrarStatus('Ficheiro anexado com sucesso.', 'success');
}

/**
 * Formata tamanho do ficheiro
 */
function formatarTamanho(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Mostra mensagem de status
 */
function mostrarStatus(mensagem, tipo) {
  DOM.statusMessage.className = `status-message ${tipo} show`;
  DOM.statusText.textContent = mensagem;

  setTimeout(() => {
    DOM.statusMessage.classList.remove('show');
  }, 5000);
}

/**
 * Mostra toast
 */
function mostrarToast(mensagem, tipo = 'info') {
  DOM.toastText.textContent = mensagem;
  DOM.toast.className = `toast toast--visible toast-${tipo}`;

  const icones = {
    success: 'check-circle',
    error: 'warning-circle',
    info: 'info'
  };
  const toastIcon = DOM.toast.querySelector('i.ph');
  if (toastIcon) {
    toastIcon.className = 'ph-fill ph-' + (icones[tipo] || 'info');
  }

  setTimeout(() => {
    DOM.toast.classList.remove('toast--visible');
  }, 4000);
}

/**
 * Envia o formulário
 */
async function enviarReport(evento) {
  evento.preventDefault();

  const formData = new FormData(DOM.form);

  // Validações
  const titulo = formData.get('titulo').trim();
  const descricao = formData.get('descricao').trim();

  if (titulo.length < 5) {
    mostrarStatus('O título deve ter pelo menos 5 caracteres.', 'error');
    return;
  }

  if (descricao.length < 20) {
    mostrarStatus('A descrição deve ter pelo menos 20 caracteres.', 'error');
    return;
  }

  // Mostrar loading
  DOM.btnEnviar.classList.add('loading');
  DOM.btnEnviar.disabled = true;

  try {
    // Simular envio (substituir pelo endpoint real)
    // const resposta = await fetch('/api/suporte/reportar', {
    //   method: 'POST',
    //   headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
    //   body: formData
    // });

    // Simulação
    await new Promise(r => setTimeout(r, 1500));

    mostrarToast('Problema reportado com sucesso! Obrigado pelo feedback.', 'success');

    // Reset form
    DOM.form.reset();
    document.querySelectorAll('.issue-type').forEach(el => el.classList.remove('selected'));
    DOM.fileUpload.classList.remove('has-file');
    DOM.fileName.textContent = '';
    ficheiroSelecionado = null;

  } catch (erro) {
    console.error('Erro ao enviar:', erro);
    mostrarStatus('Erro ao enviar o reporte. Tente novamente.', 'error');
  } finally {
    DOM.btnEnviar.classList.remove('loading');
    DOM.btnEnviar.disabled = false;
  }
}

// ═══════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════
