
import { useState, useCallback, useEffect } from 'react';
import { useDataService } from './useDataService';
import { useToast } from '@/hooks/use-toast';
import { FileItem } from '@/types';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
  emoji?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export const useTemplates = () => {
  const dataService = useDataService();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const savedTemplates = await dataService.query<Template>('templates');
        if (savedTemplates.length === 0) {
          // Criar templates padrão
          const defaultTemplates: Template[] = [
            {
              id: 'template-1',
              name: 'Nota de Estudo',
              description: 'Template para anotações de estudo com seções organizadas',
              category: 'Educação',
              content: `# {{titulo}}

## 📝 Resumo
{{resumo}}

## 🔑 Conceitos Principais
- {{conceito1}}
- {{conceito2}}
- {{conceito3}}

## 📚 Referências
- {{referencia1}}
- {{referencia2}}

## 🤔 Dúvidas
- {{duvida1}}

## 🧠 Revisão
{{data_revisao}}

---
*Criado em: {{data_criacao}}*`,
              tags: ['estudo', 'educação', 'notas'],
              emoji: '📚',
              isPublic: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              usageCount: 0
            },
            {
              id: 'template-2',
              name: 'Reunião',
              description: 'Template para atas de reunião',
              category: 'Trabalho',
              content: `# Reunião - {{titulo}}

**Data:** {{data}}
**Participantes:** {{participantes}}
**Duração:** {{duracao}}

## 📋 Agenda
1. {{item1}}
2. {{item2}}
3. {{item3}}

## 💬 Discussões
{{discussoes}}

## ✅ Decisões
- {{decisao1}}
- {{decisao2}}

## 📝 Ações
- [ ] {{acao1}} - {{responsavel1}}
- [ ] {{acao2}} - {{responsavel2}}

## 📅 Próxima Reunião
{{proxima_reuniao}}`,
              tags: ['reunião', 'trabalho', 'ata'],
              emoji: '🤝',
              isPublic: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              usageCount: 0
            },
            {
              id: 'template-3',
              name: 'Projeto',
              description: 'Template para planejamento de projetos',
              category: 'Gestão',
              content: `# Projeto: {{nome_projeto}}

## 🎯 Objetivo
{{objetivo}}

## 📊 Escopo
### Incluído
- {{incluido1}}
- {{incluido2}}

### Excluído
- {{excluido1}}
- {{excluido2}}

## 📅 Timeline
| Fase | Início | Fim | Responsável |
|------|--------|-----|-------------|
| {{fase1}} | {{inicio1}} | {{fim1}} | {{resp1}} |
| {{fase2}} | {{inicio2}} | {{fim2}} | {{resp2}} |

## 💰 Orçamento
{{orcamento}}

## 🚨 Riscos
- {{risco1}}
- {{risco2}}

## 📈 Métricas de Sucesso
- {{metrica1}}
- {{metrica2}}`,
              tags: ['projeto', 'gestão', 'planejamento'],
              emoji: '🚀',
              isPublic: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              usageCount: 0
            }
          ];

          for (const template of defaultTemplates) {
            await dataService.query('templates', { id: template.id });
          }
          setTemplates(defaultTemplates);
        } else {
          setTemplates(savedTemplates);
        }
      } catch (error) {
        console.error('Erro ao carregar templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, [dataService]);

  const createTemplate = useCallback(async (templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    const newTemplate: Template = {
      ...templateData,
      id: `template_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };

    try {
      await dataService.createFile(newTemplate);
      setTemplates(prev => [...prev, newTemplate]);
      
      toast({
        title: "Template criado",
        description: `Template "${newTemplate.name}" foi criado com sucesso`
      });
      
      return newTemplate.id;
    } catch (error) {
      toast({
        title: "Erro ao criar template",
        description: "Falha ao salvar o template",
        variant: "destructive"
      });
      return null;
    }
  }, [dataService, toast]);

  const useTemplate = useCallback(async (templateId: string, variables: Record<string, string> = {}) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return null;

    let content = template.content;
    
    // Substituir variáveis
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });

    // Incrementar contador de uso
    const updatedTemplate = { ...template, usageCount: template.usageCount + 1 };
    await dataService.updateFile(templateId, { usageCount: updatedTemplate.usageCount });
    setTemplates(prev => prev.map(t => t.id === templateId ? updatedTemplate : t));

    return {
      name: template.name,
      content,
      tags: template.tags,
      emoji: template.emoji
    };
  }, [templates, dataService]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      await dataService.deleteFile(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      toast({
        title: "Template removido",
        description: "Template foi removido com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro ao remover template",
        description: "Falha ao remover o template",
        variant: "destructive"
      });
    }
  }, [dataService, toast]);

  const getTemplatesByCategory = useCallback((category: string) => {
    return templates.filter(t => t.category === category);
  }, [templates]);

  const searchTemplates = useCallback((query: string) => {
    return templates.filter(t => 
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }, [templates]);

  return {
    templates,
    isLoading,
    createTemplate,
    useTemplate,
    deleteTemplate,
    getTemplatesByCategory,
    searchTemplates
  };
};
