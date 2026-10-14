# TEC Concursos — Agent Skill & CLI

Agente autônomo, CLI e **Skill de IA** (compatível com Google Antigravity, Claude Code, Cursor, Codex e OpenCode) para consultar catálogos, filtrar questões, extrair conteúdo completo e **gerar cadernos de estudo diretamente no [TEC Concursos](https://www.tecconcursos.com.br)** pelas rotas internas de API.

---

## Recursos Principais

- **Skill para Agentes de IA (`SKILL.md`)**: Permite que assistentes como Antigravity ou Claude Code recebam ordens em linguagem natural e executem pesquisas, contagens, extrações e criação de cadernos de estudo de forma autônoma.
- **Criação de Cadernos no Site**: Cria cadernos diretamente na conta do usuário no TEC Concursos com filtros finos e rateio proporcional de questões por matéria.
- **Sessão Persistente**: Salva cookies de autenticação (`TecPermanecerLogado` e `JSESSIONID`) em `~/.tec-agent/session.json`, mantendo o usuário conectado por semanas com renovação automática.
- **Zero Dependências**: Construído em Node.js ESM nativo com `fetch`, `WebSocket` e `node:test` (sem dependências no `node_modules`).
- **Filtros Avançados**: Matéria, assunto em árvore hierárquica, banca, órgão, ano, área, escolaridade, formação profissional, opções de dificuldade e enunciados.
- **Extração Completa**: Enunciado, alternativas, tipo da questão, gabarito identificado (mesmo quando no comentário), detalhes da prova e resolução do professor. Formatos de saída: `md` (leitura), `jsonl` (streaming com `--retomar`) e `json`.

---

## 1. Como Utilizar como Skill no Antigravity e Agentes de IA

Este repositório inclui a especificação completa da skill no arquivo [`SKILL.md`](SKILL.md). Com ele, seu agente de IA entende automaticamente a sintaxe da CLI e quando ativá-la.

### Passo 1: Instalar o utilitário `tec` no sistema

Clone o repositório e registre o comando `tec` globalmente:

```bash
git clone https://github.com/warleysr/tec-agent.git
cd tec-agent
npm test   # Executa os 8 testes unitários e de integração
npm link   # Disponibiliza o comando 'tec' globalmente no seu terminal
```

*(Alternativa sem `npm link`: use diretamente `node <caminho>/src/cli.mjs`)*

---

### Passo 2: Instalar a Skill no seu Assistente

#### No Google Antigravity (Recomendado)

Você pode instalar a skill globalmente (disponível para todos os seus projetos/conversas) ou localmente em um workspace:

**Opção A — Instalação Global (para todas as sessões do Antigravity):**
- **Windows (PowerShell):**
  ```powershell
  New-Item -ItemType Directory -Force "$HOME\.gemini\config\skills\tec-concursos"
  Copy-Item "SKILL.md" "$HOME\.gemini\config\skills\tec-concursos\SKILL.md"
  ```
- **Linux / macOS:**
  ```bash
  mkdir -p ~/.gemini/config/skills/tec-concursos
  cp SKILL.md ~/.gemini/config/skills/tec-concursos/SKILL.md
  ```

**Opção B — No Workspace Ativo do Antigravity:**
Basta copiar a pasta `skills/tec-concursos` para a raiz do seu workspace:
```bash
mkdir -p .skills/tec-concursos
cp SKILL.md .skills/tec-concursos/
```

O Antigravity detectará automaticamente a skill `tec-concursos` e a ativará sempre que o contexto for relacionado a concursos, questões ou cadernos.

---

#### No Claude Code / OpenCode / Codex / Cursor

A especificação [`SKILL.md`](SKILL.md) segue o padrão aberto de Agent Skills:
- **Claude Code:** Copie `SKILL.md` para `~/.claude/skills/tec-concursos/SKILL.md` ou `.claude/skills/tec-concursos/SKILL.md`.
- **OpenCode / Hermes:** Importe o repositório diretamente com o comando do seu skill collector.

---

### Passo 3: Exemplos de Prompts para o Agente

Com a skill instalada, você pode conversar naturalmente com o agente:

> *"Quantas questões de Backup do Cebraspe existem no TEC Concursos para o ano de 2024?"*

> *"Crie um caderno no meu TEC Concursos com 20 questões recentes de Direito Constitucional da banca FGV na pasta 'Sem classificação'."*

> *"Extraia 10 questões fáceis de Licitações (Lei 14.133/2021) da banca FCC e salve em um arquivo 'licitacoes.md' formatado para estudo."*

> *"Pesquise a árvore de assuntos de Banco de Dados dentro da matéria de Informática e me mostre os IDs dos tópicos de SQL."*

O agente executará a CLI `tec` em segundo plano, interpretará as respostas e devolverá as informações estruturadas.

---

## 2. Autenticação e Login Inicial

O TEC Concursos utiliza Google reCAPTCHA v2 no login. Por segurança e conformidade, o agente adota login assistido:

### Modo Navegador (Recomendado)
```bash
tec login
```
Abre uma janela do Chrome/Edge. Insira suas credenciais e resolva o desafio uma única vez. Assim que o login for concluído, o agente captura os cookies de longa duração (`TecPermanecerLogado`), salva em `~/.tec-agent/session.json` e fecha o navegador.

### Modo Importação de Cookies
Se você já estiver logado no navegador:
```bash
tec login --cookies "JSESSIONID=...; TecPermanecerLogado=..."
# Ou aponte para um arquivo cookies.json:
tec login --cookies cookies.json
```

### Checar Status da Conexão
```bash
tec status
```
Retorna se a sessão está válida, a contagem de pastas/cadernos e o arquivo de sessão.

---

## 3. Comandos da CLI `tec`

### Catálogos e Pesquisa de Filtros
```bash
# Pesquisar matérias:
tec catalogo materias --buscar "Administração"

# Listar assuntos com hierarquia visual:
tec catalogo assuntos --materia "Informática" --buscar "Backup"

# Pesquisar bancas e órgãos:
tec catalogo bancas --buscar "cebraspe"
tec catalogo orgaos --buscar "tribunal de contas"

# Anos, áreas de concurso e opções especiais:
tec catalogo anos
tec catalogo areas
tec catalogo opcoes
```

### Contar Questões
```bash
tec contar --materia "Informática" --assunto "Backup"
tec contar --materia "Informática" --assunto "Backup" --banca cebraspe --ano 2024
tec contar --assunto "Accountability e Transparência" --dificuldade facil
```

### Criar e Gerenciar Cadernos de Estudo
```bash
# Listar pastas de cadernos da sua conta:
tec caderno pastas

# Listar cadernos existentes:
tec caderno listar
tec caderno listar --pasta "CGU"

# Criar caderno com filtros e quantidade exata de questões:
tec caderno criar "Backup Cebraspe 2024" \
  --materia "Informática" \
  --assunto "Backup" \
  --banca cebraspe \
  --ano 2024 \
  --quantidade 10

# Criar caderno ordenando por questões mais recentes:
tec caderno criar "Direito Const FGV" \
  --materia 2 \
  --banca fgv \
  --ano 2025 \
  --quantidade 50 \
  --pasta "Sem classificação" \
  --ordenacao recentes

# Excluir cadernos:
tec caderno excluir 105877951
```

### Extração de Questões
```bash
# Markdown (com enunciado, alternativas, gabarito e resolução):
tec questoes --assunto "Backup" --banca cebraspe --ano 2024 --limite 10 --formato md --saida caderno.md

# JSONL (ideal para scripts, RAG ou treinamento):
tec questoes --materia "Informática" --ano 2024 --limite 100 --formato jsonl --saida questoes.jsonl --retomar

# Consultar questão por ID:
tec questao 3857194
```

---

## 4. Estrutura dos Dados Extraídos

Cada questão no formato JSON contém:

```json
{
  "id": 3857194,
  "tipo": "CERTO_ERRADO",
  "formato": "OBJETIVA",
  "materia": {
    "id": 14,
    "nome": "Administração Geral e Pública",
    "url": "administracao-geral-e-publica"
  },
  "assunto": {
    "id": 2150,
    "nome": "Accountability e Transparência",
    "url": "administracao-geral-e-publica/accountability-e-transparencia"
  },
  "banca": "CEBRASPE (CESPE)",
  "orgao": "CAM DEP",
  "cargo": "Analista Legislativo",
  "ano": 2026,
  "prova": "Prova Objetiva",
  "dificuldade": "Média",
  "anulada": false,
  "desatualizada": false,
  "enunciado": "No que diz respeito ao Estado burocrático...",
  "alternativas": ["Certo", "Errado"],
  "gabarito": "Errado",
  "comentario": "Gabarito: ERRADO\n\nO controle social perpassa as diversas etapas...",
  "url": "https://www.tecconcursos.com.br/questoes/3857194"
}
```

---

## 5. Uso como SDK / Biblioteca em Node.js

Você também pode importar a biblioteca programaticamente em suas aplicações ou outros agentes:

```javascript
import { TecClient, Session } from "./src/client.mjs";
import { TecApi } from "./src/api.mjs";

const client = new TecClient({ session: Session.load() });
const api = new TecApi(client);

// 1. Contar questões
const total = await api.contar({ assuntos: ["2150"], bancas: [4] });
console.log(`Disponíveis: ${total} questões`);

// 2. Criar caderno de estudo
const caderno = await api.criarCaderno({
  nome: "Revisão TI 2025",
  spec: { materias: ["4"], anos: ["2025"] },
  quantidade: 25,
});
console.log(`Caderno criado em: ${caderno.url}`);

// 3. Iterar sobre questões
for await (const id of api.ids({ materias: ["4"], anos: ["2025"] }, { limite: 5 })) {
  const q = await api.questao(id);
  console.log(q.id, q.gabarito);
}
```

---

## 6. Documentação das Rotas da API

Para detalhes técnicos sobre o mapeamento reverso dos endpoints (`/api/pastas-cadernos`, `/api/cadernos/gerar-caderno`, etc.), consulte [`docs/ROUTES.md`](docs/ROUTES.md).

---

## Licença

MIT.
