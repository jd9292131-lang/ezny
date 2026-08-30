/* EZNY — contrato único de campos por categoria.
   Este ficheiro é a fonte de verdade usada pelo criador de anúncios e pelo painel admin. */
window.EZNY_CATEGORIAS = {
  telefone: {
    label: 'Telemóveis e Tablets', icon: 'ph-device-mobile',
    campos: [
      {name:'title',label:'Título do anúncio',type:'text',required:true,placeholder:'Ex.: iPhone 14 Pro Max'},
      {name:'marca',label:'Marca',type:'text',placeholder:'Ex.: Apple, Samsung'},
      {name:'modelo',label:'Modelo',type:'text',placeholder:'Ex.: 14 Pro Max'},
      {name:'estado',label:'Estado',type:'select',options:['Novo','Usado','Recondicionado'],placeholder:'Selecionar estado'},
      {name:'armazenamento',label:'Armazenamento',type:'text',placeholder:'Ex.: 256 GB'},
      {name:'cor',label:'Cor',type:'text',placeholder:'Ex.: Preto, Azul'},
      {name:'bateria',label:'Saúde da bateria',type:'text',placeholder:'Ex.: 92%'},
      {name:'price',label:'Preço (Kz)',type:'number',required:true,placeholder:'Ex.: 500000',min:1},
      {name:'negociavel',label:'Preço negociável',type:'checkbox'},
      {name:'contacto',label:'Contacto',type:'tel',required:true,placeholder:'Ex.: 923456789'},
      {name:'localizacao',label:'Localização',type:'text',placeholder:'Ex.: Luanda, Talatona'},
      {name:'descricao',label:'Descrição',type:'textarea',placeholder:'Descreva o produto, acessórios, garantia, etc.'}
    ]
  },
  carro: {
    label:'Carros e Motas', icon:'ph-car',
    campos:[
      {name:'title',label:'Título do anúncio',type:'text',required:true,placeholder:'Ex.: Toyota Hilux 2020'},
      {name:'marca',label:'Marca',type:'text',required:true,placeholder:'Ex.: Toyota'},
      {name:'modelo',label:'Modelo',type:'text',required:true,placeholder:'Ex.: Hilux'},
      {name:'versao',label:'Versão',type:'text',placeholder:'Ex.: SRX, Executive'},
      {name:'ano',label:'Ano',type:'number',placeholder:'Ex.: 2020',min:1900,max:2100},
      {name:'quilometragem',label:'Quilometragem (km)',type:'number',placeholder:'Ex.: 45000',min:0},
      {name:'combustivel',label:'Combustível',type:'select',options:['Gasolina','Diesel','Híbrido','Elétrico','GPL','Outro'],placeholder:'Selecionar combustível'},
      {name:'caixa',label:'Caixa de velocidades',type:'select',options:['Manual','Automática','Automatizada','CVT'],placeholder:'Selecionar caixa'},
      {name:'tracao',label:'Tração',type:'select',options:['Dianteira','Traseira','4x4','Integral'],placeholder:'Selecionar tração'},
      {name:'cor',label:'Cor',type:'text',placeholder:'Ex.: Preto'},
      {name:'portas',label:'Portas',type:'number',placeholder:'Ex.: 4',min:1,max:8},
      {name:'lotacao',label:'Lugares',type:'number',placeholder:'Ex.: 5',min:1,max:60},
      {name:'estado',label:'Estado',type:'select',options:['Novo','Usado','Acidentado','Para peças'],placeholder:'Selecionar estado'},
      {name:'price',label:'Preço (Kz)',type:'number',required:true,placeholder:'Ex.: 25000000',min:1},
      {name:'negociavel',label:'Preço negociável',type:'checkbox'},
      {name:'equipamentos',label:'Equipamentos',type:'text',placeholder:'Ex.: AC, GPS, bancos em pele'},
      {name:'contacto',label:'Contacto',type:'tel',required:true,placeholder:'Ex.: 923456789'},
      {name:'localizacao',label:'Localização',type:'text',placeholder:'Ex.: Luanda, Talatona'},
      {name:'descricao',label:'Descrição',type:'textarea',placeholder:'Descreva o veículo, histórico, documentação, etc.'}
    ]
  },
  imovel: {
    label:'Imóveis', icon:'ph-house',
    campos:[
      {name:'title',label:'Título do anúncio',type:'text',required:true,placeholder:'Ex.: Moradia T4 em Talatona'},
      {name:'tipo_imovel',label:'Tipo de imóvel',type:'select',options:['Moradia','Apartamento','Terreno','Loja','Escritório','Armazém','Outro'],placeholder:'Selecionar tipo'},
      {name:'tipologia',label:'Tipologia',type:'text',placeholder:'Ex.: T4'},
      {name:'quartos',label:'Quartos',type:'number',placeholder:'Ex.: 4',min:0},
      {name:'casas_banho',label:'Casas de banho',type:'number',placeholder:'Ex.: 3',min:0},
      {name:'area_m2',label:'Área (m²)',type:'number',placeholder:'Ex.: 350',min:0,step:'0.01'},
      {name:'estado',label:'Estado',type:'select',options:['Novo','Usado','Em construção','Remodelado'],placeholder:'Selecionar estado'},
      {name:'mobilado',label:'Mobilado',type:'select',options:['Sim','Não','Semi-mobilado'],placeholder:'Selecionar opção'},
      {name:'estacionamento',label:'Estacionamento',type:'text',placeholder:'Ex.: Garagem para 2 carros'},
      {name:'price',label:'Preço (Kz)',type:'number',required:true,placeholder:'Ex.: 35000000',min:1},
      {name:'negociavel',label:'Preço negociável',type:'checkbox'},
      {name:'contacto',label:'Contacto',type:'tel',required:true,placeholder:'Ex.: 923456789'},
      {name:'localizacao',label:'Localização',type:'text',required:true,placeholder:'Ex.: Luanda, Talatona'},
      {name:'descricao',label:'Descrição detalhada',type:'textarea',required:true,placeholder:'Descreva o imóvel, localização, condições, documentos, etc.'}
    ]
  },
  arrendamento: {
    label:'Arrendamento', icon:'ph-buildings',
    campos:[
      {name:'title',label:'Título do anúncio',type:'text',required:true,placeholder:'Ex.: Apartamento T2 para arrendar'},
      {name:'tipo_imovel',label:'Tipo de imóvel',type:'select',options:['Moradia','Apartamento','Quarto','Loja','Escritório','Armazém','Outro'],placeholder:'Selecionar tipo'},
      {name:'tipologia',label:'Tipologia',type:'text',placeholder:'Ex.: T2'},
      {name:'quartos',label:'Quartos',type:'number',placeholder:'Ex.: 2',min:0},
      {name:'casas_banho',label:'Casas de banho',type:'number',placeholder:'Ex.: 2',min:0},
      {name:'area_m2',label:'Área (m²)',type:'number',placeholder:'Ex.: 180',min:0,step:'0.01'},
      {name:'mobilado',label:'Mobilado',type:'select',options:['Sim','Não','Semi-mobilado'],placeholder:'Selecionar opção'},
      {name:'estacionamento',label:'Estacionamento',type:'text',placeholder:'Ex.: Garagem para 1 carro'},
      {name:'price',label:'Renda mensal (Kz)',type:'number',required:true,placeholder:'Ex.: 350000',min:1},
      {name:'negociavel',label:'Renda negociável',type:'checkbox'},
      {name:'contacto',label:'Contacto',type:'tel',required:true,placeholder:'Ex.: 923456789'},
      {name:'localizacao',label:'Localização',type:'text',required:true,placeholder:'Ex.: Luanda, Maianga'},
      {name:'descricao',label:'Descrição detalhada',type:'textarea',required:true,placeholder:'Descreva o imóvel, condições de arrendamento, caução, etc.'}
    ]
  },
  outro: {
    label:'Outros', icon:'ph-package',
    campos:[
      {name:'title',label:'Título do anúncio',type:'text',required:true,placeholder:'Ex.: Máquina de costura industrial'},
      {name:'marca',label:'Marca / Fabricante',type:'text',placeholder:'Ex.: Singer, Philips'},
      {name:'estado',label:'Estado',type:'select',options:['Novo','Usado','Recondicionado'],placeholder:'Selecionar estado'},
      {name:'price',label:'Preço (Kz)',type:'number',required:true,placeholder:'Ex.: 25000',min:1},
      {name:'negociavel',label:'Preço negociável',type:'checkbox'},
      {name:'contacto',label:'Contacto',type:'tel',required:true,placeholder:'Ex.: 923456789'},
      {name:'localizacao',label:'Localização',type:'text',placeholder:'Ex.: Luanda'},
      {name:'descricao',label:'Descrição',type:'textarea',required:true,placeholder:'Descreva o produto ou serviço.'}
    ]
  }
};
