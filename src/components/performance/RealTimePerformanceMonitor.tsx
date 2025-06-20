import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Activity, Zap, Database, Wifi, Cpu, MemoryStick, 
  AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Play, Pause, RotateCcw, Settings 
} from 'lucide-react';

// Performance Metrics Interface
interface PerformanceMetrics {
  // Core Web Vitals
  fps: number;
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  
  // System Metrics
  memoryUsage: number;
  heapSize: number;
  networkLatency: number;
  bundleSize: number;
  
  // Application Metrics
  renderTime: number;
  loadTime: number;
  errorRate: number;
  userInteractions: number;
  
  // Real-time Data
  timestamp: number;
  trend: 'up' | 'down' | 'stable';
  score: number; // Overall performance score
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  metric: string;
  value: number;
  threshold: number;
}

interface PerformanceThresholds {
  fps: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  latency: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fps: { warning: 45, critical: 30 },
  memory: { warning: 0.7, critical: 0.9 },
  latency: { warning: 500, critical: 1000 },
  errorRate: { warning: 0.05, critical: 0.1 }
};

const RealTimePerformanceMonitor: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [thresholds, setThresholds] = useState<PerformanceThresholds>(DEFAULT_THRESHOLDS);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertIdRef = useRef<number>(0);
  const fpsCountRef = useRef<number>(0);
  const fpsStartTimeRef = useRef<number>(0);

  // Performance Measurement Functions
  const measureFPS = useCallback((): number => {
    const now = performance.now();
    if (!fpsStartTimeRef.current) {
      fpsStartTimeRef.current = now;
      fpsCountRef.current = 0;
    }
    
    fpsCountRef.current++;
    const elapsed = now - fpsStartTimeRef.current;
    
    if (elapsed >= 1000) {
      const fps = Math.round((fpsCountRef.current * 1000) / elapsed);
      fpsStartTimeRef.current = now;
      fpsCountRef.current = 0;
      return fps;
    }
    
    return 60; // Default assumption
  }, []);

  const measureMemory = useCallback((): { usage: number; heapSize: number } => {
    try {
      const memory = (performance as any).memory;
      if (memory) {
        const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        const heapSize = memory.usedJSHeapSize / (1024 * 1024); // MB
        return { usage, heapSize };
      }
    } catch (error) {
      // Fallback for browsers without memory API
    }
    return { usage: 0.5, heapSize: 50 };
  }, []);

  const measureNetworkLatency = useCallback(async (): Promise<number> => {
    try {
      const start = performance.now();
      await fetch('/api/ping', { method: 'HEAD' }).catch(() => {});
      return performance.now() - start;
    } catch {
      return 0;
    }
  }, []);

  const measureCoreWebVitals = useCallback((): { lcp: number; fid: number; cls: number } => {
    // Simplified Web Vitals measurement
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      lcp: navigation?.loadEventEnd ? navigation.loadEventEnd - navigation.navigationStart : 0,
      fid: 0, // Would need actual user interaction measurement
      cls: 0  // Would need layout shift observer
    };
  }, []);

  const calculatePerformanceScore = useCallback((metrics: PerformanceMetrics): number => {
    let score = 100;
    
    // FPS penalty
    if (metrics.fps < 30) score -= 30;
    else if (metrics.fps < 45) score -= 15;
    
    // Memory penalty
    if (metrics.memoryUsage > 0.9) score -= 25;
    else if (metrics.memoryUsage > 0.7) score -= 10;
    
    // Latency penalty
    if (metrics.networkLatency > 1000) score -= 20;
    else if (metrics.networkLatency > 500) score -= 10;
    
    // Error rate penalty
    if (metrics.errorRate > 0.1) score -= 25;
    else if (metrics.errorRate > 0.05) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }, []);

  const generateAlert = useCallback((metric: string, value: number, threshold: number, type: 'warning' | 'error'): void => {
    const alert: AlertItem = {
      id: `alert_${alertIdRef.current++}`,
      type,
      message: `${metric} ${type === 'error' ? 'crítico' : 'alto'}: ${value.toFixed(1)} (limite: ${threshold})`,
      timestamp: Date.now(),
      metric,
      value,
      threshold
    };
    
    setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
  }, []);

  const checkThresholds = useCallback((metrics: PerformanceMetrics): void => {
    // FPS checks
    if (metrics.fps <= thresholds.fps.critical) {
      generateAlert('FPS', metrics.fps, thresholds.fps.critical, 'error');
    } else if (metrics.fps <= thresholds.fps.warning) {
      generateAlert('FPS', metrics.fps, thresholds.fps.warning, 'warning');
    }
    
    // Memory checks
    if (metrics.memoryUsage >= thresholds.memory.critical) {
      generateAlert('Memória', metrics.memoryUsage * 100, thresholds.memory.critical * 100, 'error');
    } else if (metrics.memoryUsage >= thresholds.memory.warning) {
      generateAlert('Memória', metrics.memoryUsage * 100, thresholds.memory.warning * 100, 'warning');
    }
    
    // Latency checks
    if (metrics.networkLatency >= thresholds.latency.critical) {
      generateAlert('Latência', metrics.networkLatency, thresholds.latency.critical, 'error');
    } else if (metrics.networkLatency >= thresholds.latency.warning) {
      generateAlert('Latência', metrics.networkLatency, thresholds.latency.warning, 'warning');
    }
  }, [thresholds, generateAlert]);

  const collectMetrics = useCallback(async (): Promise<PerformanceMetrics> => {
    const fps = measureFPS();
    const { usage: memoryUsage, heapSize } = measureMemory();
    const networkLatency = await measureNetworkLatency();
    const { lcp, fid, cls } = measureCoreWebVitals();
    
    const newMetrics: PerformanceMetrics = {
      fps,
      lcp,
      fid,
      cls,
      memoryUsage,
      heapSize,
      networkLatency,
      bundleSize: 413, // From build output
      renderTime: performance.now() % 50, // Simulated
      loadTime: performance.timing?.loadEventEnd - performance.timing?.navigationStart || 0,
      errorRate: 0.01, // Simulated low error rate
      userInteractions: Math.floor(Math.random() * 10),
      timestamp: Date.now(),
      trend: 'stable',
      score: 0
    };
    
    // Calculate trend
    if (metricsHistory.length > 0) {
      const lastMetrics = metricsHistory[metricsHistory.length - 1];
      const scoreChange = newMetrics.score - lastMetrics.score;
      newMetrics.trend = scoreChange > 2 ? 'up' : scoreChange < -2 ? 'down' : 'stable';
    }
    
    // Calculate performance score
    newMetrics.score = calculatePerformanceScore(newMetrics);
    
    return newMetrics;
  }, [measureFPS, measureMemory, measureNetworkLatency, measureCoreWebVitals, calculatePerformanceScore, metricsHistory]);

  const startMonitoring = useCallback((): void => {
    if (intervalRef.current) return;
    
    setIsMonitoring(true);
    intervalRef.current = setInterval(async () => {
      try {
        const newMetrics = await collectMetrics();
        setMetrics(newMetrics);
        setMetricsHistory(prev => [...prev.slice(-29), newMetrics]); // Keep last 30 measurements
        checkThresholds(newMetrics);
      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }, 1000); // Update every second
  }, [collectMetrics, checkThresholds]);

  const stopMonitoring = useCallback((): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  const resetMetrics = useCallback((): void => {
    setMetrics(null);
    setMetricsHistory([]);
    setAlerts([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Monitor de Performance em Tempo Real</h1>
            <p className="text-gray-600">Monitoramento avançado de métricas do sistema</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
          >
            {isMonitoring ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isMonitoring ? 'Pausar' : 'Iniciar'}
          </Button>
          
          <Button onClick={resetMetrics} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Score Geral</p>
                <p className={`text-3xl font-bold ${getScoreColor(metrics?.score || 0)}`}>
                  {metrics?.score || 0}
                </p>
              </div>
              <Badge variant={getScoreBadgeVariant(metrics?.score || 0)}>
                {metrics?.trend === 'up' && <TrendingUp className="h-4 w-4" />}
                {metrics?.trend === 'down' && <TrendingDown className="h-4 w-4" />}
                {metrics?.trend === 'stable' && <CheckCircle className="h-4 w-4" />}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">FPS</p>
                <p className="text-2xl font-bold">{metrics?.fps || 0}</p>
              </div>
              <Zap className={`h-8 w-8 ${(metrics?.fps || 0) >= 45 ? 'text-green-500' : (metrics?.fps || 0) >= 30 ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
            <Progress value={Math.min(100, ((metrics?.fps || 0) / 60) * 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Memória</p>
                <p className="text-2xl font-bold">{((metrics?.memoryUsage || 0) * 100).toFixed(0)}%</p>
              </div>
              <MemoryStick className={`h-8 w-8 ${(metrics?.memoryUsage || 0) < 0.7 ? 'text-green-500' : (metrics?.memoryUsage || 0) < 0.9 ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
            <Progress value={(metrics?.memoryUsage || 0) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Latência</p>
                <p className="text-2xl font-bold">{Math.round(metrics?.networkLatency || 0)}ms</p>
              </div>
              <Wifi className={`h-8 w-8 ${(metrics?.networkLatency || 0) < 500 ? 'text-green-500' : (metrics?.networkLatency || 0) < 1000 ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
            <Progress value={Math.min(100, 100 - ((metrics?.networkLatency || 0) / 2000) * 100)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Web Vitals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cpu className="h-5 w-5" />
              <span>Core Web Vitals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">LCP (ms)</span>
                <span className="font-bold">{Math.round(metrics?.lcp || 0)}</span>
              </div>
              <Progress value={Math.min(100, 100 - ((metrics?.lcp || 0) / 4000) * 100)} />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">FID (ms)</span>
                <span className="font-bold">{Math.round(metrics?.fid || 0)}</span>
              </div>
              <Progress value={Math.min(100, 100 - ((metrics?.fid || 0) / 100) * 100)} />
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">CLS</span>
                <span className="font-bold">{(metrics?.cls || 0).toFixed(3)}</span>
              </div>
              <Progress value={Math.min(100, 100 - ((metrics?.cls || 0) / 0.25) * 100)} />
            </div>
          </CardContent>
        </Card>

        {/* System Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Recursos do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Heap Size</span>
                <span className="font-bold">{(metrics?.heapSize || 0).toFixed(1)} MB</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Bundle Size</span>
                <span className="font-bold">{metrics?.bundleSize || 0} kB</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Load Time</span>
                <span className="font-bold">{Math.round(metrics?.loadTime || 0)} ms</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Error Rate</span>
                <span className="font-bold">{((metrics?.errorRate || 0) * 100).toFixed(2)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Alertas de Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription className="flex justify-between items-center">
                    <span>{alert.message}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      <div className="flex items-center justify-center py-4">
        <Badge variant={isMonitoring ? "default" : "secondary"} className="px-4 py-2">
          {isMonitoring ? (
            <>
              <Activity className="h-4 w-4 mr-2 animate-pulse" />
              Monitoramento Ativo
            </>
          ) : (
            <>
              <Activity className="h-4 w-4 mr-2" />
              Monitoramento Pausado
            </>
          )}
        </Badge>
      </div>
    </div>
  );
};

export default RealTimePerformanceMonitor; 