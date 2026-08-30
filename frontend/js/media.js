// EZNY media helper: suporta ficheiros legados locais e URLs do armazenamento externo.
window.eznyImage = function (value) {
  if (!value) return '';
  const src = String(value).trim();
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  if (src.startsWith('/')) return src;
  return '/uploads/' + encodeURIComponent(src);
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
