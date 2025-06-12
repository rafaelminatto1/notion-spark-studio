import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Clock,
  Activity,
  Target,
  Zap,
  Eye,
  MessageSquare,
  Download,
  Settings,
  Calendar,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Tipos para analytics
interface UsageMetric {
  id: string;
  name: string;
  value: number;
  change: number; // porcentagem de mudança
  trend: 'up' | 'down' | 'stable';
  period: string;
}

interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

interface CollaborationMetric {
  activeUsers: number;
  documentsShared: number;
  commentsTotal: number;
  realTimeCollabs: number;
  averageResponseTime: number;
}

interface PerformanceMetric {
  avgLoadTime: number;
  searchLatency: number;
  syncLatency: number;
  errorRate: number;
  uptime: number;
}

interface UserBehaviorData {
  mostUsedFeatures: Array<{ name: string; usage: number; growth: number }>;
  timeDistribution: Array<{ hour: number; activity: number }>;
  navigationPatterns: Array<{ from: string; to: string; count: number }>;
  deviceBreakdown: Array<{ device: string; percentage: number; color: string }>;
}

interface AnalyticsData {
  overview: UsageMetric[];
  collaboration: CollaborationMetric;
  performance: PerformanceMetric;
  userBehavior: UserBehaviorData;
  timeSeriesData: {
    activeUsers: TimeSeriesData[];
    documentsCreated: TimeSeriesData[];
    collaborationEvents: TimeSeriesData[];
  };
}

interface AdvancedAnalyticsProps {
  className?: string;
  timeRange?: '24h' | '7d' | '30d' | '90d';
  onTimeRangeChange?: (range: '24h' | '7d' | '30d' | '90d') => void;
}

// Dados mock para demonstração
const generateMockData = (timeRange: string): AnalyticsData => {
  const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  return {
    overview: [
      {
        id: 'active_users',
        name: 'Usuários Ativos',
        value: 1247,
        change: 12.5,
        trend: 'up',
        period: timeRange
      },
      {
        id: 'documents_created',
        name: 'Documentos Criados',
        value: 342,
        change: 8.3,
        trend: 'up',
        period: timeRange
      },
      {
        id: 'collaboration_sessions',
        name: 'Sessões de Colaboração',
        value: 89,
        change: -3.2,
        trend: 'down',
        period: timeRange
      },
      {
        id: 'avg_session_time',
        name: 'Tempo Médio de Sessão',
        value: 24.5,
        change: 5.7,
        trend: 'up',
        period: timeRange
      }
    ],
    collaboration: {
      activeUsers: 156,
      documentsShared: 78,
      commentsTotal: 423,
      realTimeCollabs: 34,
      averageResponseTime: 1.2
    },
    performance: {
      avgLoadTime: 2.3,
      searchLatency: 0.8,
      syncLatency: 0.15,
      errorRate: 0.02,
      uptime: 99.8
    },
    userBehavior: {
      mostUsedFeatures: [
        { name: 'Editor de Texto', usage: 89, growth: 5.2 },
        { name: 'Busca Global', usage: 76, growth: 12.1 },
        { name: 'Templates', usage: 68, growth: -2.3 },
        { name: 'Colaboração', usage: 45, growth: 18.9 },
        { name: 'Graph View', usage: 34, growth: 25.6 }
      ],
      timeDistribution: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        activity: Math.random() * 100 + (i >= 9 && i <= 17 ? 50 : 0)
      })),
      navigationPatterns: [
        { from: 'Dashboard', to: 'Editor', count: 234 },
        { from: 'Editor', to: 'Templates', count: 156 },
        { from: 'Search', to: 'Document', count: 198 },
        { from: 'Dashboard', to: 'Graph View', count: 89 },
        { from: 'Templates', to: 'Editor', count: 167 }
      ],
      deviceBreakdown: [
        { device: 'Desktop', percentage: 68, color: '#3B82F6' },
        { device: 'Mobile', percentage: 22, color: '#10B981' },
        { device: 'Tablet', percentage: 10, color: '#F59E0B' }
      ]
    },
    timeSeriesData: {
      activeUsers: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: Math.floor(Math.random() * 200 + 800 + i * 5)
      })),
      documentsCreated: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: Math.floor(Math.random() * 50 + 20)
      })),
      collaborationEvents: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: Math.floor(Math.random() * 30 + 10)
      }))
    }
  };
};

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  className,
  timeRange = '7d',
  onTimeRangeChange
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(generateMockData(timeRange));

  // Refresh data when time range changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setAnalyticsData(generateMockData(timeRange));
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [timeRange]);

  const refreshData = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setAnalyticsData(generateMockData(timeRange));
      setIsLoading(false);
    }, 1000);
  }, [timeRange]);

  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [analyticsData, timeRange]);

  const MetricCard: React.FC<{ metric: UsageMetric }> = ({ metric }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{metric.name}</p>
            <p className="text-2xl font-bold text-gray-900">
              {metric.id === 'avg_session_time' ? `${metric.value} min` : metric.value.toLocaleString()}
            </p>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            metric.trend === 'up' ? 'bg-green-100 text-green-700' :
            metric.trend === 'down' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          )}>
            {metric.trend === 'up' ? <TrendingUp className="h-3 w-3" /> :
             metric.trend === 'down' ? <TrendingDown className="h-3 w-3" /> :
             <Target className="h-3 w-3" />}
            {Math.abs(metric.change)}%
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("advanced-analytics p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Avançado</h1>
          <p className="text-gray-600">Insights detalhados sobre uso e performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 horas</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
          
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-lg shadow-lg">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
              <span className="text-sm font-medium">Carregando dados...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="collaboration">Colaboração</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="behavior">Comportamento</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analyticsData.overview.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Users Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usuários Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.timeSeriesData.activeUsers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Documents Created Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos Criados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.timeSeriesData.documentsCreated}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Collaboration Tab */}
        <TabsContent value="collaboration" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Usuários Colaborando</p>
                    <p className="text-2xl font-bold">{analyticsData.collaboration.activeUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total de Comentários</p>
                    <p className="text-2xl font-bold">{analyticsData.collaboration.commentsTotal}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Tempo de Resposta</p>
                    <p className="text-2xl font-bold">{analyticsData.collaboration.averageResponseTime}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Collaboration Events Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Colaboração</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.timeSeriesData.collaborationEvents}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tempo de Carregamento</p>
                    <p className="text-2xl font-bold">{analyticsData.performance.avgLoadTime}s</p>
                  </div>
                  <Zap className={cn(
                    "h-8 w-8",
                    analyticsData.performance.avgLoadTime < 3 ? "text-green-500" : "text-orange-500"
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Uptime</p>
                    <p className="text-2xl font-bold">{analyticsData.performance.uptime}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taxa de Erro</p>
                    <p className="text-2xl font-bold">{(analyticsData.performance.errorRate * 100).toFixed(2)}%</p>
                  </div>
                  <Target className={cn(
                    "h-8 w-8",
                    analyticsData.performance.errorRate < 0.05 ? "text-green-500" : "text-red-500"
                  )} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Used Features */}
            <Card>
              <CardHeader>
                <CardTitle>Funcionalidades Mais Usadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.userBehavior.mostUsedFeatures.map((feature, index) => (
                    <div key={feature.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{index + 1}</span>
                        <span className="text-sm">{feature.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{feature.usage}%</span>
                        <Badge variant={feature.growth > 0 ? 'default' : 'secondary'}>
                          {feature.growth > 0 ? '+' : ''}{feature.growth}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Dispositivos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.userBehavior.deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                      label={({device, percentage}) => `${device}: ${percentage}%`}
                    >
                      {analyticsData.userBehavior.deviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Atividade por Hora</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analyticsData.userBehavior.timeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="activity" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics; 