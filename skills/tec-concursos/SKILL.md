---
name: tec-concursos
description: >
  Consultar catálogos, contar questões, criar e compartilhar cadernos de estudo e extrair questões diretamente do TEC Concursos
  (https://www.tecconcursos.com.br) por assunto, matéria, banca, órgão, ano, dificuldade e outros filtros,
  utilizando a CLI nativa 'tec'. Ative esta skill sempre que o usuário pedir para pesquisar concursos, filtrar questões,
  gerar cadernos de estudo ou analisar provas anteriores.
---

# TEC Concursos — Agent Skill

Esta skill fornece ao agente de IA acesso programático de alta velocidade às rotas de API do TEC Concursos através da CLI `tec`.
A sessão do usuário é persistente (armazenada em `~/.tec-agent/session.json`) com renovação automática de cookies.

---

## Pré-requisito: Estado da Sessão

Antes de executar operações que exijam autenticação, o agente pode verificar o status:
```bash
tec status
```
- Se `logged: true`: proceda normalmente com os comandos abaixo.
- Se `logged: false`: oriente o usuário a rodar `tec login` uma única vez no terminal para autenticar via navegador com captcha.

---

## Ações Disponíveis para o Agente

### 1. Pesquisa no Catálogo de Filtros
Use para descobrir IDs e validar a existência de termos antes de filtrar:
```bash
# Buscar matérias:
tec catalogo materias --buscar "Constitucional"

# Listar assuntos de uma matéria (respeitando hierarquia):
tec catalogo assuntos --materia "Informática" --buscar "Backup"

# Buscar bancas examinadoras:
tec catalogo bancas --buscar "cebraspe"

# Buscar órgãos:
tec catalogo orgaos --buscar "tribunal de contas"

# Anos, áreas, dificuldades e opções:
tec catalogo anos
tec catalogo areas
tec catalogo opcoes
```

### 2. Contar Questões (Estimativa Prévia)
**Regra recomendada:** Sempre execute `tec contar` antes de extrair grandes volumes ou criar cadernos para informar a quantidade disponível ao usuário:
```bash
# Contagem por assunto e banca:
tec contar --materia "Informática" --assunto "Backup" --banca cebraspe --ano 2024

# Contagem por dificuldade:
tec contar --assunto "Accountability e Transparência" --dificuldade facil
```

### 3. Criar e Gerenciar Cadernos de Estudo
O agente pode criar cadernos diretamente na conta do usuário no TEC Concursos:
```bash
# Listar pastas existentes:
tec caderno pastas

# Listar cadernos de uma pasta:
tec caderno listar --pasta "Sem classificação"
tec caderno listar --pasta "CGU" --subpasta "Sociedade Brasileira, Desigualdades e Desenvolvimento"

# Gerar links curtos de compartilhamento para um ou mais cadernos:
tec caderno compartilhar 105844965
tec caderno compartilhar 105844965,105844864

# Criar subpasta temática dentro de uma pasta:
tec caderno criar-subpasta "ESTADO, DEMOCRACIA, DIREITOS E CIÊNCIA POLÍTICA" --pasta "CGU"

# Listar subpastas existentes de uma pasta:
tec caderno subpastas --pasta "CGU"

# Mover cadernos existentes para uma pasta e/ou subpasta:
tec caderno mover 105844965,105844864 --pasta "CGU" --subpasta "ESTADO, DEMOCRACIA, DIREITOS E CIÊNCIA POLÍTICA"

# Criar caderno diretamente alocado em subpasta:
tec caderno criar "Fundamentos Sociológicos" \
  --assunto "Estratificação e Mobilidade Social" \
  --banca cebraspe \
  --ano 2024 \
  --pasta "CGU" \
  --subpasta "Sociedade Brasileira, Desigualdades e Desenvolvimento" \
  --quantidade 50

# Criar caderno ordenado pelas questões mais recentes:
tec caderno criar "Direito Const FGV" \
  --materia 2 \
  --banca fgv \
  --ano 2025 \
  --quantidade 50 \
  --pasta "Sem classificação" \
  --ordenacao recentes

# Excluir cadernos por ID:
tec caderno excluir 105877951
```

O comando `tec caderno compartilhar` gera os links curtos `/s/` do TEC e também retorna o link direto do caderno.

### 4. Extração de Questões para o Agente / Contexto
Extraia questões formatadas para apresentar ao usuário, analisar ou salvar em arquivos locais:
```bash
# Extração para Markdown (ideal para apresentar ao usuário ou gerar apostilas):
tec questoes --assunto "Accountability e Transparência" --banca cebraspe --ano 2023 --limite 10 --formato md --saida caderno.md

# Extração estruturada em JSONL (ideal para processamento, RAG ou treinamento):
tec questoes --materia "Informática" --assunto "Backup" --banca cebraspe --ano 2024 --limite 50 --formato jsonl --saida questoes.jsonl

# Ler questão individual por ID (com enunciado, alternativas, gabarito e comentário):
tec questao 3857194
```

---

## Boas Práticas para o Agente

1. **Desambiguação de Assuntos**: Assuntos no TEC Concursos pertencem a matérias específicas. Sempre informe `--materia` junto com `--assunto` (ou use o ID numérico do assunto) para evitar termos ambíguos.
2. **Rate Limits & Cautela**: O cliente possui limitador interno de requisições (`minIntervalMs: 250ms`). Ao extrair grandes volumes (acima de 100 questões), use `--saida <arquivo.jsonl>` com a flag `--retomar` para permitir recuperação em caso de interrupção.
3. **Limite de Cadernos**: O TEC Concursos permite no máximo 10.000 questões por caderno. Sempre passe `--quantidade <N>` quando o filtro geral tiver volume elevado.
