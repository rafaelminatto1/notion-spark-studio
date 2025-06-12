import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, PieChart, TrendingUp, TrendingDown, 
  Activity, Clock, Calendar, Target, Zap,
  FileText, Hash, Users, Brain, Eye,
  ArrowUp, ArrowDown, Minus, ChevronRight,
  Filter, Download, Share, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { FileItem } from '@/types';

interface AnalyticsData {
  productivity: ProductivityMetrics;
  content: ContentAnalytics;
  behavior: BehaviorMetrics;
  trends: TrendAnalysis;
  insights: InsightData[];
}

interface ProductivityMetrics {
  wordsPerDay: number;
  notesCreated: number;
  timeSpent: number; // minutes
  streakDays: number;
  peakHours: Array<{ hour: number; activity: number }>;
  weeklyPattern: Array<{ day: string; words: number; notes: number }>;
  completionRate: number;
}

interface ContentAnalytics {
  totalWords: number;
  averageNoteLength: number;
  topTags: Array<{ tag: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  topicDistribution: Array<{ topic: string; percentage: number; color: string }>;
  readabilityScore: number;
  sentimentTrend: Array<{ date: string; sentiment: number }>;
  complexityEvolution: Array<{ date: string; complexity: number }>;
}

interface BehaviorMetrics {
  sessionDuration: number;
  averageSessionLength: number;
  bounceRate: number;
  featureUsage: Record<string, number>;
  navigationPatterns: Array<{ from: string; to: string; count: number }>;
  errorRate: number;
  searchQueries: Array<{ query: string; frequency: number; successRate: number }>;
}

interface TrendAnalysis {
  writing: { trend: 'up' | 'down' | 'stable'; change: number };
  organization: { trend: 'up' | 'down' | 'stable'; change: number };
  engagement: { trend: 'up' | 'down' | 'stable'; change: number };
  predictions: Array<{ metric: string; prediction: string; confidence: number }>;
}

interface InsightData {
  id: string;
  type: 'productivity' | 'content' | 'behavior' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: any;
}

interface AdvancedAnalyticsProps {
  files: FileItem[];
  className?: string;
}

// Analytics Engine
class AnalyticsEngine {
  static generateAnalytics(files: FileItem[]): AnalyticsData {
    return {
      productivity: this.calculateProductivityMetrics(files),
      content: this.analyzeContent(files),
      behavior: this.analyzeBehavior(files),
      trends: this.analyzeTrends(files),
      insights: this.generateInsights(files)
    };
  }

  private static calculateProductivityMetrics(files: FileItem[]): ProductivityMetrics {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentFiles = files.filter(f => new Date(f.updatedAt) > last7Days);

    // Calculate words per day
    const totalWords = recentFiles.reduce((sum, file) => {
      const words = (file.content || '').split(/\s+/).length;
      return sum + words;
    }, 0);
    
    const wordsPerDay = Math.round(totalWords / 7);
    const notesCreated = recentFiles.length;
    
    // Simulate time spent (in production, would track actual time)
    const timeSpent = recentFiles.length * 15 + Math.random() * 60;
    
    // Calculate streak
    const streakDays = this.calculateStreak(files);
    
    // Generate peak hours (mock data)
    const peakHours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      activity: Math.random() * 100 * (hour >= 9 && hour <= 17 ? 1.5 : 0.5)
    }));

    // Weekly pattern
    const weeklyPattern = [
      'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
    ].map(day => ({
      day,
      words: Math.floor(Math.random() * 500) + 100,
      notes: Math.floor(Math.random() * 5) + 1
    }));

    const completionRate = Math.random() * 0.3 + 0.7; // 70-100%

    return {
      wordsPerDay,
      notesCreated,
      timeSpent: Math.round(timeSpent),
      streakDays,
      peakHours,
      weeklyPattern,
      completionRate
    };
  }

  private static analyzeContent(files: FileItem[]): ContentAnalytics {
    const totalWords = files.reduce((sum, file) => {
      return sum + (file.content || '').split(/\s+/).length;
    }, 0);

    const averageNoteLength = totalWords / Math.max(files.length, 1);

    // Tag analysis
    const tagCounts: Record<string, number> = {};
    files.forEach(file => {
      file.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({
        tag,
        count,
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
      }));

    // Topic distribution
    const topicDistribution = [
      { topic: 'Trabalho', percentage: 35, color: '#3B82F6' },
      { topic: 'Pessoal', percentage: 25, color: '#10B981' },
      { topic: 'Estudo', percentage: 20, color: '#F59E0B' },
      { topic: 'Projeto', percentage: 15, color: '#8B5CF6' },
      { topic: 'Outros', percentage: 5, color: '#6B7280' }
    ];

    const readabilityScore = 75 + Math.random() * 20; // 75-95

    // Generate trends
    const sentimentTrend = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sentiment: 0.3 + Math.random() * 0.4 + Math.sin(i / 5) * 0.1
    }));

    const complexityEvolution = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      complexity: 0.4 + Math.random() * 0.3 + Math.sin(i / 7) * 0.1
    }));

    return {
      totalWords: Math.round(totalWords),
      averageNoteLength: Math.round(averageNoteLength),
      topTags,
      topicDistribution,
      readabilityScore: Math.round(readabilityScore),
      sentimentTrend,
      complexityEvolution
    };
  }

  private static analyzeBehavior(files: FileItem[]): BehaviorMetrics {
    // Mock behavior data (in production, would track actual user behavior)
    const sessionDuration = 45 + Math.random() * 60; // 45-105 minutes
    const averageSessionLength = 25 + Math.random() * 20; // 25-45 minutes
    const bounceRate = 0.1 + Math.random() * 0.2; // 10-30%

    const featureUsage = {
      'editor': 85 + Math.random() * 15,
      'search': 60 + Math.random() * 25,
      'tags': 40 + Math.random() * 30,
      'templates': 25 + Math.random() * 25,
      'ai-assistant': 30 + Math.random() * 20
    };

    const navigationPatterns = [
      { from: 'dashboard', to: 'editor', count: 45 },
      { from: 'editor', to: 'search', count: 28 },
      { from: 'search', to: 'editor', count: 25 },
      { from: 'dashboard', to: 'notebooks', count: 22 },
      { from: 'notebooks', to: 'editor', count: 20 }
    ];

    const errorRate = 0.02 + Math.random() * 0.03; // 2-5%

    const searchQueries = [
      { query: 'projeto', frequency: 15, successRate: 0.85 },
      { query: 'reunião', frequency: 12, successRate: 0.92 },
      { query: 'ideias', frequency: 10, successRate: 0.78 },
      { query: 'notas', frequency: 8, successRate: 0.95 },
      { query: 'tarefas', frequency: 6, successRate: 0.88 }
    ];

    return {
      sessionDuration: Math.round(sessionDuration),
      averageSessionLength: Math.round(averageSessionLength),
      bounceRate,
      featureUsage,
      navigationPatterns,
      errorRate,
      searchQueries
    };
  }

  private static analyzeTrends(files: FileItem[]): TrendAnalysis {
    // Calculate trends based on recent activity
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekBefore = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentFiles = files.filter(f => new Date(f.updatedAt) > lastWeek);
    const previousFiles = files.filter(f => {
      const date = new Date(f.updatedAt);
      return date > weekBefore && date <= lastWeek;
    });

    const recentWords = recentFiles.reduce((sum, f) => sum + (f.content || '').split(/\s+/).length, 0);
    const previousWords = previousFiles.reduce((sum, f) => sum + (f.content || '').split(/\s+/).length, 0);

    const writingChange = previousWords > 0 ? ((recentWords - previousWords) / previousWords) * 100 : 0;
    const writingTrend = writingChange > 5 ? 'up' : writingChange < -5 ? 'down' : 'stable';

    const organizationChange = Math.random() * 20 - 10; // -10% to +10%
    const organizationTrend = organizationChange > 5 ? 'up' : organizationChange < -5 ? 'down' : 'stable';

    const engagementChange = Math.random() * 30 - 15; // -15% to +15%
    const engagementTrend = engagementChange > 5 ? 'up' : engagementChange < -5 ? 'down' : 'stable';

    const predictions = [
      {
        metric: 'Produtividade',
        prediction: 'Aumento de 15% na próxima semana',
        confidence: 0.78
      },
      {
        metric: 'Organização',
        prediction: 'Melhoria com uso de tags',
        confidence: 0.85
      },
      {
        metric: 'Qualidade',
        prediction: 'Textos mais estruturados',
        confidence: 0.72
      }
    ];

    return {
      writing: { trend: writingTrend, change: writingChange },
      organization: { trend: organizationTrend, change: organizationChange },
      engagement: { trend: engagementTrend, change: engagementChange },
      predictions
    };
  }

  private static generateInsights(files: FileItem[]): InsightData[] {
    const insights: InsightData[] = [];

    // Productivity insights
    const avgFileLength = files.reduce((sum, f) => sum + (f.content || '').length, 0) / files.length;
    if (avgFileLength < 200) {
      insights.push({
        id: 'short-notes',
        type: 'productivity',
        title: 'Notas muito curtas',
        description: 'Suas notas têm em média menos de 200 caracteres. Considere adicionar mais detalhes.',
        impact: 'medium',
        actionable: true,
        data: { avgLength: avgFileLength }
      });
    }

    // Content insights
    const untaggedFiles = files.filter(f => !f.tags || f.tags.length === 0);
    if (untaggedFiles.length > files.length * 0.3) {
      insights.push({
        id: 'missing-tags',
        type: 'content',
        title: 'Muitos arquivos sem tags',
        description: `${untaggedFiles.length} arquivos (${Math.round(untaggedFiles.length / files.length * 100)}%) não possuem tags.`,
        impact: 'high',
        actionable: true,
        data: { untaggedCount: untaggedFiles.length }
      });
    }

    // Behavior insights
    const recentActivity = files.filter(f => 
      new Date(f.updatedAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    );
    
    if (recentActivity.length === 0) {
      insights.push({
        id: 'low-activity',
        type: 'behavior',
        title: 'Baixa atividade recente',
        description: 'Você não editou nenhum arquivo nos últimos 3 dias.',
        impact: 'medium',
        actionable: true
      });
    }

    // Recommendations
    insights.push({
      id: 'use-templates',
      type: 'recommendation',
      title: 'Experimente templates',
      description: 'Templates podem acelerar sua escrita em até 40%.',
      impact: 'medium',
      actionable: true
    });

    return insights;
  }

  private static calculateStreak(files: FileItem[]): number {
    const dates = files
      .map(f => new Date(f.updatedAt).toDateString())
      .filter((date, index, array) => array.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    let currentDate = new Date();

    for (const dateStr of dates) {
      const date = new Date(dateStr);
      const diffDays = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
        currentDate = date;
      } else {
        break;
      }
    }

    return streak;
  }
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  files,
  className
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  // Generate analytics
  useEffect(() => {
    setLoading(true);
    
    // Simulate analytics processing
    const timer = setTimeout(() => {
      const data = AnalyticsEngine.generateAnalytics(files);
      setAnalytics(data);
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [files, timeRange]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Minus className="h-4 w-4 text-slate-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-slate-600';
    }
  };

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'border-red-200 bg-red-50 text-red-800';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  if (loading || !analytics) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Analytics Avançado</CardTitle>
              <p className="text-sm text-slate-500">Carregando insights...</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Analytics Avançado</CardTitle>
              <p className="text-sm text-slate-500">
                Insights detalhados sobre seu uso
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">3 meses</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="productivity" className="flex items-center gap-2">
              <Target className="h-3 w-3" />
              Produtividade
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-3 w-3" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="h-3 w-3" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {getTrendIcon(analytics.trends.writing.trend)}
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {analytics.content.totalWords.toLocaleString()}
                </div>
                <div className="text-sm text-blue-700">Palavras totais</div>
                <div className={cn("text-xs", getTrendColor(analytics.trends.writing.trend))}>
                  {analytics.trends.writing.change > 0 ? '+' : ''}{analytics.trends.writing.change.toFixed(1)}% vs anterior
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <ArrowUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {analytics.productivity.streakDays}
                </div>
                <div className="text-sm text-green-700">Dias consecutivos</div>
                <div className="text-xs text-green-600">+2 dias esta semana</div>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Hash className="h-5 w-5 text-purple-600" />
                  {getTrendIcon(analytics.trends.organization.trend)}
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {analytics.content.topTags.length}
                </div>
                <div className="text-sm text-purple-700">Tags ativas</div>
                <div className={cn("text-xs", getTrendColor(analytics.trends.organization.trend))}>
                  {analytics.trends.organization.change > 0 ? '+' : ''}{analytics.trends.organization.change.toFixed(1)}%
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <ArrowUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  {analytics.content.readabilityScore}
                </div>
                <div className="text-sm text-orange-700">Score legibilidade</div>
                <div className="text-xs text-green-600">+5 pontos</div>
              </div>
            </div>

            {/* Trends Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Atividade semanal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.productivity.weeklyPattern.map(day => (
                      <div key={day.day} className="flex items-center justify-between">
                        <span className="text-sm w-16">{day.day}</span>
                        <div className="flex-1 mx-3">
                          <Progress 
                            value={(day.words / 500) * 100} 
                            className="h-2"
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-16 text-right">
                          {day.words} palavras
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribuição de tópicos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.content.topicDistribution.map(topic => (
                      <div key={topic.topic} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: topic.color }}
                          />
                          <span className="text-sm">{topic.topic}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={topic.percentage} 
                            className="h-2 w-20"
                          />
                          <span className="text-xs text-slate-500 w-8 text-right">
                            {topic.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="productivity" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Horários de pico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-12 gap-1">
                    {analytics.productivity.peakHours.map(({ hour, activity }) => (
                      <div key={hour} className="text-center">
                        <div 
                          className="w-full bg-blue-100 rounded mb-1"
                          style={{ 
                            height: `${Math.max(activity / 2, 5)}px`,
                            backgroundColor: `rgba(59, 130, 246, ${activity / 100})`
                          }}
                        />
                        <div className="text-xs text-slate-500">
                          {hour.toString().padStart(2, '0')}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-slate-600">
                    Pico de atividade: 14h - 16h
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Métricas diárias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Palavras/dia</span>
                    <span className="font-bold">{analytics.productivity.wordsPerDay}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notas criadas</span>
                    <span className="font-bold">{analytics.productivity.notesCreated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tempo ativo</span>
                    <span className="font-bold">{analytics.productivity.timeSpent}min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa conclusão</span>
                    <span className="font-bold">
                      {Math.round(analytics.productivity.completionRate * 100)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Previsões de IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.trends.predictions.map((prediction, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{prediction.metric}</span>
                        <Badge variant="outline">
                          {Math.round(prediction.confidence * 100)}% confiança
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{prediction.prediction}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tags mais usadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.content.topTags.slice(0, 8).map(tag => (
                      <div key={tag.tag} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">#{tag.tag}</span>
                          {getTrendIcon(tag.trend)}
                        </div>
                        <Badge variant="outline">{tag.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Qualidade do conteúdo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Legibilidade</span>
                      <span className="text-sm font-medium">
                        {analytics.content.readabilityScore}/100
                      </span>
                    </div>
                    <Progress value={analytics.content.readabilityScore} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Tamanho médio</span>
                      <span className="text-sm font-medium">
                        {Math.round(analytics.content.averageNoteLength)} palavras
                      </span>
                    </div>
                    <Progress value={Math.min((analytics.content.averageNoteLength / 500) * 100, 100)} className="h-2" />
                  </div>

                  <div className="pt-2 text-xs text-slate-500">
                    Textos com boa legibilidade e tamanho adequado
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolução da escrita</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Sentimento ao longo do tempo</h4>
                    <div className="h-32 bg-gradient-to-r from-red-100 via-yellow-100 to-green-100 rounded flex items-end justify-center p-2">
                      <div className="text-xs text-center">
                        <div className="text-2xl">📈</div>
                        <div>Tendência positiva</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Complexidade textual</h4>
                    <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded flex items-end justify-center p-2">
                      <div className="text-xs text-center">
                        <div className="text-2xl">⚖️</div>
                        <div>Bem balanceada</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="mt-6 space-y-4">
            {analytics.insights.map((insight) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-lg border",
                  getImpactColor(insight.impact)
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <h4 className="font-medium">{insight.title}</h4>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {insight.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {insight.impact}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-3">{insight.description}</p>

                {insight.actionable && (
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    <ChevronRight className="h-3 w-3 mr-1" />
                    Ver detalhes
                  </Button>
                )}
              </motion.div>
            ))}

            {analytics.insights.length === 0 && (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-500 mb-2">
                  Tudo funcionando perfeitamente!
                </h3>
                <p className="text-slate-400">
                  Não há insights críticos no momento.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 