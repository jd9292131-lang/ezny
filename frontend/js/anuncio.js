
  // ==================== ESTADO ====================
  let anuncioAtual = null;
  let imagemAtual = 0;
  let equipamentosExpandido = false;
  let todasImagens = [];
  
  // Favoritos do localStorage
  let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
  
  // ==================== ABRIR MODAL COM ANÚNCIO REAL ====================
  async function abrirModalAnuncio(id) {
    const modal = document.getElementById('modalAnuncio');
    const loading = document.getElementById('modalLoading');
    const erro = document.getElementById('modalErro');
    const scroll = document.getElementById('modalScroll');
    
    // Reset
    modal.classList.add('ativo');
    loading.style.display = 'flex';
    erro.classList.remove('visivel');
    document.body.style.overflow = 'hidden';
    scroll.scrollTop = 0;
    imagemAtual = 0;
    equipamentosExpandido = false;
    
    try {
      // Buscar da API REAL
      const res = await fetch(`/api/anuncios/${id}`);
      
      if (!res.ok) {
        if (res.status === 404) throw new Error('Anúncio não encontrado');
        if (res.status === 403) throw new Error('Anúncio indisponível');
        throw new Error(`Erro ${res.status}`);
      }
      
      const dados = await res.json();
      anuncioAtual = dados;
      
      // Renderizar
      renderizarAnuncio(dados);
      
      loading.style.display = 'none';
      
    } catch (err) {
      console.error('[MODAL] Erro:', err);
      loading.style.display = 'none';
      document.getElementById('modalErroTexto').textContent = err.message || 'Erro ao carregar anúncio';
      erro.classList.add('visivel');
    }
  }
  
  function fecharModalAnuncio() {
    const modal = document.getElementById('modalAnuncio');
    modal.classList.remove('ativo');
    document.body.style.overflow = '';
    anuncioAtual = null;
    todasImagens = [];
  }
  
  // ==================== RENDERIZAR ====================
  function renderizarAnuncio(a) {
    // Badge destaque
    const badgeDest = document.getElementById('anuncioBadgeDestaque');
    if (a.destaque || a.usuario_tipo_conta === 'premium') {
      badgeDest.style.display = 'flex';
    } else {
      badgeDest.style.display = 'none';
    }
    
    // Título
    document.getElementById('anuncioTitulo').textContent = a.titulo || `${a.marca || ''} ${a.modelo || ''}`.trim() || 'Anúncio';
    document.getElementById('anuncioSubtitulo').textContent = a.versao || a.descricao || '';
    
    // Preço
    document.getElementById('anuncioPreco').textContent = formatarPreco(a.preco);
    
    // Negociável
    const neg = document.getElementById('anuncioNegociavel');
    neg.style.display = (a.negociavel === 1 || a.negociavel === '1' || a.negociavel === true) ? 'inline-block' : 'none';
    
    // Info rápida — nunca mostrar campos de outra categoria.
    const info=document.getElementById('infoRapida');
    const x={...getAtributos(a),...a};
    const quick={telefone:[['ph-device-mobile','Modelo',x.modelo],['ph-tag','Marca',x.marca]],carro:[['ph-calendar-blank','Ano',x.ano],['ph-gauge','Km',x.quilometragem!=null?formatarKm(x.quilometragem):null],['ph-gas-pump','Combustível',x.combustivel]],imovel:[['ph-house','Tipo',x.tipo_imovel],['ph-layout','Tipologia',x.tipologia],['ph-ruler','Área',x.area_m2!=null?`${x.area_m2} m²`:null]],arrendamento:[['ph-buildings','Tipo',x.tipo_imovel],['ph-layout','Tipologia',x.tipologia],['ph-ruler','Área',x.area_m2!=null?`${x.area_m2} m²`:null]],outro:[['ph-tag','Marca',x.marca]]};
    info.innerHTML=(quick[a.categoria]||[]).filter(r=>r[2]!==undefined&&r[2]!==null&&String(r[2]).trim()!=='').map(r=>`<span style="display:flex;align-items:center;gap:5px"><i class="ph ${r[0]}"></i>${r[1]}: ${escHtml(r[2])}</span>`).join('');
    
    // Localização
    document.getElementById('infoLocalizacao').textContent = a.localizacao || a.usuario_localizacao || 'Luanda';
    document.getElementById('infoTempo').textContent = tempoRelativo(a.createdAt);
    
    // Vendedor
    renderizarVendedor(a);
    
    // Imagens
    renderizarImagens(a);
    
    // Especificações
    renderizarEspecificacoes(a);
    
    // Descrição
    document.getElementById('anuncioDescricao').textContent = a.descricao_completa || a.descricao || 'Sem descrição.';
    
    // Equipamentos
    renderizarEquipamentos(a.equipamentos);
    
    // Favorito
    atualizarIconeFavorito();
  }
  
  function renderizarVendedor(a) {
    const nome = a.usuario_nome || 'Utilizador';
    const iniciais = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const avatarEl = document.getElementById('vendedorAvatar');
    if (a.usuario_avatar) {
      avatarEl.innerHTML = `<img src="${eznyImage(a.usuario_avatar)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    } else {
      avatarEl.textContent = iniciais;
    }
    
    document.getElementById('vendedorNome').textContent = nome;
    
    // Membro desde (usar createdAt do user se disponível, senão mock)
    const anoMembro = a.usuario_createdAt ? new Date(a.usuario_createdAt).getFullYear() : '2022';
    document.getElementById('vendedorMembro').textContent = `Membro desde ${anoMembro}`;
    
    // Verificado
    const verif = document.getElementById('vendedorVerificado');
    verif.style.display = (a.usuario_verificado === 1 || a.usuario_verificado === '1') ? 'inline' : 'none';
    
    // Rating (mock - depois integrar com tabela avaliacoes)
    document.getElementById('vendedorRating').textContent = '4.8';
    document.getElementById('vendedorAvaliacoes').textContent = '(32)';
  }
  
  function renderizarImagens(a) {
    todasImagens = [];
    
    if (a.imagem) todasImagens.push(a.imagem);
    if (a.galeria) {
      try {
        const galeria = Array.isArray(a.galeria) ? a.galeria : JSON.parse(a.galeria);
        galeria.forEach(img => { if (!todasImagens.includes(img)) todasImagens.push(img); });
      } catch(e) {}
    }
    
    // Se não houver imagens, placeholder
    if (todasImagens.length === 0) {
      todasImagens.push('placeholder.jpg');
    }
    
    // Imagem principal
    const imgPrincipal = document.getElementById('anuncioImgPrincipal');
    imgPrincipal.src = eznyImage(todasImagens[0]);
    imgPrincipal.onerror = function() { this.src = '/imagens/placeholder.svg'; };
    document.getElementById('anuncioContador').textContent = `1 / ${todasImagens.length}`;
    
    // Thumbnails
    const container = document.getElementById('anuncioThumbnails');
    container.innerHTML = '';
    
    todasImagens.forEach((img, idx) => {
      const btn = document.createElement('button');
      btn.className = 'thumb ' + (idx === 0 ? 'ativa' : '');
      btn.innerHTML = `<img src="${eznyImage(img)}" onerror="this.src='/imagens/placeholder.svg'">`;
      btn.onclick = () => mudarImagem(idx);
      container.appendChild(btn);
    });
  }
  
  function mudarImagem(idx) {
    imagemAtual = idx;
    const imgPrincipal = document.getElementById('anuncioImgPrincipal');
    imgPrincipal.src = eznyImage(todasImagens[idx]);
    document.getElementById('anuncioContador').textContent = `${idx + 1} / ${todasImagens.length}`;
    
    // Atualizar thumbnails
    const thumbs = document.querySelectorAll('#anuncioThumbnails .thumb');
    thumbs.forEach((t, i) => {
      t.className = 'thumb ' + (i === idx ? 'ativa' : '');
    });
  }
  
  function getAtributos(a) {
    if (!a.atributos) return {};
    if (typeof a.atributos === 'object') return a.atributos;
    try { return JSON.parse(a.atributos) || {}; } catch { return {}; }
  }
  function renderizarEspecificacoes(a) {
    const x = {...getAtributos(a), ...a};
    const configs = {
      telefone:[['ph-tag','Marca',x.marca],['ph-device-mobile','Modelo',x.modelo],['ph-circles-three-plus','Armazenamento',x.armazenamento],['ph-paint-brush','Cor',x.cor],['ph-battery-high','Bateria',x.bateria],['ph-check-circle','Estado',x.estado]],
      carro:[['ph-car','Marca',x.marca],['ph-car','Modelo',x.modelo],['ph-package','Versão',x.versao],['ph-calendar-blank','Ano',x.ano],['ph-gauge','Quilometragem',x.quilometragem!=null?formatarKm(x.quilometragem):null],['ph-gas-pump','Combustível',x.combustivel],['ph-arrows-left-right','Caixa',x.caixa],['ph-gear','Tração',x.tracao],['ph-paint-brush','Cor',x.cor],['ph-door','Portas',x.portas],['ph-users-three','Lugares',x.lotacao],['ph-check-circle','Estado',x.estado]],
      imovel:[['ph-house','Tipo de imóvel',x.tipo_imovel],['ph-layout','Tipologia',x.tipologia],['ph-bed','Quartos',x.quartos],['ph-bathtub','Casas de banho',x.casas_banho],['ph-ruler','Área',x.area_m2!=null?`${x.area_m2} m²`:null],['ph-armchair','Mobilado',x.mobilado],['ph-car','Estacionamento',x.estacionamento],['ph-check-circle','Estado',x.estado]],
      arrendamento:[['ph-buildings','Tipo de imóvel',x.tipo_imovel],['ph-layout','Tipologia',x.tipologia],['ph-bed','Quartos',x.quartos],['ph-bathtub','Casas de banho',x.casas_banho],['ph-ruler','Área',x.area_m2!=null?`${x.area_m2} m²`:null],['ph-armchair','Mobilado',x.mobilado],['ph-car','Estacionamento',x.estacionamento]],
      outro:[['ph-tag','Marca / Fabricante',x.marca],['ph-check-circle','Estado',x.estado]]
    };
    const rows=(configs[a.categoria]||configs.outro).filter(r=>r[2]!==undefined&&r[2]!==null&&String(r[2]).trim()!=='');
    document.getElementById('especificacoesContainer').innerHTML = rows.length ? rows.map(s=>`<div class="spec-linha"><div style="display:flex;align-items:center;gap:10px;color:#9ca3af"><i class="ph ${s[0]}" style="color:#14b8a6"></i><span style="font-size:14px">${s[1]}</span></div><span style="font-size:14px;font-weight:500;color:white;text-align:right">${escHtml(s[2])}</span></div>`).join('') : '<div style="padding:16px;color:#6b7280;font-size:13px">Sem especificações adicionais.</div>';
  }
  function escHtml(v){const d=document.createElement('div');d.textContent=String(v);return d.innerHTML;}

  function renderizarEquipamentos(equipStr) {
    const container = document.getElementById('equipamentosContainer');
    const secao = document.getElementById('secaoEquipamentos');
    const btnVerMais = document.getElementById('btnVerMaisEquip');
    
    if (!equipStr) {
      secao.style.display = 'none';
      return;
    }
    secao.style.display = 'block';
    
    const equipamentos = equipStr.split(',').map(e => e.trim()).filter(e => e);
    const maxVisiveis = 8;
    const visiveis = equipamentosExpandido ? equipamentos : equipamentos.slice(0, maxVisiveis);
    
    container.innerHTML = visiveis.map(e => `
      <div class="equip-tag">
        <i class="ph ph-check-circle" style="color:#14b8a6;"></i>
        ${e}
      </div>
    `).join('');
    
    if (equipamentos.length > maxVisiveis) {
      btnVerMais.style.display = 'block';
      btnVerMais.textContent = equipamentosExpandido ? 'Ver menos' : 'Ver mais';
    } else {
      btnVerMais.style.display = 'none';
    }
  }
  
  function toggleEquipamentos() {
    equipamentosExpandido = !equipamentosExpandido;
    renderizarEquipamentos(anuncioAtual.equipamentos);
  }
  
  // ==================== HELPERS ====================
  function formatarPreco(valor) {
    if (!valor || valor === 0) return '0 Kz';
    return new Intl.NumberFormat('pt-AO').format(valor) + ' Kz';
  }
  
  function formatarKm(valor) {
    if (!valor || valor === 0) return '0 km';
    return new Intl.NumberFormat('pt-AO').format(valor) + ' km';
  }
  
  function tempoRelativo(dataStr) {
    if (!dataStr) return 'Recente';
    const data = new Date(dataStr);
    const agora = new Date();
    const diff = agora - data;
    const segundos = Math.floor(diff / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias === 0) {
      if (horas === 0) {
        if (minutos === 0) return 'Agora';
        return `Há ${minutos} min`;
      }
      return `Há ${horas}h`;
    }
    if (dias === 1) return 'Ontem';
    if (dias < 7) return `Há ${dias} dias`;
    if (dias < 30) return `Há ${Math.floor(dias / 7)} semanas`;
    if (dias < 365) return `Há ${Math.floor(dias / 30)} meses`;
    return `Há ${Math.floor(dias / 365)} anos`;
  }
  
  // ==================== AÇÕES ====================
  function compartilharAnuncio() {
    if (!anuncioAtual) return;
    const url = `${window.location.origin}/anuncio/${anuncioAtual.id}`;
    if (navigator.share) {
      navigator.share({ title: anuncioAtual.titulo, url });
    } else {
      navigator.clipboard.writeText(url);
      // Toast simples
      mostrarToast('Link copiado!');
    }
  }
  
  function toggleFavorito() {
    if (!anuncioAtual) return;
    const idx = favoritos.indexOf(anuncioAtual.id);
    if (idx > -1) favoritos.splice(idx, 1);
    else favoritos.push(anuncioAtual.id);
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    atualizarIconeFavorito();
  }
  
  function atualizarIconeFavorito() {
    if (!anuncioAtual) return;
    const btn = document.getElementById('btnFavorito');
    const isFav = favoritos.includes(anuncioAtual.id);
    btn.innerHTML = `<i class="ph ${isFav ? 'ph-heart-fill' : 'ph-heart'}" style="font-size:18px; ${isFav ? 'color:#ef4444;' : ''}"></i>`;
  }
  
  function enviarMensagem() {
    if (!anuncioAtual) return;
    // Verificar se está logado
    const token = localStorage.getItem('token');
    if (!token) {
      mostrarToast('Faça login para enviar mensagem');
      setTimeout(() => { window.location.href = '/login.html'; }, 1500);
      return;
    }
    window.location.href = `/mensagens?para=${anuncioAtual.usuario_id}&anuncio=${anuncioAtual.id}`;
  }
  
  function ligarVendedor() {
    if (!anuncioAtual?.usuario_telefone) {
      mostrarToast('Telefone não disponível');
      return;
    }
    window.location.href = `tel:${anuncioAtual.usuario_telefone}`;
  }
  
  function whatsappVendedor() {
    if (!anuncioAtual?.usuario_telefone) {
      mostrarToast('Telefone não disponível');
      return;
    }
    const tel = anuncioAtual.usuario_telefone.replace(/\D/g, '');
    const msg = `Olá! Vi o teu anúncio do ${anuncioAtual.titulo} no EZNY.`;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  }
  
  function verPerfilVendedor() {
    if (!anuncioAtual) return;
    window.location.href = `/perfil/${anuncioAtual.usuario_id}`;
  }
  
  // Toast simples
  function mostrarToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:#232730; color:white; padding:10px 20px; border-radius:10px; font-size:14px; z-index:10000; animation:fadeIn 0.3s;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.remove(); }, 2500);
  }
  
  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharModalAnuncio();
  });
  
  // Fechar ao clicar fora (overlay já tem onclick)
