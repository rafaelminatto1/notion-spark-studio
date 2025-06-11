import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Zap, AlertCircle, X, Users, MessageCircle, Shield, Brain, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'error';

export interface ImplementationTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number; // 0-100
  estimatedTime?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

// Dados das tarefas da Semana 1
const week1Tasks: ImplementationTask[] = [
  {
    id: 'graph-worker',
    title: 'Graph View Web Workers',
    description: 'Implementar Web Workers para cálculos pesados do Graph View',
    status: 'completed',
    progress: 100,
    estimatedTime: '2 dias',
    priority: 'critical',
    tags: ['performance', 'graph', 'workers']
  },
  {
    id: 'debounced-search',
    title: 'Search Enhancement',
    description: 'Implementar debounced search com analytics e cancelation',
    status: 'completed',
    progress: 100,
    estimatedTime: '2 dias',
    priority: 'high',
    tags: ['search', 'performance', 'ux']
  },
  {
    id: 'micro-interactions',
    title: 'Micro-Interactions & Haptic',
    description: 'Implementar feedback haptic e micro-interactions inteligentes',
    status: 'completed',
    progress: 100,
    estimatedTime: '3 dias',
    priority: 'high',
    tags: ['ux', 'mobile', 'feedback']
  },
  {
    id: 'virtualization',
    title: 'Lista Virtualizada',
    description: 'Implementar virtualização para listas grandes (File Tree)',
    status: 'completed',
    progress: 100,
    estimatedTime: '2 dias',
    priority: 'medium',
    tags: ['performance', 'virtualization']
  },
  {
    id: 'caching-system',
    title: 'Sistema de Cache Avançado',
    description: 'Implementar cache inteligente e prefetching',
    status: 'completed',
    progress: 100,
    estimatedTime: '3 dias',
    priority: 'medium',
    tags: ['performance', 'cache']
  }
];

// Dados das tarefas da Semana 2
const week2Tasks: ImplementationTask[] = [
  {
    id: 'command-palette-ai',
    title: 'Command Palette AI Enhancement',
    description: 'Context-aware suggestions e learning algorithm',
    status: 'completed',
    progress: 100,
    estimatedTime: '3 dias',
    priority: 'critical',
    tags: ['ai', 'ux', 'command-palette']
  },
  {
    id: 'advanced-micro-interactions',
    title: 'Advanced Micro-Interactions',
    description: 'Error states elegantes e loading skeletons contextuais',
    status: 'completed',
    progress: 100,
    estimatedTime: '2 dias',
    priority: 'high',
    tags: ['ux', 'interactions', 'animations']
  },
  {
    id: 'gesture-enhancement',
    title: 'Mobile Gestures Enhancement',
    description: 'Custom gesture recognition e accessibility gestures',
    status: 'completed',
    progress: 100,
    estimatedTime: '3 dias',
    priority: 'high',
    tags: ['mobile', 'gestures', 'accessibility']
  },
  {
    id: 'adaptive-ui',
    title: 'Adaptive UI System',
    description: 'UI que se adapta ao contexto do usuário',
    status: 'completed',
    progress: 100,
    estimatedTime: '4 dias',
    priority: 'medium',
    tags: ['ux', 'adaptive', 'personalization']
  }
];

// Dados das tarefas da Semana 3
const week3Tasks: ImplementationTask[] = [
  {
    id: 'permissions-engine',
    title: 'Sistema de Permissões Granulares',
    description: 'RBAC implementation com regras condicionais',
    status: 'completed',
    progress: 100,
    estimatedTime: '4 dias',
    priority: 'critical',
    tags: ['security', 'rbac', 'permissions']
  },
  {
    id: 'realtime-collaboration',
    title: 'Real-time Collaboration',
    description: 'Live cursors e operational transform',
    status: 'pending',
    progress: 0,
    estimatedTime: '5 dias',
    priority: 'critical',
    tags: ['collaboration', 'realtime', 'sync']
  },
  {
    id: 'comments-annotations',
    title: 'Comments & Annotations',
    description: 'Threaded comments com @mentions',
    status: 'pending',
    progress: 0,
    estimatedTime: '3 dias',
    priority: 'high',
    tags: ['collaboration', 'comments', 'social']
  },
  {
    id: 'workspace-analytics',
    title: 'Workspace Analytics',
    description: 'Analytics e insights de colaboração',
    status: 'pending',
    progress: 0,
    estimatedTime: '3 dias',
    priority: 'medium',
    tags: ['analytics', 'insights', 'metrics']
  }
];

interface StatusWidgetProps {
  className?: string;
  compact?: boolean;
}

interface WeekStatus {
  week: number;
  title: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'pending';
  features: {
    name: string;
    completed: boolean;
    description: string;
    icon: React.ElementType;
  }[];
}

const roadmapStatus: WeekStatus[] = [
  {
    week: 1,
    title: 'Performance & Otimização',
    progress: 100,
    status: 'completed',
    features: [
      {
        name: 'Graph View Web Workers',
        completed: true,
        description: 'Cálculos pesados em worker threads',
        icon: Zap
      },
      {
        name: 'Search Enhancement',
        completed: true,
        description: 'Busca com debounce e cancelation',
        icon: Zap
      },
      {
        name: 'Micro-Interactions',
        completed: true,
        description: 'Haptic feedback e animações',
        icon: Zap
      },
      {
        name: 'Virtualização Avançada',
        completed: true,
        description: 'Lista virtualizada para performance',
        icon: Zap
      }
    ]
  },
  {
    week: 2,
    title: 'UX/UI Refinements',
    progress: 100,
    status: 'completed',
    features: [
      {
        name: 'Adaptive UI System',
        completed: true,
        description: 'UI que aprende padrões de uso',
        icon: Brain
      },
      {
        name: 'Advanced Gestures',
        completed: true,
        description: 'Sistema de gestos Apple-like',
        icon: Zap
      },
      {
        name: 'Enhanced Animations',
        completed: true,
        description: 'Transições fluidas e micro-interações',
        icon: Zap
      },
      {
        name: 'Command Palette AI',
        completed: true,
        description: 'Sugestões contextuais inteligentes',
        icon: Brain
      }
    ]
  },
  {
    week: 3,
    title: 'Collaboration & Permissions',
    progress: 100,
    status: 'completed',
    features: [
      {
        name: 'RBAC Permissions',
        completed: true,
        description: 'Sistema avançado de permissões',
        icon: Shield
      },
      {
        name: 'Live Cursors',
        completed: true,
        description: 'Cursores colaborativos em tempo real',
        icon: Users
      },
      {
        name: 'Operational Transform',
        completed: true,
        description: 'Edição simultânea sem conflitos',
        icon: Zap
      },
      {
        name: 'Comments & Annotations',
        completed: true,
        description: 'Sistema completo de comentários',
        icon: MessageCircle
      }
    ]
  },
  {
    week: 4,
    title: 'AI & Intelligence',
    progress: 100,
    status: 'completed',
    features: [
      {
        name: 'Auto-tagging com NLP',
        completed: true,
        description: 'Tags automáticas baseadas em conteúdo',
        icon: Brain
      },
      {
        name: 'Content Similarity',
        completed: true,
        description: 'Detecção de documentos similares',
        icon: Brain
      },
      {
        name: 'Smart Suggestions',
        completed: true,
        description: 'Sugestões de conteúdo inteligentes',
        icon: Brain
      },
      {
        name: 'Analytics & Insights',
        completed: true,
        description: 'Métricas e insights de uso',
        icon: Brain
              }
      ]
    },
    {
      week: 5,
      title: 'Layout Evernote - IMPLEMENTADO ✅',
      progress: 100,
      status: 'completed',
      features: [
        {
          name: 'Layout 3 Painéis',
          completed: true,
          description: 'Notebooks | Lista | Editor',
          icon: CheckCircle
        },
        {
          name: 'Sistema Notebooks',
          completed: true,
          description: 'Organização hierárquica',
          icon: CheckCircle
        },
        {
          name: 'Lista de Notas',
          completed: true,
          description: '3 modos de visualização',
          icon: CheckCircle
        },
        {
          name: 'Editor Limpo',
          completed: true,
          description: 'Interface minimalista',
          icon: CheckCircle
        }
      ]
    },
    {
      week: 6,
      title: 'Design System & Mobile',
      progress: 0,
      status: 'pending',
      features: [
        {
          name: 'Design System Evolution',
          completed: false,
          description: 'Sistema de design consistente',
          icon: Zap
        },
        {
          name: 'Mobile Optimization',
          completed: false,
          description: 'Experiência móvel otimizada',
          icon: Zap
        },
        {
          name: 'Offline Support',
          completed: false,
          description: 'Funcionalidade offline',
          icon: Zap
        },
        {
          name: 'Performance Monitoring',
          completed: false,
          description: 'Monitoramento em tempo real',
          icon: Brain
        }
      ]
    }
  ];

export const StatusWidget: React.FC<StatusWidgetProps> = ({ 
  className,
  compact = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [currentWeek, setCurrentWeek] = useState(3); // Mudamos para Semana 3

  // Determinar quais tarefas mostrar baseado na semana atual
  const getCurrentTasks = () => {
    switch (currentWeek) {
      case 1: return week1Tasks;
      case 2: return week2Tasks;
      case 3: return week3Tasks;
      default: return week3Tasks;
    }
  };
  
  const getWeekTitle = () => {
    switch (currentWeek) {
      case 1: return 'Performance & Otimização';
      case 2: return 'UX/UI Refinements';
      case 3: return 'Collaboration & Permissions';
      default: return 'Collaboration & Permissions';
    }
  };

  const currentTasks = getCurrentTasks();
  const weekTitle = getWeekTitle();

  // Calcular estatísticas
  const totalTasks = currentTasks.length;
  const completedTasks = currentTasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = currentTasks.filter(task => task.status === 'in-progress').length;
  const overallProgress = Math.round(
    currentTasks.reduce((sum, task) => sum + task.progress, 0) / totalTasks
  );

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'in-progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (compact && !isExpanded) {
    return (
      <motion.div 
        className={cn(
          "fixed bottom-4 right-4 z-50",
          className
        )}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
      >
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-notion-purple hover:bg-notion-purple-hover text-white shadow-lg"
        >
          <Zap className="h-4 w-4 mr-2" />
          Semana {currentWeek}: {completedTasks}/{totalTasks}
          <div className="ml-2 w-8 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={cn(
        "fixed bottom-4 right-4 z-50 w-96",
        className
      )}
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", damping: 20 }}
    >
      <Card className="bg-notion-dark border-notion-dark-border shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white flex items-center">
              <Zap className="h-5 w-5 mr-2 text-notion-purple" />
              Semana {currentWeek}: {weekTitle}
            </CardTitle>
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Progress Geral */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="#374151"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="#8B5CF6"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - overallProgress / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{overallProgress}%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Progresso Geral</span>
                <span className="text-white font-medium">{overallProgress}%</span>
              </div>
              <div className="flex gap-2 mt-1 text-xs text-gray-400">
                <span>✅ {completedTasks} completas</span>
                <span>🔄 {inProgressTasks} em andamento</span>
                <span>📋 {totalTasks - completedTasks - inProgressTasks} pendentes</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            <AnimatePresence>
              {currentTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "p-3 rounded-lg border",
                    getStatusColor(task.status)
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <h4 className="font-medium text-sm">{task.title}</h4>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {task.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-xs opacity-80 mb-2">{task.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-current"
                        initial={{ width: 0 }}
                        animate={{ width: `${task.progress}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                    <span className="text-xs font-medium">{task.progress}%</span>
                  </div>
                  
                  {/* Tags e Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {task.tags.slice(0, 3).map(tag => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="text-xs px-1 py-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {task.estimatedTime && (
                      <span className="text-xs opacity-60">
                        {task.estimatedTime}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Summary Footer */}
          <div className="mt-4 pt-3 border-t border-notion-dark-border">
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>Próxima: Sistema de Permissões</span>
              <span>ETA: 2 semanas</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 