
/**
 * ═══════════════════════════════════════════════════
 *  CENTRO DE AJUDA - EZNY
 *  FAQ interativo com pesquisa e filtros
 * ═══════════════════════════════════════════════════
 */

// ─── Estado ───────────────────────────────────────
let categoriaAtiva = 'all';
let termoPesquisa = '';

// ═══════════════════════════════════════════════════
//  FUNÇÕES
// ═══════════════════════════════════════════════════

/**
 * Alterna visibilidade da resposta FAQ
 */
function toggleFAQ(botao) {
  const item = botao.closest('.faq-item');
  const estavaAtivo = item.classList.contains('active');

  // Fechar todos os outros
  document.querySelectorAll('.faq-item.active').forEach(el => {
    if (el !== item) el.classList.remove('active');
  });

  // Toggle do clicado
  item.classList.toggle('active', !estavaAtivo);
}

/**
 * Filtra por categoria
 */
function filtrarCategoria(categoria) {
  categoriaAtiva = categoria;

  // Atualizar tabs
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.category === categoria);
  });

  aplicarFiltros();
}

/**
 * Filtra por texto de pesquisa
 */
function filtrarFAQ(termo) {
  termoPesquisa = termo.toLowerCase().trim();
  aplicarFiltros();
}

/**
 * Aplica filtros combinados (categoria + pesquisa)
 */
function aplicarFiltros() {
  const secoes = document.querySelectorAll('.faq-section');
  let totalVisiveis = 0;

  secoes.forEach(secao => {
    const categoriaSecao = secao.dataset.category;
    const itens = secao.querySelectorAll('.faq-item');
    let secaoTemVisiveis = false;

    // Verificar se a secção deve ser visível (categoria)
    const secaoVisivel = categoriaAtiva === 'all' || categoriaAtiva === categoriaSecao;

    itens.forEach(item => {
      const pergunta = item.querySelector('.q-text').textContent.toLowerCase();
      const resposta = item.querySelector('.faq-answer-content').textContent.toLowerCase();
      const matchPesquisa = !termoPesquisa || pergunta.includes(termoPesquisa) || resposta.includes(termoPesquisa);

      const visivel = secaoVisivel && matchPesquisa;
      item.style.display = visivel ? '' : 'none';

      if (visivel) {
        secaoTemVisiveis = true;
        totalVisiveis++;
      }
    });

    // Mostrar/esconder secção
    secao.style.display = secaoTemVisiveis ? '' : 'none';
  });

  // Mostrar mensagem de sem resultados
  const noResults = document.getElementById('noResults');
  noResults.classList.toggle('show', totalVisiveis === 0 && (termoPesquisa || categoriaAtiva !== 'all'));
}

// ═══════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════
(function init() {
  // Abrir primeiro FAQ de cada secção por defeito
  document.querySelectorAll('.faq-section').forEach(secao => {
    const primeiro = secao.querySelector('.faq-item');
    if (primeiro) primeiro.classList.add('active');
  });
})();
