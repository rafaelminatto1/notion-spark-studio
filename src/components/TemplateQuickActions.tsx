import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  CheckSquare, 
  Calendar, 
  FileText, 
  Users,
  Zap,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateQuickActionsProps {
  onSelectTemplate: (content: string) => void;
  className?: string;
}

const quickTemplates = [
  {
    id: 'quick-todo',
    name: 'Lista Rápida',
    icon: CheckSquare,
    emoji: '✅',
    content: `# 📋 Lista de Tarefas

## 🔥 Urgente
- [ ] 

## 📝 Hoje
- [ ] 
- [ ] 
- [ ] 

## ✅ Concluído
- [x] `
  },
  {
    id: 'quick-meeting',
    name: 'Reunião',
    icon: Users,
    emoji: '💼',
    content: `# 💼 Reunião: [ASSUNTO]

**Data:** ${new Date().toLocaleDateString('pt-BR')}
**Participantes:** 

## 📝 Pauta
- [ ] 
- [ ] 

## 💬 Decisões
- 

## ✅ Próximos Passos
- [ ] `
  },
  {
    id: 'quick-notes',
    name: 'Anotações',
    icon: BookOpen,
    emoji: '📚',
    content: `# 📚 Anotações - ${new Date().toLocaleDateString('pt-BR')}

## 💡 Principais Insights
- 

## 🔗 Referências
- 

## 📝 TODO
- [ ] `
  },
  {
    id: 'quick-doc',
    name: 'Documento',
    icon: FileText,
    emoji: '📝',
    content: `# Título do Documento

## Resumo
Breve descrição do conteúdo.

## Conteúdo Principal


## Conclusão
`
  }
];

export const TemplateQuickActions: React.FC<TemplateQuickActionsProps> = ({
  onSelectTemplate,
  className
}) => {
  return (
    <div className={cn("flex gap-1 items-center", className)}>
      <span className="text-xs text-gray-400 mr-2 hidden sm:inline">Quick:</span>
      
      {quickTemplates.map((template) => {
        const Icon = template.icon;
        return (
          <Button
            key={template.id}
            onClick={() => onSelectTemplate(template.content)}
            variant="ghost"
            size="sm"
            className="gap-1 text-xs btn-magic quick-action-hover"
            title={`Criar ${template.name}`}
          >
            <Icon className="h-3 w-3" />
            <span className="hidden md:inline">{template.name}</span>
            <span className="md:hidden">{template.emoji}</span>
          </Button>
        );
      })}
    </div>
  );
}; 