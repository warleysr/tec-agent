// Rotas do TEC mapeadas por observação (ver docs/ROUTES.md). Todas sob /api, form-urlencoded nos POST.
const strip = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const ENT = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

/** HTML -> texto (decodifica entidades, inclusive acentuadas via tabela mínima + numéricas). */
const LAT = { aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", agrave: "à", acirc: "â", ecirc: "ê", ocirc: "ô", atilde: "ã", otilde: "õ", ccedil: "ç", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Agrave: "À", Acirc: "Â", Ecirc: "Ê", Ocirc: "Ô", Atilde: "Ã", Otilde: "Õ", Ccedil: "Ç", uuml: "ü", ordm: "º", ordf: "ª", ndash: "–", mdash: "—", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", hellip: "…", sect: "§" };
export function htmlToText(html = "") {
  return html
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|tr)>/gi, "\n").replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-zA-Z]+);/g, (m, n) => ENT[n] ?? LAT[n] ?? m)
    .replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Tipos aceitos em filtros[i].tipo (extraídos de gerador.buscadores.angular.js). */
export const TIPOS = {
  materias: "MATERIA", assuntos: "ASSUNTO", bancas: "BANCA", orgaos: "ORGAO", anos: "ANO",
  areas: "AREA_CONCURSO", escolaridades: "ESCOLARIDADE", profissoes: "PROFISSAO",
  opcoes: "FILTRO_QUESTAO", enunciados: "ENUNCIADO", pastasFavoritas: "PASTA_FAVORITAS",
};

export function extrairGabarito(q, comTxt) {
  const letras = "ABCDEFGHIJ";
  let gab = Number.isInteger(q?.numeroAlternativaCorreta) ? q.numeroAlternativaCorreta : null;
  if (gab) return q.tipoQuestao === "CERTO_ERRADO" ? q.alternativas[gab - 1] : letras[gab - 1];
  if (!comTxt) return null;

  // Padrão 1: Gabarito: Letra A / Gabarito: Certo / Gabarito: E
  const m1 = /(?:Gabarito|Resposta|Opção)\s*(?:Oficial)?(?:\s*é)?(?:\s*a)?\s*[:\s-]\s*(?:Letra\s*)?([A-J]|Certo|Errado)\b/i.exec(comTxt);
  if (m1) return m1[1].length === 1 ? m1[1].toUpperCase() : m1[1][0].toUpperCase() + m1[1].slice(1).toLowerCase();

  // Padrão 2: Letra B é a correta / Alternativa C está certa
  const m2 = /(?:Letra|Alternativa)\s*([A-J])\s*(?:é a|está)?\s*(?:correta|certa)\b/i.exec(comTxt);
  if (m2) return m2[1].toUpperCase();

  // Padrão 3: B – <texto>\n\nCerta: ...
  const m3 = /([A-J])\s*[–\-—:]\s*[^\n]+\n+\s*(?:Certa|Correta)\b/i.exec(comTxt);
  if (m3) return m3[1].toUpperCase();

  // Padrão 4: Certo/Errado em comentários
  if (q?.tipoQuestao === "CERTO_ERRADO") {
    if (/\b(?:item|afirmativa|proposição)\s*(?:é|está)?\s*(?:certo|certa|correto|correta)\b/i.test(comTxt)) return "Certo";
    if (/\b(?:item|afirmativa|proposição)\s*(?:é|está)?\s*(?:errado|errada|incorreto|incorreta)\b/i.test(comTxt)) return "Errado";
  }
  return null;
}

export class TecApi {
  constructor(client, { universo = "CONCURSOS", formato = "OBJETIVA" } = {}) { this.c = client; this.universo = universo; this.formato = formato; }
  get ctx() { return { universo: this.universo, formato: this.formato }; }

  // ---------- catálogo ----------
  async materias() { return (await this.c.get("/materias", this.ctx)).materias; }
  async assuntos(materiaId, hierarquico = true) {
    return (await this.c.get("/assuntos", { ...this.ctx, materia: materiaId, hierarquico })).assuntos;
  }
  async bancas() { return (await this.c.get("/bancas", this.ctx)).bancas; }
  async orgaos() { return (await this.c.get("/orgaos", this.ctx)).orgaos; }
  async cargos(orgaoId) { return (await this.c.get("/cargos", { ...this.ctx, orgao: orgaoId, hierarquico: true })).cargos; }
  async anos() { return (await this.c.get("/anos", this.ctx)).anos; }
  async areas() { return (await this.c.get("/enums/areas")).areas; }
  async escolaridades() { return (await this.c.get("/enums/escolaridades")).escolaridades; }
  async profissoes() { return (await this.c.get("/profissoes", { formato: this.formato })).profissoes; }
  async opcoes() { return (await this.c.get("/enums/filtros-questao", this.ctx)).filtros; }
  async universos() { return (await this.c.get("/enums/universos")).universos; }
  async formatos() { return (await this.c.get("/enums/formatos-questoes")).formatos; }

  /** Busca assunto por nome. Sem matéria: rota de busca do servidor (GET /assuntos?nome=). Com matéria: percorre a árvore. */
  async buscarAssuntos(nome, materiaId) {
    if (!materiaId) {
      const r = await this.c.get("/assuntos", { ...this.ctx, nome, hierarquico: false });
      return (r.assuntos ?? []).map((n) => ({ id: n.id, nome: n.nome.trim(), hierarquia: n.hierarquia, materiaId: n.materia?.id, materia: n.materia?.nome }));
    }
    const alvo = strip(nome), hits = [];
    const walk = (nodes) => { for (const n of nodes ?? []) { if (strip(n.nome).includes(alvo)) hits.push({ id: n.id, nome: n.nome.trim(), hierarquia: n.hierarquia, materiaId, materia: undefined }); walk(n.subTree); } };
    walk(await this.assuntos(materiaId));
    return hits;
  }

  // ---------- resolução de nomes -> ids ----------
  async resolver(lista, tipo) {
    const out = [];
    for (const item of lista) {
      if (/^\d+$/.test(item) || (tipo === "opcoes")) { out.push(item); continue; }
      const alvo = strip(item); let pool;
      if (tipo === "materias") pool = (await this.materias()).map((x) => ({ id: x.id, n: x.nome }));
      else if (tipo === "bancas") pool = (await this.bancas()).flatMap((x) => [{ id: x.id, n: x.sigla }, { id: x.id, n: x.nome }, { id: x.id, n: x.url }]);
      else if (tipo === "orgaos") pool = (await this.orgaos()).flatMap((x) => [{ id: x.id, n: x.sigla }, { id: x.id, n: x.nome }]);
      else if (tipo === "profissoes") pool = (await this.profissoes()).map((x) => ({ id: x.id, n: x.nome }));
      else if (tipo === "areas") pool = (await this.areas()).flatMap(function f(x) { return [{ id: x.id, n: x.nome }, ...(x.subTree ?? []).flatMap(f)]; });
      else if (tipo === "escolaridades") pool = (await this.escolaridades()).map((x) => ({ id: x.id, n: x.nome }));
      else { out.push(item); continue; }
      const exact = pool.filter((p) => strip(p.n) === alvo);
      const hit = exact.length ? exact : pool.filter((p) => strip(p.n).includes(alvo));
      const ids = [...new Set(hit.map((h) => h.id))];
      if (!ids.length) throw new Error(`${tipo}: "${item}" não encontrado`);
      if (ids.length > 1 && !exact.length) throw new Error(`${tipo}: "${item}" ambíguo -> ${hit.slice(0, 6).map((h) => `${h.n} (${h.id})`).join(", ")}. Use o id.`);
      out.push(ids[0]);
    }
    return out;
  }

  // ---------- filtros -> parâmetros ----------
  /** spec: { materias:[], assuntos:[], bancas:[], orgaos:[], anos:[], areas:[], escolaridades:[], profissoes:[], opcoes:[], enunciados:[] }  (ids já resolvidos) */
  filtrosParams(spec) {
    const p = {}; let i = 0;
    for (const [k, tipo] of Object.entries(TIPOS)) for (const id of spec[k] ?? []) { p[`filtros[${i}].tipo`] = tipo; p[`filtros[${i}].id`] = id; i++; }
    return p;
  }
  /** Quantidade de questões para o filtro (POST /questoes/contagem/filtros -> {int}). */
  async contar(spec) {
    const r = await this.c.post("/questoes/contagem/filtros", { ...this.ctx, gerarEmSerie: false, caderno: "", ...this.filtrosParams(spec) });
    if (r.erro) throw new Error(r.erro.mensagem);
    return r.int;
  }
  /** Uma página de IDs (POST /questoes/filtros -> {questoes:[ids]}). ~100 ids/página. */
  async idsPagina(spec, pagina = 1) {
    const r = await this.c.post("/questoes/filtros", { ...this.ctx, pagina, ...this.filtrosParams(spec) });
    if (r.erro) throw new Error(r.erro.mensagem);
    return r.questoes ?? [];
  }
  async *ids(spec, { limite = Infinity, paginaInicial = 1 } = {}) {
    let n = 0;
    for (let p = paginaInicial; ; p++) {
      const page = await this.idsPagina(spec, p);
      if (!page.length) return;
      for (const id of page) { if (n++ >= limite) return; yield id; }
    }
  }

  // ---------- conteúdo da questão ----------
  async questaoBruta(id) { return (await this.c.get(`/questoes/${id}`)).questao; }
  async detalhes(id) { return (await this.c.get(`/questoes/${id}/detalhes`)).informacoes; }
  async comentario(id) { return (await this.c.get(`/questoes/${id}/comentario`)).comentario; }


  /** Questão normalizada. Gabarito vem de numeroAlternativaCorreta (quando exposto) ou do texto do comentário. */
  async questao(id, { comentario = true } = {}) {
    const [q, d] = await Promise.all([this.questaoBruta(id), this.detalhes(id).catch(() => ({}))]);
    let com = null;
    if (comentario) com = await this.comentario(id).catch(() => null);
    const comTxt = com?.textoComentario ? htmlToText(com.textoComentario) : null;
    const gabarito = extrairGabarito(q, comTxt);
    return {
      id: q.idQuestao ?? id, tipo: q.tipoQuestao, formato: q.formatoQuestao,
      materia: { id: q.idMateria, nome: q.nomeMateria, url: q.materiaUrl },
      assunto: { id: q.idAssunto, nome: q.nomeAssunto?.trim(), url: q.assuntoUrl },
      banca: q.bancaSigla ?? d.bancaNome, orgao: q.orgaoSigla ?? d.orgaoSigla, orgaoNome: q.orgaoNome ?? d.orgaoNome,
      cargo: q.cargoSigla ?? d.cargoNome, ano: q.concursoAno ?? d.concursoAno, area: q.concursoArea ?? d.concursoArea,
      prova: d.questaoProva, numero: d.questaoNumero, dificuldade: d.questaoDificuldade,
      anulada: !!q.anulada, desatualizada: !!q.desatualizada, dataPublicacao: d.dataPublicacao ?? q.dataPublicacao?.$,
      enunciado: htmlToText(q.enunciado), enunciadoHtml: q.enunciado,
      alternativas: (q.alternativas ?? []).map((a) => htmlToText(a)), alternativasHtml: q.alternativas,
      gabarito, comentario: comTxt, comentarioHtml: com?.textoComentario ?? null,
      url: `https://www.tecconcursos.com.br/questoes/${q.idQuestao ?? id}`,
    };
  }

  // ---------- cadernos ----------
  async pastas() { return (await this.c.get("/pastas-cadernos")).pastas ?? []; }

  async resolverPasta(pastaIdOuNome) {
    const pastas = await this.pastas();
    if (!pastaIdOuNome) {
      const ativa = pastas.find((p) => p.ativa) || pastas.find((p) => /sem classifica/i.test(p.nome)) || pastas[0];
      return ativa?.id ?? 0;
    }
    if (/^\d+$/.test(String(pastaIdOuNome))) return Number(pastaIdOuNome);
    const alvo = strip(pastaIdOuNome);
    const hit = pastas.find((p) => strip(p.nome) === alvo) || pastas.find((p) => strip(p.nome).includes(alvo));
    if (!hit) throw new Error(`Pasta "${pastaIdOuNome}" não encontrada. Pastas disponíveis: ${pastas.map((p) => p.nome).join(", ")}`);
    return hit.id;
  }

  /** Retorna lista de matérias com contagem de questões para os filtros informados (POST /materias/buscar-questoes-por-materia). */
  async questoesPorMateria(spec) {
    const r = await this.c.post("/materias/buscar-questoes-por-materia", {
      universo: this.universo,
      formato: this.formato,
      gerarEmSerie: false,
      ordenacao: "ALFABETICA",
      ...this.filtrosParams(spec),
    });
    if (r.erro) throw new Error(r.erro.mensagem || "Erro ao consultar matérias.");
    return r.list ?? [];
  }

  // ---------- subpastas e organização ----------
  async subpastas(pastaId) {
    const id = await this.resolverPasta(pastaId);
    const r = await this.c.get(`/pastas-cadernos/${id}/itens`);
    return (r.itens ?? []).filter((item) => item.subpasta);
  }

  async resolverSubpasta(pastaId, subpastaIdOuNome) {
    if (!subpastaIdOuNome) return null;
    if (/^\d+$/.test(String(subpastaIdOuNome))) return Number(subpastaIdOuNome);
    const subs = await this.subpastas(pastaId);
    const alvo = strip(subpastaIdOuNome);
    const hit = subs.find((s) => strip(s.nome) === alvo) || subs.find((s) => strip(s.nome).includes(alvo));
    if (!hit) throw new Error(`Subpasta "${subpastaIdOuNome}" não encontrada. Subpastas disponíveis: ${subs.map((s) => s.nome).join(", ")}`);
    return hit.id;
  }

  async criarSubpasta(pastaId, nome) {
    const id = await this.resolverPasta(pastaId);
    const r = await this.c.post(`/pastas-cadernos/${id}/subpastas`, { nome: nome.trim() });
    const subpasta = r.subpasta ?? r;
    if (subpasta?.nome !== nome.trim() && subpasta?.id) {
      await this.c.post(`/pastas-cadernos/${id}/subpastas/${subpasta.id}`, { nome: nome.trim(), _method: "put" });
      subpasta.nome = nome.trim();
    }
    return subpasta;
  }

  async moverCadernos(cadernoIds, pastaDestinoId, subpastaDestinoId = null) {
    const ids = Array.isArray(cadernoIds) ? cadernoIds : [cadernoIds];
    const pastaId = await this.resolverPasta(pastaDestinoId);
    const subId = subpastaDestinoId ? await this.resolverSubpasta(pastaId, subpastaDestinoId) : null;
    const payload = { pastaDestino: String(pastaId) };
    if (subId) payload.subpastaDestino = String(subId);
    ids.forEach((id, i) => { payload[`cadernos[${i}]`] = String(id); });
    const r = await this.c.post("/cadernos/multiple-set", payload);
    return r.boolean === true;
  }

  /** Cria um novo caderno no TEC Concursos a partir de filtros. Retorna { id, nome, pastaId, totalQuestoes, url, mensagem }. */
  async criarCaderno({ nome, spec, pasta, subpasta, quantidade, ordenacao = "ALEATORIA" }) {
    if (!nome) throw new Error("Nome do caderno é obrigatório.");
    const pastaDestino = await this.resolverPasta(pasta);
    const subpastaDestino = subpasta ? await this.resolverSubpasta(pastaDestino, subpasta) : null;
    const forma = ordenacao.toUpperCase() === "RECENTES" ? "RECENTES" : "ALEATORIA";

    const materias = await this.questoesPorMateria(spec);
    distribuirQuestoes(materias, quantidade);

    const payload = {
      nomeCaderno: nome.trim(),
      caderno: "",
      universo: this.universo,
      formato: this.formato,
      formaEscolherQuestoes: forma,
      pastaDestino: String(pastaDestino),
      ...this.filtrosParams(spec),
    };

    materias.forEach((m, idx) => {
      payload[`materias[${idx}].id`] = String(m.id);
      payload[`materias[${idx}].numeroQuestoes`] = String(m.alocado);
    });

    const r = await this.c.post("/cadernos/gerar-caderno", payload);
    if (r.erro || (r.mensagem && r.mensagem.toLowerCase().includes("erro"))) {
      throw new Error(r.mensagem || r.erro?.mensagem || "Falha ao criar caderno no TEC Concursos.");
    }

    if (subpastaDestino && r.id) {
      await this.moverCadernos([r.id], pastaDestino, subpastaDestino);
    }

    const totalAlocado = materias.reduce((s, m) => s + (m.alocado || 0), 0);
    return {
      id: r.id,
      nome: nome.trim(),
      pastaId: pastaDestino,
      subpastaId: subpastaDestino ?? undefined,
      totalQuestoes: totalAlocado,
      mensagem: r.mensagem,
      url: `https://www.tecconcursos.com.br/questoes/cadernos/${r.id}`,
    };
  }

  async listarCadernos(pastaId, { subpastaId = null, ordenacao = "nome", pagina = 1 } = {}) {
    const id = await this.resolverPasta(pastaId);
    let url = `/pastas-cadernos/${id}/itens`;
    if (subpastaId) {
      const subId = await this.resolverSubpasta(id, subpastaId);
      url = `/pastas-cadernos/${id}/subpastas/${subId}/itens`;
    }
    const r = await this.c.get(url, { ordenacao, paginar: true, pagina });
    return r.itens ?? [];
  }

  async compartilharCaderno(cadernoId) {
    if (!/^\d+$/.test(String(cadernoId))) throw new Error(`ID de caderno inválido: ${cadernoId}`);
    const r = await this.c.post(`/cadernos/${cadernoId}/compartilhamento`, {});
    if (r.erro || !Array.isArray(r.links) || !r.links[0]) {
      throw new Error(r.erro?.mensagem || "O TEC não retornou um link de compartilhamento para este caderno.");
    }
    return { id: Number(cadernoId), linkCompartilhamento: r.links[0], linkDireto: r.links[1] ?? null };
  }

  async excluirCadernos(cadernoIds) {
    const ids = Array.isArray(cadernoIds) ? cadernoIds : [cadernoIds];
    const payload = {};
    ids.forEach((id, i) => { payload[`cadernos[${i}]`] = String(id); });
    const r = await this.c.post("/cadernos/multiple-delete", payload);
    return r.boolean === true;
  }

  async cadernoQuestao(cadernoId, n) { return (await this.c.get(`/cadernos/${cadernoId}/questoes/${n}`)).questao; }
}

export function distribuirQuestoes(materias, totalDesejado) {
  const totalDisponivel = materias.reduce((acc, m) => acc + (m.numeroQuestoes || 0), 0);
  if (totalDisponivel <= 0) {
    throw new Error("Não é possível gerar o caderno: nenhuma questão disponível para os filtros informados (ou todas as questões já foram alocadas em outros cadernos/lixeira).");
  }

  const limite = totalDesejado !== undefined && totalDesejado !== null && totalDesejado !== "" ? Number(totalDesejado) : null;
  if (limite !== null && (isNaN(limite) || limite <= 0)) {
    throw new Error("A quantidade de questões deve ser um número inteiro positivo.");
  }
  if (limite && limite > 10000) {
    throw new Error("O limite máximo do TEC Concursos é de 10.000 questões por caderno.");
  }
  if (!limite && totalDisponivel > 10000) {
    throw new Error(`O filtro selecionou ${totalDisponivel} questões, mas o TEC Concursos limita cadernos a no máximo 10.000 questões. Use --quantidade (ex: --quantidade 1000) para definir o limite.`);
  }

  const alvo = limite ? Math.min(limite, totalDisponivel) : totalDisponivel;

  if (alvo === totalDisponivel) {
    materias.forEach((m) => { m.alocado = m.numeroQuestoes; });
    return materias;
  }

  let soma = 0;
  materias.forEach((m) => {
    const share = Math.floor((m.numeroQuestoes / totalDisponivel) * alvo);
    m.alocado = Math.min(share, m.numeroQuestoes);
    soma += m.alocado;
  });

  let resto = alvo - soma;
  for (let i = 0; i < materias.length && resto > 0; i++) {
    if (materias[i].alocado < materias[i].numeroQuestoes) {
      materias[i].alocado++;
      resto--;
    }
    if (i === materias.length - 1 && resto > 0) i = -1;
  }

  return materias;
}
