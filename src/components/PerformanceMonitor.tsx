import React from 'react';
import { usePerformance } from '../hooks/usePerformance';
import { PerformanceAlerts } from './PerformanceAlerts';
import { PerformanceOptimizations } from './PerformanceOptimizations';
import { PerformanceHistory } from './PerformanceHistory';
import { PerformanceComponents } from './PerformanceComponents';
import { PerformanceFPS } from './PerformanceFPS';
import { PerformanceLatency } from './PerformanceLatency';
import { PerformanceSettings } from './PerformanceSettings';
import { PerformanceToastAlerts, usePerformanceToasts } from './PerformanceToastAlerts';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Play, Pause, Trash2, Download, Settings, BarChart3 } from 'lucide-react';

export const PerformanceMonitor: React.FC = () => {
  const {
    metrics,
    networkMetrics,
    memoryMetrics,
    renderingMetrics,
    fpsMetrics,
    latencyMetrics,
    componentMetrics,
    alerts,
    optimizations,
    history,
    isMonitoring,
    thresholds,
    autoOptimization,
    alertsEnabled,
    startMonitoring,
    stopMonitoring,
    applyOptimization,
    clearHistory,
    exportHistory,
    setThresholds,
    setAutoOptimization,
    setAlertsEnabled
  } = usePerformance();

  // Hook para alertas em tempo real
  usePerformanceToasts(alerts, isMonitoring);

  return (
    <div id="performance-monitor" className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Monitor de Performance</h2>
          {isMonitoring && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Monitorando
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          {isMonitoring ? (
            <Button onClick={stopMonitoring} variant="outline">
              <Pause className="w-4 h-4 mr-2" />
              Pausar
            </Button>
          ) : (
            <Button onClick={startMonitoring}>
              <Play className="w-4 h-4 mr-2" />
              Iniciar
            </Button>
          )}
          <Button onClick={clearHistory} variant="outline">
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          <Button onClick={exportHistory} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">FPS</p>
                  <p className={`text-2xl font-bold ${
                    metrics.fps >= thresholds.fps.warning ? 'text-green-600' :
                    metrics.fps >= thresholds.fps.error ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.fps}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Alvo: 60</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Memória</p>
                  <p className={`text-2xl font-bold ${
                    metrics.memoryUsage < thresholds.memoryUsage.warning ? 'text-green-600' :
                    metrics.memoryUsage < thresholds.memoryUsage.error ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.memoryUsage.toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {(memoryMetrics.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Renderização</p>
                  <p className={`text-2xl font-bold ${
                    metrics.renderTime < thresholds.renderTime.warning ? 'text-green-600' :
                    metrics.renderTime < thresholds.renderTime.error ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.renderTime.toFixed(1)}ms
                  </p>
                </div>
                                 <div className="text-right">
                   <p className="text-xs text-gray-400">Alvo: &lt;16ms</p>
                 </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Latência</p>
                  <p className={`text-2xl font-bold ${
                    metrics.networkLatency < thresholds.networkLatency.warning ? 'text-green-600' :
                    metrics.networkLatency < thresholds.networkLatency.error ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {metrics.networkLatency.toFixed(0)}ms
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Rede</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Alertas e Otimizações */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div id="performance-alerts">
              <PerformanceAlerts alerts={alerts.slice(-10)} />
            </div>
            <div id="performance-optimizations">
              <PerformanceOptimizations
                optimizations={optimizations.slice(-10)}
                onApply={applyOptimization}
              />
            </div>
          </div>

          {/* Gráficos de FPS e Latência */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceFPS metrics={fpsMetrics} />
            <PerformanceLatency metrics={latencyMetrics} />
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {/* Métricas Detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Métricas de Rede</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Latência:</span>
                  <span>{networkMetrics.latency.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Download:</span>
                  <span>{networkMetrics.downloadSpeed.toFixed(2)} Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span>Upload:</span>
                  <span>{networkMetrics.uploadSpeed.toFixed(2)} Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span>Conexão:</span>
                  <span>{networkMetrics.connectionType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Requisições:</span>
                  <span>{networkMetrics.requests.length}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Métricas de Memória</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Heap Usado:</span>
                  <span>{(memoryMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Heap Total:</span>
                  <span>{(memoryMetrics.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Limite:</span>
                  <span>{(memoryMetrics.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Uso:</span>
                  <span>{((memoryMetrics.usedJSHeapSize / memoryMetrics.jsHeapSizeLimit) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Métricas de Renderização</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tempo:</span>
                  <span>{renderingMetrics.renderTime.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Contagem:</span>
                  <span>{renderingMetrics.renderCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Camadas:</span>
                  <span>{renderingMetrics.layers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Atualizações:</span>
                  <span>{renderingMetrics.updates.length}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Componentes */}
          <PerformanceComponents components={componentMetrics} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <PerformanceHistory history={history} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <PerformanceSettings
            thresholds={thresholds}
            onThresholdsChange={setThresholds}
            autoOptimization={autoOptimization}
            onAutoOptimizationChange={setAutoOptimization}
            alertsEnabled={alertsEnabled}
            onAlertsEnabledChange={setAlertsEnabled}
          />
        </TabsContent>
      </Tabs>

      {/* Componente invisível para alertas toast */}
      <PerformanceToastAlerts alerts={alerts} isMonitoring={isMonitoring} />
    </div>
  );
}; 