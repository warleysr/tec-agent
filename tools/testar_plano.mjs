import { Session, TecClient } from '../src/client.mjs';
import { TecApi } from '../src/api.mjs';

const session = Session.load();
const client = new TecClient({ session });
const api = new TecApi(client);

const CEBRASPE = '4';
const BANCAS_TOP = ['4', '5', '3', '7', '6']; // Cebraspe, FGV, FCC, Cesgranrio, Vunesp
const ANOS_5 = ['2026', '2025', '2024', '2023', '2022'];
const ANOS_10 = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];
const REMOVER_ADAP = 'REMOVER_ADAPTADAS_INEDITAS';
const CERTO_ERRADO = 'REMOVER_MULTIPLA_ESCOLHA';

const CADERNOS_PLANO = [
  {
    codigo: 'CGU - 1. Fundamentos Sociológicos',
    descricao: 'Instituições, socialização, estratificação, mobilidade, redes, poder e desigualdades',
    assuntos: [9033, 9048, 9066, 9096, 9101, 9125, 9064, 9142],
    filtroBase: { bancas: [CEBRASPE], anos: ANOS_5, opcoes: [REMOVER_ADAP, CERTO_ERRADO] },
  },
  {
    codigo: 'CGU - 2. Formação Social e Cidadania no Brasil',
    descricao: 'Heranças da escravidão, Estado e sociedade, cidadania, inclusão/exclusão (Afrouxado: 10 anos + M.E. ou Top Bancas)',
    assuntos: [9330, 9359, 9075, 9350, 9102, 9342, 9361, 11629],
    filtroBase: { bancas: [CEBRASPE], anos: ANOS_5, opcoes: [REMOVER_ADAP, CERTO_ERRADO] },
    filtroAfrouxado1: { bancas: [CEBRASPE], anos: ANOS_10, opcoes: [REMOVER_ADAP, CERTO_ERRADO] },
    filtroAfrouxado2: { bancas: [CEBRASPE], anos: ANOS_10, opcoes: [REMOVER_ADAP] },
    filtroAfrouxado3: { bancas: BANCAS_TOP, anos: ANOS_5, opcoes: [REMOVER_ADAP] },
    filtroAfrouxado4: { bancas: BANCAS_TOP, anos: ANOS_10, opcoes: [REMOVER_ADAP] },
  },
  {
    codigo: 'CGU - 3A. Trabalho, Precarização e Mudanças Tecnológicas',
    descricao: 'Estrutura produtiva, relações de trabalho, informalidade, precarização e avanços tecnológicos',
    assuntos: [9083, 9352, 5370],
    filtroBase: { bancas: [CEBRASPE], anos: ANOS_5, opcoes: [REMOVER_ADAP, CERTO_ERRADO] },
  },
  {
    codigo: 'CGU - 3B. População, Demografia e Território',
    descricao: 'Transição demográfica, envelhecimento, migrações, desigualdades regionais, urbanas e rurais',
    assuntos: [5367, 5381, 5388, 9138, 3239],
    filtroBase: { bancas: [CEBRASPE], anos: ANOS_5, opcoes: [REMOVER_ADAP, CERTO_ERRADO] },
  },
  {
    codigo: 'CGU - 4A. Diversidade Étnico-Racial, Indígenas e Comunidades Tradicionais',
    descricao: 'Relações étnico-raciais, racismo, povos indígenas, quilombolas e igualdade racial',
    assuntos: [9134, 5565],
    filtroBase: { bancas: [CEBRASPE], anos: ANOS_5, opcoes: [REMOVER_ADAP, CERTO_ERRADO] },
  },
  {
    codigo: 'CGU - 4B. Gênero, Sexualidade, PCD e Acessibilidade',
    descricao: 'Gênero, sexualidade, movimento LGBTQI+, PCD, Estatuto do Idoso, acessibilidade e barreiras',
    assuntos: [9117, 9348, 5566, 5591, 4641, 4640, 5976, 5168],
    filtroBase: { bancas: [CEBRASPE], anos: ANOS_5, opcoes: [REMOVER_ADAP, CERTO_ERRADO] },
  },
  {
    codigo: 'CGU - 5. Desenvolvimento e Realidade Brasileira',
    descricao: 'Pobreza, renda, proteção social, educação, saúde, saneamento, sustentabilidade, clima e indicadores',
    assuntos: [9140, 9349, 9111, 9357, 9358, 5402, 3638, 3641, 3642],
    filtroBase: { bancas: [CEBRASPE], anos: ANOS_5, opcoes: [REMOVER_ADAP, CERTO_ERRADO] },
  }
];

async function testarPlano() {
  console.log('--- TESTANDO CONTROLE DE QUANTIDADE POR CADERNO ---');
  for (const c of CADERNOS_PLANO) {
    const spec = {
      assuntos: c.assuntos.map(String),
      ...c.filtroBase
    };
    const count = await api.contar(spec);
    console.log(`\n${c.codigo}:`);
    console.log(`  Base (Cebraspe, C/E, 5 anos): ${count} questões`);

    if (count < 20) {
      if (c.filtroAfrouxado1) {
        const specA1 = { assuntos: c.assuntos.map(String), ...c.filtroAfrouxado1 };
        console.log(`  Afrouxado 1 (Cebraspe, C/E, 10 anos): ${await api.contar(specA1)} questões`);
      }
      if (c.filtroAfrouxado2) {
        const specA2 = { assuntos: c.assuntos.map(String), ...c.filtroAfrouxado2 };
        console.log(`  Afrouxado 2 (Cebraspe, C/E + M.E., 10 anos): ${await api.contar(specA2)} questões`);
      }
      if (c.filtroAfrouxado3) {
        const specA3 = { assuntos: c.assuntos.map(String), ...c.filtroAfrouxado3 };
        console.log(`  Afrouxado 3 (Top Bancas, C/E + M.E., 5 anos): ${await api.contar(specA3)} questões`);
      }
      if (c.filtroAfrouxado4) {
        const specA4 = { assuntos: c.assuntos.map(String), ...c.filtroAfrouxado4 };
        console.log(`  Afrouxado 4 (Top Bancas, C/E + M.E., 10 anos): ${await api.contar(specA4)} questões`);
      }
    }
  }
}

testarPlano().catch(console.error);
