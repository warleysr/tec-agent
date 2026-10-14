# TEC Concursos — Agente Extrator de Questões

Agente autônomo e CLI em Node.js (zero dependências externas) para consultar catálogos, filtrar e extrair questões completas do [TEC Concursos](https://www.tecconcursos.com.br) diretamente pelas rotas internas de API com sessão persistente.

---

## Recursos

- **Conexão Persistente**: Salva os cookies de autenticação (`TecPermanecerLogado` e `JSESSIONID`) em `~/.tec-agent/session.json`. Mantém o usuário logado por semanas, renovando a sessão automaticamente.
- **Filtro Avançado por Assunto**: Busca inteligente de assuntos em árvore hierárquica por nome ou por ID, com desambiguação por matéria.
- **Múltiplos Filtros Combináveis**: Matéria, assunto, banca, órgão, ano, área de concurso, escolaridade, formação profissional, opções de dificuldade e enunciados.
- **Extração Completa**: Enunciado, alternativas, gabarito oficial identificado (inclusive quando embutido no comentário), detalhes da prova/órgão e comentário do professor.
- **Formatos de Saída**: Exportação para `jsonl` (streaming com suporte a retomar/resume), `json` e `md` (Markdown formatado para leitura/estudo).
- **Sem Dependências**: Desenvolvido em ESM puro com `fetch`, `WebSocket` e `node:test` nativos do Node.js.

---

## Instalação e Requisitos

- Node.js >= 20

```bash
cd tec-agent
npm test
```

Para usar o comando `tec` globalmente:
```bash
npm link
```
Ou execute diretamente com `node src/cli.mjs`.

---

## 1. Login e Gerenciamento de Sessão

O formulário de login do TEC Concursos utiliza Google reCAPTCHA. Para garantir segurança e conformidade, o login é realizado de forma assistida:

### Modo 1: Login Assistido por Navegador (Padrão)
```bash
node src/cli.mjs login
```
Abre uma janela do Chrome/Edge. Você insere seu e-mail, senha e resolve o captcha. O agente detecta a confirmação de login, captura os cookies (incluindo `TecPermanecerLogado`), fecha o navegador e salva a sessão.

### Modo 2: Importação de Cookies
Se já estiver logado no navegador convencional, basta exportar ou copiar os cookies e rodar:
```bash
node src/cli.mjs login --cookies "JSESSIONID=...; TecPermanecerLogado=..."
# Ou aponte para um arquivo json exportado:
node src/cli.mjs login --cookies cookies.json
```

### Verificar Status da Sessão
```bash
node src/cli.mjs status
```
Retorna confirmação de que a sessão está ativa e a quantidade de pastas/cadernos da sua conta.

### Logout
```bash
node src/cli.mjs logout
```

---

## 2. Consulta de Catálogos (Filtros Disponíveis)

Antes de extrair questões, você pode pesquisar os nomes e IDs dos filtros:

```bash
# Listar ou buscar matérias
node src/cli.mjs catalogo materias --buscar "Administração"

# Listar árvore de assuntos de uma matéria
node src/cli.mjs catalogo assuntos --materia "Informática" --buscar "Backup"

# Buscar bancas examinadoras
node src/cli.mjs catalogo bancas --buscar "cebraspe"

# Buscar órgãos
node src/cli.mjs catalogo orgaos --buscar "tribunal de contas"

# Listar anos, áreas, escolaridades e opções de questão
node src/cli.mjs catalogo anos
node src/cli.mjs catalogo areas
node src/cli.mjs catalogo opcoes
```

---

## 3. Contagem e Estimativa de Questões

Use o comando `contar` para testar os filtros e ver quantas questões existem antes de extrair:

```bash
# Contar questões por assunto específico
node src/cli.mjs contar --materia "Informática" --assunto "Backup"

# Combinar assunto + banca + ano
node src/cli.mjs contar --materia "Informática" --assunto "Backup" --banca cebraspe --ano 2024

# Filtrar por dificuldade
node src/cli.mjs contar --assunto "Accountability e Transparência" --dificuldade facil
```

---

## 4. Extração de Questões

### Extrair para Markdown (Ideal para Leitura/Caderno de Estudos)
```bash
node src/cli.mjs questoes \
  --assunto "Accountability e Transparência" \
  --banca cebraspe \
  --ano 2023 \
  --limite 10 \
  --formato md \
  --saida caderno_accountability.md
```

### Extrair para JSONL (Ideal para Processamento em Lote / RAG / Finetuning)
```bash
node src/cli.mjs questoes \
  --materia "Informática" \
  --assunto "Backup" \
  --banca cebraspe \
  --ano 2024 \
  --formato jsonl \
  --saida backup_cebraspe_2024.jsonl
```

### Opções de Extração
- `--limite <N>`: Quantidade máxima de questões a extrair.
- `--saida <arquivo>`: Arquivo de destino (se omitido, imprime no terminal).
- `--formato jsonl|json|md`: Formato dos dados.
- `--retomar`: Ao salvar em `jsonl`, pula questões que já constam no arquivo caso o download tenha sido interrompido.
- `--sem-comentario`: Extrai apenas enunciado e alternativas, acelerando a coleta.
- `--delay <ms>`: Intervalo mínimo entre requisições (padrão: 250ms).

---

## 5. Criação e Gerenciamento de Cadernos de Estudo

Crie cadernos diretamente na sua conta do TEC Concursos para resolver no site ou no app:

```bash
# Listar pastas da sua conta
tec caderno pastas

# Listar cadernos de uma pasta (padrão: pasta ativa ou "Sem classificação")
tec caderno listar
tec caderno listar --pasta "CGU"

# Criar caderno com filtros e limite de questões
tec caderno criar "Backup Cebraspe 2024" \
  --materia "Informática" \
  --assunto "Backup" \
  --banca cebraspe \
  --ano 2024 \
  --quantidade 10

# Criar caderno com ordenação por questões mais recentes
tec caderno criar "Direito Const FGV" \
  --materia 2 \
  --banca fgv \
  --ano 2025 \
  --quantidade 50 \
  --pasta "Sem classificação" \
  --ordenacao recentes

# Excluir caderno(s) por ID
tec caderno excluir 105877951
```

---

## 6. Estrutura dos Dados Extraídos

Cada questão no formato JSON contém os seguintes campos:

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

## 7. Uso como Módulo / Biblioteca em Node.js

Você também pode importar o cliente diretamente em outros scripts ou agentes:

```javascript
import { TecClient, Session } from "./src/client.mjs";
import { TecApi } from "./src/api.mjs";

const client = new TecClient({ session: Session.load() });
const api = new TecApi(client);

// Contar questões de um assunto
const total = await api.contar({ assuntos: ["2150"], bancas: [4] });
console.log(`Encontradas ${total} questões`);

// Criar caderno de estudo diretamente pelo código
const caderno = await api.criarCaderno({
  nome: "Caderno IA - Backup",
  spec: { assuntos: ["2436"], bancas: [4] },
  quantidade: 10,
});
console.log(`Caderno criado: ${caderno.url}`);

// Iterar sobre IDs e buscar questões
for await (const id of api.ids({ assuntos: ["2150"] }, { limite: 5 })) {
  const questao = await api.questao(id);
  console.log(questao.id, questao.gabarito);
}
```

---

## 8. Documentação Técnica das Rotas

Veja o mapeamento completo e especificações dos endpoints em [`docs/ROUTES.md`](docs/ROUTES.md).
