import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Brain,
  Gauge,
  TrendingUp,
  Activity,
  Zap,
  Shield,
  Target,
  Clock,
  Globe,
  BarChart3,
  LineChart,
  PieChart,
  Settings,
  RefreshCw,
  Download,
  Bell,
  ChevronRight,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RealTimeCollaborationDashboard } from '../components/collaboration/RealTimeCollaborationDashboard';
import { AdvancedAnalyticsDashboard } from '../components/analytics/AdvancedAnalyticsDashboard';
import { AIPerformanceDashboard } from '../components/performance/AIPerformanceDashboard';
import useAdvancedSystems from '../hooks/useAdvancedSystems';
import useAIPerformanceOptimizer from '../hooks/useAIPerformanceOptimizer';

interface SystemOverview {
  collaboration: {
    activeUsers: number;
    syncLatency: number;
    conflictsResolved: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  };
  analytics: {
    totalUsers: number;
    conversionRate: number;
    engagementScore: number;
    predictionAccuracy: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  };
  performance: {
    score: number;
    cpu: number;
    memory: number;
    optimizationsApplied: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  };
}

interface SystemAlert {
  id: string;
  system: 'collaboration' | 'analytics' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  action?: string;
}

export function Dashboard() {
  const [systemState] = useAdvancedSystems();
  const { performanceData, isOptimizing } = useAIPerformanceOptimizer();
  
  const [selectedSystem, setSelectedSystem] = useState<string>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [systemOverview, setSystemOverview] = useState<SystemOverview>({
    collaboration: {
      activeUsers: 3,
      syncLatency: 45,
      conflictsResolved: 12,
      status: 'excellent'
    },
    analytics: {
      totalUsers: 145,
      conversionRate: 12.5,
      engagementScore: 78,
      predictionAccuracy: 87,
      status: 'good'
    },
    performance: {
      score: 85,
      cpu: 45,
      memory: 62,
      optimizationsApplied: 8,
      status: 'good'
    }
  });

  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      system: 'performance',
      severity: 'medium',
      title: 'Memory Usage Elevado',
      message: 'Uso de memória chegou a 75%. Otimização automática recomendada.',
      timestamp: Date.now() - 300000,
      resolved: false,
      action: 'optimize'
    },
    {
      id: '2',
      system: 'analytics',
      severity: 'low',
      title: 'Oportunidade de Crescimento',
      message: 'IA detectou potencial de 15% de aumento na conversão.',
      timestamp: Date.now() - 600000,
      resolved: false,
      action: 'analyze'
    },
    {
      id: '3',
      system: 'collaboration',
      severity: 'high',
      title: 'Pico de Atividade',
      message: '8 usuários simultâneos. Sistema funcionando perfeitamente.',
      timestamp: Date.now() - 180000,
      resolved: false,
      action: 'monitor'
    }
  ]);

  // Simulação de dados em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemOverview(prev => ({
        collaboration: {
          ...prev.collaboration,
          activeUsers: Math.max(1, prev.collaboration.activeUsers + (Math.random() > 0.5 ? 1 : -1)),
          syncLatency: Math.max(20, prev.collaboration.syncLatency + (Math.random() - 0.5) * 10),
          conflictsResolved: prev.collaboration.conflictsResolved + (Math.random() > 0.8 ? 1 : 0)
        },
        analytics: {
          ...prev.analytics,
          totalUsers: prev.analytics.totalUsers + Math.floor(Math.random() * 3),
          conversionRate: Math.max(0, prev.analytics.conversionRate + (Math.random() - 0.5) * 0.5),
          engagementScore: Math.max(0, Math.min(100, prev.analytics.engagementScore + (Math.random() - 0.5) * 3)),
          predictionAccuracy: Math.max(70, Math.min(95, prev.analytics.predictionAccuracy + (Math.random() - 0.5) * 2))
        },
        performance: {
          ...prev.performance,
          score: Math.max(70, Math.min(100, prev.performance.score + (Math.random() - 0.5) * 3)),
          cpu: Math.max(20, Math.min(90, prev.performance.cpu + (Math.random() - 0.5) * 8)),
          memory: Math.max(30, Math.min(85, prev.performance.memory + (Math.random() - 0.5) * 5)),
          optimizationsApplied: prev.performance.optimizationsApplied + (Math.random() > 0.9 ? 1 : 0)
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300';
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simular refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const resolveAlert = (alertId: string) => {
    setSystemAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true }
          : alert
      )
    );
  };

  const exportSystemData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      systemOverview,
      alerts: systemAlerts.filter(a => !a.resolved),
      systemState
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-overview-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalScore = Math.round(
    (systemOverview.performance.score + 
     systemOverview.analytics.engagementScore + 
     (100 - systemOverview.collaboration.syncLatency)) / 3
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Principal */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Notion Spark Studio
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Plataforma de Próxima Geração com IA Avançada
            </p>
            <div className="flex items-center gap-4 mt-3">
              <Badge className={`${getStatusColor('excellent')} text-sm px-3 py-1`}>
                Sistema Operacional
              </Badge>
              <Badge variant="outline" className="text-sm">
                Score Global: {totalScore}/100
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                Produção - {new Date().toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={exportSystemData}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              <Badge variant="destructive" className="text-xs">
                {systemAlerts.filter(a => !a.resolved).length}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Score Global e Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Status dos Sistemas</h2>
                  <p className="text-indigo-100">
                    Monitoramento em tempo real de todos os componentes críticos
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{totalScore}</div>
                  <div className="text-indigo-100">Score Global</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6 mt-6">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">Colaboração</span>
                  </div>
                  <div className="text-2xl font-bold">{systemOverview.collaboration.activeUsers}</div>
                  <div className="text-sm text-indigo-100">usuários ativos</div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5" />
                    <span className="font-medium">Analytics IA</span>
                  </div>
                  <div className="text-2xl font-bold">{systemOverview.analytics.predictionAccuracy}%</div>
                  <div className="text-sm text-indigo-100">precisão IA</div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="h-5 w-5" />
                    <span className="font-medium">Performance</span>
                  </div>
                  <div className="text-2xl font-bold">{systemOverview.performance.score}</div>
                  <div className="text-sm text-indigo-100">score performance</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alertas Críticos */}
        {systemAlerts.filter(a => !a.resolved && (a.severity === 'high' || a.severity === 'critical')).length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            {systemAlerts
              .filter(a => !a.resolved && (a.severity === 'high' || a.severity === 'critical'))
              .map((alert) => (
                <Card key={alert.id} className={getSeverityColor(alert.severity)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 mt-0.5 text-orange-500" />
                        <div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {alert.system}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((Date.now() - alert.timestamp) / 60000)} min atrás
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.action && (
                          <Button size="sm" variant="outline">
                            {alert.action === 'optimize' && 'Otimizar'}
                            {alert.action === 'analyze' && 'Analisar'}
                            {alert.action === 'monitor' && 'Monitorar'}
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </motion.div>
        )}

        {/* Métricas Principais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {systemOverview.analytics.totalUsers}
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3" />
                +12% este mês
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {systemOverview.analytics.conversionRate.toFixed(1)}%
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3" />
                +0.8% semana
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latência Sync</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {systemOverview.collaboration.syncLatency}ms
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Excelente performance
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Otimizações IA</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {systemOverview.performance.optimizationsApplied}
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                <Activity className="h-3 w-3" />
                Ativas hoje
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sistemas Detalhados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs value={selectedSystem} onValueChange={setSelectedSystem}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="collaboration">Colaboração</TabsTrigger>
              <TabsTrigger value="analytics">Analytics IA</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Resumo dos Sistemas */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Users className="h-5 w-5" />
                      Colaboração em Tempo Real
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Usuários Ativos</span>
                      <span className="font-bold">{systemOverview.collaboration.activeUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Latência</span>
                      <span className="font-bold">{systemOverview.collaboration.syncLatency}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Conflitos Resolvidos</span>
                      <span className="font-bold">{systemOverview.collaboration.conflictsResolved}</span>
                    </div>
                    <Button 
                      className="w-full mt-3" 
                      onClick={() => setSelectedSystem('collaboration')}
                    >
                      Ver Detalhes
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700">
                      <Brain className="h-5 w-5" />
                      Analytics Avançado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Engajamento</span>
                      <span className="font-bold">{systemOverview.analytics.engagementScore}/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Precisão IA</span>
                      <span className="font-bold">{systemOverview.analytics.predictionAccuracy}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Conversão</span>
                      <span className="font-bold">{systemOverview.analytics.conversionRate.toFixed(1)}%</span>
                    </div>
                    <Button 
                      className="w-full mt-3" 
                      onClick={() => setSelectedSystem('analytics')}
                    >
                      Ver Detalhes
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Gauge className="h-5 w-5" />
                      Performance IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Score Global</span>
                      <span className="font-bold">{systemOverview.performance.score}/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CPU</span>
                      <span className="font-bold">{systemOverview.performance.cpu}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Memória</span>
                      <span className="font-bold">{systemOverview.performance.memory}%</span>
                    </div>
                    <Button 
                      className="w-full mt-3" 
                      onClick={() => setSelectedSystem('performance')}
                    >
                      Ver Detalhes
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Status Geral do Sistema */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Status Geral do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Colaboração</span>
                        <Badge className={getStatusColor(systemOverview.collaboration.status)}>
                          {systemOverview.collaboration.status}
                        </Badge>
                      </div>
                      <Progress value={100 - systemOverview.collaboration.syncLatency} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Analytics</span>
                        <Badge className={getStatusColor(systemOverview.analytics.status)}>
                          {systemOverview.analytics.status}
                        </Badge>
                      </div>
                      <Progress value={systemOverview.analytics.engagementScore} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Performance</span>
                        <Badge className={getStatusColor(systemOverview.performance.status)}>
                          {systemOverview.performance.status}
                        </Badge>
                      </div>
                      <Progress value={systemOverview.performance.score} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="collaboration">
              <RealTimeCollaborationDashboard />
            </TabsContent>

            <TabsContent value="analytics">
              <AdvancedAnalyticsDashboard />
            </TabsContent>

            <TabsContent value="performance">
              <AIPerformanceDashboard />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
} 