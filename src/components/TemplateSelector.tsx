import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  CheckSquare, 
  Calendar,
  FileCode,
  Zap,
  BookOpen,
  Target,
  Users,
  MessageSquare,
  ChevronDown,
  X,
  Coffee,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  content: string;
  preview: string;
  emoji: string;
}

interface TemplateSelectorProps {
  onSelectTemplate: (content: string) => void;
  className?: string;
}

const templates: Template[] = [
  // 📝 Documentação
  {
    id: 'documento-basico',
    name: 'Documento Básico',
    description: 'Estrutura simples para documentos',
    icon: FileText,
    category: 'Documentação',
    emoji: '📝',
    preview: '# Título\n\n## Seção\n\nConteúdo...',
    content: `# Título do Documento

## Visão Geral
Descrição breve do que este documento contém.

## Seções Principais

### Seção 1
Conteúdo da primeira seção.

### Seção 2
Conteúdo da segunda seção.

## Conclusão
Resumo e próximos passos.

---
*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*`
  },
  
  {
    id: 'documentacao-tecnica',
    name: 'Documentação Técnica',
    description: 'Template para docs de desenvolvimento',
    icon: FileCode,
    category: 'Documentação',
    emoji: '⚙️',
    preview: '# API Docs\n\n## Endpoints\n\n```javascript...',
    content: `# Documentação Técnica

## Visão Geral
Descrição técnica do sistema/feature.

## Arquitetura
\`\`\`mermaid
graph TD
    A[Frontend] --> B[API]
    B --> C[Database]
\`\`\`

## API Reference

### Endpoints

#### GET /api/endpoint
\`\`\`javascript
fetch('/api/endpoint')
  .then(response => response.json())
  .then(data => console.log(data));
\`\`\`

**Response:**
\`\`\`json
{
  "status": "success",
  "data": {}
}
\`\`\`

## Setup Local

\`\`\`bash
npm install
npm run dev
\`\`\`

## Variáveis de Ambiente
\`\`\`env
API_URL=http://localhost:3000
DATABASE_URL=postgresql://...
\`\`\`

## Troubleshooting

### Erro Comum 1
**Problema:** Descrição do problema
**Solução:** Como resolver

---
*Documentação mantida pelo time de desenvolvimento*`
  },

  // ✅ Produtividade
  {
    id: 'lista-tarefas',
    name: 'Lista de Tarefas',
    description: 'Todo list organizada',
    icon: CheckSquare,
    category: 'Produtividade',
    emoji: '✅',
    preview: '# Tarefas\n\n- [ ] Tarefa 1\n- [x] Completa',
    content: `# 📋 Lista de Tarefas - ${new Date().toLocaleDateString('pt-BR')}

## 🔥 Prioridade Alta
- [ ] Tarefa urgente 1
- [ ] Tarefa urgente 2

## 📝 Tarefas Principais
- [ ] Tarefa importante 1
- [ ] Tarefa importante 2
- [ ] Tarefa importante 3

## 🎯 Para Esta Semana
- [ ] Tarefa da semana 1
- [ ] Tarefa da semana 2

## ✅ Concluídas
- [x] Tarefa completada 1
- [x] Tarefa completada 2

---
**💡 Dica:** Use Ctrl+Click para marcar/desmarcar checkboxes`
  },

  {
    id: 'planejamento-semanal',
    name: 'Planejamento Semanal',
    description: 'Organização da semana',
    icon: Calendar,
    category: 'Produtividade',
    emoji: '📅',
    preview: '## Segunda-feira\n- [ ] Reunião...',
    content: `# 📅 Planejamento Semanal
*Semana de ${new Date().toLocaleDateString('pt-BR')}*

## 🎯 Objetivos da Semana
1. [ ] Objetivo principal 1
2. [ ] Objetivo principal 2
3. [ ] Objetivo principal 3

---

## Segunda-feira 📌
### Manhã
- [ ] Tarefa manhã 1
- [ ] Tarefa manhã 2

### Tarde
- [ ] Tarefa tarde 1
- [ ] Tarefa tarde 2

## Terça-feira 📌
### Manhã
- [ ] Tarefa manhã 1

### Tarde
- [ ] Tarefa tarde 1

## Quarta-feira 📌
### Manhã
- [ ] Tarefa manhã 1

### Tarde
- [ ] Tarefa tarde 1

## Quinta-feira 📌
### Manhã
- [ ] Tarefa manhã 1

### Tarde
- [ ] Tarefa tarde 1

## Sexta-feira 📌
### Manhã
- [ ] Tarefa manhã 1

### Tarde
- [ ] Review da semana
- [ ] Planejamento próxima semana

---

## 📊 Review Semanal
### ✅ Conquistas
- 

### ⚠️ Desafios
- 

### 🚀 Próximos Passos
- `
  },

  // 🚀 Projetos
  {
    id: 'projeto-kickoff',
    name: 'Kickoff de Projeto',
    description: 'Início de novos projetos',
    icon: Zap,
    category: 'Projetos',
    emoji: '🚀',
    preview: '# Projeto X\n\n## Objetivos\n\n## Timeline...',
    content: `# 🚀 Projeto: [NOME DO PROJETO]

## 📋 Informações Básicas
- **Responsável:** 
- **Equipe:** 
- **Data de Início:** ${new Date().toLocaleDateString('pt-BR')}
- **Prazo:** 
- **Orçamento:** 

## 🎯 Objetivos
### Principal
Descrever o objetivo principal do projeto.

### Secundários
- [ ] Objetivo secundário 1
- [ ] Objetivo secundário 2

## 🔍 Escopo
### Incluído
- ✅ Feature/funcionalidade 1
- ✅ Feature/funcionalidade 2

### Excluído
- ❌ Fora do escopo 1
- ❌ Fora do escopo 2

## 📅 Timeline
| Fase | Prazo | Responsável | Status |
|------|--------|-------------|---------|
| Planejamento | - | - | 🟡 Em andamento |
| Desenvolvimento | - | - | ⏳ Aguardando |
| Testes | - | - | ⏳ Aguardando |
| Deploy | - | - | ⏳ Aguardando |

## 🎭 Stakeholders
- **Sponsor:** 
- **Product Owner:** 
- **Tech Lead:** 
- **QA:** 

## 🚧 Riscos & Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Risco 1 | Alta/Média/Baixa | Alto/Médio/Baixo | Como mitigar |

## 📚 Documentos Relacionados
- [[Especificações Técnicas]]
- [[Design System]]
- [[Cronograma Detalhado]]

---
*Última atualização: ${new Date().toLocaleDateString('pt-BR')}*`
  },

  // 📚 Aprendizado
  {
    id: 'notas-estudo',
    name: 'Notas de Estudo',
    description: 'Template para anotações de estudo',
    icon: BookOpen,
    category: 'Aprendizado',
    emoji: '📚',
    preview: '# Estudos: Topic\n\n## Conceitos...',
    content: `# 📚 Estudos: [TÓPICO]

## 📖 Fonte
- **Material:** Livro/Curso/Artigo
- **Autor:** 
- **Data:** ${new Date().toLocaleDateString('pt-BR')}

## 🎯 Objetivos de Aprendizado
- [ ] Entender conceito A
- [ ] Aplicar técnica B
- [ ] Dominar ferramenta C

## 📝 Conceitos Principais

### Conceito 1
**Definição:** O que é

**Exemplo:**
\`\`\`
Código ou exemplo prático
\`\`\`

**Aplicação:** Onde usar

### Conceito 2
**Definição:** O que é

**Exemplo:**
\`\`\`
Código ou exemplo prático
\`\`\`

## 💡 Insights & Descobertas
- 

## 🔗 Links Úteis
- [Documentação oficial](url)
- [Tutorial](url)
- [Exemplos](url)

## 🧪 Exercícios Práticos
- [ ] Exercício 1: Descrição
- [ ] Exercício 2: Descrição

## 📝 Resumo
### O que aprendi:


### Próximos passos:


---
**Tags:** #estudo #[tecnologia] #[categoria]`
  },

  // 💼 Reuniões
  {
    id: 'ata-reuniao',
    name: 'Ata de Reunião',
    description: 'Registro de reuniões',
    icon: Users,
    category: 'Reuniões',
    emoji: '💼',
    preview: '# Reunião - Topic\n\n## Participantes...',
    content: `# 💼 Reunião: [ASSUNTO]

## 📋 Informações
- **Data:** ${new Date().toLocaleDateString('pt-BR')}
- **Horário:** ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
- **Duração:** 
- **Local/Link:** 

## 👥 Participantes
- **Facilitador:** 
- **Participantes:**
  - 
  - 
  - 

## 🎯 Objetivos
- 
- 

## 📝 Pauta
1. [ ] Ponto 1
2. [ ] Ponto 2
3. [ ] Ponto 3

## 💬 Discussões & Decisões

### Ponto 1: [Título]
**Discussão:** O que foi debatido

**Decisão:** O que foi decidido

**Responsável:** Quem ficou responsável

### Ponto 2: [Título]
**Discussão:** O que foi debatido

**Decisão:** O que foi decidido

**Responsável:** Quem ficou responsável

## ✅ Action Items
| Tarefa | Responsável | Prazo | Status |
|--------|-------------|--------|---------|
| Tarefa 1 | @pessoa | dd/mm | ⏳ Pendente |
| Tarefa 2 | @pessoa | dd/mm | ⏳ Pendente |

## 📅 Próximos Passos
- [ ] Agendar próxima reunião
- [ ] Enviar ata para participantes
- [ ] Acompanhar action items

---
**Próxima reunião:** dd/mm/yyyy às HH:mm`
  },

  // 💭 Brainstorming
  {
    id: 'brainstorming',
    name: 'Brainstorming',
    description: 'Sessão de ideias criativas',
    icon: MessageSquare,
    category: 'Criatividade',
    emoji: '💭',
    preview: '# Brainstorming\n\n## Problema\n\n## Ideias...',
    content: `# 💭 Brainstorming: [TÓPICO]

## 🎯 Objetivo
Descrever o que queremos alcançar com esta sessão.

## 🤔 Problema/Desafio
Definir claramente o problema que estamos tentando resolver.

## 💡 Ideias

### 🚀 Ideias Favoritas
1. **Ideia 1**
   - Descrição
   - Prós: 
   - Contras: 
   - Viabilidade: ⭐⭐⭐⭐⭐

2. **Ideia 2**
   - Descrição
   - Prós: 
   - Contras: 
   - Viabilidade: ⭐⭐⭐⭐⭐

### 🌟 Todas as Ideias
- Ideia A
- Ideia B
- Ideia C
- Ideia D
- Ideia E

### 🤪 Ideias Malucas (sem filtro)
- Ideia maluca 1
- Ideia maluca 2
- Ideia maluca 3

## 🏆 Seleção Final
### Top 3 Ideias
1. **[Nome da Ideia]**
   - Por que escolher: 
   - Próximos passos: 

2. **[Nome da Ideia]**
   - Por que escolher: 
   - Próximos passos: 

3. **[Nome da Ideia]**
   - Por que escolher: 
   - Próximos passos: 

## 📋 Action Plan
- [ ] Validar ideia escolhida com stakeholders
- [ ] Criar protótipo/MVP
- [ ] Definir métricas de sucesso
- [ ] Agendar revisão em X dias

---
**Participantes da sessão:** 
**Data:** ${new Date().toLocaleDateString('pt-BR')}`
  }
];

const categories = Array.from(new Set(templates.map(t => t.category)));

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'Todos' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template.content);
    setIsOpen(false);
    setSearchTerm('');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className={cn("gap-2 btn-magic", className)}
      >
        <Sparkles className="h-4 w-4" />
        Templates
        <ChevronDown className="h-3 w-3" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] m-4 bg-gradient-to-br from-background via-background/95 to-background border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Templates de Conteúdo</h2>
              <p className="text-sm text-gray-400">Acelere sua produtividade com templates prontos</p>
            </div>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
            className="rounded-full p-2 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-white/10 bg-workspace-surface/50">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-workspace-surface border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto">
              <Button
                onClick={() => setSelectedCategory('Todos')}
                variant={selectedCategory === 'Todos' ? 'default' : 'ghost'}
                size="sm"
                className="whitespace-nowrap"
              >
                Todos ({templates.length})
              </Button>
              {categories.map(category => {
                const count = templates.filter(t => t.category === category).length;
                return (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    variant={selectedCategory === category ? 'default' : 'ghost'}
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    {category} ({count})
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 template-grid">
            {filteredTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className="group p-4 bg-gradient-to-br from-workspace-surface to-workspace-surface/50 border border-white/10 rounded-xl hover:border-purple-500/50 hover:bg-gradient-to-br hover:from-purple-500/10 hover:to-blue-500/10 cursor-pointer template-card"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg group-hover:from-purple-500 group-hover:to-blue-500 transition-all">
                      <Icon className="h-4 w-4 text-purple-400 group-hover:text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white text-sm group-hover:text-purple-200 transition-colors">
                        {template.emoji} {template.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-300">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-3 text-xs font-mono text-gray-300 border border-white/5">
                    <pre className="whitespace-pre-wrap overflow-hidden">
                      {template.preview}
                    </pre>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-purple-400 font-medium">
                      {template.category}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Usar Template
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum template encontrado</h3>
              <p className="text-gray-400">Tente ajustar os filtros ou termo de busca</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-workspace-surface/30">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>💡 Dica: Você pode personalizar qualquer template após selecioná-lo</span>
            <span>{filteredTemplates.length} templates disponíveis</span>
          </div>
        </div>
      </div>
    </div>
  );
};
