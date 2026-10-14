import { Session, TecClient } from '../src/client.mjs';
import { TecApi } from '../src/api.mjs';

const session = Session.load();
const client = new TecClient({ session });
const api = new TecApi(client);

const PASTA_CGU = 7853487;
const SUBPASTA_TEMA = 1839444;

const CEBRASPE = '4';
const ANOS_5 = ['2026', '2025', '2024', '2023', '2022'];
const ANOS_10 = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];
const REMOVER_ADAP = 'REMOVER_ADAPTADAS_INEDITAS';
const CERTO_ERRADO = 'REMOVER_MULTIPLA_ESCOLHA';

const CADERNOS_A_CRIAR = [
  {
    nome: 'CGU - 2. Formação Social e Cidadania no Brasil',
    assuntos: ['9330', '9359', '9075', '9350', '9102', '9342', '9361', '11629', '16590', '16588', '13930', '6595', '5440'],
    bancas: [CEBRASPE],
    anos: ANOS_10, // Afrouxado para 10 anos conforme regra (garantindo volume de 81 questões)
    opcoes: [REMOVER_ADAP, CERTO_ERRADO],
    limite: 100,
    motivoFiltro: 'Cebraspe, Certo/Errado, 10 anos (afrouxado de 5 para 10 anos para atingir base robusta de 81 questões)'
  },
  {
    nome: 'CGU - 3A. Trabalho, Precarização e Mudanças Tecnológicas',
    assuntos: ['9083', '9352', '5370'],
    bancas: [CEBRASPE],
    anos: ANOS_5,
    opcoes: [REMOVER_ADAP, CERTO_ERRADO],
    limite: 100,
    motivoFiltro: 'Cebraspe, Certo/Errado, últimos 5 anos'
  },
  {
    nome: 'CGU - 3B. População, Demografia e Desigualdades Regionais',
    assuntos: ['5367', '5381', '5388', '9138', '3239'],
    bancas: [CEBRASPE],
    anos: ANOS_5,
    opcoes: [REMOVER_ADAP, CERTO_ERRADO],
    limite: 100,
    motivoFiltro: 'Cebraspe, Certo/Errado, últimos 5 anos'
  },
  {
    nome: 'CGU - 4A. Diversidade Étnico-Racial, Indígenas e Quilombolas',
    assuntos: ['9134', '5565', '4174', '8210', '16102', '15793', '9331', '9332'],
    bancas: [CEBRASPE],
    anos: ANOS_10, // Afrouxado de 5 para 10 anos porque em 5 anos havia apenas 17 questões (< 20)
    opcoes: [REMOVER_ADAP, CERTO_ERRADO],
    limite: 100,
    motivoFiltro: 'Cebraspe, Certo/Errado, 10 anos (afrouxado de 5 anos pois continha 17 questões < 20; 10 anos = 48 questões)'
  },
  {
    nome: 'CGU - 4B. Gênero, Sexualidade, PCD e Acessibilidade',
    assuntos: ['9117', '5566', '5591', '4641', '4640', '5976', '9348', '5168'],
    bancas: [CEBRASPE],
    anos: ANOS_5,
    opcoes: [REMOVER_ADAP, CERTO_ERRADO],
    limite: 100, // Limitado ao teto de 100 questões (disponível: 138)
    motivoFiltro: 'Cebraspe, Certo/Errado, últimos 5 anos (limitado a 100 questões recentes de 138 disponíveis)'
  },
  {
    nome: 'CGU - 5. Desenvolvimento e Realidade Brasileira',
    assuntos: ['9140', '9349', '9111', '9357', '9358', '5402', '3638', '3641', '3642'],
    bancas: [CEBRASPE],
    anos: ANOS_5,
    opcoes: [REMOVER_ADAP, CERTO_ERRADO],
    limite: 100,
    motivoFiltro: 'Cebraspe, Certo/Errado, últimos 5 anos'
  }
];

async function executarCriacaoEmLote() {
  console.log(`=== INICIANDO CRIAÇÃO DOS CADERNOS RESTANTES ===\n`);
  const resultados = [];

  for (const c of CADERNOS_A_CRIAR) {
    console.log(`--------------------------------------------------------`);
    console.log(`Processando: ${c.nome}`);
    console.log(`Filtros: ${c.motivoFiltro}`);

    const spec = {
      assuntos: c.assuntos,
      bancas: c.bancas,
      anos: c.anos,
      opcoes: c.opcoes
    };

    const totalDisponivel = await api.contar(spec);
    const qtdAlocada = Math.min(totalDisponivel, c.limite);
    console.log(`Disponíveis no TEC: ${totalDisponivel} | Quantidade no caderno: ${qtdAlocada}`);

    if (qtdAlocada === 0) {
      console.warn(`AVISO: Nenhuma questão encontrada para ${c.nome}. Pulando.`);
      continue;
    }

    console.log(`Criando caderno no TEC...`);
    const criado = await api.criarCaderno({
      nome: c.nome,
      spec,
      pasta: PASTA_CGU,
      quantidade: qtdAlocada,
      ordenacao: 'RECENTES'
    });
    console.log(`Caderno criado! ID: ${criado.id} | Total: ${criado.totalQuestoes} questões`);

    console.log(`Movendo para a subpasta ${SUBPASTA_TEMA}...`);
    await client.post('/cadernos/multiple-set', {
      'cadernos[0]': String(criado.id),
      pastaDestino: String(PASTA_CGU),
      subpastaDestino: String(SUBPASTA_TEMA)
    });
    console.log(`Caderno ${criado.id} movido com sucesso para a subpasta!\n`);

    resultados.push({
      id: criado.id,
      nome: c.nome,
      questoes: criado.totalQuestoes,
      filtro: c.motivoFiltro,
      url: criado.url
    });

    // Pequena pausa entre criações para estabilidade de requisições
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`========================================================`);
  console.log(`VERIFICANDO TODOS OS ITENS NA SUBPASTA...`);
  const subItens = await client.get(`/pastas-cadernos/${PASTA_CGU}/subpastas/${SUBPASTA_TEMA}/itens`);
  console.log(`Total de cadernos na subpasta: ${subItens.itens?.length || 0}`);
  for (const item of subItens.itens || []) {
    console.log(`- ID: ${item.id} | ${item.nome} (${item.quantidadeItens} questões)`);
  }
}

executarCriacaoEmLote().catch(console.error);
