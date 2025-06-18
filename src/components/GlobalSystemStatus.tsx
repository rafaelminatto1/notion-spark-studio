'use client';

import React from 'react';
import { useGlobalSystemStatus } from '@/hooks/useGlobalSystemStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Brain, 
  Database, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  RefreshCw,
  TrendingUp,
  Zap,
  Shield,
  Cpu
} from 'lucide-react';

export const GlobalSystemStatus: React.FC = () => {
  const { 
    isLoading, 
    systemsReady, 
    metrics, 
    health, 
    lastUpdate, 
    refreshMetrics, 
    getSystemSummary, 
    exportMetrics 
  } = useGlobalSystemStatus();

  const handleExport = async () => {
    try {
      const data = await exportMetrics();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-metrics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getHealthColor = (overall: string) => {
    switch (overall) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthIcon = (overall: string) => {
    switch (overall) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Carregando status dos sistemas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card - Overall Status */}
      <Card className={`border-2 ${getHealthColor(health.overall)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getHealthIcon(health.overall)}
              <div>
                <CardTitle className="text-xl">{getSystemSummary()}</CardTitle>
                <CardDescription>
                  Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                </CardDescription>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshMetrics}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Score Geral</span>
                <span className="font-medium">{health.score}/100</span>
              </div>
              <Progress value={health.score} className="h-2" />
            </div>
            
            {health.issues.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Problemas Detectados
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {health.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {health.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Recomendações
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {health.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Performance Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">FPS</span>
              <Badge variant="outline">{metrics.performance.fps.toFixed(1)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Memória</span>
              <Badge variant="outline">{metrics.performance.memory.toFixed(1)} MB</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Load Time</span>
              <Badge variant="outline">{metrics.performance.loadTime.toFixed(0)} ms</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Latência</span>
              <Badge variant="outline">{metrics.performance.networkLatency.toFixed(0)} ms</Badge>
            </div>
          </CardContent>
        </Card>

        {/* AI Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-600" />
              Inteligência Artificial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Predições</span>
              <Badge variant="outline">{metrics.ai.predictions.toLocaleString()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Precisão</span>
              <Badge variant="outline">{metrics.ai.accuracy.toFixed(1)}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Recomendações</span>
              <Badge variant="outline">{metrics.ai.recommendations}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Taxa de Aprendizado</span>
              <Badge variant="outline">{(metrics.ai.learningRate * 100).toFixed(1)}%</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Cache Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Database className="w-5 h-5 mr-2 text-green-600" />
              Smart Cache
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Hit Rate</span>
              <Badge variant="outline">{metrics.cache.hitRate.toFixed(1)}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tamanho</span>
              <Badge variant="outline">{metrics.cache.size} MB</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Eficiência</span>
              <Badge variant="outline">{metrics.cache.efficiency.toFixed(1)}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Operações</span>
              <Badge variant="outline">{metrics.cache.operations.toLocaleString()}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Wifi className="w-5 h-5 mr-2 text-blue-600" />
              Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Conexões</span>
              <Badge variant="outline">{metrics.realtime.connections}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Msgs Enviadas</span>
              <Badge variant="outline">{metrics.realtime.messagesSent.toLocaleString()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Msgs Recebidas</span>
              <Badge variant="outline">{metrics.realtime.messagesReceived.toLocaleString()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Latência WS</span>
              <Badge variant="outline">{metrics.realtime.latency.toFixed(0)} ms</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Monitoring Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Shield className="w-5 h-5 mr-2 text-indigo-600" />
              Monitoramento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Eventos</span>
              <Badge variant="outline">{metrics.monitoring.events.toLocaleString()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Erros</span>
              <Badge variant={metrics.monitoring.errors > 5 ? "destructive" : "outline"}>
                {metrics.monitoring.errors}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Warnings</span>
              <Badge variant={metrics.monitoring.warnings > 10 ? "secondary" : "outline"}>
                {metrics.monitoring.warnings}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Uptime</span>
              <Badge variant="outline">{metrics.monitoring.uptime.toFixed(2)}%</Badge>
            </div>
          </CardContent>
        </Card>

        {/* System Ready Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Cpu className="w-5 h-5 mr-2 text-orange-600" />
              Status Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sistemas Ativos</span>
              <Badge variant={systemsReady ? "default" : "secondary"}>
                {systemsReady ? "Operacional" : "Iniciando"}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">AI Engine</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Cache Engine</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">WebSocket Service</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Monitoring</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 