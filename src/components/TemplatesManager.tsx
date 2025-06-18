import React, { useState } from 'react';
import { FileText, Copy, Trash2, Plus, Calendar, Briefcase, BookOpen, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  emoji: string;
  category: string;
  createdAt: Date;
  variables?: string[];
}

interface TemplatesManagerProps {
  onCreateFromTemplate: (template: Template) => void;
  className?: string;
}

const defaultTemplates: Template[] = [
  {
    id: 'daily-note',
    name: 'Nota Diária',
    description: 'Template para anotações do dia',
    emoji: '📅',
    category: 'Pessoal',
    variables: ['date', 'dayOfWeek'],
    content: `# {{date}} - {{dayOfWeek}}

## 🎯 Objetivos do Dia
- [ ] 

## 📝 Anotações Importantes
- 

## 💭 Reflexões
- 

## ⭐ Destaques do Dia
- 

## 📚 Aprendizado
- 

## 🔗 Links Relacionados
- `,
    createdAt: new Date()
  },
  {
    id: 'meeting-notes',
    name: 'Ata de Reunião',
    description: 'Template para registrar reuniões',
    emoji: '🤝',
    category: 'Trabalho',
    variables: ['date', 'time', 'title'],
    content: `# 🤝 {{title}}

**📅 Data:** {{date}}
**⏰ Horário:** {{time}}
**👥 Participantes:** 
- 

## 📋 Agenda
1. 
2. 
3. 

## 📝 Discussões Principais
### Tópico 1
- 

### Tópico 2
- 

## ✅ Decisões Tomadas
- [ ] 

## 📌 Próximos Passos
- [ ] **Responsável:** | **Prazo:** 

## 🔗 Recursos Mencionados
- `,
    createdAt: new Date()
  },
  {
    id: 'project-planning',
    name: 'Planejamento de Projeto',
    description: 'Template para organizar projetos',
    emoji: '🚀',
    category: 'Trabalho',
    variables: ['title', 'date'],
    content: `# 🚀 Projeto: {{title}}

**📅 Criado em:** {{date}}
**📊 Status:** 🟡 Planejamento

## 🎯 Objetivo Principal
<!-- Descreva o objetivo principal do projeto -->

## 📋 Escopo do Projeto
### ✅ Incluído
- 

### ❌ Não Incluído
- 

## 🗓️ Cronograma
- **📅 Início:** 
- **🏁 Fim Previsto:** 
- **⏰ Duração:** 

## 👥 Equipe
| Nome | Papel | Contato |
|------|-------|---------|
|      |       |         |

## 📋 Principais Entregas
- [ ] 
- [ ] 
- [ ] 

## 🎯 Marcos Importantes
- [ ] **Marco 1:** 
- [ ] **Marco 2:** 
- [ ] **Marco 3:** 

## 📊 Métricas de Sucesso
- 

## 🔄 Status Atual
- [ ] 📝 Planejamento
- [ ] 🔄 Em Andamento  
- [ ] 👀 Em Revisão
- [ ] ✅ Concluído

## 🔗 Links Úteis
- `,
    createdAt: new Date()
  },
  {
    id: 'study-notes',
    name: 'Anotações de Estudo',
    description: 'Template para organizar estudos e anotações acadêmicas',
    emoji: '📚',
    category: 'Educação',
    variables: ['subject', 'topic', 'date'],
    content: `# 📚 {{subject}} - {{topic}}

**📅 Data:** {{date}}
**🏷️ Tags:** #{{subject}} #estudo

## 🎯 Objetivos de Aprendizado
- [ ] 
- [ ] 
- [ ] 

## 📖 Conceitos Principais
### 💡 {{concept1}}
**Definição:** 

**Exemplo:** 

### 💡 {{concept2}}
**Definição:** 

**Exemplo:** 

## 🔍 Pontos Importantes
- 

## ❓ Dúvidas e Questões
- [ ] 

## 💡 Insights e Conexões
- 

## 🧠 Resumo Executivo
<!-- Resumo dos pontos mais importantes -->

## 🔗 Recursos e Referências
- 
- 

## 📝 Próximos Passos
- [ ] 
- [ ] `,
    createdAt: new Date()
  },
  {
    id: 'book-notes',
    name: 'Resenha de Livro',
    description: 'Template para anotações e resenhas de livros',
    emoji: '📖',
    category: 'Educação',
    variables: ['bookTitle', 'author', 'date'],
    content: `# 📖 {{bookTitle}}

**✍️ Autor:** {{author}}
**📅 Lido em:** {{date}}
**⭐ Avaliação:** /10

## 📝 Resumo
<!-- Resumo geral do livro -->

## 🎯 Principais Ideias
1. 
2. 
3. 

## 💡 Citações Marcantes
> "Adicione citação aqui"

> "Outra citação importante"

## 🧠 Reflexões Pessoais
- 

## ✅ Pontos Positivos
- 

## ❌ Pontos Negativos
- 

## 🔗 Conexões
<!-- Links para outras notas relacionadas -->
- [[]]

## 📚 Livros Relacionados
- 

## 📋 Ações/Aplicações
- [ ] 
- [ ] `,
    createdAt: new Date()
  }
];

export const TemplatesManager: React.FC<TemplatesManagerProps> = ({
  onCreateFromTemplate,
  className
}) => {
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    name: '',
    description: '',
    content: '',
    emoji: '📄',
    category: 'Pessoal'
  });

  const categories = Array.from(new Set(templates.map(t => t.category)));
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const processTemplate = (template: Template): Template => {
    const now = new Date();
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    const variables = {
      date: now.toLocaleDateString('pt-BR'),
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      dayOfWeek: dayNames[now.getDay()],
      title: 'Novo Documento',
      subject: 'Matéria',
      topic: 'Tópico',
      concept1: 'Conceito 1',
      concept2: 'Conceito 2',
      bookTitle: 'Título do Livro',
      author: 'Nome do Autor'
    };

    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, value);
    });

    return {
      ...template,
      content
    };
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) return;

    const template: Template = {
      id: Date.now().toString(),
      name: newTemplate.name,
      description: newTemplate.description || '',
      content: newTemplate.content,
      emoji: newTemplate.emoji || '📄',
      category: newTemplate.category || 'Pessoal',
      createdAt: new Date()
    };

    setTemplates(prev => [...prev, template]);
    setNewTemplate({
      name: '',
      description: '',
      content: '',
      emoji: '📄',
      category: 'Pessoal'
    });
    setIsCreatingTemplate(false);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setNewTemplate(template);
    setIsCreatingTemplate(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate || !newTemplate.name || !newTemplate.content) return;

    const updatedTemplate: Template = {
      ...editingTemplate,
      name: newTemplate.name,
      description: newTemplate.description || '',
      content: newTemplate.content,
      emoji: newTemplate.emoji || '📄',
      category: newTemplate.category || 'Pessoal'
    };

    setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t));
    setEditingTemplate(null);
    setNewTemplate({
      name: '',
      description: '',
      content: '',
      emoji: '📄',
      category: 'Pessoal'
    });
    setIsCreatingTemplate(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const handleUseTemplate = (template: Template) => {
    const processedTemplate = processTemplate(template);
    onCreateFromTemplate(processedTemplate);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Trabalho': return Briefcase;
      case 'Educação': return BookOpen;
      case 'Pessoal': return Calendar;
      default: return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Trabalho': return 'bg-blue-500/20 text-blue-400';
      case 'Educação': return 'bg-green-500/20 text-green-400';
      case 'Pessoal': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className={cn("flex min-h-screen w-full bg-[#f7faff] dark:bg-[#181f2a]", className)}>
      {/* Sidebar fixa à esquerda */}
      <aside className="hidden md:flex w-64 flex-shrink-0 h-screen sticky top-0 z-40 border-r border-[#e3e8f0] dark:border-[#232b3b] bg-white dark:bg-[#1a2233]">
        {/* Sidebar pode ser reutilizada aqui se necessário */}
      </aside>
      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header fixo no topo */}
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#181f2a]/95 backdrop-blur-xl border-b border-[#e3e8f0] dark:border-[#232b3b]">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-[#2563eb] dark:text-[#60a5fa]" />
              <h1 className="text-2xl font-bold text-[#1a2233] dark:text-white">Templates</h1>
            </div>
            <Button size="lg" className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold rounded-xl shadow">
              <Plus className="h-5 w-5 mr-2" /> Novo Template
            </Button>
          </div>
        </div>
        {/* Lista de Templates */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 md:px-12 py-8 gap-8 w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {defaultTemplates.map(template => (
              <Card key={template.id} className="shadow-md border-0 bg-white dark:bg-[#232b3b] flex flex-col">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <span className="text-3xl">{template.emoji}</span>
                  <div>
                    <CardTitle className="text-lg font-bold text-[#1a2233] dark:text-white">{template.name}</CardTitle>
                    <span className="text-xs text-[#64748b] dark:text-[#cbd5e1]">{template.category}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-2">
                  <p className="text-[#4b5563] dark:text-[#cbd5e1] text-sm mb-2">{template.description}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {template.variables?.map(v => (
                      <Badge key={v} className="bg-[#2563eb]/10 text-[#2563eb] dark:bg-[#60a5fa]/10 dark:text-[#60a5fa]">{v}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button size="sm" className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg" onClick={() => { onCreateFromTemplate(template); }}>
                      <Copy className="h-4 w-4 mr-1" /> Usar
                    </Button>
                    <Button size="sm" variant="outline" className="border-[#22c55e] text-[#22c55e] dark:border-[#4ade80] dark:text-[#4ade80]">
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" className="border-[#ef4444] text-[#ef4444] dark:border-[#f87171] dark:text-[#f87171]">
                      <Trash2 className="h-4 w-4 mr-1" /> Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
