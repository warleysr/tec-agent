import { Session, TecClient } from '../src/client.mjs';
import { TecApi } from '../src/api.mjs';

const session = Session.load();
const client = new TecClient({ session });
const api = new TecApi(client);

const PASTA_CGU = 7853487;
const SUBPASTA_TEMA = 1839444;

async function testarCriacao() {
  const nomeCaderno = 'CGU - 1. Fundamentos Sociológicos';
  const spec = {
    assuntos: ['9033', '9048', '9066', '9096', '9101', '9125', '9064', '9142'],
    bancas: ['4'], // Cebraspe
    anos: ['2026', '2025', '2024', '2023', '2022'],
    opcoes: ['REMOVER_ADAPTADAS_INEDITAS', 'REMOVER_MULTIPLA_ESCOLHA']
  };

  console.log(`Contando questões para ${nomeCaderno}...`);
  const total = await api.contar(spec);
  console.log(`Total disponível: ${total}`);

  console.log(`Criando caderno...`);
  const res = await api.criarCaderno({
    nome: nomeCaderno,
    spec,
    pasta: PASTA_CGU,
    quantidade: Math.min(total, 100),
    ordenacao: 'RECENTES'
  });
  console.log('Resultado da criação:', res);

  console.log(`Movendo caderno ${res.id} para subpasta ${SUBPASTA_TEMA}...`);
  const moveRes = await client.post('/cadernos/multiple-set', {
    'cadernos[0]': String(res.id),
    pastaDestino: String(PASTA_CGU),
    subpastaDestino: String(SUBPASTA_TEMA)
  });
  console.log('Resultado de mover para subpasta:', moveRes);

  console.log('Verificando itens da subpasta...');
  const subItens = await client.get(`/pastas-cadernos/${PASTA_CGU}/subpastas/${SUBPASTA_TEMA}/itens`);
  console.log('Itens na subpasta:', JSON.stringify(subItens, null, 2));
}

testarCriacao().catch(console.error);
