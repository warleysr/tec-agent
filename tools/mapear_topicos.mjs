import { Session, TecClient } from '../src/client.mjs';
import { TecApi } from '../src/api.mjs';

const session = Session.load();
const client = new TecClient({ session });
const api = new TecApi(client);

const CEBRASPE = '4';
const BANCAS_EXPANDIDAS = ['4', '5', '3', '7', '6']; // Cebraspe, FGV, FCC, Cesgranrio, Vunesp
const ANOS_5 = ['2026', '2025', '2024', '2023', '2022'];
const ANOS_10 = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];
const REMOVER_ADAP = 'REMOVER_ADAPTADAS_INEDITAS';
const CERTO_ERRADO = 'REMOVER_MULTIPLA_ESCOLHA';

// Mapeamento dos 5 tópicos principais para conjuntos de assuntos no TEC
// Vamos listar os IDs de assuntos das matérias:
// 80: Ciências Sociais
// 183: Direitos Humanos
// 100: Geografia
// 17: Atualidades
// 14: Administração Pública

const TOPICOS = {
  '1. Fundamentos Sociológicos': {
    descricao: 'Instituições, socialização, ação coletiva, estratificação, mobilidade, redes, poder e reprodução das desigualdades',
    assuntos: [
      // Ciências Sociais (80)
      9033, // Princípios de Sociologia
      9048, // Cultura e Sociedade (Socialização 9058, etc)
      9066, // Interação Social e Vida Cotidiana (Movimentos sociais 9073, Redes 9351)
      9096, // Estratificação e Mobilidade Social (Camadas 9097, Classes 9098, Mobilidade 9099)
      9101, // A Política e o Poder
      9125, // Instituições Sociais (9126 Família, 9129 Religião, 9133 Estado e controle social, 9333 Conceito)
      9064, // Desigualdade e Divisões Globais
      9142, // Desigualdade Social
    ]
  },
  '2. Formação Social e Cidadania no Brasil': {
    descricao: 'Heranças da escravidão, hierarquias sociais, cidadania, Estado e sociedade, inclusão e exclusão',
    assuntos: [
      // Ciências Sociais (80)
      9330, // Escravidão no Brasil
      9359, // Dívida histórica
      9075, // Organização Social e Cidadania (9076 Conceitos, 9081 DH e cidadania, 9347 Conquista de direitos)
      9350, // Ações Afirmativas
      9102, // Conceito de Estado
      9342, // Democracia e Direitos
      9361, // Sociólogos e Intelectuais Brasileiros
      // Direitos Humanos (183)
      11629, // Direito da Antidiscriminação - Conceitos, Doutrina, Ações, Modalidades
    ]
  },
  '3. População, Território e Trabalho': {
    descricao: 'Transição demográfica, envelhecimento, desigualdades regionais/urbanas/rurais, estrutura produtiva, informalidade e tecnologia',
    assuntos: [
      // Ciências Sociais (80)
      9083, // Trabalho e Sociedade (9086 Meios, 9087 Forças, 9088 Relações, 9089 Precarização, 9092 Trabalho Informal, 9093 Trabalho Remoto)
      9352, // Avanços Tecnológicos
      9138, // Movimentos Migratórios e Imigratórios
      // Geografia (100)
      5367, // Geografia da População (Dinâmica, Transição demográfica, Envelhecimento)
      5381, // Geografia Urbana (Urbanização, Segregação)
      5388, // Geografia Agrária (Estrutura fundiária, Relações de trabalho no campo)
      5370, // Geografia Econômica (Estrutura produtiva)
      // Atualidades (17)
      3239, // Organização Territorial e Demografia
    ]
  },
  '4. Diversidade e Acesso a Direitos': {
    descricao: 'Relações étnico-raciais, gênero e sexualidade, PCD, povos indígenas, comunidades tradicionais, interseccionalidade, acessibilidade',
    assuntos: [
      // Ciências Sociais (80)
      9134, // Raça, Etnia e Migração (9135 Raça, 9136 Etnias, 9137 Racismo/Preconceito/Discriminação, 9331 Indígenas, 9332 Quilombolas)
      9117, // Gênero e Sexualidade (9118 Construção social, 9122 Movimento LGBTQI+, 9337 Gênero e direitos, 9338 Movimento Feminista, 9336 Feminicídio)
      9348, // Acessibilidade
      // Direitos Humanos (183)
      5565, // Direitos de Igualdade Racial (Estatuto da Igualdade Racial, etc.)
      5566, // Direitos de Orientação Sexual
      5591, // Direito das Mulheres no Brasil
      4641, // Direito das Pessoas com Deficiência (Estatuto da PCD / Lei 13.146)
      4640, // Direito do Idoso (Estatuto do Idoso)
      5976, // Prioridade de Atendimento e Acessibilidade
      // Atualidades (17)
      5168, // Sociedade, Gênero, Raça, Desigualdade e Classe Social
    ]
  },
  '5. Desenvolvimento e Realidade Brasileira': {
    descricao: 'Pobreza, renda, proteção social, educação, saúde, saneamento, sustentabilidade, vulnerabilidade climática, indicadores sociais',
    assuntos: [
      // Ciências Sociais (80)
      9140, // Pobreza e Desenvolvimento (9141 Países pobres, 9142 Desigualdade Social, 9143 Desenvolvimento Econômico, 9144 Assistência Social)
      9349, // Indicadores Sociais
      9111, // Educação (9112 Educação e mudança social)
      9357, // Problemas Sociais (Saúde, saneamento, habitação)
      9358, // Meio Ambiente e Sustentabilidade
      // Geografia (100)
      5402, // Geografia e Meio Ambiente (Vulnerabilidade, Clima, Sustentabilidade)
      // Atualidades (17)
      3638, // Meio Ambiente, Ecologia e Sustentabilidade
      3641, // Educação
      3642, // Saúde
    ]
  }
};

async function avaliar() {
  console.log('Testando contagem por tópicos nos diferentes níveis de filtro...\n');

  for (const [nome, info] of Object.entries(TOPICOS)) {
    console.log(`=======================================================`);
    console.log(`TÓPICO: ${nome}`);
    console.log(`Assuntos vinculados: ${info.assuntos.length}`);

    // Nível 1: Cebraspe + C/E + 5 anos + sem adaptadas
    const specN1 = {
      assuntos: info.assuntos.map(String),
      bancas: [CEBRASPE],
      anos: ANOS_5,
      opcoes: [REMOVER_ADAP, CERTO_ERRADO]
    };
    const c1 = await api.contar(specN1);

    // Nível 2: Cebraspe + C/E + 10 anos + sem adaptadas
    const specN2 = {
      assuntos: info.assuntos.map(String),
      bancas: [CEBRASPE],
      anos: ANOS_10,
      opcoes: [REMOVER_ADAP, CERTO_ERRADO]
    };
    const c2 = await api.contar(specN2);

    // Nível 3: Cebraspe + Todos Tipos (C/E + ME) + 5 anos + sem adaptadas
    const specN3 = {
      assuntos: info.assuntos.map(String),
      bancas: [CEBRASPE],
      anos: ANOS_5,
      opcoes: [REMOVER_ADAP]
    };
    const c3 = await api.contar(specN3);

    // Nível 4: Cebraspe + Todos Tipos + 10 anos + sem adaptadas
    const specN4 = {
      assuntos: info.assuntos.map(String),
      bancas: [CEBRASPE],
      anos: ANOS_10,
      opcoes: [REMOVER_ADAP]
    };
    const c4 = await api.contar(specN4);

    // Nível 5: Mais Bancas + Todos Tipos + 5 anos + sem adaptadas
    const specN5 = {
      assuntos: info.assuntos.map(String),
      bancas: BANCAS_EXPANDIDAS,
      anos: ANOS_5,
      opcoes: [REMOVER_ADAP]
    };
    const c5 = await api.contar(specN5);

    // Nível 6: Mais Bancas + Todos Tipos + 10 anos + sem adaptadas
    const specN6 = {
      assuntos: info.assuntos.map(String),
      bancas: BANCAS_EXPANDIDAS,
      anos: ANOS_10,
      opcoes: [REMOVER_ADAP]
    };
    const c6 = await api.contar(specN6);

    console.log(`  1. Cebraspe | C/E | 5 anos:              ${c1} questões`);
    console.log(`  2. Cebraspe | C/E | 10 anos:             ${c2} questões`);
    console.log(`  3. Cebraspe | C/E + M.E. | 5 anos:       ${c3} questões`);
    console.log(`  4. Cebraspe | C/E + M.E. | 10 anos:      ${c4} questões`);
    console.log(`  5. Top Bancas | C/E + M.E. | 5 anos:     ${c5} questões`);
    console.log(`  6. Top Bancas | C/E + M.E. | 10 anos:    ${c6} questões`);
  }
}

avaliar().catch(console.error);
