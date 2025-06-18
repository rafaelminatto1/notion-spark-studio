import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Calendar, 
  CheckSquare, 
  Briefcase,
  BookOpen,
  Camera,
  Zap,
  Heart,
  X,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppleDevice } from '@/hooks/useAppleDevice';
import { useTemplateMetrics } from '@/hooks/useTemplateMetrics';

interface AppleTemplate {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<any>;
  emoji: string;
  content: string;
  deviceOptimized?: 'iPhone' | 'iPad' | 'both';
}

interface AppleTemplateSelectorProps {
  onSelectTemplate: (content: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const appleTemplates: AppleTemplate[] = [
  {
    id: 'iphone-daily',
    name: 'Daily iPhone',
    category: 'Produtividade',
    icon: Calendar,
    emoji: '📱',
    deviceOptimized: 'iPhone',
    content: `# 📱 Daily ${new Date().toLocaleDateString('pt-BR')}

## 🌅 Manhã
- [ ] Verificar agenda
- [ ] Responder mensagens importantes
- [ ] 

## 💼 Trabalho  
- [ ] 
- [ ] 
- [ ] 

## 🌙 Noite
- [ ] Revisar o dia
- [ ] Planejar amanhã

## 💭 Reflexões
`
  },
  {
    id: 'ipad-notes',
    name: 'iPad Study Notes',
    category: 'Estudos',
    icon: BookOpen,
    emoji: '📚',
    deviceOptimized: 'iPad',
    content: `# 📚 Anotações de Estudo - ${new Date().toLocaleDateString('pt-BR')}

## 📝 Tema Principal
**Assunto:** 

### 🎯 Objetivos de Aprendizado
- [ ] 
- [ ] 
- [ ] 

### 💡 Conceitos Chave
1. **Conceito 1:** 
2. **Conceito 2:** 
3. **Conceito 3:** 

### 📊 Exemplos Práticos


### 🔗 Referências
- 

### ✅ Resumo
`
  },
  {
    id: 'apple-meeting',
    name: 'Apple Meeting',
    category: 'Reuniões',
    icon: Briefcase,
    emoji: '🍎',
    deviceOptimized: 'both',
    content: `# 🍎 Reunião Apple Style

**📅 Data:** ${new Date().toLocaleDateString('pt-BR')}
**👥 Participantes:** 

## 🎯 Agenda
- [ ] 
- [ ] 
- [ ] 

## 💬 Discussões


## ✅ Decisões Tomadas
- 

## 🚀 Próximas Ações
- [ ] 
- [ ] 

## 📱 Compatibilidade
✅ iPhone optimizado  
✅ iPad optimizado
`
  },
  {
    id: 'iphone-quick-capture',
    name: 'Quick Capture',
    category: 'Captura Rápida',
    icon: Camera,
    emoji: '⚡',
    deviceOptimized: 'iPhone',
    content: `# ⚡ Captura Rápida

**🕐 ${new Date().toLocaleTimeString('pt-BR')}**

## 💭 Ideia
`
  },
  {
    id: 'ipad-project',
    name: 'iPad Project Plan',
    category: 'Projetos',
    icon: Briefcase,
    emoji: '🎯',
    deviceOptimized: 'iPad',
    content: `# 🎯 Plano de Projeto - iPad

## 📋 Visão Geral
**Nome do Projeto:** 
**Data de Início:** ${new Date().toLocaleDateString('pt-BR')}
**Prazo:** 

## 🎯 Objetivos
- [ ] 
- [ ] 
- [ ] 

## 📊 Fases do Projeto

### 🚀 Fase 1: Planejamento
- [ ] 
- [ ] 

### ⚙️ Fase 2: Execução
- [ ] 
- [ ] 

### ✅ Fase 3: Entrega
- [ ] 
- [ ] 

## 👥 Equipe


## 📈 Métricas de Sucesso


## 🔄 Status Updates
**${new Date().toLocaleDateString('pt-BR')}:** Projeto iniciado
`
  },
  {
    id: 'apple-wellness',
    name: 'Apple Wellness',
    category: 'Bem-estar',
    icon: Heart,
    emoji: '❤️',
    deviceOptimized: 'both',
    content: `# ❤️ Bem-estar Apple

## 🏃 Atividade Física
**Meta diária:** 
- [ ] Exercício: 
- [ ] Passos: 
- [ ] Água: 

## 🧘 Mindfulness
- [ ] Meditação (__ min)
- [ ] Respiração consciente
- [ ] Momento de gratidão

## 📱 Screen Time
**Tempo limite:** 
**Apps mais usados:**
- 
- 

## 🛌 Sono
**Meta:** 8h
**Hora de dormir:** 
**Qualidade:** ⭐⭐⭐⭐⭐

## 📝 Reflexão do Dia
`
  }
];

export const AppleTemplateSelector: React.FC<AppleTemplateSelectorProps> = ({
  onSelectTemplate,
  isOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { isTargetDevice, isIPhone, isIPad, deviceModel } = useAppleDevice();
  const { trackTemplateUsage } = useTemplateMetrics();

  if (!isOpen || !isTargetDevice) return null;

  const filteredTemplates = appleTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDevice = template.deviceOptimized === 'both' ||
                         (isIPhone && template.deviceOptimized === 'iPhone') ||
                         (isIPad && template.deviceOptimized === 'iPad');
    
    return matchesSearch && matchesDevice;
  });

  const handleSelectTemplate = (template: AppleTemplate) => {
    onSelectTemplate(template.content);
    trackTemplateUsage(template.id, template.name, template.category, template.content.length);
    onClose();
  };

  return (
    <div className="apple-template-modal">
      <div className="apple-template-content safe-area-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="apple-title">🍎 Templates Apple</h2>
            <p className="apple-subtitle">Otimizado para {deviceModel}</p>
          </div>
          <Button
            onClick={onClose}
            className="apple-button secondary"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); }}
            className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent apple-body"
            style={{ minHeight: '48px' }}
          />
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.id}
                onClick={() => { handleSelectTemplate(template); }}
                className="apple-haptic-feedback text-left p-6 bg-gray-800/50 border border-gray-600 rounded-2xl hover:bg-gray-700/50 transition-all duration-200 apple-fade-in"
                style={{ minHeight: '80px' }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">{template.emoji}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="apple-subtitle truncate">{template.name}</h3>
                      {template.deviceOptimized && (
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                          {template.deviceOptimized}
                        </span>
                      )}
                    </div>
                    <p className="apple-caption">{template.category}</p>
                    <p className="apple-caption mt-2 line-clamp-2">
                      {template.content.split('\n')[0].replace('#', '').trim()}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="apple-subtitle mb-2">Nenhum template encontrado</h3>
            <p className="apple-body">Tente uma busca diferente ou volte mais tarde</p>
          </div>
        )}

        {/* Device Info */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="apple-caption text-center text-blue-400">
            ✨ Otimizado especificamente para seu {deviceModel}
          </p>
        </div>
      </div>
    </div>
  );
}; 