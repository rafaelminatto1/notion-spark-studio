import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Zap,
  FileText,
  Users,
  Clock,
  Star,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Network,
  Tags,
  Calendar,
  Layers
} from 'lucide-react';
import type { FileItem } from '@/types';
import { cn } from '@/lib/utils';

interface AIInsight {
  id: string;
  type: 'recommendation' | 'optimization' | 'pattern' | 'anomaly' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  category: 'productivity' | 'organization' | 'collaboration' | 'performance' | 'security';
  actionable: boolean;
  relatedFiles?: string[];
  suggestedAction?: string;
  timestamp: Date;
}

interface WorkspaceMetrics {
  totalFiles: number;
  activeFiles: number;
  collaborationScore: number;
  organizationScore: number;
  productivityTrend: number;
  knowledgeGaps: string[];
  hotTopics: string[];
  underutilizedContent: string[];
}

interface SmartWorkspaceAnalyzerProps {
  files: FileItem[];
  currentFileId?: string;
  userActivity?: any[];
  className?: string;
}

export const SmartWorkspaceAnalyzer: React.FC<SmartWorkspaceAnalyzerProps> = ({
  files,
  currentFileId,
  userActivity = [],
  className
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'metrics' | 'trends' | 'actions'>('insights');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  // Métricas do workspace
  const workspaceMetrics = useMemo<WorkspaceMetrics>(() => {
    const totalFiles = files.length;
    const recentlyModified = files.filter(f => {
      const daysDiff = (Date.now() - new Date(f.lastModified).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;

    // Análise de tags para detectar tópicos quentes
    const tagFrequency = new Map<string, number>();
    files.forEach(file => {
      file.tags?.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    });

    const hotTopics = Array.from(tagFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Conteúdo subutilizado (arquivos antigos sem visualizações recentes)
    const underutilizedContent = files
      .filter(f => {
        const daysSinceModified = (Date.now() - new Date(f.lastModified).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceModified > 30;
      })
      .slice(0, 5)
      .map(f => f.name);

    return {
      totalFiles,
      activeFiles: recentlyModified,
      collaborationScore: Math.min(100, (files.filter(f => f.collaborators && f.collaborators.length > 1).length / totalFiles) * 100),
      organizationScore: Math.min(100, (files.filter(f => f.tags && f.tags.length > 0).length / totalFiles) * 100),
      productivityTrend: recentlyModified > 0 ? Math.min(100, (recentlyModified / totalFiles) * 200) : 50,
      knowledgeGaps: ['Machine Learning', 'Data Science', 'API Documentation'], // Simulado
      hotTopics,
      underutilizedContent
    };
  }, [files]);

  // Análise inteligente do workspace
  const performAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setLastAnalysis(new Date());

    // Simular análise de IA
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newInsights: AIInsight[] = [];

    // Análise de organização
    if (workspaceMetrics.organizationScore < 50) {
      newInsights.push({
        id: `org-${Date.now()}`,
        type: 'recommendation',
        title: 'Melhore a organização dos arquivos',
        description: `${Math.round(100 - workspaceMetrics.organizationScore)}% dos seus arquivos não possuem tags. Adicionar tags melhorará a descoberta de conteúdo.`,
        confidence: 85,
        impact: 'medium',
        category: 'organization',
        actionable: true,
        suggestedAction: 'Adicionar tags aos arquivos principais',
        timestamp: new Date()
      });
    }

    // Análise de colaboração
    if (workspaceMetrics.collaborationScore < 30) {
      newInsights.push({
        id: `collab-${Date.now()}`,
        type: 'recommendation',
        title: 'Aumentar colaboração da equipe',
        description: 'Poucos arquivos possuem múltiplos colaboradores. Compartilhar conhecimento pode acelerar projetos.',
        confidence: 78,
        impact: 'high',
        category: 'collaboration',
        actionable: true,
        suggestedAction: 'Convidar membros da equipe para documentos principais',
        timestamp: new Date()
      });
    }

    // Análise de conteúdo subutilizado
    if (workspaceMetrics.underutilizedContent.length > 0) {
      newInsights.push({
        id: `unused-${Date.now()}`,
        type: 'optimization',
        title: 'Conteúdo subutilizado detectado',
        description: `${workspaceMetrics.underutilizedContent.length} arquivos não foram acessados há mais de 30 dias.`,
        confidence: 92,
        impact: 'medium',
        category: 'productivity',
        actionable: true,
        relatedFiles: workspaceMetrics.underutilizedContent.slice(0, 3),
        suggestedAction: 'Revisar e arquivar ou atualizar conteúdo obsoleto',
        timestamp: new Date()
      });
    }

    // Análise de tendências
    if (workspaceMetrics.productivityTrend > 80) {
      newInsights.push({
        id: `trend-${Date.now()}`,
        type: 'pattern',
        title: 'Alta atividade detectada',
        description: 'Seu workspace está muito ativo. Considere otimizar fluxos de trabalho para manter eficiência.',
        confidence: 88,
        impact: 'medium',
        category: 'productivity',
        actionable: true,
        suggestedAction: 'Criar templates para acelerar criação de conteúdo',
        timestamp: new Date()
      });
    }

    // Análise de lacunas de conhecimento
    if (workspaceMetrics.knowledgeGaps.length > 0) {
      newInsights.push({
        id: `gaps-${Date.now()}`,
        type: 'prediction',
        title: 'Lacunas de conhecimento identificadas',
        description: `Áreas com potencial para expansão: ${workspaceMetrics.knowledgeGaps.join(', ')}`,
        confidence: 72,
        impact: 'high',
        category: 'productivity',
        actionable: true,
        suggestedAction: 'Criar documentação sobre tópicos em falta',
        timestamp: new Date()
      });
    }

    // Insights baseados em arquivos populares
    const popularFiles = files
      .filter(f => f.views && f.views > 10)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 3);

    if (popularFiles.length > 0) {
      newInsights.push({
        id: `popular-${Date.now()}`,
        type: 'pattern',
        title: 'Conteúdo de alto engajamento',
        description: `${popularFiles.length} arquivos estão recebendo muita atenção. Use-os como base para expandir tópicos relacionados.`,
        confidence: 95,
        impact: 'high',
        category: 'productivity',
        actionable: true,
        relatedFiles: popularFiles.map(f => f.name),
        suggestedAction: 'Criar conteúdo relacionado aos temas populares',
        timestamp: new Date()
      });
    }

    setInsights(newInsights);
    setIsAnalyzing(false);
  }, [files, workspaceMetrics]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && files.length > 0) {
      performAnalysis();
      const interval = setInterval(performAnalysis, 300000); // 5 minutos
      return () => { clearInterval(interval); };
    }
  }, [autoRefresh, files.length, performAnalysis]);

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      case 'optimization': return <Zap className="h-4 w-4" />;
      case 'pattern': return <TrendingUp className="h-4 w-4" />;
      case 'anomaly': return <AlertCircle className="h-4 w-4" />;
      case 'prediction': return <Target className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: AIInsight['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getCategoryIcon = (category: AIInsight['category']) => {
    switch (category) {
      case 'productivity': return <Zap className="h-3 w-3" />;
      case 'organization': return <Layers className="h-3 w-3" />;
      case 'collaboration': return <Users className="h-3 w-3" />;
      case 'performance': return <BarChart3 className="h-3 w-3" />;
      case 'security': return <AlertCircle className="h-3 w-3" />;
      default: return <Brain className="h-3 w-3" />;
    }
  };

  const highImpactInsights = insights.filter(i => i.impact === 'high').length;
  const actionableInsights = insights.filter(i => i.actionable).length;

  return (
    <div className={cn("relative", className)}>
      <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Workspace Analyzer</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {insights.length} insights • {actionableInsights} ações sugeridas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAnalyzing && (
                <RefreshCw className="h-4 w-4 animate-spin text-purple-500" />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={performAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                {isAnalyzing ? 'Analisando...' : 'Analisar'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(value: any) => { setActiveTab(value); }}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="insights" className="text-xs">
                Insights
                {highImpactInsights > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 text-xs">
                    {highImpactInsights}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="metrics" className="text-xs">Métricas</TabsTrigger>
              <TabsTrigger value="trends" className="text-xs">Tendências</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">
                Ações
                {actionableInsights > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {actionableInsights}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-3">
              <div className="max-h-96 overflow-y-auto space-y-3">
                {insights.length === 0 && !isAnalyzing ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium mb-1">Nenhum insight ainda</p>
                    <p className="text-sm">Clique em "Analisar" para começar</p>
                  </div>
                ) : (
                  insights.map((insight, index) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          insight.impact === 'high' ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400" :
                          insight.impact === 'medium' ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400" :
                          "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                        )}>
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {insight.title}
                            </h4>
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              {getCategoryIcon(insight.category)}
                              {insight.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {insight.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <span>Confiança:</span>
                                <span className="font-medium">{insight.confidence}%</span>
                              </div>
                              <Badge 
                                variant={insight.impact === 'high' ? 'destructive' : 
                                        insight.impact === 'medium' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {insight.impact} impact
                              </Badge>
                            </div>
                            {insight.actionable && (
                              <Button variant="outline" size="sm" className="text-xs">
                                <ArrowRight className="h-3 w-3 mr-1" />
                                Ação
                              </Button>
                            )}
                          </div>
                          {insight.relatedFiles && insight.relatedFiles.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                              <p className="text-xs text-gray-500 mb-1">Arquivos relacionados:</p>
                              <div className="flex flex-wrap gap-1">
                                {insight.relatedFiles.slice(0, 3).map(file => (
                                  <Badge key={file} variant="outline" className="text-xs">
                                    <FileText className="h-2 w-2 mr-1" />
                                    {file}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Produtividade</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {workspaceMetrics.productivityTrend}%
                  </div>
                  <Progress value={workspaceMetrics.productivityTrend} className="h-2" />
                </div>

                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Organização</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {Math.round(workspaceMetrics.organizationScore)}%
                  </div>
                  <Progress value={workspaceMetrics.organizationScore} className="h-2" />
                </div>

                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Colaboração</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {Math.round(workspaceMetrics.collaborationScore)}%
                  </div>
                  <Progress value={workspaceMetrics.collaborationScore} className="h-2" />
                </div>

                <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Arquivos Ativos</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                    {workspaceMetrics.activeFiles}
                  </div>
                  <p className="text-xs text-gray-500">de {workspaceMetrics.totalFiles} total</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    Tópicos em Alta
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {workspaceMetrics.hotTopics.map(topic => (
                      <Badge key={topic} variant="secondary" className="flex items-center gap-1">
                        <Tags className="h-3 w-3" />
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Conteúdo Subutilizado
                  </h4>
                  <div className="space-y-2">
                    {workspaceMetrics.underutilizedContent.slice(0, 5).map(content => (
                      <div key={content} className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{content}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Lacunas de Conhecimento
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {workspaceMetrics.knowledgeGaps.map(gap => (
                      <Badge key={gap} variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                        {gap}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-3">
              <div className="max-h-96 overflow-y-auto space-y-3">
                {insights.filter(i => i.actionable).length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium mb-1">Tudo em ordem!</p>
                    <p className="text-sm">Nenhuma ação necessária no momento</p>
                  </div>
                ) : (
                  insights
                    .filter(i => i.actionable)
                    .map((insight, index) => (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            insight.impact === 'high' ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400" :
                            insight.impact === 'medium' ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400" :
                            "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                          )}>
                            {getInsightIcon(insight.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                              {insight.title}
                            </h4>
                            {insight.suggestedAction && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                💡 {insight.suggestedAction}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <Badge 
                                variant={insight.impact === 'high' ? 'destructive' : 
                                        insight.impact === 'medium' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                Impacto {insight.impact}
                              </Badge>
                              <Button variant="default" size="sm" className="text-xs">
                                <ArrowRight className="h-3 w-3 mr-1" />
                                Executar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          {lastAnalysis && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                Última análise: {lastAnalysis.toLocaleTimeString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 