import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Session, flatten, HttpError, AuthError } from "../src/client.mjs";
import { htmlToText, TIPOS, extrairGabarito, distribuirQuestoes } from "../src/api.mjs";

test("extrairGabarito handles explicit key and multiple commentary formats", () => {
  // Caso 1: Alternativa direta vinda da API
  assert.equal(extrairGabarito({ numeroAlternativaCorreta: 2, tipoQuestao: "MULTIPLA_ESCOLHA" }), "B");
  assert.equal(extrairGabarito({ numeroAlternativaCorreta: 1, tipoQuestao: "CERTO_ERRADO", alternativas: ["Certo", "Errado"] }), "Certo");

  // Caso 2: Padrão Gabarito: Letra X
  assert.equal(extrairGabarito({}, "Gabarito: Letra C\nComentário do professor"), "C");
  assert.equal(extrairGabarito({}, "Gabarito: ERRADO"), "Errado");

  // Caso 3: Padrão Letra / Alternativa correta
  assert.equal(extrairGabarito({}, "Portanto, a alternativa D está correta."), "D");

  // Caso 4: Padrão B – texto ... Certa:
  assert.equal(extrairGabarito({}, "B – arquivo incremental\n\nCerta: de fato este é o item"), "B");

  // Caso 5: CERTO_ERRADO sem texto padrão
  assert.equal(extrairGabarito({ tipoQuestao: "CERTO_ERRADO" }, "Conclusão: o item está certo."), "Certo");
  assert.equal(extrairGabarito({ tipoQuestao: "CERTO_ERRADO" }, "Conclusão: a proposição está errada."), "Errado");
});

test("htmlToText decodes HTML entities and strips tags", () => {
  const input = "<p>O <em>accountability</em> &eacute; &ldquo;essencial&rdquo; &amp; b&aacute;sico.<br>Item 1.</p>";
  const expected = 'O accountability é “essencial” & básico.\nItem 1.';
  assert.equal(htmlToText(input), expected);
});

test("flatten converts nested objects and arrays to form pairs", () => {
  const input = {
    universo: "CONCURSOS",
    anos: [2023, 2024],
    "filtros[0].tipo": "ASSUNTO",
    "filtros[0].id": 2150,
  };
  const flat = flatten(input);
  assert.deepEqual(flat, [
    ["universo", "CONCURSOS"],
    ["anos[0]", "2023"],
    ["anos[1]", "2024"],
    ["filtros[0].tipo", "ASSUNTO"],
    ["filtros[0].id", "2150"],
  ]);
});

test("Session stores, serializes, absorbs cookies and clears", () => {
  const tmpFile = path.join(os.tmpdir(), `tec-test-session-${Date.now()}.json`);
  const session = new Session(tmpFile);
  session.cookies = { JSESSIONID: "ABC1234", TecPermanecerLogado: "XYZ9876" };
  session.meta = { via: "test", at: new Date().toISOString() };
  session.save();

  assert.ok(fs.existsSync(tmpFile));
  const loaded = Session.load(tmpFile);
  assert.equal(loaded.cookies.JSESSIONID, "ABC1234");
  assert.equal(loaded.cookies.TecPermanecerLogado, "XYZ9876");
  assert.equal(loaded.header(), "JSESSIONID=ABC1234; TecPermanecerLogado=XYZ9876");

  // Absorve Set-Cookie
  const mockResponse = {
    headers: {
      getSetCookie: () => [
        "JSESSIONID=NEW555; Path=/; HttpOnly",
        "AWSALB=ALB777; Path=/",
      ],
    },
  };
  loaded.absorb(mockResponse);
  assert.equal(loaded.cookies.JSESSIONID, "NEW555");
  assert.equal(loaded.cookies.AWSALB, "ALB777");
  assert.equal(loaded.cookies.TecPermanecerLogado, "XYZ9876");

  loaded.clear();
  assert.ok(!fs.existsSync(tmpFile));
  assert.deepEqual(loaded.cookies, {});
});

test("TIPOS mapping contains standard filter types", () => {
  assert.equal(TIPOS.materias, "MATERIA");
  assert.equal(TIPOS.assuntos, "ASSUNTO");
  assert.equal(TIPOS.bancas, "BANCA");
  assert.equal(TIPOS.orgaos, "ORGAO");
  assert.equal(TIPOS.anos, "ANO");
  assert.equal(TIPOS.opcoes, "FILTRO_QUESTAO");
});

test("distribuirQuestoes allocates questions proportionally across materias", () => {
  const materias = [
    { id: 1, nome: "Dir Admin", numeroQuestoes: 100 },
    { id: 2, nome: "Dir Const", numeroQuestoes: 50 },
    { id: 3, nome: "Info", numeroQuestoes: 20 },
  ];

  // Caso 1: Quantidade total desejada menor que o disponível
  distribuirQuestoes(materias, 17);
  const totalAlocado = materias.reduce((s, m) => s + m.alocado, 0);
  assert.equal(totalAlocado, 17);
  assert.equal(materias[0].alocado, 10);
  assert.equal(materias[1].alocado, 5);
  assert.equal(materias[2].alocado, 2);

  // Caso 2: Quantidade desejada igual ou maior que disponível
  const mat2 = [{ id: 4, nome: "Português", numeroQuestoes: 5 }];
  distribuirQuestoes(mat2, 10);
  assert.equal(mat2[0].alocado, 5);

  // Caso 3: Validação de erro para lista vazia ou 0 questões
  assert.throws(() => distribuirQuestoes([], 10), /nenhuma questão disponível/);
  assert.throws(() => distribuirQuestoes([{ id: 1, numeroQuestoes: 0 }], 10), /nenhuma questão disponível/);

  // Caso 4: Validação de limite > 10000
  assert.throws(() => distribuirQuestoes([{ id: 1, numeroQuestoes: 20000 }], 15000), /limite máximo/);
});
