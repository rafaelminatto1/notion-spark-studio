import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Brain,
  AlertCircle,
  CheckCircle,
  Zap,
  Eye,
  Heart,
  Activity,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { advancedAnalytics } from '../../services/AdvancedAnalyticsEngine';
import useAdvancedSystems from '../../hooks/useAdvancedSystems';

interface AnalyticsMetrics {
  activeUsers: number;
  totalSessions: number;
  conversionRate: number;
  engagementScore: number;
  retentionRate: number;
  churnRate: number;
  avgSessionDuration: number;
  bounceRate: number;
}

interface UserSegment {
  name: string;
  size: number;
  growth: number;
  value: number;
  color: string;
}

interface PredictionData {
  metric: string;
  current: number;
  predicted: number;
  confidence: number;
  timeframe: string;
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'anomaly' | 'achievement';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  recommendation: string;
  timestamp: number;
}

export function AdvancedAnalyticsDashboard() {
  const [systemState] = useAdvancedSystems();
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [selectedView, setSelectedView] = useState('overview');
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    activeUsers: 145,
    totalSessions: 1250,
    conversionRate: 12.5,
    engagementScore: 78,
    retentionRate: 85,
    churnRate: 15,
    avgSessionDuration: 485,
    bounceRate: 23
  });

  const [userSegments] = useState<UserSegment[]>([
    { name: 'Power Users', size: 45, growth: 15, value: 2850, color: '#8B5CF6' },
    { name: 'Usuários Novos', size: 32, growth: 28, value: 1240, color: '#3B82F6' },
    { name: 'Usuários Casuais', size: 23, growth: -5, value: 890, color: '#10B981' },
    { name: 'Em Risco', size: 18, growth: -12, value: 450, color: '#F59E0B' },
    { name: 'Inativos', size: 12, growth: -18, value: 120, color: '#EF4444' }
  ]);

  const [predictions] = useState<PredictionData[]>([
    { metric: 'Usuários Ativos', current: 145, predicted: 178, confidence: 87, timeframe: '30 dias' },
    { metric: 'Taxa de Conversão', current: 12.5, predicted: 14.2, confidence: 82, timeframe: '30 dias' },
    { metric: 'Engajamento', current: 78, predicted: 83, confidence: 79, timeframe: '30 dias' },
    { metric: 'Retenção', current: 85, predicted: 88, confidence: 84, timeframe: '30 dias' }
  ]);

  const [aiInsights, setAiInsights] = useState<AIInsight[]>([
    {
      id: '1',
      type: 'opportunity',
      title: 'Potencial de Crescimento Identificado',
      description: 'Usuários novos mostram 28% mais engajamento nos primeiros 3 dias',
      impact: 'high',
      confidence: 89,
      recommendation: 'Implementar onboarding personalizado para maximizar retenção inicial',
      timestamp: Date.now() - 1800000
    },
    {
      id: '2', 
      type: 'risk',
      title: 'Risco de Churn Detectado',
      description: '18 usuários estão em risco de abandonar a plataforma',
      impact: 'medium',
      confidence: 76,
      recommendation: 'Enviar campanhas de reengajamento personalizadas',
      timestamp: Date.now() - 3600000
    },
    {
      id: '3',
      type: 'achievement',
      title: 'Meta de Engajamento Superada',
      description: 'Engajamento aumentou 12% acima da meta mensal',
      impact: 'high',
      confidence: 95,
      recommendation: 'Analisar fatores de sucesso para replicar em outras áreas',
      timestamp: Date.now() - 7200000
    }
  ]);

  // Dados para gráficos
  const [engagementData] = useState([
    { day: 'Seg', users: 120, sessions: 340, engagement: 78 },
    { day: 'Ter', users: 135, sessions: 380, engagement: 82 },
    { day: 'Qua', users: 145, sessions: 420, engagement: 75 },
    { day: 'Qui', users: 158, sessions: 450, engagement: 85 },
    { day: 'Sex', users: 162, sessions: 480, engagement: 88 },
    { day: 'Sab', users: 98, sessions: 220, engagement: 72 },
    { day: 'Dom', users: 89, sessions: 190, engagement: 69 }
  ]);

  const [conversionFunnelData] = useState([
    { stage: 'Visitantes', value: 1000, color: '#3B82F6' },
    { stage: 'Cadastros', value: 450, color: '#10B981' },
    { stage: 'Ativação', value: 280, color: '#F59E0B' },
    { stage: 'Retenção', value: 180, color: '#EF4444' },
    { stage: 'Conversão', value: 125, color: '#8B5CF6' }
  ]);

  const [featureUsageData] = useState([
    { feature: 'Editor', usage: 89, users: 145 },
    { feature: 'Colaboração', usage: 67, users: 98 },
    { feature: 'Templates', usage: 54, users: 78 },
    { feature: 'Busca', usage: 43, users: 62 },
    { feature: 'Exportação', usage: 32, users: 46 },
    { feature: 'Integração', usage: 28, users: 40 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simular atualizações em tempo real
      setMetrics(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + (Math.random() > 0.5 ? 1 : -1),
        totalSessions: prev.totalSessions + Math.floor(Math.random() * 5),
        conversionRate: Math.round((prev.conversionRate + (Math.random() - 0.5) * 0.2) * 10) / 10,
        engagementScore: Math.round(prev.engagementScore + (Math.random() - 0.5) * 2)
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4" />;
      case 'risk': return <AlertCircle className="h-4 w-4" />;
      case 'achievement': return <CheckCircle className="h-4 w-4" />;
      case 'anomaly': return <Zap className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-blue-200 bg-blue-50';
      case 'risk': return 'border-red-200 bg-red-50';
      case 'achievement': return 'border-green-200 bg-green-50';
      case 'anomaly': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      userSegments,
      predictions,
      insights: aiInsights
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedTimeframe}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Avançado com IA</h2>
          <p className="text-muted-foreground">
            Insights inteligentes e análise preditiva do comportamento dos usuários
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 dia</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.activeUsers}</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              +12% vs semana anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.conversionRate}%</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              +0.8% este mês
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engajamento</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.engagementScore}</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              +5 pontos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retenção</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.retentionRate}%</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              +3% este trimestre
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
          <TabsTrigger value="predictions">Predições IA</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Gráfico de Engajamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" />
                  Engajamento Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Funil de Conversão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Funil de Conversão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionFunnelData.map((stage, index) => {
                    const percentage = index === 0 ? 100 : (stage.value / conversionFunnelData[0].value) * 100;
                    return (
                      <div key={stage.stage} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{stage.stage}</span>
                          <span className="font-medium">{stage.value} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Uso de Features */}
            <Card>
              <CardHeader>
                <CardTitle>Uso de Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={featureUsageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usage" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Métricas Detalhadas */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas Detalhadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sessões Totais</span>
                    <span className="font-bold">{metrics.totalSessions.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Duração Média da Sessão</span>
                    <span className="font-bold">{formatDuration(metrics.avgSessionDuration)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Rejeição</span>
                    <span className="font-bold">{metrics.bounceRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Churn</span>
                    <span className="font-bold text-red-600">{metrics.churnRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Segmentos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userSegments}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="size"
                      label={({ name, size }) => `${name}: ${size}%`}
                    >
                      {userSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de Segmentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userSegments.map((segment) => (
                    <div key={segment.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{segment.name}</span>
                        <Badge 
                          variant={segment.growth > 0 ? "default" : "destructive"}
                          className="flex items-center gap-1"
                        >
                          {segment.growth > 0 ? 
                            <TrendingUp className="h-3 w-3" /> : 
                            <TrendingDown className="h-3 w-3" />
                          }
                          {Math.abs(segment.growth)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tamanho:</span>
                          <span className="ml-2 font-medium">{segment.size}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor:</span>
                          <span className="ml-2 font-medium">R$ {segment.value}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {predictions.map((prediction) => (
              <Card key={prediction.metric}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Predição: {prediction.metric}
                  </CardTitle>
                  <CardDescription>
                    Previsão para os próximos {prediction.timeframe}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Valor Atual</span>
                    <span className="font-bold text-2xl">{prediction.current}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Valor Previsto</span>
                    <span className="font-bold text-2xl text-green-600">{prediction.predicted}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Confiança da Predição</span>
                      <span>{prediction.confidence}%</span>
                    </div>
                    <Progress value={prediction.confidence} className="h-2" />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {prediction.predicted > prediction.current ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">
                          +{((prediction.predicted - prediction.current) / prediction.current * 100).toFixed(1)}% projetado
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="text-red-600">
                          {((prediction.predicted - prediction.current) / prediction.current * 100).toFixed(1)}% projetado
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            <AnimatePresence>
              {aiInsights.map((insight) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className={getInsightColor(insight.type)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getInsightIcon(insight.type)}
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {insight.confidence}% confiança
                          </Badge>
                          <Badge variant={
                            insight.impact === 'critical' ? 'destructive' :
                            insight.impact === 'high' ? 'default' :
                            insight.impact === 'medium' ? 'secondary' : 'outline'
                          }>
                            {insight.impact}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">{insight.description}</p>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">Recomendação da IA:</p>
                        <p className="text-sm mt-1">{insight.recommendation}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Gerado há {Math.round((Date.now() - insight.timestamp) / 60000)} minutos</span>
                        <Button variant="ghost" size="sm">
                          Ver detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 