
// ═══════════════════════════════════════════════════════════
// VISITA
// ═══════════════════════════════════════════════════════════
fetch('/api/visit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ visitorId: localStorage.getItem('visitorId') })
}).catch(err => console.log('Erro ao registar visita:', err));

// ═══════════════════════════════════════════════════════════
// ABAS
// ═══════════════════════════════════════════════════════════
function abrirAba(aba) {
  document.getElementById('login').classList.remove('active');
  document.getElementById('cadastro').classList.remove('active');
  document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));

  if (aba === 'login') {
    document.getElementById('login').classList.add('active');
    document.querySelectorAll('.tabs button')[0].classList.add('active');
  } else {
    document.getElementById('cadastro').classList.add('active');
    document.querySelectorAll('.tabs button')[1].classList.add('active');
  }

  esconderMsgs();
}

// ═══════════════════════════════════════════════════════════
// MENSAGENS
// ═══════════════════════════════════════════════════════════
function mostrarErro(id, msg) {
  const el = document.getElementById(id);
  el.querySelector('span').textContent = msg;
  el.classList.add('active');
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 400);
}

function mostrarBan(id, msg) {
  const el = document.getElementById(id);
  el.querySelector('.detalhe').textContent = msg;
  el.classList.add('active');
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 400);
}

function mostrarSucesso(id, msg) {
  const el = document.getElementById(id);
  el.querySelector('span').textContent = msg;
  el.classList.add('active');
}

function esconderMsgs() {
  document.querySelectorAll('.msg').forEach(el => el.classList.remove('active'));
}

// ═══════════════════════════════════════════════════════════
// TOGGLE SENHA
// ═══════════════════════════════════════════════════════════
function toggleSenha(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon = btn.querySelector('i');

  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('ph-eye-slash');
    icon.classList.add('ph-eye');
  } else {
    input.type = 'password';
    icon.classList.remove('ph-eye');
    icon.classList.add('ph-eye-slash');
  }
}

// ═══════════════════════════════════════════════════════════
// FORÇA DA SENHA
// ═══════════════════════════════════════════════════════════
function verificarForcaSenha() {
  const senha = document.getElementById('senhaCadastro').value;
  const bars = document.querySelectorAll('#strengthBar .bar');
  const text = document.getElementById('strengthText');

  let forca = 0;
  if (senha.length >= 6) forca++;
  if (senha.length >= 10) forca++;
  if (/[A-Z]/.test(senha)) forca++;
  if (/[0-9]/.test(senha)) forca++;
  if (/[^A-Za-z0-9]/.test(senha)) forca++;

  bars.forEach(b => b.className = 'bar');

  if (senha.length === 0) {
    text.textContent = '';
    return;
  }

  if (forca <= 2) {
    bars[0].classList.add('weak');
    text.textContent = 'Senha fraca';
    text.className = 'strength-text weak';
  } else if (forca <= 4) {
    bars[0].classList.add('medium');
    bars[1].classList.add('medium');
    text.textContent = 'Senha média';
    text.className = 'strength-text medium';
  } else {
    bars[0].classList.add('strong');
    bars[1].classList.add('strong');
    bars[2].classList.add('strong');
    text.textContent = 'Senha forte';
    text.className = 'strength-text strong';
  }
}

// ═══════════════════════════════════════════════════════════
// CONFIRMAÇÃO DE SENHA
// ═══════════════════════════════════════════════════════════
function verificarConfirmacaoSenha() {
  const senha = document.getElementById('senhaCadastro').value;
  const confirmar = document.getElementById('senhaConfirmar');
  const icon = confirmar.closest('.input-container').querySelector('.input-icon i');

  if (confirmar.value.length === 0) {
    confirmar.classList.remove('erro', 'sucesso');
    icon.className = 'ph ph-lock-key-open';
    return;
  }

  if (senha === confirmar.value) {
    confirmar.classList.remove('erro');
    confirmar.classList.add('sucesso');
    icon.className = 'ph ph-check-circle';
    icon.style.color = 'var(--success)';
  } else {
    confirmar.classList.remove('sucesso');
    confirmar.classList.add('erro');
    icon.className = 'ph ph-x-circle';
    icon.style.color = 'var(--danger)';
  }
}

// ═══════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════
async function login() {
  const telefone = document.getElementById('telefone').value.trim();
  const senha = document.getElementById('senha').value.trim();
  const btn = document.getElementById('btnLogin');

  esconderMsgs();

  if (!telefone || !senha) {
    mostrarErro('msgErroLogin', 'Preencha todos os campos!');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div><span>A entrar...</span>';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone, senha })
    });

    const data = await res.json();

    if (res.status === 403 && data.banido) {
      mostrarBan('msgBanLogin', data.erro || 'A sua conta está suspensa.');
      btn.disabled = false;
      btn.innerHTML = '<span>Entrar</span>';
      return;
    }

    if (data.erro) {
      mostrarErro('msgErroLogin', data.erro);
      btn.disabled = false;
      btn.innerHTML = '<span>Entrar</span>';
      return;
    }

    const userData = {
      nome: data.nome || telefone,
      telefone: data.telefone || telefone,
      email: data.email || null,
      tipo: data.tipo || 'user',
      tipo_conta: data.tipo_conta || 'normal'
    };

    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('token', data.token || '');

    if (data.tipo === 'admin') {
      window.location.href = 'M8g73@0ehdn3r0935fuNfehcjjs98d7Ct6r7ee9w0d9bz23909ej2mdd09@£rtcszajAfjk3.html';
    } else {
      window.location.href = 'index.html';
    }

  } catch (err) {
    mostrarErro('msgErroLogin', 'Erro de conexão com o servidor.');
    btn.disabled = false;
    btn.innerHTML = '<span>Entrar</span>';
  }
}

// ═══════════════════════════════════════════════════════════
// REGISTO
// ═══════════════════════════════════════════════════════════
async function cadastrar() {
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('emailCadastro').value.trim();
  const telefone = document.getElementById('telefoneCadastro').value.trim();
  const senha = document.getElementById('senhaCadastro').value;
  const senhaConfirmar = document.getElementById('senhaConfirmar').value;
  const data_nascimento = document.getElementById('data_nascimento').value;
  const btn = document.getElementById('btnCadastro');
const aceitarTermos = document.getElementById('aceitarTermos');
  esconderMsgs();

  // Campos obrigatórios — email NÃO é obrigatório
  if (!nome || !telefone || !senha || !senhaConfirmar || !data_nascimento) {
    mostrarErro('msgErroCadastro', 'Preencha todos os campos obrigatórios!');
    return;
  }
// Aceitação obrigatória dos Termos de Uso e da Política de Privacidade
if (!aceitarTermos || !aceitarTermos.checked) {
  mostrarErro(
    'msgErroCadastro',
    'Para criar a conta, deve aceitar os Termos de Uso e a Política de Privacidade.'
  );

  aceitarTermos?.focus();
  return;
}
  // Email só é validado se tiver sido preenchido
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    mostrarErro('msgErroCadastro', 'Introduza um email válido.');
    document.getElementById('emailCadastro').focus();
    return;
  }

  if (senha !== senhaConfirmar) {
    mostrarErro('msgErroCadastro', 'As senhas não coincidem!');
    document.getElementById('senhaConfirmar').focus();
    return;
  }

  if (senha.length < 6) {
    mostrarErro('msgErroCadastro', 'A senha deve ter pelo menos 6 caracteres!');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div><span>A criar conta...</span>';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
  nome,
  telefone,
  senha,
  data_nascimento,
  email: email || null,
  aceitou_termos: aceitarTermos.checked
})
    });

    const data = await res.json();

    if (res.status === 403 && data.banido) {
      mostrarBan('msgBanCadastro', data.erro || 'Este número está banido.');
      btn.disabled = false;
      btn.innerHTML = '<span>Criar Conta</span>';
      return;
    }

    if (data.erro) {
      mostrarErro('msgErroCadastro', data.erro);
      btn.disabled = false;
      btn.innerHTML = '<span>Criar Conta</span>';
      return;
    }

    mostrarSucesso(
      'msgSucessoCadastro',
      'Conta criada com sucesso! A redirecionar...'
    );

    const userData = {
      nome: data.nome || nome,
      telefone: data.telefone || telefone,
      email: data.email || null,
      tipo: data.tipo || 'user',
      tipo_conta: data.tipo_conta || 'normal'
    };

    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('token', data.token || '');

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);

  } catch (err) {
    console.error('[CADASTRO]', err);
    mostrarErro('msgErroCadastro', 'Erro de conexão com o servidor.');
    btn.disabled = false;
    btn.innerHTML = '<span>Criar Conta</span>';
  }
}
// Enter para submeter
['telefone', 'senha'].forEach(id => {
  document.getElementById(id)?.addEventListener('keypress', e => {
    if (e.key === 'Enter') login();
  });
});

['nome', 'telefoneCadastro', 'data_nascimento', 'senhaCadastro', 'senhaConfirmar'].forEach(id => {
  document.getElementById(id)?.addEventListener('keypress', e => {
    if (e.key === 'Enter') cadastrar();
  });
});