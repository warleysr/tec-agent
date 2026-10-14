import { test } from "node:test";
import assert from "node:assert/strict";
import { TecClient, Session } from "../src/client.mjs";
import { TecApi } from "../src/api.mjs";

test("TecApi live integration test", async (t) => {
  const session = Session.load();
  if (!session.hasLoginCookie) {
    t.skip("Nenhuma sessão logada encontrada; ignorando teste de integração.");
    return;
  }

  const client = new TecClient({ session });
  const api = new TecApi(client);

  const who = await client.whoami();
  assert.equal(who.logged, true, "Sessão deve estar autenticada");

  const anos = await api.anos();
  assert.ok(Array.isArray(anos) && anos.length > 0, "Deve listar anos");
  assert.ok(anos.includes(2024), "Deve conter 2024");

  const [bancaId] = await api.resolver(["cebraspe"], "bancas");
  assert.equal(bancaId, 4, "CEBRASPE deve resolver para ID 4");

  const [materiaId] = await api.resolver(["Informática"], "materias");
  assert.equal(materiaId, 4, "Informática deve resolver para ID 4");

  const total = await api.contar({
    assuntos: ["2436"], // Backup
    bancas: [bancaId],
    anos: [2024],
  });
  assert.ok(typeof total === "number" && total > 0, "Contagem deve retornar número positivo");

  const ids = [];
  for await (const id of api.ids({ assuntos: ["2436"], bancas: [bancaId], anos: [2024] }, { limite: 1 })) {
    ids.push(id);
  }
  assert.equal(ids.length, 1, "Deve extrair 1 ID de questão");

  const q = await api.questao(ids[0], { comentario: true });
  assert.equal(q.id, ids[0]);
  assert.ok(q.enunciado.length > 0, "Deve conter enunciado");
  assert.ok(Array.isArray(q.alternativas), "Deve conter alternativas");
  assert.ok(q.gabarito, "Deve conter gabarito");
});

test("TecApi cadernos lifecycle", async (t) => {
  const session = Session.load();
  if (!session.hasLoginCookie) {
    t.skip("Nenhuma sessão logada encontrada; ignorando teste de cadernos.");
    return;
  }

  const client = new TecClient({ session });
  const api = new TecApi(client);

  const pastas = await api.pastas();
  assert.ok(Array.isArray(pastas) && pastas.length > 0, "Deve listar pastas de cadernos");

  const nomeTeste = `Caderno Teste Auto ${Date.now()}`;
  const criado = await api.criarCaderno({
    nome: nomeTeste,
    spec: { materias: ["4"], anos: ["2024"] },
    quantidade: 2,
    ordenacao: "ALEATORIA",
  });

  assert.ok(criado.id, "Caderno deve ter ID gerado");
  assert.equal(criado.totalQuestoes, 2, "Caderno deve conter 2 questões alocadas");
  assert.ok(criado.url.includes(String(criado.id)), "URL deve apontar para o caderno");

  const itens = await api.listarCadernos(criado.pastaId);
  const encontrado = itens.find((it) => it.id === criado.id);
  assert.ok(encontrado, "Caderno recém-criado deve constar na pasta");
  assert.equal(encontrado.quantidadeItens, 2, "Caderno deve ter 2 questões registradas");

  const excluido = await api.excluirCadernos(criado.id);
  assert.equal(excluido, true, "Exclusão do caderno deve retornar true");

  const itensApos = await api.listarCadernos(criado.pastaId);
  assert.ok(!itensApos.some((it) => it.id === criado.id), "Caderno excluído não deve constar na pasta ativa");
});
