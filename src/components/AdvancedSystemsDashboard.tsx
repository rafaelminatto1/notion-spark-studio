import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Users, 
  BarChart3, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Cpu,
  Network,
  Eye,
  Target,
  Sparkles
} from 'lucide-react';
import { useAIPerformanceOptimizer } from '@/hooks/useAIPerformanceOptimizer';
import { useRealTimeCollaboration } from '@/hooks/useRealTimeCollaboration';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';

interface SystemStatus {
  name: string;
  status: 'operational' | 'warning' | 'critical' | 'offline';
  uptime: number;
  lastUpdate: number;
}

export function AdvancedSystemsDashboard() {
  const [refreshRate, setRefreshRate] = useState(5000);
  const [systemsStatus, setSystemsStatus] = useState<SystemStatus[]>([
    { name: 'AI Optimizer', status: 'operational', uptime: 99.9, lastUpdate: Date.now() },
    { name: 'Collaboration', status: 'operational', uptime: 98.5, lastUpdate: Date.now() },
    { name: 'Analytics', status: 'operational', uptime: 99.7, lastUpdate: Date.now() }
  ]);

  // Hooks para os sistemas avançados
  const aiOptimizer = useAIPerformanceOptimizer({
    enabled: true,
    autoApply: true,
    confidenceThreshold: 0.87,
    learningMode: true
  });

  const collaboration = useRealTimeCollaboration({
    enabled: true,
    wsUrl: 'ws://localhost:3001',
    autoReconnect: true,
    maxReconnectAttempts: 5
  });

  const analytics = useAdvancedAnalytics({
    enabled: true,
    trackingLevel: 'comprehensive',
    autoTrack: true,
    realTimeInsights: true,
    retentionPeriod: 30
  });

  // Simulação de dados em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemsStatus(prev => prev.map(system => ({
        ...system,
        uptime: Math.max(95, system.uptime + (Math.random() - 0.5) * 0.1),
        lastUpdate: Date.now()
      })));
    }, refreshRate);

    return () => { clearInterval(interval); };
  }, [refreshRate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      case 'offline': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'offline': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Advanced Systems Dashboard
          </h1>
          <p className="text-slate-600">
            Monitoramento em tempo real dos sistemas de IA, Colaboração e Analytics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Activity className="h-3 w-3 mr-1" />
            Live Monitoring
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              aiOptimizer.resetLearning();
              analytics.resetAnalytics();
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Reset Systems
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {systemsStatus.map((system, index) => (
          <Card key={system.name} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {system.name}
                </CardTitle>
                <div className={`flex items-center gap-1 ${getStatusColor(system.status)}`}>
                  {getStatusIcon(system.status)}
                  <span className="text-xs capitalize">{system.status}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Uptime</span>
                  <span className="font-semibold">{system.uptime.toFixed(1)}%</span>
                </div>
                <Progress value={system.uptime} className="h-2" />
                <p className="text-xs text-slate-500">
                  Updated {Math.round((Date.now() - system.lastUpdate) / 1000)}s ago
                </p>
              </div>
            </CardContent>
            <div className={`absolute inset-x-0 bottom-0 h-1 ${
              system.status === 'operational' ? 'bg-green-500' :
              system.status === 'warning' ? 'bg-yellow-500' :
              system.status === 'critical' ? 'bg-red-500' : 'bg-gray-500'
            }`} />
          </Card>
        ))}
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* AI Performance Optimizer */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Performance Optimizer
            </CardTitle>
            <CardDescription>
              Sistema de otimização inteligente baseado em machine learning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Optimization Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Optimization Score</span>
                <Badge variant={aiOptimizer.optimizationScore > 70 ? "default" : "secondary"}>
                  {Math.round(aiOptimizer.optimizationScore)}%
                </Badge>
              </div>
              <Progress value={aiOptimizer.optimizationScore} className="h-2" />
            </div>

            {/* User Satisfaction */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">User Satisfaction</span>
                <span className="text-sm font-semibold">
                  {Math.round(aiOptimizer.satisfactionScore)}%
                </span>
              </div>
              <Progress value={aiOptimizer.satisfactionScore} className="h-2" />
            </div>

            <Separator />

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-slate-600">Total Optimizations</p>
                <p className="font-semibold">{aiOptimizer.metrics.totalOptimizations}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-600">Avg Improvement</p>
                <p className="font-semibold">{Math.round(aiOptimizer.improvementPotential)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-600">Bottlenecks</p>
                <p className="font-semibold flex items-center gap-1">
                  {aiOptimizer.metrics.predictedBottlenecks}
                  {aiOptimizer.hasBottlenecks && (
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-600">Learning Mode</p>
                <Badge variant={aiOptimizer.isLearning ? "default" : "secondary"} className="text-xs">
                  {aiOptimizer.isLearning ? 'Active' : 'Idle'}
                </Badge>
              </div>
            </div>

            <Button 
              size="sm" 
              className="w-full"
              onClick={() => aiOptimizer.applyOptimizations()}
            >
              <Zap className="h-4 w-4 mr-2" />
              Apply Optimizations
            </Button>
          </CardContent>
        </Card>

        {/* Real-Time Collaboration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Real-Time Collaboration
            </CardTitle>
            <CardDescription>
              Engine de colaboração com operational transforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status</span>
              <Badge variant={collaboration.isConnected ? "default" : "destructive"}>
                <Network className="h-3 w-3 mr-1" />
                {collaboration.isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>

            {/* Sync Efficiency */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sync Efficiency</span>
                <span className="text-sm font-semibold">
                  {collaboration.syncEfficiency}%
                </span>
              </div>
              <Progress value={collaboration.syncEfficiency} className="h-2" />
            </div>

            <Separator />

            {/* Active Collaborators */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Active Users</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {collaboration.metrics.activeUsers}
                </span>
                <span className="text-sm text-slate-600">online</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-slate-600">Latency</p>
                <p className="font-semibold">{Math.round(collaboration.syncLatency)}ms</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-600">Operations/sec</p>
                <p className="font-semibold">{collaboration.metrics.operationsPerSecond}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-600">Conflicts</p>
                <p className="font-semibold">{collaboration.conflictCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-600">Quality</p>
                <Badge variant="outline" className="text-xs">
                  {collaboration.syncLatency < 100 ? 'good' : 
                   collaboration.syncLatency < 300 ? 'fair' : 'poor'}
                </Badge>
              </div>
            </div>

            <Button 
              size="sm" 
              className="w-full"
              variant={collaboration.isConnected ? "outline" : "default"}
              onClick={() => { collaboration.isConnected ? 
                collaboration.leaveDocument() : 
                collaboration.reconnect(); }
              }
            >
              <Users className="h-4 w-4 mr-2" />
              {collaboration.isConnected ? 'Leave Session' : 'Reconnect'}
            </Button>
          </CardContent>
        </Card>

        {/* Advanced Analytics */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Advanced Analytics
            </CardTitle>
            <CardDescription>
              IA-powered insights e métricas comportamentais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Engagement Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Engagement Level</span>
                <Badge variant={
                  analytics.engagementLevel === 'high' ? "default" :
                  analytics.engagementLevel === 'medium' ? "secondary" : "outline"
                }>
                  {analytics.engagementLevel}
                </Badge>
              </div>
              <Progress value={analytics.metrics.engagementScore * 100} className="h-2" />
            </div>

            {/* Retention Health */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Retention Health</span>
                <Badge variant={
                  analytics.metrics.retentionRate > 0.6 ? "default" :
                  analytics.metrics.retentionRate > 0.3 ? "secondary" : "outline"
                }>
                  {analytics.metrics.retentionRate > 0.6 ? 'good' :
                   analytics.metrics.retentionRate > 0.3 ? 'fair' : 'poor'}
                </Badge>
              </div>
              <Progress value={analytics.metrics.retentionRate * 100} className="h-2" />
            </div>

            <Separator />

            {/* Real-time Events */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Real-time Events</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">
                  {analytics.realtimeEvents}
                </span>
                <span className="text-sm text-slate-600">this session</span>
              </div>
            </div>

            {/* Analytics Metrics */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-slate-600">Active Users</p>
                <p className="font-semibold">{analytics.metrics.activeUsers}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-600">Conversion</p>
                <p className="font-semibold">
                  {(analytics.metrics.conversionRate * 100).toFixed(1)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-600">Bounce Rate</p>
                <p className="font-semibold">
                  {(analytics.metrics.bounceRate * 100).toFixed(1)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-600">Insights</p>
                <p className="font-semibold flex items-center gap-1">
                  {analytics.insights.length}
                  {analytics.criticalInsights.length > 0 && (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  )}
                </p>
              </div>
            </div>

            <Button 
              size="sm" 
              className="w-full"
              onClick={() => { analytics.refreshMetrics(); }}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Insights Panel */}
      {analytics.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-amber-600" />
              AI-Generated Insights
              <Badge variant="secondary">{analytics.insights.length}</Badge>
            </CardTitle>
            <CardDescription>
              Insights automáticos baseados em análise comportamental e performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.insights.slice(0, 6).map((insight) => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border ${
                    insight.impact === 'critical' ? 'border-red-200 bg-red-50' :
                    insight.impact === 'high' ? 'border-amber-200 bg-amber-50' :
                    insight.impact === 'medium' ? 'border-blue-200 bg-blue-50' :
                    'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(insight.confidence * 100)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    {insight.description}
                  </p>
                  {insight.actionable && insight.recommendation && (
                    <div className="mt-3 p-2 bg-white rounded border text-xs">
                      <strong>Recomendação:</strong> {insight.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-slate-500 pt-4">
        <p>
          Dashboard atualizado automaticamente • Próxima atualização em {Math.ceil(refreshRate / 1000)}s
        </p>
      </div>
    </div>
  );
} 