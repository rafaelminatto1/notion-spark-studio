import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  FileText, 
  Users, 
  Activity,
  Target,
  Calendar,
  Eye,
  Edit3,
  MessageCircle,
  Tag,
  Zap,
  Brain,
  Star,
  Hash,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FileItem } from '@/types';
import { cn } from '@/lib/utils';
import { format, subDays, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkspaceAnalyticsProps {
  files: FileItem[];
  userActivity: ActivityEvent[];
  collaborationData?: CollaborationMetrics;
  className?: string;
}

interface ActivityEvent {
  id: string;
  type: 'create' | 'edit' | 'view' | 'delete' | 'comment' | 'collaborate';
  fileId: string;
  fileName: string;
  timestamp: Date;
  duration?: number; // in seconds
  userId: string;
  metadata?: {
    wordsAdded?: number;
    wordsRemoved?: number;
    charactersTyped?: number;
    collaborators?: string[];
    [key: string]: any;
  };
}

interface CollaborationMetrics {
  activeUsers: number;
  totalCollaborations: number;
  averageSessionDuration: number;
  conflictsResolved: number;
  commentsExchanged: number;
}

interface AnalyticsData {
  totalFiles: number;
  totalWords: number;
  avgWordsPerFile: number;
  totalTags: number;
  mostUsedTags: { tag: string; count: number }[];
  dailyActivity: { date: string; events: number; words: number }[];
  fileTypes: { type: string; count: number }[];
  productivityScore: number;
  weeklyTrend: number;
  topFiles: { file: FileItem; views: number; edits: number }[];
  timeSpentWriting: number;
  focusTime: number;
  distractionEvents: number;
  collaborationScore: number;
}

export const WorkspaceAnalytics: React.FC<WorkspaceAnalyticsProps> = ({
  files,
  userActivity,
  collaborationData,
  className
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Calculate analytics data
  const calculateAnalytics = useMemo(() => {
    const daysCount = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const startDate = subDays(new Date(), daysCount);
    
    // Filter recent activity
    const recentActivity = userActivity.filter(event => 
      isAfter(event.timestamp, startDate)
    );

    // Calculate basic metrics
    const totalFiles = files.filter(f => f.type === 'file').length;
    const totalWords = files.reduce((acc, file) => {
      if (file.content) {
        return acc + file.content.split(/\s+/).filter(word => word.length > 0).length;
      }
      return acc;
    }, 0);

    const avgWordsPerFile = totalFiles > 0 ? Math.round(totalWords / totalFiles) : 0;

    // Tag analysis
    const allTags = files.flatMap(file => file.tags || []);
    const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

    const mostUsedTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Daily activity analysis
    const dailyActivity: { date: string; events: number; words: number }[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayEvents = recentActivity.filter(event => 
        event.timestamp >= dayStart && event.timestamp < dayEnd
      );

      const dayWords = dayEvents.reduce((acc, event) => {
        return acc + (event.metadata?.wordsAdded ?? 0);
      }, 0);

      dailyActivity.push({
        date: format(date, 'MMM dd', { locale: ptBR }),
        events: dayEvents.length,
        words: dayWords
      });
    }

    // File type analysis
    const fileTypes = [
      { type: 'Documento', count: files.filter(f => f.type === 'file').length },
      { type: 'Database', count: files.filter(f => f.type === 'database').length },
      { type: 'Pasta', count: files.filter(f => f.type === 'folder').length }
    ].filter(ft => ft.count > 0);

    // Calculate productivity score (0-100)
    const editEvents = recentActivity.filter(e => e.type === 'edit').length;
    const createEvents = recentActivity.filter(e => e.type === 'create').length;
    const avgDailyEvents = recentActivity.length / daysCount;
    const avgWordsPerDay = dailyActivity.reduce((acc, day) => acc + day.words, 0) / daysCount;
    
    const productivityScore = Math.min(100, Math.round(
      (editEvents * 2 + createEvents * 5 + avgWordsPerDay / 10) / 2
    ));

    // Calculate weekly trend
    const halfPoint = Math.floor(daysCount / 2);
    const firstHalf = dailyActivity.slice(0, halfPoint);
    const secondHalf = dailyActivity.slice(halfPoint);
    
    const firstHalfAvg = firstHalf.reduce((acc, day) => acc + day.events, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((acc, day) => acc + day.events, 0) / secondHalf.length;
    
    const weeklyTrend = secondHalfAvg > firstHalfAvg ? 
      Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100) : 
      -Math.round(((firstHalfAvg - secondHalfAvg) / firstHalfAvg) * 100);

    // Top files analysis
    const fileActivity = files.map(file => {
      const fileEvents = recentActivity.filter(e => e.fileId === file.id);
      const views = fileEvents.filter(e => e.type === 'view').length;
      const edits = fileEvents.filter(e => e.type === 'edit').length;
      
      return { file, views, edits, total: views + edits * 2 };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

    // Time analysis
    const timeSpentWriting = recentActivity
      .filter(e => e.type === 'edit')
      .reduce((acc, event) => acc + (event.duration || 0), 0);

    const focusTime = recentActivity
      .filter(e => e.duration && e.duration > 300) // Sessions longer than 5 minutes
      .reduce((acc, event) => acc + (event.duration || 0), 0);

    const distractionEvents = recentActivity
      .filter(e => e.duration && e.duration < 60) // Very short sessions
      .length;

    // Collaboration score
    const collaborationScore = collaborationData ? Math.min(100, Math.round(
      (collaborationData.totalCollaborations * 10 + 
       collaborationData.commentsExchanged * 2 + 
       collaborationData.activeUsers * 15) / 3
    )) : 0;

    return {
      totalFiles,
      totalWords,
      avgWordsPerFile,
      totalTags: allTags.length,
      mostUsedTags,
      dailyActivity,
      fileTypes,
      productivityScore,
      weeklyTrend,
      topFiles: fileActivity,
      timeSpentWriting: Math.round(timeSpentWriting / 60), // Convert to minutes
      focusTime: Math.round(focusTime / 60), // Convert to minutes
      distractionEvents,
      collaborationScore
    };
  }, [files, userActivity, selectedPeriod, collaborationData]);

  useEffect(() => {
    setAnalytics(calculateAnalytics);
  }, [calculateAnalytics]);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    color = "blue" 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: number;
    color?: string;
  }) => (
    <Card className="bg-workspace-surface border-workspace-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-${color}-500/20`}>
            <Icon className={`h-5 w-5 text-${color}-400`} />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <TrendingUp className={cn(
              "h-3 w-3",
              trend >= 0 ? "text-green-400" : "text-red-400 rotate-180"
            )} />
            <span className={cn(
              trend >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {Math.abs(trend)}% vs período anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">📊 Analytics do Workspace</h2>
          <p className="text-gray-400">Insights sobre sua produtividade e uso</p>
        </div>
        
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(period => (
            <button
              key={period}
              onClick={() => { setSelectedPeriod(period); }}
              className={cn(
                "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                selectedPeriod === period
                  ? "bg-blue-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-workspace-surface"
              )}
            >
              {period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Arquivos Criados"
          value={analytics.totalFiles}
          icon={FileText}
          color="blue"
        />
        <MetricCard
          title="Palavras Escritas"
          value={analytics.totalWords.toLocaleString()}
          subtitle={`${analytics.avgWordsPerFile} por arquivo`}
          icon={Edit3}
          color="green"
        />
        <MetricCard
          title="Score de Produtividade"
          value={`${analytics.productivityScore}%`}
          icon={Target}
          trend={analytics.weeklyTrend}
          color="purple"
        />
        <MetricCard
          title="Tempo Focado"
          value={`${analytics.focusTime}min`}
          subtitle={`${analytics.timeSpentWriting}min escrevendo`}
          icon={Clock}
          color="orange"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="collaboration">Colaboração</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Daily Activity Chart */}
          <Card className="bg-workspace-surface border-workspace-border">
            <CardHeader>
              <CardTitle className="text-white">Atividade Diária</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {analytics.dailyActivity.map((day, index) => (
                    <div key={index} className="text-center">
                      <div 
                        className="w-full bg-blue-500/20 rounded mb-1"
                        style={{ 
                          height: `${Math.max(20, (day.events / Math.max(...analytics.dailyActivity.map(d => d.events))) * 80)}px`
                        }}
                      />
                      <div className="text-xs text-gray-400">{day.date}</div>
                      <div className="text-xs text-white">{day.events}</div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Eventos por dia</span>
                  <span className="text-white">
                    Média: {Math.round(analytics.dailyActivity.reduce((acc, day) => acc + day.events, 0) / analytics.dailyActivity.length)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Files */}
          <Card className="bg-workspace-surface border-workspace-border">
            <CardHeader>
              <CardTitle className="text-white">Arquivos Mais Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topFiles.map((item, index) => (
                  <div key={item.file.id} className="flex items-center justify-between p-3 bg-workspace-surface/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded bg-blue-500/20 text-blue-400 text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{item.file.name}</div>
                        <div className="text-xs text-gray-400">
                          {item.views} visualizações • {item.edits} edições
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        <Eye className="h-3 w-3 mr-1" />
                        {item.views}
                      </Badge>
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        <Edit3 className="h-3 w-3 mr-1" />
                        {item.edits}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {/* Activity Patterns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-workspace-surface border-workspace-border">
              <CardHeader>
                <CardTitle className="text-white">Padrões de Trabalho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Sessões de Foco</span>
                    <span className="text-white">{Math.floor(analytics.focusTime / 30)} sessões</span>
                  </div>
                  <Progress value={(analytics.focusTime / (analytics.focusTime + analytics.distractionEvents * 2)) * 100} />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Distrações</span>
                    <span className="text-white">{analytics.distractionEvents} eventos</span>
                  </div>
                  <Progress value={Math.min(100, (analytics.distractionEvents / 10) * 100)} className="bg-red-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-workspace-surface border-workspace-border">
              <CardHeader>
                <CardTitle className="text-white">Tipos de Arquivo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.fileTypes.map((type, index) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple'][index]}-500`} />
                        <span className="text-gray-300">{type.type}</span>
                      </div>
                      <span className="text-white">{type.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          {/* Tags Analysis */}
          <Card className="bg-workspace-surface border-workspace-border">
            <CardHeader>
              <CardTitle className="text-white">Tags Mais Usadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analytics.mostUsedTags.map((tag, index) => (
                  <Badge 
                    key={tag.tag} 
                    variant="outline" 
                    className={cn(
                      "text-sm",
                      index === 0 ? "border-gold text-yellow-400" :
                      index === 1 ? "border-silver text-gray-300" :
                      index === 2 ? "border-bronze text-orange-400" :
                      "border-gray-500 text-gray-400"
                    )}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag.tag} ({tag.count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Quality */}
          <Card className="bg-workspace-surface border-workspace-border">
            <CardHeader>
              <CardTitle className="text-white">Qualidade do Conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-workspace-surface/50 rounded-lg">
                  <div className="text-2xl font-bold text-white">{analytics.avgWordsPerFile}</div>
                  <div className="text-sm text-gray-400">Palavras por arquivo</div>
                </div>
                <div className="text-center p-4 bg-workspace-surface/50 rounded-lg">
                  <div className="text-2xl font-bold text-white">{analytics.totalTags}</div>
                  <div className="text-sm text-gray-400">Total de tags</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-4">
          {collaborationData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Usuários Ativos"
                  value={collaborationData.activeUsers}
                  icon={Users}
                  color="green"
                />
                <MetricCard
                  title="Colaborações"
                  value={collaborationData.totalCollaborations}
                  icon={Activity}
                  color="blue"
                />
                <MetricCard
                  title="Score de Colaboração"
                  value={`${analytics.collaborationScore}%`}
                  icon={Star}
                  color="purple"
                />
              </div>

              <Card className="bg-workspace-surface border-workspace-border">
                <CardHeader>
                  <CardTitle className="text-white">Métricas de Colaboração</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Duração Média da Sessão</span>
                        <span className="text-white">{Math.round(collaborationData.averageSessionDuration / 60)}min</span>
                      </div>
                      <Progress value={Math.min(100, (collaborationData.averageSessionDuration / 1800) * 100)} />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Comentários Trocados</span>
                        <span className="text-white">{collaborationData.commentsExchanged}</span>
                      </div>
                      <Progress value={Math.min(100, (collaborationData.commentsExchanged / 50) * 100)} />
                    </div>
                  </div>

                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 font-medium">
                        {collaborationData.conflictsResolved} conflitos resolvidos automaticamente
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-workspace-surface border-workspace-border">
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400 opacity-50" />
                <p className="text-gray-400">Dados de colaboração não disponíveis</p>
                <p className="text-sm text-gray-500 mt-1">
                  Ative a colaboração para ver métricas de trabalho em equipe
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 