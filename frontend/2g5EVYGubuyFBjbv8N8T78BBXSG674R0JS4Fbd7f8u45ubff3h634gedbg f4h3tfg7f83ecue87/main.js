async function cadastrar(){
    const dados = {
        nome: document.getElementById('nome').value,
        telefone: document.getElementById('telefone').value,
        senha: document.getElementById('senha').value,
        data_nascimento: document.getElementById('data_nascimento').value
    };

    if(!dados.nome || !dados.telefone || !dados.senha || !dados.data_nascimento){
        alert("Preencha todos os campos!");
        return;
    }

    const res = await fetch('/api/auth/register',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(dados)
    });

    const data = await res.json();
    alert(data.message || data.erro);
}


// LOGIN (mantive só uma função)
async function login(){
    const telefone = document.getElementById('telefoneLogin').value;
    const senha = document.getElementById('senhaLogin').value;

    const res = await fetch('/api/auth/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ telefone, senha })
    });

    const data = await res.json();

    if(data.token){
        localStorage.setItem('token', data.token);
        alert('Login OK');
        window.location.href='ver-anuncios.html';
    }else{
        alert(data.error || data.erro);
    }
}


// ======== ANÚNCIOS ======== (mantive só uma versão)
async function carregarAnuncios(){
    const res = await fetch('/api/anuncios/publicos');
    const data = await res.json();

    const div = document.getElementById('anuncios') || document.getElementById('listaAnuncios');
    if(!div) return;

    div.innerHTML = '';

    data.forEach(a=>{
        div.innerHTML += `
        <div style="background:rgba(0,0,0,0.6);padding:10px;margin:10px;border-radius:5px;">
            <h3>${a.nomeProduto || a.titulo} - ${a.marca}</h3>
            <p>Preço: ${a.preco}</p>
            <p>Contato: ${a.contacto}</p>
            ${a._id ? `<button onclick="aprovar('${a._id}')">Aprovar</button>` : ''}
        </div>`;
    });
}

async function aprovar(id){
    const res = await fetch(`/api/admin/aprovar/${id}`,{ method:'POST' });
    const data = await res.json();
    alert(data.message);
    carregarAnuncios();
}


// ======== COMUNICADOS ========
async function criarComunicado(){
    const titulo = document.getElementById('tituloCom').value;
    const mensagem = document.getElementById('mensagemCom').value;

    const res = await fetch('/api/comunicados/criar',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ titulo, mensagem })
    });

    const data = await res.json();
    alert(data.message);
    carregarComunicados();
}

async function carregarComunicados(){
    const res = await fetch('/api/comunicados/todos');
    const data = await res.json();

    const div = document.getElementById('comunicados');
    if(!div) return;

    div.innerHTML = '';

    data.forEach(c=>{
        div.innerHTML += `
        <div style="background:rgba(255,255,255,0.1);padding:10px;margin:10px;border-radius:5px;">
            <h4>${c.titulo}</h4>
            <p>${c.mensagem}</p>
            <small>${new Date(c.criadoEm).toLocaleString()}</small>
        </div>`;
    });
}


// ======== VENDEDORES ========
async function carregarVendedores(){
    const res = await fetch('/api/admin/vendedores');
    const data = await res.json();

    const div = document.getElementById('listaVendedores');
    if(!div) return;

    div.innerHTML = '';

    data.forEach(v=>{
        div.innerHTML += `
        <div style="background:rgba(0,0,0,0.5);padding:10px;margin:10px;border-radius:5px;">
            <h3>${v.nome} (${v.telefone})</h3>
            <p>${v.cidade || ''}, ${v.pais || ''}</p>
            <p>Bloqueado: ${v.bloqueado}</p>
            <button onclick="bloquearVendedor('${v._id}')">Bloquear</button>
        </div>`;
    });
}

async function bloquearVendedor(id){
    const res = await fetch(`/api/admin/bloquear/${id}`,{ method:'POST' });
    const data = await res.json();
    alert(data.message);
    carregarVendedores();
}


// ======== PUBLICAR ========
function publicar(){
    const token = localStorage.getItem('token');

    if(!token){
        alert('Precisa fazer login primeiro!');
        window.location.href = 'auth.html';
        return;
    }
}


// ======== AVALIAR ========
async function avaliar(vendedorId){
    const nota = prompt('Dê uma nota de 1 a 5');
    const comentario = prompt('Comentário');

    await fetch(`/api/anuncios/avaliar/${vendedorId}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ nota, comentario })
    });

    alert('Avaliação enviada!');
}


// ======== INICIALIZAÇÃO (JUNTEI OS DOIS ONLOAD) ========
window.onload = function(){

    carregarAnuncios();
    carregarComunicados();
    carregarVendedores();

    const params = new URLSearchParams(window.location.search);
    const categoria = params.get("categoria");

    document.body.classList.remove(
        "bg-telefone",
        "bg-carro",
        "bg-imovel",
        "bg-arrendamento"
    );

    if (categoria === "telefone") {
        document.body.classList.add("bg-telefone");
    } else if (categoria === "carro") {
        document.body.classList.add("bg-carro");
    } else if (categoria === "imovel") {
        document.body.classList.add("bg-imovel");
    } else if (categoria === "arrendamento") {
        document.body.classList.add("bg-arrendamento");
    }

    const lista = document.getElementById("lista");

    if(lista){
        fetch("/api/anuncios")
        .then(res => res.json())
        .then(data => {
            const filtrados = data.filter(a => a.categoria === categoria);

            filtrados.forEach(anuncio => {
                lista.innerHTML += `
                <div class="card">
                    <h3>${anuncio.title}</h3>
                    <p>${anuncio.price} Kz</p>
                </div>`;
            });
        });
    }
};


// ======== UTILIZADOR ========
function getUsuario(){
  return localStorage.getItem("usuario");
}

function getToken(){
  return localStorage.getItem("token");
}

function protegerPagina(){
  if(!getToken()){
    window.location.href = "auth.html";
  }
}


// ======== FAVORITOS ========
function getFavoritos(){
  return JSON.parse(localStorage.getItem("favoritos")) || [];
}

function toggleFavorito(id){
  let fav = getFavoritos();

  if(fav.includes(id)){
    fav = fav.filter(f => f !== id);
  } else {
    fav.push(id);
  }

  localStorage.setItem("favoritos", JSON.stringify(fav));
}