import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  Clock, 
  Eye, 
  Edit, 
  Share2,
  Download,
  Upload,
  Activity,
  Target,
  Zap,
  Brain,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Filter,
  Refresh,
  Settings,
  AlertCircle,
  CheckCircle,
  Star,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Tipos para métricas
interface Metric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  category: 'productivity' | 'collaboration' | 'performance' | 'usage' | 'ai';
  description: string;
  target?: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface ChartData {
  id: string;
  name: string;
  data: Array<{
    timestamp: Date;
    value: number;
    label?: string;
  }>;
  type: 'line' | 'bar' | 'area' | 'pie';
  color: string;
}

interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedActions?: string[];
}

interface AdvancedMetricsDashboardProps {
  className?: string;
}

export const AdvancedMetricsDashboard: React.FC<AdvancedMetricsDashboardProps> = ({
  className = ''
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Dados simulados de métricas
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      id: 'documents_created',
      name: 'Documentos Criados',
      value: 142,
      previousValue: 128,
      unit: 'docs',
      trend: 'up',
      changePercentage: 10.9,
      category: 'productivity',
      description: 'Documentos criados nos últimos 7 dias',
      target: 150,
      status: 'good'
    },
    {
      id: 'collaboration_sessions',
      name: 'Sessões de Colaboração',
      value: 87,
      previousValue: 92,
      unit: 'sessões',
      trend: 'down',
      changePercentage: -5.4,
      category: 'collaboration',
      description: 'Sessões colaborativas ativas',
      target: 100,
      status: 'warning'
    },
    {
      id: 'avg_response_time',
      name: 'Tempo de Resposta',
      value: 234,
      previousValue: 312,
      unit: 'ms',
      trend: 'up',
      changePercentage: -25.0,
      category: 'performance',
      description: 'Tempo médio de resposta do sistema',
      target: 200,
      status: 'warning'
    },
    {
      id: 'ai_suggestions_used',
      name: 'Sugestões de IA Utilizadas',
      value: 67,
      previousValue: 45,
      unit: '%',
      trend: 'up',
      changePercentage: 48.9,
      category: 'ai',
      description: 'Taxa de aceitação das sugestões de IA',
      target: 70,
      status: 'excellent'
    },
    {
      id: 'daily_active_users',
      name: 'Usuários Ativos Diários',
      value: 1247,
      previousValue: 1189,
      unit: 'usuários',
      trend: 'up',
      changePercentage: 4.9,
      category: 'usage',
      description: 'Usuários únicos ativos por dia',
      target: 1500,
      status: 'good'
    },
    {
      id: 'storage_usage',
      name: 'Uso de Armazenamento',
      value: 78.5,
      previousValue: 74.2,
      unit: '%',
      trend: 'up',
      changePercentage: 5.8,
      category: 'usage',
      description: 'Percentual de armazenamento utilizado',
      target: 80,
      status: 'warning'
    }
  ]);

  // Dados de gráficos
  const [chartData, setChartData] = useState<ChartData[]>([
    {
      id: 'productivity_trend',
      name: 'Tendência de Produtividade',
      type: 'line',
      color: '#3B82F6',
      data: Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
        value: Math.floor(Math.random() * 50) + 50 + i * 2
      }))
    },
    {
      id: 'collaboration_distribution',
      name: 'Distribuição de Colaboração',
      type: 'pie',
      color: '#10B981',
      data: [
        { timestamp: new Date(), value: 35, label: 'Documentos' },
        { timestamp: new Date(), value: 25, label: 'Reuniões' },
        { timestamp: new Date(), value: 20, label: 'Comentários' },
        { timestamp: new Date(), value: 20, label: 'Reviews' }
      ]
    }
  ]);

  // Insights de IA
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([
    {
      id: 'insight_1',
      type: 'trend',
      title: 'Aumento na Produtividade',
      description: 'Detectamos um aumento de 23% na produtividade da equipe nas últimas 2 semanas, principalmente devido ao uso de templates automáticos.',
      confidence: 0.92,
      impact: 'high',
      actionable: true,
      suggestedActions: ['Expandir uso de templates', 'Treinar equipe em automação']
    },
    {
      id: 'insight_2',
      type: 'anomaly',
      title: 'Pico de Uso de Armazenamento',
      description: 'Houve um aumento anômalo de 15% no uso de armazenamento na última semana, concentrado em arquivos de mídia.',
      confidence: 0.87,
      impact: 'medium',
      actionable: true,
      suggestedActions: ['Revisar política de mídia', 'Implementar compressão automática']
    },
    {
      id: 'insight_3',
      type: 'prediction',
      title: 'Previsão de Crescimento',
      description: 'Com base nos padrões atuais, prevemos que o número de usuários ativos aumentará 35% nos próximos 3 meses.',
      confidence: 0.78,
      impact: 'high',
      actionable: true,
      suggestedActions: ['Planejar escalabilidade', 'Aumentar capacidade de servidores']
    }
  ]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simular atualização de dados
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * 10,
        changePercentage: metric.changePercentage + (Math.random() - 0.5) * 2
      })));
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filtros
  const filteredMetrics = useMemo(() => {
    if (selectedCategory === 'all') return metrics;
    return metrics.filter(metric => metric.category === selectedCategory);
  }, [metrics, selectedCategory]);

  // Métricas agregadas
  const aggregatedStats = useMemo(() => {
    const total = metrics.length;
    const excellent = metrics.filter(m => m.status === 'excellent').length;
    const warning = metrics.filter(m => m.status === 'warning').length;
    const critical = metrics.filter(m => m.status === 'critical').length;

    return {
      total,
      excellent,
      good: total - excellent - warning - critical,
      warning,
      critical,
      healthScore: Math.round(((excellent * 4 + (total - excellent - warning - critical) * 3 + warning * 2 + critical * 1) / (total * 4)) * 100)
    };
  }, [metrics]);

  // Componente de métrica individual
  const MetricCard: React.FC<{ metric: Metric }> = ({ metric }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
        case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'critical': return 'text-red-600 bg-red-50 border-red-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    };

    const getTrendIcon = (trend: string, changePercentage: number) => {
      if (trend === 'up' && changePercentage > 0) {
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      } else if (trend === 'down' && changePercentage < 0) {
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      }
      return <Activity className="h-4 w-4 text-gray-500" />;
    };

    return (
      <motion.div
        className="h-full"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={`h-full border-l-4 ${getStatusColor(metric.status)}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.name}
              </CardTitle>
              {getTrendIcon(metric.trend, metric.changePercentage)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">
                  {metric.value.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  {metric.unit}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge
                  variant={metric.changePercentage > 0 ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {metric.changePercentage > 0 ? '+' : ''}{metric.changePercentage.toFixed(1)}%
                </Badge>
                <span className="text-xs text-gray-500">vs período anterior</span>
              </div>

              {metric.target && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Meta: {metric.target}</span>
                    <span>{Math.round((metric.value / metric.target) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(metric.value / metric.target) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {metric.description}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Gráfico simples (simulado)
  const SimpleChart: React.FC<{ data: ChartData }> = ({ data }) => {
    if (data.type === 'pie') {
      return (
        <div className="space-y-2">
          {data.data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: `hsl(${index * 90}, 70%, 50%)` }}
                />
                <span className="text-sm">{item.label}</span>
              </div>
              <span className="text-sm font-medium">{item.value}%</span>
            </div>
          ))}
        </div>
      );
    }

    const maxValue = Math.max(...data.data.map(d => d.value));
    return (
      <div className="flex items-end space-x-1 h-32">
        {data.data.slice(-20).map((point, index) => (
          <div
            key={index}
            className="flex-1 bg-blue-500 rounded-t min-w-0"
            style={{ 
              height: `${(point.value / maxValue) * 100}%`,
              backgroundColor: data.color
            }}
            title={`${point.value} em ${point.timestamp.toLocaleDateString()}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Dashboard de Métricas Avançadas</span>
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Análise em tempo real do desempenho e produtividade
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Hoje</SelectItem>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="90d">90 dias</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
              >
                <Refresh className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resumo de saúde do sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Saúde Geral do Sistema</span>
            <Badge variant="default" className="ml-2">
              {aggregatedStats.healthScore}% Saudável
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{aggregatedStats.excellent}</div>
              <div className="text-sm text-gray-500">Excelente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{aggregatedStats.good}</div>
              <div className="text-sm text-gray-500">Bom</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{aggregatedStats.warning}</div>
              <div className="text-sm text-gray-500">Atenção</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{aggregatedStats.critical}</div>
              <div className="text-sm text-gray-500">Crítico</div>
            </div>
          </div>
          <Progress value={aggregatedStats.healthScore} className="mt-4" />
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="insights">Insights IA</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          {/* Filtros */}
          <div className="flex items-center space-x-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="productivity">Produtividade</SelectItem>
                <SelectItem value="collaboration">Colaboração</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="usage">Uso</SelectItem>
                <SelectItem value="ai">Inteligência Artificial</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline">{filteredMetrics.length} métricas</Badge>
          </div>

          {/* Grid de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredMetrics.map((metric) => (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <MetricCard metric={metric} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartData.map((chart) => (
              <Card key={chart.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {chart.type === 'line' && <LineChart className="h-4 w-4" />}
                    {chart.type === 'pie' && <PieChart className="h-4 w-4" />}
                    {chart.type === 'bar' && <BarChart3 className="h-4 w-4" />}
                    <span>{chart.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SimpleChart data={chart} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Insights Gerados pela IA</h3>
              <Badge variant="secondary">
                <Brain className="h-3 w-3 mr-1" />
                {aiInsights.length} insights
              </Badge>
            </div>
            
            {aiInsights.map((insight) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`border-l-4 ${
                  insight.impact === 'high' ? 'border-l-red-500' :
                  insight.impact === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        {insight.type === 'trend' && <TrendingUp className="h-4 w-4" />}
                        {insight.type === 'anomaly' && <AlertCircle className="h-4 w-4" />}
                        {insight.type === 'recommendation' && <Star className="h-4 w-4" />}
                        {insight.type === 'prediction' && <Eye className="h-4 w-4" />}
                        <span>{insight.title}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={insight.impact === 'high' ? 'destructive' : 'secondary'}>
                          {insight.impact}
                        </Badge>
                        <Badge variant="outline">
                          {Math.round(insight.confidence * 100)}% confiança
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {insight.description}
                    </p>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Confiança da IA</span>
                        <span>{Math.round(insight.confidence * 100)}%</span>
                      </div>
                      <Progress value={insight.confidence * 100} />
                    </div>

                    {insight.suggestedActions && insight.suggestedActions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Ações Sugeridas:</p>
                        <div className="space-y-1">
                          {insight.suggestedActions.map((action, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-sm">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Automatizados</CardTitle>
              <p className="text-sm text-gray-500">
                Gere relatórios detalhados com base nos dados coletados
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Relatório de Produtividade</span>
                  <span className="text-xs text-gray-500">Últimos 30 dias</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Análise de Colaboração</span>
                  <span className="text-xs text-gray-500">Últimos 7 dias</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  <span>Tendências de Uso</span>
                  <span className="text-xs text-gray-500">Últimos 90 dias</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col">
                  <Brain className="h-6 w-6 mb-2" />
                  <span>Insights de IA</span>
                  <span className="text-xs text-gray-500">Consolidado</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedMetricsDashboard; 