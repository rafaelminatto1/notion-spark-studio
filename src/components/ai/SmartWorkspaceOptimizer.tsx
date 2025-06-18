import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Zap, 
  Clock, 
  Star, 
  Filter,
  BarChart3,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Settings,
  BookOpen,
  Folder,
  Tag,
  Users,
  Eye,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import type { FileItem } from '@/types';

// Tipos para otimizações inteligentes
interface OptimizationSuggestion {
  id: string;
  type: 'organization' | 'productivity' | 'performance' | 'collaboration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'easy' | 'medium' | 'complex';
  estimatedBenefit: number; // 0-100
  actionItems: OptimizationAction[];
  metrics?: {
    currentValue: number;
    targetValue: number;
    unit: string;
  };
}

interface OptimizationAction {
  id: string;
  description: string;
  completed: boolean;
  automated: boolean;
}

interface WorkspaceAnalytics {
  totalFiles: number;
  totalFolders: number;
  averageFileSize: number;
  duplicateContent: number;
  untaggedFiles: number;
  lastActivity: Date;
  productivityScore: number;
  organizationScore: number;
  collaborationScore: number;
  performanceScore: number;
}

interface SmartWorkspaceOptimizerProps {
  files: FileItem[];
  className?: string;
  onApplyOptimization?: (suggestionId: string) => void;
}

export const SmartWorkspaceOptimizer: React.FC<SmartWorkspaceOptimizerProps> = ({
  files = [],
  className = '',
  onApplyOptimization
}) => {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [analytics, setAnalytics] = useState<WorkspaceAnalytics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  // Análise inteligente do workspace
  const analyzeWorkspace = useMemo(() => {
    if (files.length === 0) return null;

    const totalFiles = files.filter(f => f.type === 'file').length;
    const totalFolders = files.filter(f => f.type === 'folder').length;
    const averageFileSize = files.reduce((acc, file) => acc + (file.size || 0), 0) / totalFiles;
    
    // Detectar arquivos sem tags
    const untaggedFiles = files.filter(f => f.type === 'file' && (!f.tags || f.tags.length === 0)).length;
    
    // Detectar conteúdo duplicado (simulado)
    const duplicateContent = Math.floor(totalFiles * 0.1); // 10% estimado
    
    // Última atividade
    const lastActivity = files.reduce((latest, file) => {
      const fileDate = file.modifiedAt || file.createdAt;
      return fileDate > latest ? fileDate : latest;
    }, new Date(0));

    // Calcular scores (0-100)
    const organizationScore = Math.max(0, 100 - (untaggedFiles / totalFiles) * 100);
    const productivityScore = Math.min(100, (totalFiles / Math.max(1, totalFolders)) * 20);
    const collaborationScore = Math.random() * 40 + 50; // Simulado
    const performanceScore = Math.min(100, 100 - (duplicateContent / totalFiles) * 100);

    return {
      totalFiles,
      totalFolders,
      averageFileSize: Math.round(averageFileSize),
      duplicateContent,
      untaggedFiles,
      lastActivity,
      productivityScore: Math.round(productivityScore),
      organizationScore: Math.round(organizationScore),
      collaborationScore: Math.round(collaborationScore),
      performanceScore: Math.round(performanceScore)
    };
  }, [files]);

  // Gerar sugestões inteligentes baseadas na análise
  const generateSuggestions = useMemo((): OptimizationSuggestion[] => {
    if (!analyzeWorkspace) return [];

    const suggestions: OptimizationSuggestion[] = [];

    // Sugestão de organização - Tags automáticas
    if (analyzeWorkspace.untaggedFiles > 0) {
      suggestions.push({
        id: 'auto-tagging',
        type: 'organization',
        priority: analyzeWorkspace.untaggedFiles > analyzeWorkspace.totalFiles * 0.5 ? 'high' : 'medium',
        title: 'Auto-Tagging Inteligente',
        description: `${analyzeWorkspace.untaggedFiles} arquivos sem tags detectados. IA pode sugerir tags automaticamente.`,
        impact: `Melhoria de ${Math.round((analyzeWorkspace.untaggedFiles / analyzeWorkspace.totalFiles) * 100)}% na organização`,
        effort: 'easy',
        estimatedBenefit: Math.min(90, (analyzeWorkspace.untaggedFiles / analyzeWorkspace.totalFiles) * 100),
        actionItems: [
          { id: '1', description: 'Analisar conteúdo dos arquivos sem tags', completed: false, automated: true },
          { id: '2', description: 'Aplicar tags sugeridas pela IA', completed: false, automated: false },
          { id: '3', description: 'Revisar e ajustar tags aplicadas', completed: false, automated: false }
        ],
        metrics: {
          currentValue: analyzeWorkspace.totalFiles - analyzeWorkspace.untaggedFiles,
          targetValue: analyzeWorkspace.totalFiles,
          unit: 'arquivos taggeados'
        }
      });
    }

    // Sugestão de performance - Remover duplicatas
    if (analyzeWorkspace.duplicateContent > 0) {
      suggestions.push({
        id: 'remove-duplicates',
        type: 'performance',
        priority: 'medium',
        title: 'Limpeza de Conteúdo Duplicado',
        description: `${analyzeWorkspace.duplicateContent} arquivos com conteúdo similar detectados.`,
        impact: `Economia de espaço e melhoria de performance`,
        effort: 'medium',
        estimatedBenefit: 70,
        actionItems: [
          { id: '1', description: 'Escanear por conteúdo duplicado', completed: false, automated: true },
          { id: '2', description: 'Apresentar sugestões de merge/remoção', completed: false, automated: true },
          { id: '3', description: 'Confirmar ações de limpeza', completed: false, automated: false }
        ]
      });
    }

    // Sugestão de produtividade - Estrutura de pastas
    if (analyzeWorkspace.totalFiles / Math.max(1, analyzeWorkspace.totalFolders) > 10) {
      suggestions.push({
        id: 'folder-structure',
        type: 'productivity',
        priority: 'medium',
        title: 'Otimizar Estrutura de Pastas',
        description: 'Muitos arquivos por pasta. Sugerimos criar subcategorias.',
        impact: 'Navegação mais rápida e organização melhorada',
        effort: 'medium',
        estimatedBenefit: 60,
        actionItems: [
          { id: '1', description: 'Analisar padrões de arquivos', completed: false, automated: true },
          { id: '2', description: 'Sugerir nova estrutura de pastas', completed: false, automated: true },
          { id: '3', description: 'Reorganizar arquivos automaticamente', completed: false, automated: false }
        ]
      });
    }

    // Sugestão de colaboração - Compartilhamento inteligente
    if (analyzeWorkspace.collaborationScore < 70) {
      suggestions.push({
        id: 'smart-sharing',
        type: 'collaboration',
        priority: 'low',
        title: 'Configurar Compartilhamento Inteligente',
        description: 'IA pode sugerir quais arquivos compartilhar com base em padrões de uso.',
        impact: 'Melhoria na colaboração em equipe',
        effort: 'easy',
        estimatedBenefit: 50,
        actionItems: [
          { id: '1', description: 'Analisar padrões de acesso', completed: false, automated: true },
          { id: '2', description: 'Sugerir arquivos para compartilhamento', completed: false, automated: true },
          { id: '3', description: 'Configurar permissões automáticas', completed: false, automated: false }
        ]
      });
    }

    // Sugestão de produtividade - Templates inteligentes
    suggestions.push({
      id: 'smart-templates',
      type: 'productivity',
      priority: 'low',
      title: 'Templates Personalizados',
      description: 'Criar templates baseados nos seus documentos mais usados.',
      impact: 'Acelera criação de novos documentos',
      effort: 'easy',
      estimatedBenefit: 40,
      actionItems: [
        { id: '1', description: 'Identificar padrões comuns nos documentos', completed: false, automated: true },
        { id: '2', description: 'Gerar templates automaticamente', completed: false, automated: true },
        { id: '3', description: 'Disponibilizar templates no menu', completed: false, automated: false }
      ]
    });

    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [analyzeWorkspace]);

  useEffect(() => {
    setAnalytics(analyzeWorkspace);
    setSuggestions(generateSuggestions);
  }, [analyzeWorkspace, generateSuggestions]);

  // Executar análise completa
  const runFullAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setAnalytics(analyzeWorkspace);
    setSuggestions(generateSuggestions);
    setIsAnalyzing(false);
  };

  // Aplicar otimização
  const handleApplyOptimization = (suggestionId: string) => {
    setAppliedSuggestions(prev => new Set([...prev, suggestionId]));
    onApplyOptimization?.(suggestionId);
  };

  // Filtrar sugestões por tipo
  const filteredSuggestions = useMemo(() => {
    if (selectedType === 'all') return suggestions;
    return suggestions.filter(s => s.type === selectedType);
  }, [suggestions, selectedType]);

  // Função para obter cor da prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Função para obter ícone do tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'organization': return <Folder className="h-4 w-4" />;
      case 'productivity': return <Zap className="h-4 w-4" />;
      case 'performance': return <Activity className="h-4 w-4" />;
      case 'collaboration': return <Users className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (!analytics) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Preparando Análise Inteligente
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Carregue alguns arquivos para começar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com score geral */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-500" />
            Smart Workspace Optimizer
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            IA analisa seu workspace e sugere otimizações personalizadas
          </p>
        </div>
        <Button
          onClick={runFullAnalysis}
          disabled={isAnalyzing}
          variant="outline"
        >
          {isAnalyzing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {isAnalyzing ? 'Analisando...' : 'Análise Completa'}
        </Button>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Organização</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.organizationScore}
                </p>
              </div>
              <Folder className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={analytics.organizationScore} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Produtividade</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.productivityScore}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={analytics.productivityScore} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Performance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.performanceScore}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={analytics.performanceScore} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Colaboração</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.collaborationScore}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
            <Progress value={analytics.collaborationScore} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas do workspace */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análise do Workspace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{analytics.totalFiles}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Arquivos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{analytics.totalFolders}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pastas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{analytics.untaggedFiles}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sem Tags</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{analytics.duplicateContent}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Duplicatas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sugestões de otimização */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Sugestões de Otimização ({filteredSuggestions.length})
            </CardTitle>
            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="organization">Organização</TabsTrigger>
                <TabsTrigger value="productivity">Produtividade</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="collaboration">Colaboração</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence>
              {filteredSuggestions.map((suggestion) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        {getTypeIcon(suggestion.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {suggestion.title}
                          </h3>
                          <Badge className={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority}
                          </Badge>
                          {suggestion.effort === 'easy' && (
                            <Badge variant="outline">Fácil</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {suggestion.description}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          💡 {suggestion.impact}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {suggestion.estimatedBenefit}%
                      </div>
                      <p className="text-xs text-gray-500">benefício</p>
                    </div>
                  </div>

                  {suggestion.metrics && (
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        Atual: {suggestion.metrics.currentValue} {suggestion.metrics.unit}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                      <span>
                        Meta: {suggestion.metrics.targetValue} {suggestion.metrics.unit}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {suggestion.actionItems.length} ações • {suggestion.effort}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => { handleApplyOptimization(suggestion.id); }}
                      disabled={appliedSuggestions.has(suggestion.id)}
                    >
                      {appliedSuggestions.has(suggestion.id) ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aplicado
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-2" />
                          Aplicar
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredSuggestions.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">Workspace Otimizado!</h3>
                <p>Não encontramos sugestões de melhoria no momento.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 