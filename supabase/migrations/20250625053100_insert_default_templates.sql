-- Inserir templates padrão
INSERT INTO public.document_templates (name, description, content, category, is_public) VALUES
(
  'Reunião de Equipe',
  'Template para atas de reunião com agenda e action items',
  '# Reunião de Equipe - [Data]

## 📋 Informações da Reunião
- **Data**: [Data]
- **Horário**: [Horário]
- **Participantes**: [Lista de participantes]
- **Facilitador**: [Nome]

## 📝 Agenda
1. [ ] Abertura e boas-vindas
2. [ ] Revisão da reunião anterior
3. [ ] Tópico 1
4. [ ] Tópico 2
5. [ ] Próximos passos
6. [ ] Encerramento

## 💬 Discussões
### Tópico 1: [Nome do tópico]
- **Discussão**: [Resumo da discussão]
- **Decisões**: [Decisões tomadas]
- **Responsável**: [Nome]
- **Prazo**: [Data]

### Tópico 2: [Nome do tópico]
- **Discussão**: [Resumo da discussão]
- **Decisões**: [Decisões tomadas]
- **Responsável**: [Nome]
- **Prazo**: [Data]

## ✅ Action Items
- [ ] [Ação 1] - Responsável: [Nome] - Prazo: [Data]
- [ ] [Ação 2] - Responsável: [Nome] - Prazo: [Data]
- [ ] [Ação 3] - Responsável: [Nome] - Prazo: [Data]

## 📅 Próxima Reunião
- **Data**: [Data]
- **Horário**: [Horário]
- **Agenda prévia**: [Tópicos]',
  'meeting',
  true
),
(
  'Planejamento de Projeto',
  'Template para documentos de planejamento e roadmap de projetos',
  '# 📊 Planejamento de Projeto - [Nome do Projeto]

## 🎯 Visão Geral
- **Nome do Projeto**: [Nome]
- **Gerente do Projeto**: [Nome]
- **Data de Início**: [Data]
- **Data de Conclusão**: [Data]
- **Status**: 🟡 Em Planejamento

## 📋 Objetivo
[Descreva o objetivo principal do projeto]

## 🎯 Escopo
### Incluído no Escopo
- [ ] [Item 1]
- [ ] [Item 2]
- [ ] [Item 3]

### Fora do Escopo
- ❌ [Item 1]
- ❌ [Item 2]

## 👥 Equipe do Projeto
| Nome | Função | Responsabilidades |
|------|--------|------------------|
| [Nome] | [Função] | [Responsabilidades] |
| [Nome] | [Função] | [Responsabilidades] |

## 📅 Cronograma
### Fase 1: [Nome da Fase]
- **Duração**: [Período]
- **Entregas**: [Lista de entregas]
- **Marcos**: [Marcos importantes]

### Fase 2: [Nome da Fase]
- **Duração**: [Período]
- **Entregas**: [Lista de entregas]
- **Marcos**: [Marcos importantes]

## 🎯 Entregas Principais
- [ ] [Entrega 1] - [Data]
- [ ] [Entrega 2] - [Data]
- [ ] [Entrega 3] - [Data]

## ⚠️ Riscos e Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| [Risco 1] | [Alta/Média/Baixa] | [Alto/Médio/Baixo] | [Estratégia] |
| [Risco 2] | [Alta/Média/Baixa] | [Alto/Médio/Baixo] | [Estratégia] |

## 💰 Orçamento
- **Orçamento Total**: [Valor]
- **Recursos**: [Detalhamento]
- **Contingência**: [Valor]

## 📊 Métricas de Sucesso
- [ ] [Métrica 1]
- [ ] [Métrica 2]
- [ ] [Métrica 3]',
  'project',
  true
),
(
  'Notas de Estudo',
  'Template para organizar anotações e materiais de estudo',
  '# 📚 Notas de Estudo - [Assunto]

## 📖 Informações Gerais
- **Disciplina**: [Nome da disciplina]
- **Professor**: [Nome]
- **Data**: [Data]
- **Tópico**: [Tópico principal]

## 🎯 Objetivos de Aprendizagem
- [ ] [Objetivo 1]
- [ ] [Objetivo 2]
- [ ] [Objetivo 3]

## 📝 Anotações Principais

### Conceito 1: [Nome do Conceito]
**Definição**: [Definição clara e concisa]

**Características**:
- [Característica 1]
- [Característica 2]
- [Característica 3]

**Exemplos**:
- [Exemplo 1]
- [Exemplo 2]

### Conceito 2: [Nome do Conceito]
**Definição**: [Definição clara e concisa]

**Características**:
- [Característica 1]
- [Característica 2]

## 🔗 Conexões
- **Relaciona-se com**: [Outros tópicos/conceitos]
- **Aplicações práticas**: [Onde usar]
- **Interdisciplinaridade**: [Outras áreas]

## ❓ Dúvidas e Questões
- [ ] [Dúvida 1]
- [ ] [Dúvida 2]
- [ ] [Dúvida 3]

## 📋 Resumo
[Resumo dos pontos principais em 3-5 frases]

## 📚 Referências
- [Referência 1]
- [Referência 2]
- [Referência 3]

## ✅ Checklist de Revisão
- [ ] Revisei todas as anotações
- [ ] Esclarecer dúvidas pendentes
- [ ] Fazer exercícios práticos
- [ ] Conectar com conhecimento anterior',
  'study',
  true
),
(
  'Documento em Branco',
  'Template simples para começar do zero',
  '# [Título do Documento]

Comece a escrever aqui...

## Seção 1

Seu conteúdo aqui.

## Seção 2

Mais conteúdo aqui.

---

*Documento criado em [Data]*',
  'general',
  true
),
(
  'Daily Standup',
  'Template para reuniões diárias de acompanhamento',
  '# 🚀 Daily Standup - [Data]

## 📋 Informações
- **Data**: [Data]
- **Facilitador**: [Nome]
- **Participantes**: [Lista]
- **Duração**: 15 minutos

## 👥 Updates da Equipe

### [Nome do Membro 1]
- **Ontem**: [O que foi feito]
- **Hoje**: [O que será feito]
- **Impedimentos**: [Bloqueios ou dificuldades]

### [Nome do Membro 2]
- **Ontem**: [O que foi feito]
- **Hoje**: [O que será feito]
- **Impedimentos**: [Bloqueios ou dificuldades]

### [Nome do Membro 3]
- **Ontem**: [O que foi feito]
- **Hoje**: [O que será feito]
- **Impedimentos**: [Bloqueios ou dificuldades]

## 🚨 Impedimentos e Bloqueios
- [ ] [Impedimento 1] - Responsável: [Nome]
- [ ] [Impedimento 2] - Responsável: [Nome]

## 🎯 Próximos Passos
- [ ] [Ação 1]
- [ ] [Ação 2]
- [ ] [Ação 3]

## 📅 Próximo Standup
- **Data**: [Data]
- **Horário**: [Horário]',
  'meeting',
  true
),
(
  'Relatório Semanal',
  'Template para relatórios de progresso semanal',
  '# 📊 Relatório Semanal - Semana de [Data]

## 📈 Resumo Executivo
[Resumo dos principais resultados e conquistas da semana]

## ✅ Conquistas da Semana
- [ ] [Conquista 1]
- [ ] [Conquista 2]
- [ ] [Conquista 3]
- [ ] [Conquista 4]

## 📊 Métricas e KPIs
| Métrica | Meta | Realizado | Status |
|---------|------|-----------|--------|
| [Métrica 1] | [Valor] | [Valor] | 🟢/🟡/🔴 |
| [Métrica 2] | [Valor] | [Valor] | 🟢/🟡/🔴 |
| [Métrica 3] | [Valor] | [Valor] | 🟢/🟡/🔴 |

## 🎯 Projetos em Andamento
### Projeto 1: [Nome]
- **Status**: [Em andamento/Concluído/Atrasado]
- **Progresso**: [%]
- **Próximos passos**: [Ações]

### Projeto 2: [Nome]
- **Status**: [Em andamento/Concluído/Atrasado]
- **Progresso**: [%]
- **Próximos passos**: [Ações]

## ⚠️ Desafios e Riscos
- **Desafio 1**: [Descrição] - Mitigação: [Ação]
- **Desafio 2**: [Descrição] - Mitigação: [Ação]

## 📅 Planos para Próxima Semana
- [ ] [Objetivo 1]
- [ ] [Objetivo 2]
- [ ] [Objetivo 3]
- [ ] [Objetivo 4]

## 💡 Insights e Aprendizados
- [Insight 1]
- [Insight 2]
- [Insight 3]

---
*Relatório gerado em: [Data]*',
  'report',
  true
); 