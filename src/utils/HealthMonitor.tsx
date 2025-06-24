import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Wifi, 
  Database, 
  Cpu, 
  MemoryStick,
  HardDrive,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useHealthMonitor } from './HealthMonitorHooks';
import type { HealthMetric, SystemHealth, HealthIssue } from './HealthMonitorCore';

// Componente de dashboard de saúde
interface HealthDashboardProps {
  compact?: boolean;
  autoStart?: boolean;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({ 
  compact = false, 
  autoStart = true 
}) => {
  const { health, isMonitoring, startMonitoring, stopMonitoring, autoFix } = useHealthMonitor();

  useEffect(() => {
    if (autoStart && !isMonitoring) {
      startMonitoring();
    }
  }, [autoStart, isMonitoring, startMonitoring]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!health) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Iniciando monitoramento...</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-background rounded-lg border">
        {getStatusIcon(health.overall)}
        <span className="text-sm font-medium">
          Saúde: {health.score}%
        </span>
        {health.issues.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {health.issues.length} problemas
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(health.overall)}
              <CardTitle className="text-lg">Saúde do Sistema</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(health.overall)}>
                {health.score}% Saudável
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isMonitoring ? 'animate-spin' : ''}`} />
                {isMonitoring ? 'Pausar' : 'Iniciar'}
              </Button>
            </div>
          </div>
          <Progress value={health.score} className="mt-2" />
        </CardHeader>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {health.metrics.map(metric => (
          <Card key={metric.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{metric.name}</span>
                {getStatusIcon(metric.status)}
              </div>
              <div className="text-2xl font-bold">
                {metric.value}{metric.unit}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Problemas */}
      {health.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Problemas Detectados ({health.issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {health.issues.map(issue => (
              <div key={issue.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{issue.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {issue.description}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Solução: {issue.solution}
                    </p>
                  </div>
                  {issue.autoFixable && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => autoFix(issue.id)}
                    >
                      Corrigir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {health.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Recomendações ({health.recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {health.recommendations.map(recommendation => (
              <div key={recommendation.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{recommendation.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recommendation.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        Esforço: {recommendation.effort}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Prioridade: {recommendation.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Benefício: {recommendation.benefit}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => recommendation.implementation()}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Re-exports
export { useHealthMonitor } from './HealthMonitorHooks';
export { ApplicationHealthMonitor } from './HealthMonitorCore';
export type { HealthMetric, SystemHealth, HealthIssue } from './HealthMonitorCore'; 