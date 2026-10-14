#!/usr/bin/env node
import fs from "node:fs";
import { AuthError, TecClient, Session, SESSION_FILE } from "./client.mjs";
import { TecApi, htmlToText } from "./api.mjs";
import { loginBrowser, loginPassword, importCookies, prompt } from "./auth.mjs";

const HELP = `tec — agente para extrair questões do TEC Concursos via rotas /api

SESSÃO
  tec login [--browser | --password | --cookies <arquivo|"a=b; c=d">]
  tec status | tec logout

CATÁLOGO
  tec catalogo materias|bancas|orgaos|anos|areas|escolaridades|profissoes|opcoes [--buscar texto]
  tec catalogo assuntos --materia "Informática" [--buscar backup]

EXTRAÇÃO (filtros combináveis; listas separadas por vírgula; nomes ou ids)
  tec contar   [filtros]
  tec questoes [filtros] [--limite N] [--sem-comentario] [--saida arq.jsonl] [--formato jsonl|json|md] [--retomar] [--delay ms]
  tec questao <id> [--sem-comentario]
  tec raw GET|POST /caminho [--param k=v ...]

CADERNOS
  tec caderno criar "Nome do Caderno" [filtros] [--pasta "Nome/ID"] [--quantidade N] [--ordenacao aleatoria|recentes]
  tec caderno listar [--pasta "Nome/ID"]
  tec caderno pastas
  tec caderno excluir <id1,id2...>

FILTROS
  --materia  --assunto  --banca  --orgao  --ano  --area  --escolaridade  --profissao
  --dificuldade muito-facil|facil|media|dificil|muito-dificil
  --opcao ID_FILTRO_QUESTAO (ver: tec catalogo opcoes)   --enunciado "texto"
  --universo CONCURSOS|OAB|CFC|VESTIBULAR   --tipo OBJETIVA|OBJETIVA_INEDITAS|DISCURSIVA

Variáveis: TEC_AGENT_HOME (padrão ~/.tec-agent), CHROME_PATH, TEC_EMAIL/TEC_SENHA (login --password)`;

function parseArgs(argv) {
  const pos = [], f = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { pos.push(a); continue; }
    const k = a.slice(2), next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) f[k] = true;
    else { f[k] = [].concat(f[k] === true || f[k] === undefined ? [] : f[k], next); i++; }
  }
  return { pos, f };
}
const list = (v) => (v === undefined || v === true ? [] : [].concat(v).flatMap((s) => String(s).split(",")).map((s) => s.trim()).filter(Boolean));
const one = (v) => (Array.isArray(v) ? v[0] : v);
const DIF = { "muito-facil": "DIFICULDADE_MUITO_FACIL", facil: "DIFICULDADE_FACIL", media: "DIFICULDADE_MEDIA", dificil: "DIFICULDADE_DIFICIL", "muito-dificil": "DIFICULDADE_MUITO_DIFICIL" };
const out = (x) => console.log(typeof x === "string" ? x : JSON.stringify(x, null, 2));
const err = (...a) => console.error(...a);

async function buildSpec(api, f) {
  const spec = {};
  const materias = list(f.materia);
  spec.materias = materias.length ? await api.resolver(materias, "materias") : [];
  spec.bancas = await api.resolver(list(f.banca), "bancas");
  spec.orgaos = await api.resolver(list(f.orgao), "orgaos");
  spec.areas = await api.resolver(list(f.area), "areas");
  spec.escolaridades = await api.resolver(list(f.escolaridade), "escolaridades");
  spec.profissoes = await api.resolver(list(f.profissao), "profissoes");
  spec.anos = list(f.ano);
  spec.opcoes = [...list(f.opcao), ...list(f.dificuldade).map((d) => DIF[d] ?? d)];
  spec.enunciados = list(f.enunciado);
  spec.assuntos = [];
  for (const a of list(f.assunto)) {
    if (/^\d+$/.test(a)) { spec.assuntos.push(a); continue; }
    const hits = await api.buscarAssuntos(a, spec.materias.length === 1 ? spec.materias[0] : undefined);
    const exact = hits.filter((h) => h.nome.toLowerCase() === a.toLowerCase());
    const pick = exact.length ? exact : hits;
    if (!pick.length) throw new Error(`assunto "${a}" não encontrado`);
    if (pick.length > 1 && !exact.length && !f["todos-assuntos"]) {
      throw new Error(`assunto "${a}" ambíguo:\n` + pick.slice(0, 15).map((h) => `  ${h.id}\t${h.materia} › ${h.nome}`).join("\n") + `\nUse o id, restrinja com --materia, ou --todos-assuntos para incluir todos.`);
    }
    for (const h of f["todos-assuntos"] ? pick : [pick[0]]) spec.assuntos.push(String(h.id));
  }
  if (spec.assuntos.length && !f["toda-materia"]) {
    // No TEC Concursos, MATERIA e ASSUNTO pertencem ao mesmo grupo ("MATERIAS_ASSUNTOS").
    // Se ambos forem enviados, a API faz UNIÃO (OR), trazendo todas as questões da matéria inteira.
    // Portanto, quando --assunto é informado, --materia serve para contextualizar/desambiguar o assunto.
    spec.materias = [];
  }
  if (!Object.values(spec).some((v) => v.length)) throw new Error("Informe ao menos um filtro (ex.: --materia, --assunto, --banca).");
  return spec;
}

function flat(nodes, depth = 0) { return nodes.flatMap((n) => [{ ...n, depth }, ...flat(n.subTree ?? [], depth + 1)]); }

async function main() {
  const { pos, f } = parseArgs(process.argv.slice(2));
  const cmd = pos[0];
  if (!cmd || cmd === "help" || f.help) return out(HELP);
  const session = Session.load();
  const client = new TecClient({ session, minIntervalMs: Number(one(f.delay) ?? 250) });
  const api = new TecApi(client, { universo: one(f.universo) ?? "CONCURSOS", formato: one(f.tipo) ?? "OBJETIVA" });

  if (cmd === "login") {
    let who;
    if (f.cookies) { const v = one(f.cookies); importCookies(client, fs.existsSync(v) ? fs.readFileSync(v, "utf8") : v); who = await client.whoami(); }
    else if (f.password) {
      const email = process.env.TEC_EMAIL || (await prompt("E-mail: "));
      const senha = process.env.TEC_SENHA || (await prompt("Senha: ", { hidden: true }));
      try { who = await loginPassword(client, email, senha); }
      catch (e) { err(e.message); err("Abrindo login assistido pelo navegador..."); who = await loginBrowser(client); }
    } else who = await loginBrowser(client);
    if (!who.logged) throw new AuthError("Login não confirmado.");
    return out({ ok: true, sessao: SESSION_FILE, via: session.meta.via, cookies: Object.keys(session.cookies) });
  }
  if (cmd === "logout") { try { await client.request("GET", "/logout", { json: false, raw: true }); } catch {} session.clear(); return out("Sessão removida."); }
  if (cmd === "status") {
    const who = session.hasLoginCookie ? await client.whoami().catch((e) => ({ logged: false, erro: e.message })) : { logged: false };
    return out({ ...who, sessao: SESSION_FILE, via: session.meta?.via, desde: session.meta?.at, cookies: Object.keys(session.cookies) });
  }

  if (cmd === "catalogo") {
    const what = pos[1], q = one(f.buscar)?.toLowerCase();
    const filt = (arr, fn) => (q ? arr.filter((x) => fn(x).toLowerCase().includes(q)) : arr);
    const line = (id, nome, extra = "") => console.log(`${id}\t${nome}${extra ? "\t" + extra : ""}`);
    switch (what) {
      case "materias": filt(await api.materias(), (x) => x.nome).forEach((x) => line(x.id, x.nome)); break;
      case "assuntos": {
        const m = one(f.materia); if (!m) throw new Error("--materia obrigatório");
        const [mid] = await api.resolver([m], "materias");
        flat(await api.assuntos(mid)).filter((n) => !q || n.nome.toLowerCase().includes(q)).forEach((n) => line(n.id, "  ".repeat(n.depth) + n.nome.trim(), n.hierarquia ?? ""));
        break;
      }
      case "bancas": filt(await api.bancas(), (x) => x.sigla + x.nome).forEach((x) => line(x.id, x.sigla, x.nome)); break;
      case "orgaos": filt(await api.orgaos(), (x) => x.sigla + x.nome).forEach((x) => line(x.id, x.sigla, x.nome)); break;
      case "anos": out((await api.anos()).join(", ")); break;
      case "areas": flat(await api.areas()).forEach((x) => line(x.id, "  ".repeat(x.depth) + x.nome)); break;
      case "escolaridades": (await api.escolaridades()).forEach((x) => line(x.id, x.nome)); break;
      case "profissoes": filt(await api.profissoes(), (x) => x.nome).forEach((x) => line(x.id, x.nome)); break;
      case "opcoes": (await api.opcoes()).forEach((x) => line(x.id, x.nome, x.grupo)); break;
      default: throw new Error("catalogo: materias|assuntos|bancas|orgaos|anos|areas|escolaridades|profissoes|opcoes");
    }
    return;
  }

  if (cmd === "raw") {
    const [, method = "GET", p] = pos; const params = Object.fromEntries(list(f.param).map((s) => s.split(/=(.*)/s).slice(0, 2)));
    return out(method.toUpperCase() === "POST" ? await client.post(p, params) : await client.get(p, params));
  }

  if (cmd === "questao") { const q = await api.questao(pos[1], { comentario: !f["sem-comentario"] }); return out(q); }

  if (cmd === "contar") { const spec = await buildSpec(api, f); return out({ filtros: spec, total: await api.contar(spec) }); }

  if (cmd === "questoes") {
    const spec = await buildSpec(api, f);
    const total = await api.contar(spec);
    const limite = f.limite ? Number(one(f.limite)) : Infinity;
    const fmt = one(f.formato) ?? "jsonl", saida = one(f.saida);
    err(`Filtros resolvidos: ${JSON.stringify(spec)}\nTotal no site: ${total}${Number.isFinite(limite) ? ` (extraindo ${Math.min(limite, total)})` : ""}`);
    const feitos = new Set();
    if (saida && f.retomar && fs.existsSync(saida) && fmt === "jsonl")
      for (const l of fs.readFileSync(saida, "utf8").split("\n")) if (l.trim()) { try { feitos.add(JSON.parse(l).id); } catch {} }
    const sink = saida && fmt === "jsonl" ? fs.createWriteStream(saida, { flags: f.retomar ? "a" : "w" }) : null;
    const acc = []; let n = 0, falhas = 0;
    for await (const id of api.ids(spec, { limite })) {
      if (feitos.has(id)) { n++; continue; }
      try {
        const q = await api.questao(id, { comentario: !f["sem-comentario"] });
        n++;
        if (sink) sink.write(JSON.stringify(q) + "\n"); else if (fmt === "jsonl" && !saida) console.log(JSON.stringify(q)); else acc.push(q);
        if (n % 10 === 0) err(`  ${n}/${Math.min(limite, total)}`);
      } catch (e) { if (e instanceof AuthError) throw e; falhas++; err(`  falha na questão ${id}: ${e.message}`); }
    }
    sink?.end();
    if (fmt === "json" || fmt === "md") {
      const body = fmt === "json" ? JSON.stringify(acc, null, 2) : acc.map(toMarkdown).join("\n\n---\n\n");
      saida ? fs.writeFileSync(saida, body) : console.log(body);
    }
    err(`Concluído: ${n} questões, ${falhas} falhas${saida ? ` -> ${saida}` : ""}`);
    return;
  }

  if (cmd === "caderno") {
    const action = pos[1];
    if (action === "criar") {
      const nome = pos[2];
      if (!nome) throw new Error('Uso: tec caderno criar "Nome do Caderno" [filtros] [--pasta "Nome/ID"] [--quantidade N] [--ordenacao aleatoria|recentes]');
      const spec = await buildSpec(api, f);
      const res = await api.criarCaderno({
        nome,
        spec,
        pasta: one(f.pasta),
        quantidade: one(f.quantidade) ?? one(f.limite),
        ordenacao: one(f.ordenacao) ?? "ALEATORIA",
      });
      return out(res);
    }
    if (action === "listar") {
      const itens = await api.listarCadernos(one(f.pasta));
      if (!itens.length) return out("Nenhum caderno encontrado.");
      itens.forEach((c) => console.log(`${c.id}\t${c.nome}\t${c.quantidadeItens} questões\t${c.data}`));
      return;
    }
    if (action === "pastas") {
      const pastas = await api.pastas();
      pastas.forEach((p) => console.log(`${p.id}\t${p.nome}\t${p.qtdCadernos} cadernos${p.ativa ? " (ativa)" : ""}`));
      return;
    }
    if (action === "excluir") {
      const ids = list(pos[2] ?? f.id);
      if (!ids.length) throw new Error("Informe o(s) ID(s) do(s) caderno(s) a excluir: tec caderno excluir 12345");
      const ok = await api.excluirCadernos(ids);
      return out({ ok, excluidos: ids });
    }
    throw new Error('Comando de caderno desconhecido. Use: tec caderno criar|listar|pastas|excluir');
  }

  throw new Error(`Comando desconhecido: ${cmd}\n\n${HELP}`);
}

function toMarkdown(q) {
  const L = "ABCDEFGHIJ";
  return `### Questão ${q.id} — ${q.banca ?? ""} ${q.ano ?? ""} — ${q.orgao ?? ""}\n*${q.materia.nome} › ${q.assunto.nome}*\n\n${q.enunciado}\n\n` +
    q.alternativas.map((a, i) => (q.tipo === "CERTO_ERRADO" ? `- ${a}` : `- ${L[i]}) ${a}`)).join("\n") +
    `\n\n**Gabarito:** ${q.gabarito ?? "?"}` + (q.comentario ? `\n\n**Comentário:**\n${q.comentario}` : "");
}

main().catch((e) => {
  if (e instanceof AuthError) { err(`\n[auth] ${e.message}`); process.exit(2); }
  err(`\n[erro] ${e.message}`); process.exit(1);
});
