// EZNY media helper: suporta ficheiros legados locais e URLs do armazenamento externo.
window.eznyImage = function (value) {
  if (!value) return '';
  const src = String(value).trim();
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  if (src.startsWith('/')) return src;
  return '/uploads/' + encodeURIComponent(src);
};

window.eznyAddSellerReportButton = function (ad, sellerNameElement) {
  if (!ad || !sellerNameElement) return;
  const card = sellerNameElement.closest('.modal-vendedor-card') || sellerNameElement.closest('#modalAnuncio');
  if (!card) return;

  let button = card.querySelector('.ezny-report-seller');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'ezny-report-seller';
    button.innerHTML = '<i class="ph ph-flag"></i> Denunciar vendedor';
    button.addEventListener('click', async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Inicie sessão para denunciar este vendedor.');
        window.location.href = 'auth.html';
        return;
      }
      const sellerId = Number(button.dataset.sellerId);
      const adId = Number(button.dataset.adId);
      if (!Number.isInteger(sellerId) || sellerId <= 0) {
        alert('Não foi possível identificar o vendedor deste anúncio.');
        return;
      }
      const descricao = prompt('Descreva o motivo da denúncia deste vendedor:');
      if (descricao === null) return;
      if (!descricao.trim()) {
        alert('Escreva o motivo da denúncia antes de enviar.');
        return;
      }

      button.disabled = true;
      try {
        const response = await fetch('/api/denuncias/criar', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo_denuncia: 'vendedor',
            descricao: descricao.trim(),
            usuario_reportado_id: sellerId,
            anuncio_id: Number.isInteger(adId) && adId > 0 ? adId : null
          })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.erro || `Não foi possível enviar a denúncia (HTTP ${response.status}).`);
        alert(result.message || 'Denúncia enviada. A equipa EZNY irá analisá-la.');
      } catch (error) {
        console.error('[DENUNCIAS] Falha ao denunciar vendedor:', error);
        alert(error.message || 'Não foi possível enviar a denúncia. Tente novamente.');
      } finally {
        button.disabled = false;
      }
    });
  }

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('userData') || 'null'); } catch { return null; }
  })();
  button.dataset.sellerId = String(ad.usuario_id || '');
  button.dataset.adId = String(ad.id || '');
  button.hidden = !ad.usuario_id || Number(currentUser?.id) === Number(ad.usuario_id);
  const body = sellerNameElement.closest('.modal-vendedor-card')?.querySelector('.modal-vendedor-body');
  if (body && button.parentElement !== card) card.appendChild(button);
  if (!body && card.id === 'modalAnuncio') {
    const seller = sellerNameElement.parentElement?.parentElement?.parentElement;
    if (seller && button.parentElement !== seller) seller.appendChild(button);
  }
};

/* EZNY presença global — funciona em Vercel/Neon e não depende de estado em memória do servidor. */
(function(){
  try {
    let sid=localStorage.getItem('eznySessaoId');
    if(!sid){sid=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random());localStorage.setItem('eznySessaoId',sid);}
    const token=localStorage.getItem('token') || '';
    const heartbeat=()=>fetch('/api/sessao/heartbeat',{method:'POST',headers:{'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{})},body:JSON.stringify({sessao_id:sid}),keepalive:true}).catch(()=>{});
    heartbeat(); setInterval(heartbeat,60000);
  } catch(e) {}
})();

/* Compressão no cliente: mantém uploads abaixo do limite prático de request das Functions da Vercel. */
window.eznyCompressImage = async function(file, maxBytes=850*1024){
  if(!file || file.size<=maxBytes) return file;
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file), img=new Image();
    img.onload=()=>{
      URL.revokeObjectURL(url);
      const maxSide=1800, scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(img.naturalWidth*scale)); canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const finish=(quality)=>canvas.toBlob(blob=>{
        if(!blob) return reject(new Error('Não foi possível processar a imagem.'));
        if(blob.size<=maxBytes || quality<=.5){resolve(new File([blob],(file.name||'imagem').replace(/\.[^.]+$/i,'.jpg'),{type:'image/jpeg'}));}
        else finish(quality-.08);
      },'image/jpeg',quality);
      finish(.84);
    };
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Imagem inválida.'));}; img.src=url;
  });
};
