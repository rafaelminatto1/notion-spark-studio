
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
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Templates</h2>
          <p className="text-sm text-gray-400 mt-1">
            Crie e gerencie templates para estruturar suas notas
          </p>
        </div>
        <Dialog open={isCreatingTemplate} onOpenChange={setIsCreatingTemplate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-notion-dark border-notion-dark-border max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingTemplate ? 'Editar Template' : 'Criar Novo Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Nome</label>
                  <Input
                    value={newTemplate.name || ''}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do template"
                    className="bg-notion-dark-hover border-notion-dark-border"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Emoji</label>
                  <Input
                    value={newTemplate.emoji || ''}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, emoji: e.target.value }))}
                    placeholder="📄"
                    className="bg-notion-dark-hover border-notion-dark-border"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300">Descrição</label>
                <Input
                  value={newTemplate.description || ''}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do template"
                  className="bg-notion-dark-hover border-notion-dark-border"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">Categoria</label>
                <select
                  value={newTemplate.category || 'Pessoal'}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-notion-dark-hover border border-notion-dark-border rounded-md px-3 py-2 text-white"
                >
                  <option value="Pessoal">Pessoal</option>
                  <option value="Trabalho">Trabalho</option>
                  <option value="Educação">Educação</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">Conteúdo</label>
                <p className="text-xs text-gray-500 mb-2">
                  Use variáveis: {{`{{date}}`}}, {{`{{time}}`}}, {{`{{title}}`}}, {{`{{subject}}`}}, {{`{{topic}}`}}
                </p>
                <Textarea
                  value={newTemplate.content || ''}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Conteúdo do template..."
                  className="bg-notion-dark-hover border-notion-dark-border h-60 font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingTemplate(false);
                    setEditingTemplate(null);
                    setNewTemplate({
                      name: '',
                      description: '',
                      content: '',
                      emoji: '📄',
                      category: 'Pessoal'
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
                  {editingTemplate ? 'Atualizar' : 'Criar'} Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          Todos ({templates.length})
        </Button>
        {categories.map(category => {
          const Icon = getCategoryIcon(category);
          const count = templates.filter(t => t.category === category).length;
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="gap-2"
            >
              <Icon className="h-3 w-3" />
              {category} ({count})
            </Button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="bg-notion-dark-hover border-notion-dark-border hover:border-notion-purple transition-all duration-200 group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2 text-white text-sm">
                  <span className="text-lg">{template.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{template.name}</div>
                    <Badge className={cn("text-xs mt-1", getCategoryColor(template.category))}>
                      {template.category}
                    </Badge>
                  </div>
                </CardTitle>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  {!defaultTemplates.find(t => t.id === template.id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{template.description}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {template.variables && template.variables.length > 0 && (
                    <div className="flex gap-1">
                      {template.variables.slice(0, 2).map(variable => (
                        <Badge key={variable} variant="outline" className="text-xs px-1 py-0">
                          {variable}
                        </Badge>
                      ))}
                      {template.variables.length > 2 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          +{template.variables.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleUseTemplate(template)}
                  className="gap-2 bg-notion-purple hover:bg-notion-purple/80"
                >
                  <Copy className="h-3 w-3" />
                  Usar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            {selectedCategory === 'all' 
              ? 'Crie seu primeiro template personalizado'
              : `Nenhum template na categoria "${selectedCategory}"`
            }
          </p>
          <Button
            onClick={() => setIsCreatingTemplate(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar Template
          </Button>
        </div>
      )}
    </div>
  );
};
