import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Cpu, 
  MemoryStick, 
  Zap, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Gauge,
  RefreshCw,
  Download,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    total: number;
    limit: number;
  };
  renderTime: number;
  componentCounts: Record<string, number>;
  networkRequests: number;
  cacheHitRate: number;
  bundleSize: number;
  loadTime: number;
  interactionDelay: number;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
  metric: keyof PerformanceMetrics;
}

interface ComponentMetrics {
  name: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  memoryUsage: number;
  isSlowComponent: boolean;
}

export const PerformanceMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRecording, setIsRecording] = useState(false);
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: { used: 0, total: 0, limit: 0 },
    renderTime: 0,
    componentCounts: {},
    networkRequests: 0,
    cacheHitRate: 95,
    bundleSize: 0,
    loadTime: 0,
    interactionDelay: 0
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [componentMetrics, setComponentMetrics] = useState<ComponentMetrics[]>([]);
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);
  
  const performanceObserver = useRef<PerformanceObserver | null>(null);
  const fpsCounter = useRef(0);
  const lastFrameTime = useRef(performance.now());
  const renderTimes = useRef<number[]>([]);
  const componentRenderCounts = useRef(new Map<string, ComponentMetrics>());

  // Inicializar monitoramento
  useEffect(() => {
    if (!isRecording) return;

    // Monitor FPS
    const trackFPS = () => {
      const now = performance.now();
      const delta = now - lastFrameTime.current;
      lastFrameTime.current = now;
      
      if (delta > 0) {
        const currentFPS = Math.round(1000 / delta);
        fpsCounter.current = currentFPS;
      }
      
      if (isRecording) {
        requestAnimationFrame(trackFPS);
      }
    };

    // Monitor Performance Entries
    if ('PerformanceObserver' in window) {
      performanceObserver.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'measure' && entry.name.includes('React')) {
            renderTimes.current.push(entry.duration);
            if (renderTimes.current.length > 100) {
              renderTimes.current.shift();
            }
          }
          
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            setMetrics(prev => ({
              ...prev,
              loadTime: navEntry.loadEventEnd - navEntry.navigationStart
            }));
          }
        });
      });

      performanceObserver.current.observe({ 
        entryTypes: ['measure', 'navigation', 'paint', 'layout-shift'] 
      });
    }

    // Monitor Memory
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memory: {
            used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
            total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024)
          }
        }));
      }
    };

    // Atualizar métricas periodicamente
    const updateMetrics = () => {
      if (!isRecording) return;

      const avgRenderTime = renderTimes.current.length > 0
        ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
        : 0;

      setMetrics(prev => {
        const newMetrics = {
          ...prev,
          fps: fpsCounter.current,
          renderTime: avgRenderTime,
          componentCounts: Object.fromEntries(componentRenderCounts.current.entries().map(([key, value]) => [key, value.renderCount]))
        };

        // Adicionar ao histórico
        setHistory(prevHistory => {
          const newHistory = [...prevHistory, newMetrics];
          return newHistory.slice(-50); // Manter apenas os últimos 50 registros
        });

        return newMetrics;
      });

      updateMemoryUsage();
      checkPerformanceAlerts();
    };

    trackFPS();
    const metricsInterval = setInterval(updateMetrics, 1000);
    const memoryInterval = setInterval(updateMemoryUsage, 2000);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(memoryInterval);
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
      }
    };
  }, [isRecording]);

  // Verificar alertas de performance
  const checkPerformanceAlerts = useCallback(() => {
    const newAlerts: PerformanceAlert[] = [];

    if (metrics.fps < 30) {
      newAlerts.push({
        id: `fps-${Date.now()}`,
        type: 'warning',
        message: `FPS baixo detectado: ${metrics.fps}fps`,
        timestamp: Date.now(),
        metric: 'fps'
      });
    }

    if (metrics.memory.used > metrics.memory.limit * 0.8) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'error',
        message: `Uso de memória crítico: ${metrics.memory.used}MB`,
        timestamp: Date.now(),
        metric: 'memory'
      });
    }

    if (metrics.renderTime > 16) {
      newAlerts.push({
        id: `render-${Date.now()}`,
        type: 'warning',
        message: `Tempo de renderização alto: ${metrics.renderTime.toFixed(2)}ms`,
        timestamp: Date.now(),
        metric: 'renderTime'
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts].slice(-10));
    }
  }, [metrics]);

  // Hook para monitorar componentes React
  const trackComponentRender = useCallback((componentName: string, renderTime: number) => {
    const existing = componentRenderCounts.current.get(componentName) || {
      name: componentName,
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      memoryUsage: 0,
      isSlowComponent: false
    };

    existing.renderCount++;
    existing.lastRenderTime = renderTime;
    existing.averageRenderTime = (existing.averageRenderTime + renderTime) / 2;
    existing.isSlowComponent = existing.averageRenderTime > 10;

    componentRenderCounts.current.set(componentName, existing);
    
    setComponentMetrics(Array.from(componentRenderCounts.current.values()));
  }, []);

  // Exportar relatório de performance
  const exportReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: metrics,
      history: history,
      alerts: alerts,
      componentMetrics: componentMetrics,
      browser: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, history, alerts, componentMetrics]);

  // Limpar dados
  const clearData = useCallback(() => {
    setHistory([]);
    setAlerts([]);
    setComponentMetrics([]);
    componentRenderCounts.current.clear();
    renderTimes.current = [];
  }, []);

  const getPerformanceScore = useCallback(() => {
    let score = 100;
    
    if (metrics.fps < 60) score -= (60 - metrics.fps) * 2;
    if (metrics.renderTime > 16) score -= (metrics.renderTime - 16) * 3;
    if (metrics.memory.used > metrics.memory.limit * 0.7) score -= 20;
    if (metrics.interactionDelay > 100) score -= 15;
    
    return Math.max(0, Math.round(score));
  }, [metrics]);

  const performanceScore = getPerformanceScore();

  if (!isVisible) {
    return (
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
      >
        <Button
          onClick={() => setIsVisible(true)}
          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          size="icon"
        >
          <Activity className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <Card className={cn(
          "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl",
          isMinimized ? "w-80" : "w-96"
        )}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Performance Monitor</CardTitle>
                <Badge 
                  variant={performanceScore > 80 ? "default" : performanceScore > 60 ? "secondary" : "destructive"}
                  className="ml-2"
                >
                  {performanceScore}%
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsRecording(!isRecording)}
                  className={cn(
                    "h-8 w-8",
                    isRecording ? "text-red-500" : "text-gray-500"
                  )}
                >
                  {isRecording ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8"
                >
                  {isMinimized ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsVisible(false)}
                  className="h-8 w-8"
                >
                  ✕
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="pt-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="components">Components</TabsTrigger>
                  <TabsTrigger value="alerts">Alerts</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* Métricas principais */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <Gauge className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium">FPS</div>
                        <div className="text-lg font-bold text-blue-600">{metrics.fps}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <MemoryStick className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="text-sm font-medium">Memory</div>
                        <div className="text-lg font-bold text-green-600">{metrics.memory.used}MB</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="text-sm font-medium">Render</div>
                        <div className="text-lg font-bold text-orange-600">{metrics.renderTime.toFixed(1)}ms</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <div>
                        <div className="text-sm font-medium">Score</div>
                        <div className="text-lg font-bold text-purple-600">{performanceScore}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Usage</span>
                        <span>{((metrics.memory.used / metrics.memory.limit) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(metrics.memory.used / metrics.memory.limit) * 100} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Performance Score</span>
                        <span>{performanceScore}%</span>
                      </div>
                      <Progress value={performanceScore} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="components" className="space-y-3 mt-4">
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {componentMetrics.length === 0 ? (
                      <div className="text-center text-gray-500 py-4">
                        No component data available
                      </div>
                    ) : (
                      componentMetrics.slice(0, 10).map((comp) => (
                        <div key={comp.name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div>
                            <div className="font-medium text-sm">{comp.name}</div>
                            <div className="text-xs text-gray-500">
                              {comp.renderCount} renders • {comp.averageRenderTime.toFixed(1)}ms avg
                            </div>
                          </div>
                          {comp.isSlowComponent && (
                            <Badge variant="destructive" className="text-xs">
                              Slow
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="alerts" className="space-y-3 mt-4">
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {alerts.length === 0 ? (
                      <div className="text-center text-green-500 py-4">
                        ✓ No performance issues detected
                      </div>
                    ) : (
                      alerts.slice().reverse().map((alert) => (
                        <div key={alert.id} className={cn(
                          "flex items-start gap-2 p-2 rounded",
                          alert.type === 'error' && "bg-red-50 dark:bg-red-950/20",
                          alert.type === 'warning' && "bg-orange-50 dark:bg-orange-950/20",
                          alert.type === 'info' && "bg-blue-50 dark:bg-blue-950/20"
                        )}>
                          <AlertTriangle className={cn(
                            "h-4 w-4 mt-0.5",
                            alert.type === 'error' && "text-red-500",
                            alert.type === 'warning' && "text-orange-500",
                            alert.type === 'info' && "text-blue-500"
                          )} />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{alert.message}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Recent Performance</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={exportReport}>
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearData}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  
                  <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-gray-400" />
                    <span className="ml-2 text-gray-500">Chart visualization would go here</span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {history.length} data points collected
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook para usar o Performance Monitor
export const usePerformanceMonitor = () => {
  const trackComponentRender = useCallback((componentName: string, renderTime: number) => {
    // Esta função seria conectada ao PerformanceMonitor quando ele estiver montado
    if (window.performance && window.performance.mark) {
      window.performance.mark(`${componentName}-render-start`);
      setTimeout(() => {
        window.performance.mark(`${componentName}-render-end`);
        window.performance.measure(
          `${componentName}-render`,
          `${componentName}-render-start`,
          `${componentName}-render-end`
        );
      }, renderTime);
    }
  }, []);

  return { trackComponentRender };
};

export default PerformanceMonitor; 