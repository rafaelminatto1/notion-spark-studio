
import React, { useState } from 'react';
import { FileText, Copy, Trash2, Plus, Calendar, Briefcase, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  emoji: string;
  category: string;
  createdAt: Date;
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
    content: `# {{date}}

## 🎯 Objetivos do Dia
- [ ] 

## 📝 Anotações
- 

## 🤔 Reflexões
- 

## ⭐ Destaques
- `,
    createdAt: new Date()
  },
  {
    id: 'meeting-notes',
    name: 'Notas de Reunião',
    description: 'Template para reuniões e encontros',
    emoji: '🤝',
    category: 'Trabalho',
    content: `# Reunião - {{title}}

**Data:** {{date}}
**Participantes:** 
**Duração:** 

## 📋 Agenda
- 

## 📝 Discussões
- 

## ✅ Ações
- [ ] 

## 📌 Próximos Passos
- `,
    createdAt: new Date()
  },
  {
    id: 'project-planning',
    name: 'Planejamento de Projeto',
    description: 'Template para organizar projetos',
    emoji: '🚀',
    category: 'Trabalho',
    content: `# Projeto: {{title}}

## 🎯 Objetivo
<!-- Descreva o objetivo principal do projeto -->

## 📊 Escopo
### Incluído
- 

### Não Incluído
- 

## 🗓️ Cronograma
- **Início:** 
- **Fim:** 

## 👥 Equipe
- 

## 📋 Tarefas
- [ ] 

## 🔄 Status
- [ ] Planejamento
- [ ] Em Andamento
- [ ] Revisão
- [ ] Concluído`,
    createdAt: new Date()
  },
  {
    id: 'study-notes',
    name: 'Anotações de Estudo',
    description: 'Template para organizar estudos',
    emoji: '📚',
    category: 'Educação',
    content: `# {{subject}} - {{topic}}

## 🎯 Objetivos de Aprendizado
- 

## 📖 Conceitos Principais
### {{concept1}}
- 

### {{concept2}}
- 

## 💡 Insights
- 

## ❓ Dúvidas
- 

## 🔗 Recursos
- 

## 📝 Resumo
- `,
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

  const handleUseTemplate = (template: Template) => {
    const now = new Date();
    const content = template.content
      .replace(/\{\{date\}\}/g, now.toLocaleDateString('pt-BR'))
      .replace(/\{\{title\}\}/g, 'Novo Documento')
      .replace(/\{\{subject\}\}/g, 'Matéria')
      .replace(/\{\{topic\}\}/g, 'Tópico')
      .replace(/\{\{concept1\}\}/g, 'Conceito 1')
      .replace(/\{\{concept2\}\}/g, 'Conceito 2');

    onCreateFromTemplate({
      ...template,
      content
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Trabalho': return Briefcase;
      case 'Educação': return BookOpen;
      case 'Pessoal': return Calendar;
      default: return FileText;
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Templates</h2>
        <Dialog open={isCreatingTemplate} onOpenChange={setIsCreatingTemplate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-notion-dark border-notion-dark-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Novo Template</DialogTitle>
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
                <Textarea
                  value={newTemplate.content || ''}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Conteúdo do template... Use {{date}}, {{title}} para variáveis"
                  className="bg-notion-dark-hover border-notion-dark-border h-40"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingTemplate(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Criar Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          Todos
        </Button>
        {categories.map(category => {
          const Icon = getCategoryIcon(category);
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="gap-2"
            >
              <Icon className="h-3 w-3" />
              {category}
            </Button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="bg-notion-dark-hover border-notion-dark-border hover:border-notion-purple transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-white text-sm">
                <span className="text-lg">{template.emoji}</span>
                {template.name}
              </CardTitle>
              <p className="text-xs text-gray-400">{template.description}</p>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{template.category}</span>
                <Button
                  size="sm"
                  onClick={() => handleUseTemplate(template)}
                  className="gap-2"
                >
                  <Copy className="h-3 w-3" />
                  Usar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
