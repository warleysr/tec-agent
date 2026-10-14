# Mapeamento Reverso das Rotas do TEC Concursos

Documentação das rotas internas mapeadas através de observação de tráfego CDP (Chrome DevTools Protocol) e análise dos controladores AngularJS do frontend (`questoes.filtro.angular.js`, `gerador.angular.js`, `gerador.buscadores.angular.js`, `questao.angular.js`, `caderno.factory.js`).

---

## 1. Arquitetura e Cabeçalhos Obrigatórios

O backend do TEC Concursos utiliza balanceador **AWS ALB** e servidor **nginx**.
As rotas de API residem sob o prefixo `/api/`.

Para requisições diretas via script/agente:
- **`User-Agent`**: Obrigatório de navegador moderno (requisições com UA padrão como `curl` recebem `403 Forbidden`).
- **`Referer`**: Obrigatório conter a origem do site (ex.: `https://www.tecconcursos.com.br/questoes/`). Sem `Referer`, o balanceador AWS ALB bloqueia com `403`.
- **`X-Requested-With`**: `XMLHttpRequest` (padrão em requisições assíncronas do frontend).
- **`Content-Type`**: `application/x-www-form-urlencoded; charset=UTF-8` nas rotas `POST`.
- **`Cookie`**: Header com os cookies da sessão ativa.

---

## 2. Autenticação e Persistência de Sessão

O formulário de login (`POST /login`) exige o token do Google reCAPTCHA v2 (`reCaptchaResponse`). Por design e segurança, o agente **não tenta contornar o captcha**. Em vez disso, adota estratégias limpas:

1. **Login Assistido por Navegador (`tec login`)**:
   Abre uma instância desacoplada do Chrome/Edge. O usuário insere suas credenciais e resolve o desafio. Assim que o login tem sucesso, o agente captura os cookies e fecha o navegador.
2. **Importação Direta de Cookies (`tec login --cookies`)**:
   Permite colar cookies exportados do navegador já autenticado.

### Mecanismo de Permanecer Conectado (Remember-Me)
Ao fazer login, o servidor emite:
- **`TecPermanecerLogado`**: Cookie `HttpOnly` com validade de 14 dias (renovável).
- **`JSESSIONID`**: Cookie de sessão transitória.
- **`AWSALB` / `AWSALBCORS`**: Cookies de afinidade do balanceador.

O cliente HTTP do agente (`TecClient`) intercepta todo cabeçalho `Set-Cookie` e atualiza automaticamente o arquivo `~/.tec-agent/session.json`. Caso o `JSESSIONID` expire, a presença de `TecPermanecerLogado` faz o servidor emitir um novo `JSESSIONID` na primeira requisição sem deslogar o usuário.

---

## 3. Catálogo de Filtros (Metadados)

Todas as rotas retornam JSON:

| Rota | Método | Parâmetros | Descrição |
|------|--------|------------|-----------|
| `/api/materias` | `GET` | `formato=OBJETIVA&universo=CONCURSOS` | Lista todas as matérias com ID e nome |
| `/api/assuntos` | `GET` | `universo=CONCURSOS&formato=OBJETIVA&materia={id}&hierarquico=true` | Árvore hierárquica completa de assuntos da matéria |
| `/api/assuntos` | `GET` | `universo=CONCURSOS&formato=OBJETIVA&nome={termo}&hierarquico=false` | Busca de assuntos por nome globalmente |
| `/api/bancas` | `GET` | `formato=OBJETIVA&universo=CONCURSOS` | Lista bancas examinadoras (Cebraspe, FCC, FGV...) |
| `/api/orgaos` | `GET` | `formato=OBJETIVA&universo=CONCURSOS` | Lista órgãos (RFB, TCU, PF...) |
| `/api/cargos` | `GET` | `universo=CONCURSOS&formato=OBJETIVA&orgao={id}&hierarquico=true` | Cargos por órgão |
| `/api/anos` | `GET` | `formato=OBJETIVA&universo=CONCURSOS` | Anos disponíveis (1989 até 2026) |
| `/api/enums/areas` | `GET` | - | Áreas de concurso (Fiscal, Policial, TI...) |
| `/api/enums/escolaridades` | `GET` | - | Ensino Médio, Superior, Especialização... |
| `/api/profissoes` | `GET` | `formato=OBJETIVA` | Formações acadêmicas |
| `/api/enums/filtros-questao` | `GET` | `formato=OBJETIVA&universo=CONCURSOS` | Opções especiais (dificuldade, anuladas, comentadas...) |
| `/api/pastas-cadernos` | `GET` | - | Pastas e cadernos criados pelo usuário logado |

---

## 4. Tipos de Filtro no Backend (`filtros[i].tipo`)

No payload das consultas, os filtros são enviados sequencialmente como `filtros[0].tipo`, `filtros[0].id`, `filtros[1].tipo`, `filtros[1].id`:

- `MATERIA`
- `ASSUNTO`
- `BANCA`
- `ORGAO`
- `ANO`
- `AREA_CONCURSO`
- `ESCOLARIDADE`
- `PROFISSAO`
- `FILTRO_QUESTAO` (ex: `DIFICULDADE_FACIL`, `REMOVER_ANULADAS`, `SOMENTE_COMENTADAS_POR_IA`)
- `ENUNCIADO`

> **Importante**: No backend do TEC, `MATERIA` e `ASSUNTO` pertencem ao mesmo agrupamento interno (`MATERIAS_ASSUNTOS`). Se ambos forem enviados juntos na mesma requisição, o backend faz uma união (OR), trazendo todas as questões da matéria inteira. Portanto, ao filtrar por assunto, a matéria deve ser usada para resolver e desambiguar o ID do assunto, enviando apenas o ID do `ASSUNTO` no payload.

---

## 5. Contagem e Extração de Questões

### A. Contagem de Questões do Filtro
- **Rota**: `POST /api/questoes/contagem/filtros`
- **Payload** (form-urlencoded):
  ```
  universo=CONCURSOS
  formato=OBJETIVA
  gerarEmSerie=false
  caderno=
  filtros[0].tipo=ASSUNTO
  filtros[0].id=2436
  filtros[1].tipo=ANO
  filtros[1].id=2024
  ```
- **Retorno**: `{"int": 9}`

### B. Listagem Paginada de IDs de Questões
- **Rota**: `POST /api/questoes/filtros`
- **Payload** (form-urlencoded):
  ```
  universo=CONCURSOS
  formato=OBJETIVA
  pagina=1
  filtros[0].tipo=ASSUNTO
  filtros[0].id=2436
  ```
- **Retorno**: `{"questoes": [2795429, 2810344, ...]}` (retorna até ~100 IDs por página)

### C. Leitura do Conteúdo da Questão
- **Rota**: `GET /api/questoes/{id}`
  - Retorna enunciado em HTML, array de alternativas em HTML, tipo (`CERTO_ERRADO` ou `MULTIPLA_ESCOLHA`), metadados de matéria e assunto.
- **Rota**: `GET /api/questoes/{id}/detalhes`
  - Retorna prova, órgão, cargo, banca, ano, área e nível de dificuldade estimado.
- **Rota**: `GET /api/questoes/{id}/comentario`
  - Retorna o comentário do professor em HTML com resolução passo a passo.

---

## 6. Criação e Gerenciamento de Cadernos de Estudo

### A. Listagem de Pastas de Cadernos
- **Rota**: `GET /api/pastas-cadernos`
- **Retorno**: `{"pastas": [{"id": 6489204, "nome": "Sem classificação", "qtdCadernos": 5, "ativa": false}, ...]}`

### B. Listagem de Cadernos em uma Pasta
- **Rota**: `GET /api/pastas-cadernos/{idPasta}/itens?ordenacao=nome&paginar=true&pagina=1`
- **Retorno**: `{"itens": [{"id": 100194832, "nome": "Ciencia de Dados", "quantidadeItens": 326, "data": "06/08/2026", ...}]}`

### C. Consulta de Matérias e Disponibilidade para o Filtro
- **Rota**: `POST /api/materias/buscar-questoes-por-materia`
- **Payload** (form-urlencoded):
  ```
  universo=CONCURSOS
  formato=OBJETIVA
  gerarEmSerie=false
  ordenacao=ALFABETICA
  filtros[0].tipo=MATERIA
  filtros[0].id=2
  filtros[1].tipo=ANO
  filtros[1].id=2025
  ```
- **Retorno**: `{"list": [{"id": 2, "nome": "Direito Constitucional", "numeroQuestoes": 6113}]}`

### D. Geração de Caderno
- **Rota**: `POST /api/cadernos/gerar-caderno`
- **Payload** (form-urlencoded):
  ```
  nomeCaderno=Caderno de Teste
  caderno=
  universo=CONCURSOS
  formato=OBJETIVA
  formaEscolherQuestoes=ALEATORIA
  pastaDestino=6489204
  filtros[0].tipo=MATERIA
  filtros[0].id=2
  filtros[1].tipo=ANO
  filtros[1].id=2025
  materias[0].id=2
  materias[0].numeroQuestoes=50
  ```
- **Retorno**: `{"id": 105877613, "mensagem": "O caderno foi salvo na pasta Sem classificação"}`

### E. Exclusão de Cadernos
- **Rota**: `POST /api/cadernos/multiple-delete`
- **Payload** (form-urlencoded):
  ```
  cadernos[0]=105877613
  ```
- **Retorno**: `{"boolean": true}`

### F. Gerenciamento de Subpastas
- **Criar Subpasta**: `POST /api/pastas-cadernos/{idPasta}/subpastas`
  - Payload: `nome=Nome da Subpasta`
  - Retorno: `{"subpasta": {"id": 1839444, "nome": "Nome da Subpasta", "subpasta": true, ...}}`
- **Renomear Subpasta**: `POST /api/pastas-cadernos/{idPasta}/subpastas/{idSubpasta}`
  - Payload: `nome=Novo Nome&_method=put`
  - Retorno: `{"boolean": true}`
- **Listar Itens de uma Subpasta**: `GET /api/pastas-cadernos/{idPasta}/subpastas/{idSubpasta}/itens?ordenacao=nome&paginar=true&pagina=1`
  - Retorno: `{"itens": [{"id": 105883756, "nome": "Caderno 1", ...}]}`

### G. Movimentação de Cadernos entre Pastas e Subpastas
- **Rota**: `POST /api/cadernos/multiple-set`
- **Payload** (form-urlencoded):
  ```
  pastaDestino=7853487
  subpastaDestino=1839444
  cadernos[0]=105883756
  cadernos[1]=105883816
  ```
- **Retorno**: `{"boolean": true}`

