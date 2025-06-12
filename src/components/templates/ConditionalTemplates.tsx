import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  Variable, 
  Calendar, 
  User, 
  Hash, 
  Type, 
  CheckSquare,
  Zap,
  Settings,
  Play,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Tipos para templates condicionais
interface TemplateVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'user' | 'calculated';
  defaultValue?: any;
  options?: string[]; // Para type 'select'
  formula?: string; // Para type 'calculated'
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface TemplateCondition {
  id: string;
  variable: string;
  operator: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains' | 'exists';
  value: any;
  action: 'show' | 'hide' | 'set_value' | 'calculate';
  target?: string; // ID da variável ou bloco afetado
  calculation?: string; // Fórmula para cálculos
}

interface ConditionalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  variables: TemplateVariable[];
  conditions: TemplateCondition[];
  content: string; // Template com placeholders
  preview?: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ConditionalTemplatesProps {
  onTemplateSelect?: (template: ConditionalTemplate, variables: Record<string, any>) => void;
  onTemplateCreate?: (template: ConditionalTemplate) => void;
  className?: string;
}

// Templates predefinidos
const PREDEFINED_TEMPLATES: ConditionalTemplate[] = [
  {
    id: 'meeting-notes',
    name: 'Ata de Reunião Inteligente',
    description: 'Template que se adapta baseado no tipo e duração da reunião',
    category: 'Produtividade',
    variables: [
      {
        id: 'meeting_type',
        name: 'Tipo de Reunião',
        type: 'select',
        options: ['Brainstorm', 'Planning', 'Review', 'One-on-One', 'All-Hands'],
        defaultValue: 'Planning',
        validation: { required: true }
      },
      {
        id: 'duration',
        name: 'Duração (minutos)',
        type: 'number',
        defaultValue: 60,
        validation: { min: 15, max: 480 }
      },
      {
        id: 'participants',
        name: 'Número de Participantes',
        type: 'number',
        defaultValue: 5,
        validation: { min: 2, max: 50 }
      },
      {
        id: 'has_decisions',
        name: 'Inclui Decisões',
        type: 'boolean',
        defaultValue: true
      },
      {
        id: 'urgency_score',
        name: 'Score de Urgência',
        type: 'calculated',
        formula: 'IF(duration < 30, 3, IF(participants > 10, 2, 1))'
      }
    ],
    conditions: [
      {
        id: 'show_action_items',
        variable: 'meeting_type',
        operator: 'equals',
        value: 'Planning',
        action: 'show',
        target: 'action_items_section'
      },
      {
        id: 'show_brainstorm_tools',
        variable: 'meeting_type',
        operator: 'equals',
        value: 'Brainstorm',
        action: 'show',
        target: 'brainstorm_section'
      }
    ],
    content: `# {{meeting_type}} - {{date}}

## 📋 Informações da Reunião
- **Tipo:** {{meeting_type}}
- **Duração:** {{duration}} minutos
- **Participantes:** {{participants}} pessoas
- **Data:** {{date}}
- **Urgência:** {{urgency_score}}/3

## 👥 Participantes
{{#each attendees}}
- {{name}} ({{role}})
{{/each}}

## 🎯 Objetivos
{{#if meeting_type === 'Planning'}}
### Objetivos de Planejamento
- [ ] Definir marcos principais
- [ ] Alocar recursos
- [ ] Estabelecer timeline
{{/if}}

{{#if meeting_type === 'Brainstorm'}}
### Objetivos de Brainstorming
- [ ] Gerar ideias inovadoras
- [ ] Explorar soluções alternativas
- [ ] Definir próximos passos criativos

### 🧠 Técnicas Utilizadas
- [ ] Mind Mapping
- [ ] Brainwriting
- [ ] SCAMPER
{{/if}}

## 📝 Notas e Discussões
{{discussion_notes}}

{{#if has_decisions}}
## ✅ Decisões Tomadas
{{#each decisions}}
- **{{title}}:** {{description}}
  - Responsável: {{owner}}
  - Prazo: {{deadline}}
{{/each}}
{{/if}}

{{#if meeting_type === 'Planning'}}
## 📋 Action Items
{{#each action_items}}
- [ ] {{task}} - @{{assignee}} - {{due_date}}
{{/each}}
{{/if}}

## 🔄 Próximos Passos
{{next_steps}}

---
*Ata gerada automaticamente em {{current_time}}*`,
    preview: '# Ata de Reunião Inteligente\n\nTemplate que se adapta baseado no tipo de reunião...',
    tags: ['reunião', 'produtividade', 'planejamento'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'project-proposal',
    name: 'Proposta de Projeto Dinâmica',
    description: 'Template que se ajusta baseado no orçamento e complexidade',
    category: 'Negócios',
    variables: [
      {
        id: 'budget_range',
        name: 'Faixa de Orçamento',
        type: 'select',
        options: ['< 10k', '10k-50k', '50k-100k', '> 100k'],
        defaultValue: '10k-50k'
      },
      {
        id: 'complexity',
        name: 'Complexidade',
        type: 'select',
        options: ['Simples', 'Média', 'Alta', 'Crítica'],
        defaultValue: 'Média'
      },
      {
        id: 'timeline_months',
        name: 'Timeline (meses)',
        type: 'number',
        defaultValue: 6,
        validation: { min: 1, max: 24 }
      },
      {
        id: 'requires_approval',
        name: 'Requer Aprovação',
        type: 'boolean',
        defaultValue: false
      },
      {
        id: 'risk_score',
        name: 'Score de Risco',
        type: 'calculated',
        formula: 'IF(complexity === "Crítica", 5, IF(budget_range === "> 100k", 4, 2))'
      }
    ],
    conditions: [
      {
        id: 'show_detailed_budget',
        variable: 'budget_range',
        operator: 'equals',
        value: '> 100k',
        action: 'show',
        target: 'detailed_budget_section'
      },
      {
        id: 'show_risk_assessment',
        variable: 'complexity',
        operator: 'equals',
        value: 'Crítica',
        action: 'show',
        target: 'risk_section'
      }
    ],
    content: `# Proposta de Projeto: {{project_name}}

## 💰 Resumo Financeiro
- **Orçamento:** {{budget_range}}
- **Timeline:** {{timeline_months}} meses
- **Complexidade:** {{complexity}}
- **Score de Risco:** {{risk_score}}/5

{{#if budget_range === "> 100k"}}
## 💸 Detalhamento do Orçamento
### Breakdown Financeiro
- **Desenvolvimento:** 60%
- **Design:** 20%
- **Testing:** 15%
- **Contingência:** 5%

### Aprovações Necessárias
- [ ] Diretor Financeiro
- [ ] Diretor de Tecnologia
- [ ] CEO (projetos > 100k)
{{/if}}

{{#if complexity === "Crítica"}}
## ⚠️ Avaliação de Riscos
### Riscos Identificados
- **Técnicos:** {{technical_risks}}
- **Cronograma:** {{timeline_risks}}
- **Recursos:** {{resource_risks}}

### Plano de Mitigação
{{mitigation_plan}}
{{/if}}

## 🎯 Objetivos e Escopo
{{project_objectives}}

## 📋 Entregáveis
{{#each deliverables}}
- {{name}} - {{deadline}}
{{/each}}

## 👥 Equipe Necessária
{{team_requirements}}

---
*Proposta gerada em {{current_date}}*`,
    preview: '# Proposta de Projeto Dinâmica\n\nTemplate adaptável por orçamento e complexidade...',
    tags: ['projeto', 'negócios', 'proposta'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const ConditionalTemplates: React.FC<ConditionalTemplatesProps> = ({
  onTemplateSelect,
  onTemplateCreate,
  className
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ConditionalTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Processar condições e calcular variáveis
  const processedContent = useMemo(() => {
    if (!selectedTemplate) return '';

    let content = selectedTemplate.content;
    const processedValues = { ...variableValues };

    // Processar variáveis calculadas
    selectedTemplate.variables.forEach(variable => {
      if (variable.type === 'calculated' && variable.formula) {
        try {
          // Aqui implementaríamos um evaluator de fórmulas
          // Por simplicidade, vamos simular alguns cálculos
          if (variable.id === 'urgency_score') {
            const duration = processedValues.duration || 60;
            const participants = processedValues.participants || 5;
            processedValues[variable.id] = duration < 30 ? 3 : participants > 10 ? 2 : 1;
          }
          if (variable.id === 'risk_score') {
            const complexity = processedValues.complexity || 'Média';
            const budget = processedValues.budget_range || '10k-50k';
            processedValues[variable.id] = complexity === 'Crítica' ? 5 : budget === '> 100k' ? 4 : 2;
          }
        } catch (error) {
          console.error('Erro ao calcular variável:', variable.id, error);
        }
      }
    });

    // Substituir placeholders simples
    Object.entries(processedValues).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(placeholder, String(value || ''));
    });

    // Adicionar variáveis do sistema
    content = content.replace(/{{date}}/g, new Date().toLocaleDateString('pt-BR'));
    content = content.replace(/{{current_time}}/g, new Date().toLocaleString('pt-BR'));
    content = content.replace(/{{current_date}}/g, new Date().toLocaleDateString('pt-BR'));

    return content;
  }, [selectedTemplate, variableValues]);

  const handleVariableChange = useCallback((variableId: string, value: any) => {
    setVariableValues(prev => ({
      ...prev,
      [variableId]: value
    }));
  }, []);

  const handleTemplateSelect = useCallback((template: ConditionalTemplate) => {
    setSelectedTemplate(template);
    
    // Inicializar valores padrão
    const defaultValues: Record<string, any> = {};
    template.variables.forEach(variable => {
      if (variable.defaultValue !== undefined) {
        defaultValues[variable.id] = variable.defaultValue;
      }
    });
    setVariableValues(defaultValues);
  }, []);

  const handleApplyTemplate = useCallback(() => {
    if (selectedTemplate && onTemplateSelect) {
      onTemplateSelect(selectedTemplate, variableValues);
    }
  }, [selectedTemplate, variableValues, onTemplateSelect]);

  const renderVariableInput = (variable: TemplateVariable) => {
    const value = variableValues[variable.id];

    switch (variable.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleVariableChange(variable.id, e.target.value)}
            placeholder={`Digite ${variable.name.toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleVariableChange(variable.id, Number(e.target.value))}
            min={variable.validation?.min}
            max={variable.validation?.max}
          />
        );

      case 'boolean':
        return (
          <Switch
            checked={value || false}
            onCheckedChange={(checked) => handleVariableChange(variable.id, checked)}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleVariableChange(variable.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {variable.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleVariableChange(variable.id, e.target.value)}
          />
        );

      case 'calculated':
        return (
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
            {value !== undefined ? String(value) : 'Calculando...'}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("conditional-templates p-6", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Templates Inteligentes</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(!isCreating)}
            >
              <Zap className="h-4 w-4 mr-2" />
              Criar
            </Button>
          </div>

          <div className="space-y-3">
            {PREDEFINED_TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  selectedTemplate?.id === template.id && "ring-2 ring-blue-500"
                )}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                  <p className="text-xs text-gray-600">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {template.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{template.variables.length} variáveis</span>
                    <span>{template.conditions.length} condições</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Variables Configuration */}
        {selectedTemplate && (
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-semibold text-gray-900">Configuração</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            <div className="space-y-4">
              {selectedTemplate.variables.map((variable) => (
                <div key={variable.id} className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    {variable.type === 'calculated' && <Hash className="h-3 w-3" />}
                    {variable.type === 'date' && <Calendar className="h-3 w-3" />}
                    {variable.type === 'boolean' && <CheckSquare className="h-3 w-3" />}
                    {variable.type === 'text' && <Type className="h-3 w-3" />}
                    {variable.type === 'number' && <Variable className="h-3 w-3" />}
                    {variable.name}
                    {variable.validation?.required && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  {renderVariableInput(variable)}
                  {variable.type === 'calculated' && variable.formula && (
                    <p className="text-xs text-gray-500">
                      Fórmula: {variable.formula}
                    </p>
                  )}
                </div>
              ))}

              <Button
                onClick={handleApplyTemplate}
                className="w-full mt-6"
                disabled={!selectedTemplate}
              >
                <Play className="h-4 w-4 mr-2" />
                Aplicar Template
              </Button>
            </div>
          </div>
        )}

        {/* Preview */}
        {selectedTemplate && showPreview && (
          <div className="lg:col-span-1">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Preview</h3>
            <Card>
              <CardContent className="p-4">
                <div className="bg-gray-50 rounded-md p-3 max-h-96 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {processedContent}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditionalTemplates; 