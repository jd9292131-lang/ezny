const handlers = Object.freeze({
  '00e61c27f03b95bc': { event: 'click', callback: function(event) {
    abrirModalLogout()
  } },
  '01b9fc41df0d0f9d': { event: 'click', callback: function(event) {
    fecharModalLogout()
  } },
  '01dc8ed42bbe9e9c': { event: 'click', callback: function(event) {
    salvarPerfil()
  } },
  '02d17cfa14bf17b0': { event: 'click', callback: function(event) {
    irUpgrade()
  } },
  '0363746330b06544': { event: 'click', callback: function(event) {
    logout()
  } },
  '0424588372247a33': { event: 'click', callback: function(event) {
    limparLidas()
  } },
  '046a91feda1dbccc': { event: 'click', callback: function(event) {
    enviarMensagem()
  } },
  '059f9eb261b7361d': { event: 'click', callback: function(event) {
    ligarVendedorModal()
  } },
  '075f32c5c59296fd': { event: 'input', callback: function(event) {
    verificarForcaSenha()
  } },
  '07a1ae433101c2a3': { event: 'click', callback: function(event) {
    setChartPeriod(30, this)
  } },
  '0858e6bee71c2140': { event: 'click', callback: function(event) {
    confirmarEliminar()
  } },
  '088b64f90316a0bf': { event: 'click', callback: function(event) {
    event.stopPropagation(); logout()
  } },
  '08f5f228440270d8': { event: 'click', callback: function(event) {
    toggleFaq(this)
  } },
  '0a367046f9710501': { event: 'click', callback: function(event) {
    history.back()
  } },
  '0cf99b51e412c11c': { event: 'click', callback: function(event) {
    navigateTo('pagamentos', this)
  } },
  '0d42141f392720b1': { event: 'click', callback: function(event) {
    fecharModalAnuncio()
  } },
  '0d7f9edcf268f13a': { event: 'click', callback: function(event) {
    ligarVendedor()
  } },
  '0e2dba13acba8cc5': { event: 'input', callback: function(event) {
    filtrarFAQ(this.value)
  } },
  '0ee3120c3d1b0015': { event: 'click', callback: function(event) {
    toggleFAQ(this)
  } },
  '0f3be6f390497375': { event: 'click', callback: function(event) {
    navigateTo('usuarios', this)
  } },
  '1064cf75b3617669': { event: 'click', callback: function(event) {
    mostrarInfoVerificado()
  } },
  '1161c4237949bb38': { event: 'click', callback: function(event) {
    document.getElementById('fileInput').click()
  } },
  '126e48422180d067': { event: 'click', callback: function(event) {
    setEstrela(3)
  } },
  '13517184a9772c6a': { event: 'click', callback: function(event) {
    mostrarListaSeguidores()
  } },
  '13928af5ac16cf61': { event: 'click', callback: function(event) {
    history.back()
  } },
  '162718eda0262191': { event: 'click', callback: function(event) {
    enviarComentarioModal()
  } },
  '174a0ca99a1adea1': { event: 'click', callback: function(event) {
    mudarTab('publicacoes', this)
  } },
  '19e328aef9484596': { event: 'click', callback: function(event) {
    navigateTo('configuracoes', this)
  } },
  '1c20c33a2bde3dee': { event: 'click', callback: function(event) {
    mudarImagemAnuncio(-1)
  } },
  '1cb3b1a04f778431': { event: 'click', callback: function(event) {
    toggleSidebar()
  } },
  '1cd089efd200b583': { event: 'click', callback: function(event) {
    enviarMensagemModal()
  } },
  '1d34e9dd6847fc53': { event: 'click', callback: function(event) {
    refreshAll()
  } },
  '1dbb7e54ac144990': { event: 'click', callback: function(event) {
    closePopupModal()
  } },
  '1e24c1716108245a': { event: 'click', callback: function(event) {
    whatsappVendedorModal()
  } },
  '1e6da2694566e511': { event: 'click', callback: function(event) {
    compartilharAnuncio()
  } },
  '1e92461dd45e9eb7': { event: 'click', callback: function(event) {
    mostrarListaSeguindo()
  } },
  '1f3c3e17fa3e5068': { event: 'submit', callback: function(event) {
    enviarReport(event)
  } },
  '218153cd5acee961': { event: 'click', callback: function(event) {
    confirmDelete()
  } },
  '22bb08b34470b3e5': { event: 'click', callback: function(event) {
    toggleSeguir()
  } },
  '2304ae414185dc3a': { event: 'click', callback: function(event) {
    fecharModalAnuncio(event)
  } },
  '2507012aa67c7619': { event: 'click', callback: function(event) {
    event.stopPropagation()
  } },
  '253cb6b5fdc1cb88': { event: 'click', callback: function(event) {
    irCategoria('outro')
  } },
  '2628a873eefaca19': { event: 'click', callback: function(event) {
    fecharModalLogout()
  } },
  '276d3a7e239e3d27': { event: 'click', callback: function(event) {
    navigateTo('enviar-comunicados', this)
  } },
  '2826a8c3a278a075': { event: 'click', callback: function(event) {
    selecionarPagamento(this, 'deposito')
  } },
  '2c9ac12a82b515d8': { event: 'click', callback: function(event) {
    abrirAba('login')
  } },
  '2dc0c22f299a77b5': { event: 'click', callback: function(event) {
    irCategoria('arrendamento')
  } },
  '2dea61478848f03c': { event: 'click', callback: function(event) {
    setSlide(0)
  } },
  '2e29fa18d4319991': { event: 'click', callback: function(event) {
    carregarAtivosAdmin()
  } },
  '2e3f61fced110e5e': { event: 'change', callback: function(event) {
    handleCategoriaChange()
  } },
  '2ef9e075c1c3dbff': { event: 'click', callback: function(event) {
    event.stopPropagation()
  } },
  '2f54fba43f865c05': { event: 'click', callback: function(event) {
    event.stopPropagation()
  } },
  '2f7d5d130638a990': { event: 'click', callback: function(event) {
    history.back()
  } },
  '30d6be1993f61eda': { event: 'change', callback: function(event) {
    previewAvatar(this)
  } },
  '319885239e4ca1f0': { event: 'click', callback: function(event) {
    enviarAvaliacao()
  } },
  '35b70cce0e0c632e': { event: 'click', callback: function(event) {
    document.getElementById('editarAvatarInput').click()
  } },
  '366a5ae9426644e4': { event: 'input', callback: function(event) {
    filtrarFavoritos()
  } },
  '3749a825bdc2c8c1': { event: 'click', callback: function(event) {
    filtrarCategoria('all')
  } },
  '376f7f56955a037d': { event: 'click', callback: function(event) {
    whatsappVendedorModal()
  } },
  '37a094231e26df4d': { event: 'click', callback: function(event) {
    enviarComentarioModal()
  } },
  '37e90939b84f230c': { event: 'click', callback: function(event) {
    enviarDenuncia()
  } },
  '391d4547269e7aab': { event: 'click', callback: function(event) {
    document.getElementById('mImagem').click()
  } },
  '3a4d06c5e6ab0f0c': { event: 'click', callback: function(event) {
    whatsappVendedor()
  } },
  '3d4a192a85a72771': { event: 'click', callback: function(event) {
    fecharModalLista()
  } },
  '3e3317d73e584c4d': { event: 'click', callback: function(event) {
    toggleSidebar()
  } },
  '3e779b8a53563d0e': { event: 'click', callback: function(event) {
    enviarComentario()
  } },
  '3e8ba2aa232106b3': { event: 'click', callback: function(event) {
    navigateTo('dashboard', this)
  } },
  '4361ddd74a6d4b71': { event: 'click', callback: function(event) {
    login()
  } },
  '46685403a7e036ac': { event: 'click', callback: function(event) {
    fecharModalLogout()
  } },
  '471f25bb8c009852': { event: 'keyup', callback: function(event) {
    filterAds()
  } },
  '483d57bf4405e1b3': { event: 'click', callback: function(event) {
    confirmarLogout()
  } },
  '4a567db476e653bb': { event: 'click', callback: function(event) {
    history.back()
  } },
  '4bca375882847894': { event: 'click', callback: function(event) {
    setChartPeriod(90, this)
  } },
  '4be596bb9a099e4d': { event: 'click', callback: function(event) {
    enviarComentarioModal()
  } },
  '4cf4e1c68e258301': { event: 'click', callback: function(event) {
    toggleSidebar()
  } },
  '4d1eb4add60e698f': { event: 'click', callback: function(event) {
    setEstrela(5)
  } },
  '4d20f701a1969331': { event: 'click', callback: function(event) {
    toggleFavorito()
  } },
  '4dfc8bc0d30119b5': { event: 'click', callback: function(event) {
    enviarPopupTodos()
  } },
  '4eec42bf94b051f3': { event: 'click', callback: function(event) {
    mudarImagemAnuncio(1)
  } },
  '4f7a567caf699c1f': { event: 'click', callback: function(event) {
    toggleReacao()
  } },
  '515848cdd60b740d': { event: 'click', callback: function(event) {
    mudarTab('avaliacoes')
  } },
  '51b51a7e65320232': { event: 'click', callback: function(event) {
    fecharModalEditar()
  } },
  '527af218ef64efde': { event: 'click', callback: function(event) {
    setEstrela(4)
  } },
  '52bad8333258cb40': { event: 'click', callback: function(event) {
    history.back()
  } },
  '53e5d7e304e92ac3': { event: 'click', callback: function(event) {
    toggleEquipamentos()
  } },
  '5475d28f47b96545': { event: 'click', callback: function(event) {
    navigateTo('notificacoes', this)
  } },
  '54f4d5233b14465d': { event: 'click', callback: function(event) {
    criarAnuncio()
  } },
  '552e9e9e3c40c7a2': { event: 'click', callback: function(event) {
    event.stopPropagation()
  } },
  '55f6854d631925b9': { event: 'click', callback: function(event) {
    marcarTodasLidas()
  } },
  '56dd00dc995a7581': { event: 'click', callback: function(event) {
    saveSettings()
  } },
  '5890db3e01ab04b0': { event: 'click', callback: function(event) {
    fecharModalAnuncio()
  } },
  '59408e146cfff2a5': { event: 'click', callback: function(event) {
    event.stopPropagation()
  } },
  '5c38b94903282e65': { event: 'click', callback: function(event) {
    enviarMensagemModal()
  } },
  '5c8516a962c21eb2': { event: 'click', callback: function(event) {
    verPerfilVendedor()
  } },
  '5da9265e1750f423': { event: 'click', callback: function(event) {
    toggleFavModal()
  } },
  '5e6facc0da8ad265': { event: 'click', callback: function(event) {
    salvarPerfil()
  } },
  '5eec54b30e8d4e2c': { event: 'click', callback: function(event) {
    irCategoria('carro')
  } },
  '5f2087e0338bdc60': { event: 'change', callback: function(event) {
    handleAvatarChange(event)
  } },
  '5f3bbdf2fd2b2605': { event: 'click', callback: function(event) {
    irPerfilVendedor()
  } },
  '637685d0d8e8bd3c': { event: 'click', callback: function(event) {
    document.getElementById('editarCapaInput').click()
  } },
  '64c7bdd99e83ebbf': { event: 'click', callback: function(event) {
    fecharModalEditar(event)
  } },
  '69e27a5cb7d8e14c': { event: 'click', callback: function(event) {
    abrirEditar()
  } },
  '6b496a086e5129bf': { event: 'click', callback: function(event) {
    abrirAba('cadastro')
  } },
  '6c71c52018baeb4e': { event: 'click', callback: function(event) {
    event.stopPropagation()
  } },
  '6d38807ba0203d65': { event: 'click', callback: function(event) {
    filtrarCategoria('anuncios')
  } },
  '6d8054dcdc0c0455': { event: 'change', callback: function(event) {
    filterAds()
  } },
  '6e96e1308e38c192': { event: 'click', callback: function(event) {
    navigateTo('comunicados', this)
  } },
  '6f2c40baa15571dc': { event: 'click', callback: function(event) {
    closeConfirm()
  } },
  '709d79be25c73802': { event: 'click', callback: function(event) {
    selecionarPlano('premium_30d', this)
  } },
  '7246da80f58c425f': { event: 'keypress', callback: function(event) {
    if(event.key==='Enter')enviarComentario()
  } },
  '7341013e18e6c348': { event: 'click', callback: function(event) {
    toggleEquipamentosModal()
  } },
  '737bebffe6fb1d67': { event: 'click', callback: function(event) {
    toggleFavModal()
  } },
  '74a99898f0bc5461': { event: 'error', callback: function(event) {
    this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3QgZmlsbD0iIzFhMWQyNCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiLz48dGV4dCBmaWxsPSIjNGI1NTYzIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZHk9IjEwIiB4PSI1MCUiIHk9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+TtyBTZW0gaW1hZ2VtPC90ZXh0PjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJkMzEzOSIgc3Ryb2tlLXdpZHRoPSIyIiBkPSJNMTIwLDE4MCBMMTYwLDE0MCBMMjAwLDE4MCBMMjQwLDEyMCBMMjgwLDE4MCIvPjxjaXJjbGUgZmlsbD0iIzJkMzEzOSIgY3g9IjE2MCIgY3k9IjExMCIgcj0iMTUiLz48L3N2Zz4='
  } },
  '74c9eaaa9399342f': { event: 'click', callback: function(event) {
    fecharModal()
  } },
  '7683fd7361a01d50': { event: 'click', callback: function(event) {
    confirmarLogout()
  } },
  '797387ffb621e46f': { event: 'click', callback: function(event) {
    focusComentario()
  } },
  '797424fad1f9c4d2': { event: 'click', callback: function(event) {
    history.back()
  } },
  '7b15e34bcf615912': { event: 'click', callback: function(event) {
    abrirModalPassword()
  } },
  '7c340cc72bcc6c08': { event: 'click', callback: function(event) {
    toggleMenu()
  } },
  '7c70430df9a7e451': { event: 'click', callback: function(event) {
    fecharModal(event)
  } },
  '7d6f326cfe9ce2e5': { event: 'click', callback: function(event) {
    fecharModal(event)
  } },
  '80ef4aa07ed13fdb': { event: 'click', callback: function(event) {
    setEstrela(1)
  } },
  '81cb59a095249187': { event: 'click', callback: function(event) {
    confirmarLogout()
  } },
  '823294ea4528ae65': { event: 'click', callback: function(event) {
    selecionarPagamento(this, 'transferencia')
  } },
  '8265d34da54231ff': { event: 'click', callback: function(event) {
    history.back()
  } },
  '836174d957899401': { event: 'click', callback: function(event) {
    confirmarLogout()
  } },
  '83e483e2a71bd13e': { event: 'click', callback: function(event) {
    fecharModalLogout()
  } },
  '8425170603e9f33d': { event: 'click', callback: function(event) {
    fecharModalDenuncia()
  } },
  '8449a44a7ce650b4': { event: 'click', callback: function(event) {
    fecharModalLogout()
  } },
  '84e0f0d7e40d00ac': { event: 'submit', callback: function(event) {
    salvarPerfil(event)
  } },
  '85b4228bb4ede4dd': { event: 'change', callback: function(event) {
    handleFileSelect(this)
  } },
  '87bf50cf1eb83b1b': { event: 'click', callback: function(event) {
    contactarWhatsApp()
  } },
  '88422f893be01993': { event: 'click', callback: function(event) {
    ligarVendedorModal()
  } },
  '89e07a0e01783dc3': { event: 'click', callback: function(event) {
    confirmarPagamento()
  } },
  '8bd9cb7447e8f3fe': { event: 'click', callback: function(event) {
    partilharAnuncioModal()
  } },
  '8c708dc1ca935bcb': { event: 'click', callback: function(event) {
    fecharEditar(event)
  } },
  '8d26863d48c0cb41': { event: 'click', callback: function(event) {
    openComunicadoModal()
  } },
  '8d55851cf7c3292a': { event: 'keyup', callback: function(event) {
    filterUsers()
  } },
  '8f75b950f434cdf8': { event: 'click', callback: function(event) {
    cadastrar()
  } },
  '8fdb64d54fc92ea8': { event: 'click', callback: function(event) {
    editarAvatar()
  } },
  '9121d29dcadc7ef6': { event: 'click', callback: function(event) {
    confirmarLogout()
  } },
  '9143d978b9787cc7': { event: 'click', callback: function(event) {
    editarAvatar()
  } },
  '925643a88eb362cd': { event: 'change', callback: function(event) {
    handleAdminCategoriaChange()
  } },
  '9386121330760a01': { event: 'click', callback: function(event) {
    selecionarPlano('premium_15d', this)
  } },
  '9455d716d5a884a9': { event: 'click', callback: function(event) {
    setSlide(3)
  } },
  '9481b05e043f9397': { event: 'input', callback: function(event) {
    verificarConfirmacaoSenha()
  } },
  '95084dbfd19f9b3d': { event: 'click', callback: function(event) {
    document.getElementById('avatarInput').click()
  } },
  '95390e78f2ff0a3e': { event: 'click', callback: function(event) {
    filtrarCategoria('conta')
  } },
  '954cf04dedff61be': { event: 'click', callback: function(event) {
    partilharAnuncioModal()
  } },
  '96f9acd94a0012a0': { event: 'click', callback: function(event) {
    setSlide(1)
  } },
  '9899be108cc4cde8': { event: 'click', callback: function(event) {
    navigateTo('estatisticas', this)
  } },
  '99b1deefff34f609': { event: 'click', callback: function(event) {
    criarPopup()
  } },
  '9a5ba73b92fafff0': { event: 'click', callback: function(event) {
    partilharAnuncioModal()
  } },
  '9a7a087ccc5b99fe': { event: 'click', callback: function(event) {
    enviarMensagemModal()
  } },
  '9ab50c1fa08412da': { event: 'click', callback: function(event) {
    fecharModalLista(event)
  } },
  '9b6fdab318ca8acb': { event: 'click', callback: function(event) {
    irCategoria('casa')
  } },
  '9befa8ed678c0b44': { event: 'submit', callback: function(event) {
    salvarPassword(event)
  } },
  '9fa8760d17eb05a0': { event: 'change', callback: function(event) {
    previewCapa(this)
  } },
  'a01670254aa83ddb': { event: 'click', callback: function(event) {
    toggleSenha('senhaCadastro', this)
  } },
  'a0e3a2e1f2e06037': { event: 'click', callback: function(event) {
    fecharModalAnuncio(event)
  } },
  'a1696187e4742456': { event: 'click', callback: function(event) {
    navigateTo('denuncias', this)
  } },
  '52935b8a1e8a4e14': { event: 'click', callback: function(event) {
    navigateTo('relatos', this)
  } },
  '934ca3e7b82b012f': { event: 'change', callback: function(event) {
    atualizarEstadoDenuncia(this)
  } },
  '48e21d07e153d6f1': { event: 'click', callback: function(event) {
    askDeletePopup(Number(this.dataset.id), this.dataset.origem)
  } },
  '19a974cd4d9b8d61': { event: 'change', callback: function(event) {
    alterarFiltroComunicados(this)
  } },
  'b3fb51df634305d2': { event: 'change', callback: function(event) {
    alterarFiltroPopups(this)
  } },
  'a325b03aace45612': { event: 'click', callback: function(event) {
    alterarEstadoComunicado(this.dataset.id, this.dataset.origem, this.dataset.ativo)
  } },
  '3866e99c117e4521': { event: 'click', callback: function(event) {
    descarregarAnexoRelato(Number(this.dataset.id))
  } },
  'a170ef04b18b16e7': { event: 'click', callback: function(event) {
    resetVisitas()
  } },
  'a235f87257db9086': { event: 'change', callback: function(event) {
    handleFiles(this.files)
  } },
  'a4447f73905061bc': { event: 'click', callback: function(event) {
    fecharModalLogout()
  } },
  'a6543565be7a05c8': { event: 'click', callback: function(event) {
    selecionarTipo(this)
  } },
  'a6752ea3b903432b': { event: 'submit', callback: function(event) {
    enviarReport(event)
  } },
  'a6d2a51e28080e3a': { event: 'click', callback: function(event) {
    fecharModalAnuncio()
  } },
  'a797f713c7908ab9': { event: 'click', callback: function(event) {
    history.back()
  } },
  'a8b686ba575bf685': { event: 'input', callback: function(event) {
    filtrarAnuncios()
  } },
  'a914d9ea008d8703': { event: 'click', callback: function(event) {
    logout()
  } },
  'a97d42cbf2382dd0': { event: 'click', callback: function(event) {
    selectBanType('permanente', this)
  } },
  'aae04602d8c02ee7': { event: 'click', callback: function(event) {
    criarComunicado()
  } },
  'ab6acda57c1af63c': { event: 'click', callback: function(event) {
    event.stopPropagation(); logout()
  } },
  'ab6e30b69a50d5c8': { event: 'change', callback: function(event) {
    filtrarMeusAnuncios()
  } },
  'ac1fd181de1765d3': { event: 'click', callback: function(event) {
    toggleTema()
  } },
  'acac40acaee51ff6': { event: 'click', callback: function(event) {
    toggleFavModal()
  } },
  'ad499575a8a731f4': { event: 'click', callback: function(event) {
    fecharModalAnuncio()
  } },
  'af3d1891294596ad': { event: 'click', callback: function(event) {
    confirmarLogout()
  } },
  'b245bc3e34d41e50': { event: 'click', callback: function(event) {
    enviarNotificacaoAntigos()
  } },
  'b27b3a6461622d4c': { event: 'click', callback: function(event) {
    setSlide(2)
  } },
  'b363240608d44f34': { event: 'submit', callback: function(event) {
    event.preventDefault();
  } },
  'b45c91a31d745371': { event: 'change', callback: function(event) {
    handleFileSelect(this)
  } },
  'b49d21018f779a75': { event: 'click', callback: function(event) {
    navigateTo('popups', this)
  } },
  'b622f5008df08bed': { event: 'click', callback: function(event) {
    irCategoria('imovel')
  } },
  'b64f22bc1b6412b5': { event: 'click', callback: function(event) {
    testarEndpointsManualmente()
  } },
  'b9aeca383e30db93': { event: 'click', callback: function(event) {
    selecionarTipo(this)
  } },
  'bb5b523d404c0fe7': { event: 'click', callback: function(event) {
    filtrarCategoria('seguranca')
  } },
  'bc083600c48495cc': { event: 'change', callback: function(event) {
    handleImageUpload(this.files)
  } },
  'bc33046227229cf1': { event: 'change', callback: function(event) {
    alternarTema()
  } },
  'bc4a3e1002c28498': { event: 'click', callback: function(event) {
    fecharModal()
  } },
  'bd6cf86b7ced638b': { event: 'click', callback: function(event) {
    mudarTab('publicacoes')
  } },
  'c056d4d3c21088f6': { event: 'click', callback: function(event) {
    fecharModalAnuncio(event)
  } },
  'c1eccf37451d7c06': { event: 'click', callback: function(event) {
    mudarTab('avaliacoes', this)
  } },
  'c41095c6314c9bdd': { event: 'click', callback: function(event) {
    publicar()
  } },
  'c43069fe5959f8bd': { event: 'click', callback: function(event) {
    ligarVendedorModal()
  } },
  'c4b0e43a076cad98': { event: 'click', callback: function(event) {
    setChartPeriod(7, this)
  } },
  'c83ec3b350acc08d': { event: 'error', callback: function(event) {
    this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3QgZmlsbD0iIzFhMWQyNCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiLz48dGV4dCBmaWxsPSIjNGI1NTYzIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZHk9IjEwIiB4PSI1MCUiIHk9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+TtyBTZW0gaW1hZ2VtPC90ZXh0PjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJkMzEzOSIgc3Ryb2tlLXdpZHRoPSIyIiBkPSJNMTIwLDE4MCBMMTYwLDE0MCBMMjAwLDE4MCBMMjQwLDEyMCBMMjgwLDE4MCIvPjxjaXJjbGUgZmlsbD0iIzJkMzEzOSIgY3g9IjE2MCIgY3k9IjExMCIgcj0iMTUiLz48L3N2Zz4='
  } },
  'c86f5159336f78bd': { event: 'click', callback: function(event) {
    fecharModalLogout(event)
  } },
  'c9e66d3feb6b2f56': { event: 'click', callback: function(event) {
    toggleSidebar()
  } },
  'ca2b396473aa700d': { event: 'click', callback: function(event) {
    setEstrela(2)
  } },
  'cbb756396fb4d234': { event: 'click', callback: function(event) {
    this.classList.toggle('active')
  } },
  'cd81e6627cc274c9': { event: 'click', callback: function(event) {
    openModal()
  } },
  'ce039c89dd1d4d3c': { event: 'click', callback: function(event) {
    enviarNotificacaoNovos()
  } },
  '11f03f110b759cb9': { event: 'click', callback: function(event) {
    enviarNotificacaoUtilizador()
  } },
  'ce460715cbf92490': { event: 'click', callback: function(event) {
    irPerfilVendedor()
  } },
  'cf313aadf6731259': { event: 'click', callback: function(event) {
    closeComunicadoModal()
  } },
  'd033752e5a29269b': { event: 'click', callback: function(event) {
    fecharModalEditar()
  } },
  'd2d5af0e08ab1993': { event: 'click', callback: function(event) {
    toggleSenha('senhaConfirmar', this)
  } },
  'd342a478a7700932': { event: 'change', callback: function(event) {
    filterUsers()
  } },
  'd43d3b52447309aa': { event: 'click', callback: function(event) {
    fecharModalAnuncio(event)
  } },
  'd479aaab65aaa408': { event: 'click', callback: function(event) {
    fecharModalAnuncio()
  } },
  'd48ccdad373f245b': { event: 'click', callback: function(event) {
    history.back()
  } },
  'd49fae73ca701f76': { event: 'click', callback: function(event) {
    abrirPagamento()
  } },
  'd508af0017a737c9': { event: 'click', callback: function(event) {
    event.stopPropagation(); logout()
  } },
  'd6957b4198c63db0': { event: 'click', callback: function(event) {
    iniciarChat()
  } },
  'd83090e90dbcffb6': { event: 'click', callback: function(event) {
    copiarReferencia()
  } },
  'd856514916f3450e': { event: 'click', callback: function(event) {
    abrirModalEditar()
  } },
  'd8e1a2f53cdc6b63': { event: 'click', callback: function(event) {
    selecionarPagamento(this, 'multicaixa')
  } },
  'daf32d8ed96ab52e': { event: 'click', callback: function(event) {
    logout()
  } },
  'db658499f2064706': { event: 'click', callback: function(event) {
    irPerfilVendedor()
  } },
  'dc3151c61aa02c77': { event: 'error', callback: function(event) {
    this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3QgZmlsbD0iIzFhMWQyNCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiLz48dGV4dCBmaWxsPSIjNGI1NTYzIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZHk9IjEwIiB4PSI1MCUiIHk9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+TtyBTZW0gaW1hZ2VtPC90ZXh0PjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzJkMzEzOSIgc3Ryb2tlLXdpZHRoPSIyIiBkPSJNMTIwLDE4MCBMMTYwLDE0MCBMMjAwLDE4MCBMMjQwLDEyMCBMMjgwLDE4MCIvPjxjaXJjbGUgZmlsbD0iIzJkMzEzOSIgY3g9IjE2MCIgY3k9IjExMCIgcj0iMTUiLz48L3N2Zz4='
  } },
  'dd75ff69b7260654': { event: 'click', callback: function(event) {
    toggleEquipamentosModal()
  } },
  'e3a7e71f212ab3e9': { event: 'click', callback: function(event) {
    history.back()
  } },
  'e3db841ec86f6762': { event: 'click', callback: function(event) {
    selectBanType('temporario', this)
  } },
  'e3e8ba6132f538b9': { event: 'click', callback: function(event) {
    fecharModalPassword()
  } },
  'e4da81648d71dcb8': { event: 'click', callback: function(event) {
    mudarTab('sobre', this)
  } },
  'e5bbdf95f02f2ca7': { event: 'click', callback: function(event) {
    toggleSenha('senha', this)
  } },
  'ea2a55b2129e4ab4': { event: 'click', callback: function(event) {
    eliminarConta()
  } },
  'ea375faed53420ee': { event: 'click', callback: function(event) {
    fecharModalDenuncia(event)
  } },
  'eb68f4567247a532': { event: 'click', callback: function(event) {
    terminarSessao()
  } },
  'ec9700f3b734d5ad': { event: 'error', callback: function(event) {
    this.style.display='none';this.nextElementSibling.style.display='flex'
  } },
  'eca475a5cdc2eebe': { event: 'click', callback: function(event) {
    confirmBan()
  } },
  'eed912b6b1a03b7a': { event: 'click', callback: function(event) {
    partilharAnuncio()
  } },
  'f0a0670f963a71a5': { event: 'click', callback: function(event) {
    whatsappVendedorModal()
  } },
  'f0c9301a0710dc9a': { event: 'click', callback: function(event) {
    fecharEditar()
  } },
  'f20a38d3b4c4d589': { event: 'change', callback: function(event) {
    filtrarAnuncios()
  } },
  'f26edef237d1ca48': { event: 'click', callback: function(event) {
    event.stopPropagation()
  } },
  'f2fa41e38b62c4c7': { event: 'click', callback: function(event) {
    document.getElementById('fileInput').click()
  } },
  'f4c47d48fc671c7f': { event: 'click', callback: function(event) {
    closeBanModal()
  } },
  'f712086e75f693a1': { event: 'click', callback: function(event) {
    abrirDenunciaAnuncio()
  } },
  'f7947bf183919310': { event: 'click', callback: function(event) {
    filtrarCategoria('pagamentos')
  } },
  'f8749b982d12a208': { event: 'click', callback: function(event) {
    event.stopPropagation()
  } },
  'f9de46f7f29632a4': { event: 'click', callback: function(event) {
    closeModal()
  } },
  'fb616f0fcb50b2d9': { event: 'click', callback: function(event) {
    toggleEquipamentosModal()
  } },
  'fbbf36e794a8403a': { event: 'click', callback: function(event) {
    navigateTo('anuncios', this)
  } },
  'ff294d987feee8c3': { event: 'click', callback: function(event) {
    irCategoria('telefone')
  } },
  'ffbb45df8ad301ca': { event: 'click', callback: function(event) {
    event.stopPropagation(); logout()
  } },
});
const boundElements = new WeakSet();
const failedImages = new WeakSet();
const boundActions = new WeakSet();
const boundFallbacks = new WeakSet();
const actions = Object.freeze({
  abrirDenunciaPerfil: (...args) => window.abrirDenunciaPerfil(...args),
  abrirEditar: (...args) => window.abrirEditar(...args),
  abrirModalAnuncio: (...args) => window.abrirModalAnuncio(...args),
  abrirModalEditar: (...args) => window.abrirModalEditar(...args),
  abrirModalEliminar: (...args) => window.abrirModalEliminar(...args),
  abrirNotificacao: (...args) => window.abrirNotificacao(...args),
  aprovar: (...args) => window.aprovar(...args),
  aprovarAnuncio: (...args) => window.aprovarAnuncio(...args),
  atualizarPreview: (...args) => window.atualizarPreview(...args),
  bloquearVendedor: (...args) => window.bloquearVendedor(...args),
  cancelarPagamentoAdmin: (...args) => window.cancelarPagamentoAdmin(...args),
  confirmarPagamentoAdmin: (...args) => window.confirmarPagamentoAdmin(...args),
  copiarLinkPerfil: (...args) => window.copiarLinkPerfil(...args),
  desbanirUser: (...args) => window.desbanirUser(...args),
  eliminarNotif: (...args) => window.eliminarNotif(...args),
  enviarRespostaModal: (...args) => window.enviarRespostaModal(...args),
  fecharModalAnuncio: (...args) => window.fecharModalAnuncio(...args),
  fecharModalLista: (...args) => window.fecharModalLista(...args),
  goPage: (...args) => window.goPage(...args),
  iniciarChat: (...args) => window.iniciarChat(...args),
  irParaImagem: (...args) => window.irParaImagem(...args),
  irUpgrade: (...args) => window.irUpgrade(...args),
  marcarLida: (...args) => window.marcarLida(...args),
  marcarLidaNotif: (...args) => window.marcarLidaNotif(...args),
  mostrarInfoVerificado: (...args) => window.mostrarInfoVerificado(...args),
  mudarImagemModal: (...args) => window.mudarImagemModal(...args),
  openBanModal: (...args) => window.openBanModal(...args),
  prepararRespostaModal: (...args) => window.prepararRespostaModal(...args),
  rejeitarAnuncio: (...args) => window.rejeitarAnuncio(...args),
  removerImagem: (...args) => window.removerImagem(...args),
  removerElemento: element => element.parentElement.remove(),
  toggleFav: (...args) => window.toggleFav(...args),
  toggleFavFavoritos: (...args) => window.toggleFavFavoritos(...args),
  toggleSeguir: (...args) => window.toggleSeguir(...args),
  verAnuncio: (...args) => window.verAnuncio(...args),
  verAnuncioFavorito: (...args) => window.verAnuncioFavorito(...args),
  verAnuncioNotif: (...args) => window.verAnuncioNotif(...args),
  askDelete: (...args) => window.askDelete(...args),
  askDeleteAdmin: (...args) => window.askDeleteAdmin(...args),
  askDeletePopup: (...args) => window.askDeletePopup(...args)
});

// Convert legacy generated markup only from allowlisted calls and literal arguments.
function splitArguments(source) {
  const args = [];
  let start = 0;
  let quote = '';
  let escaped = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (escaped) {
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ',') {
      args.push(source.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (source.slice(start).trim()) args.push(source.slice(start).trim());
  if (quote) throw new SyntaxError('Unterminated string in generated CSP action');
  return args;
}

function parseActionArgument(source) {
  if (source === 'this') return { $element: true };
  if (source === 'event') return { $event: true };
  if (source === 'undefined') return { $undefined: true };
  if (source === 'null') return null;
  if (source === 'true') return true;
  if (source === 'false') return false;
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(source)) return Number(source);
  if (source.startsWith('"') && source.endsWith('"')) return JSON.parse(source);
  if (source.startsWith("'") && source.endsWith("'")) {
    return source.slice(1, -1).replace(/\\(['"\\])/g, '$1').replace(/\\n/g, '\n');
  }
  throw new SyntaxError(`Unsupported generated CSP action argument: ${source}`);
}

function bindLegacyHandler(element, attribute) {
  const source = element.getAttribute(attribute);
  element.removeAttribute(attribute);
  if (attribute === 'onerror') {
    let match = source.match(/^this\.src\s*=\s*(['"])([\s\S]*)\1\s*;?$/);
    if (match) {
      element.dataset.cspFallback = 'src';
      element.dataset.cspFallbackSrc = match[2];
    } else if (/^this\.src\s*=\s*data:image\/[\w.+-]+;base64,[A-Za-z0-9+/=]+\s*;?$/.test(source)) {
      element.dataset.cspFallback = 'src';
      element.dataset.cspFallbackSrc = source.replace(/^this\.src\s*=\s*/, '').replace(/;$/, '');
    } else if (/^this\.style\.display\s*=\s*['"]none['"]\s*;?$/.test(source)) {
      element.dataset.cspFallback = 'hide';
    } else if (/^this\.style\.display\s*=\s*none\s*;\s*this\.nextElementSibling\.style\.display\s*=\s*flex\s*;?$/.test(source)) {
      element.dataset.cspFallback = 'hide-next';
    } else if (/^this\.style\.display\s*=\s*['"]none['"]\s*;\s*this\.nextElementSibling\.style\.display\s*=\s*['"]flex['"]\s*;?$/.test(source)) {
      element.dataset.cspFallback = 'hide-next';
    } else if (/^this\.style\.display\s*=\s*['"]none['"]\s*;\s*document\.getElementById\(['"]([^'"]+)['"]\)\.style\.display\s*=\s*['"]flex['"]\s*;?$/.test(source)) {
      element.dataset.cspFallback = 'placeholder';
      element.dataset.cspFallbackTarget = source.match(/getElementById\(['"]([^'"]+)['"]\)/)[1];
    } else if (/^this\.style\.display\s*=\s*['"]none['"]\s*;\s*var\s+\w+\s*=\s*document\.getElementById\(['"]([^'"]+)['"]\)\s*;\s*if\s*\(\w+\)\s*\w+\.style\.display\s*=\s*['"]flex['"]\s*;?$/.test(source)) {
      element.dataset.cspFallback = 'placeholder';
      element.dataset.cspFallbackTarget = source.match(/getElementById\(['"]([^'"]+)['"]\)/)[1];
    } else {
      throw new SyntaxError(`Unsupported generated CSP error handler: ${source}`);
    }
    bindFallback(element);
    return;
  }

  let stopPropagation = false;
  let actionSource = source.trim();
  if (actionSource.startsWith('event.stopPropagation();')) {
    stopPropagation = true;
    actionSource = actionSource.slice('event.stopPropagation();'.length).trim();
  }
  if (actionSource === 'this.parentElement.remove()') {
    element.dataset.cspAction = 'removerElemento';
    element.dataset.cspArgs = '';
  } else {
    const match = actionSource.match(/^([A-Za-z_$][\w$]*)\s*\(([\s\S]*)\)\s*;?$/);
    if (!match || !Object.prototype.hasOwnProperty.call(actions, match[1])) {
      throw new SyntaxError(`Unsupported generated CSP handler: ${source}`);
    }
    const args = splitArguments(match[2]).map(parseActionArgument);
    element.dataset.cspAction = match[1];
    element.dataset.cspArgs = encodeURIComponent(JSON.stringify(args));
    if ((match[1] === 'toggleFav' || match[1] === 'toggleFavFavoritos') && args[1] !== undefined) {
      element.dataset.cspItemId = String(args[1]);
    }
  }
  if (stopPropagation) element.dataset.cspStopPropagation = 'true';
  bindAction(element);
}

function bindHandler(element) {
  if (!(element instanceof Element) || boundElements.has(element) || !element.hasAttribute('data-csp-handler')) return;
  if (!Object.prototype.hasOwnProperty.call(handlers, element.dataset.cspHandler)) {
    throw new Error(`Unknown CSP event handler: ${element.dataset.cspHandler}`);
  }
  const definition = handlers[element.dataset.cspHandler];
  boundElements.add(element);
  const listener = function(event) {
    if (definition.event === 'error') {
      if (failedImages.has(element)) return;
      failedImages.add(element);
    }
    if (definition.callback.call(element, event) === false) event.preventDefault();
  };
  element.addEventListener(definition.event, listener);
  if (definition.event === 'error' && element instanceof HTMLImageElement && element.complete && element.naturalWidth === 0) {
    listener(new Event('error'));
  }
}

function bindAction(element) {
  if (!(element instanceof Element) || boundActions.has(element) || !element.hasAttribute('data-csp-action')) return;
  if (!Object.prototype.hasOwnProperty.call(actions, element.dataset.cspAction)) {
    throw new Error(`Unknown CSP action: ${element.dataset.cspAction}`);
  }
  const action = actions[element.dataset.cspAction];
  boundActions.add(element);
  const eventType = element.dataset.cspEvent || 'click';
  element.addEventListener(eventType, function(event) {
    const encodedArgs = element.dataset.cspArgs;
    const args = encodedArgs ? JSON.parse(decodeURIComponent(encodedArgs)) : [];
    if (!Array.isArray(args)) throw new TypeError('CSP action arguments must be a JSON array');
    const resolvedArgs = args.map(arg => {
      if (arg && typeof arg === 'object' && arg.$element === true) return element;
      if (arg && typeof arg === 'object' && arg.$event === true) return event;
      if (arg && typeof arg === 'object' && arg.$undefined === true) return undefined;
      return arg;
    });
    if (element.dataset.cspStopPropagation === 'true') event.stopPropagation();
    if (element.dataset.cspPreventDefault === 'true') event.preventDefault();
    if (action.apply(element, resolvedArgs) === false) event.preventDefault();
  });
}

function bindFallback(element) {
  if (!(element instanceof HTMLImageElement) || boundFallbacks.has(element) || !element.hasAttribute('data-csp-fallback')) return;
  boundFallbacks.add(element);
  element.addEventListener('error', function() {
    if (failedImages.has(element)) return;
    failedImages.add(element);
    const fallback = element.dataset.cspFallback;
    if (fallback === 'src') {
      const fallbackSource = element.dataset.cspFallbackSrc;
      if (fallbackSource && new URL(fallbackSource, document.baseURI).href !== (element.currentSrc || element.src)) {
        element.src = fallbackSource;
      }
    } else if (fallback === 'hide') {
      element.style.display = 'none';
    } else if (fallback === 'hide-next') {
      element.style.display = 'none';
      if (element.nextElementSibling) element.nextElementSibling.style.display = 'flex';
    } else if (fallback === 'placeholder') {
      element.style.display = 'none';
      const placeholder = document.getElementById(element.dataset.cspFallbackTarget);
      if (placeholder) placeholder.style.display = 'flex';
    }
  });
  if (element.complete && element.naturalWidth === 0) element.dispatchEvent(new Event('error'));
}

function bindHandlers(root) {
  const legacyEvents = ['onclick', 'onchange', 'oninput', 'onsubmit', 'onload', 'onerror'];
  if (root instanceof Element) {
    for (const attribute of legacyEvents) {
      if (root.hasAttribute(attribute)) bindLegacyHandler(root, attribute);
    }
  }
  if (root.querySelectorAll) {
    root.querySelectorAll(legacyEvents.map(attribute => `[${attribute}]`).join(',')).forEach(element => {
      for (const attribute of legacyEvents) {
        if (element.hasAttribute(attribute)) bindLegacyHandler(element, attribute);
      }
    });
  }
  if (root instanceof Element && root.hasAttribute('data-csp-handler')) bindHandler(root);
  if (root.querySelectorAll) root.querySelectorAll('[data-csp-handler]').forEach(bindHandler);
  if (root instanceof Element && root.hasAttribute('data-csp-action')) bindAction(root);
  if (root.querySelectorAll) root.querySelectorAll('[data-csp-action]').forEach(bindAction);
  if (root instanceof HTMLImageElement && root.hasAttribute('data-csp-fallback')) bindFallback(root);
  if (root.querySelectorAll) root.querySelectorAll('img[data-csp-fallback]').forEach(bindFallback);
}

bindHandlers(document);
new MutationObserver(records => {
  for (const record of records) {
    for (const node of record.addedNodes) bindHandlers(node);
  }
}).observe(document.documentElement, { childList: true, subtree: true });
