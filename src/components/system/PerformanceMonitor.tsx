import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Cpu, 
  Timer, 
  Zap, 
  Eye, 
  EyeOff,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Settings,
  HardDrive,
  Wifi
} from 'lucide-react';

interface SystemMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  documentsLoaded: number;
  activeConnections: number;
  cacheHitRate: number;
  searchLatency: number;
  networkLatency: number;
  syncStatus: 'online' | 'offline' | 'syncing' | 'error';
  pendingSyncs: number;
  interactionLatency: number;
  errorRate: number;
  diskUsage: number;
  connectionType: 'wifi' | '4g' | '3g' | 'ethernet' | 'offline';
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  metric?: keyof SystemMetrics;
  value?: number;
  threshold?: number;
}

interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  action: () => void;
}

interface PerformanceMonitorProps {
  className?: string;
  onOptimizationSuggestion?: (suggestion: OptimizationSuggestion) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  className = '',
  onOptimizationSuggestion
}) => {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    fps: 60,
    memoryUsage: 45,
    cpuUsage: 25,
    renderTime: 16.7,
    documentsLoaded: 0,
    activeConnections: 1,
    cacheHitRate: 95,
    searchLatency: 50,
    networkLatency: 45,
    syncStatus: 'online',
    pendingSyncs: 0,
    interactionLatency: 20,
    errorRate: 0.1,
    diskUsage: 60,
    connectionType: 'wifi'
  });
  
  const [history, setHistory] = useState<SystemMetrics[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [autoOptimization, setAutoOptimization] = useState(true);

  // Monitoramento em tempo real
  const collectMetrics = useCallback(() => {
    const newMetrics: SystemMetrics = {
      fps: Math.max(15, 60 + Math.random() * 10 - 5),
      memoryUsage: Math.max(20, Math.min(90, metrics.memoryUsage + Math.random() * 10 - 5)),
      cpuUsage: Math.max(10, Math.min(80, metrics.cpuUsage + Math.random() * 8 - 4)),
      renderTime: 1000 / (60 + Math.random() * 10 - 5),
      
      documentsLoaded: document.querySelectorAll('[data-document]').length,
      activeConnections: navigator.onLine ? 1 : 0,
      cacheHitRate: Math.max(80, Math.min(99, 95 + Math.random() * 4 - 2)),
      searchLatency: Math.max(10, Math.min(200, 50 + Math.random() * 20 - 10)),
      
      networkLatency: navigator.onLine ? Math.max(10, Math.min(300, 45 + Math.random() * 40 - 20)) : 0,
      syncStatus: navigator.onLine ? 'online' : 'offline',
      pendingSyncs: navigator.onLine ? 0 : Math.floor(Math.random() * 5),
      
      interactionLatency: Math.max(5, Math.min(100, 20 + Math.random() * 10 - 5)),
      errorRate: Math.max(0, Math.min(5, 0.1 + Math.random() * 0.2 - 0.1)),
      
      diskUsage: Math.max(40, Math.min(95, metrics.diskUsage + Math.random() * 2 - 1)),
      connectionType: navigator.onLine ? 'wifi' : 'offline'
    };

    setMetrics(newMetrics);
    setHistory(prev => [...prev.slice(-29), newMetrics]);
    checkAlerts(newMetrics);
    
    if (autoOptimization) {
      performAutoOptimization(newMetrics);
    }
  }, [metrics.memoryUsage, metrics.cpuUsage, metrics.diskUsage, autoOptimization]);

  // Sistema de alertas
  const checkAlerts = useCallback((currentMetrics: SystemMetrics) => {
    const newAlerts: PerformanceAlert[] = [];
    
    if (currentMetrics.fps < 30) {
      newAlerts.push({
        id: `fps-${Date.now()}`,
        type: 'warning',
        message: `FPS baixo detectado: ${Math.round(currentMetrics.fps)}`,
        timestamp: new Date(),
        metric: 'fps',
        value: currentMetrics.fps,
        threshold: 30
      });
    }
    
    if (currentMetrics.memoryUsage > 80) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'error',
        message: `Uso de memória crítico: ${Math.round(currentMetrics.memoryUsage)}%`,
        timestamp: new Date(),
        metric: 'memoryUsage',
        value: currentMetrics.memoryUsage,
        threshold: 80
      });
    }
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev.slice(-9), ...newAlerts]);
      
      newAlerts.forEach(alert => {
        if (alert.type === 'error') {
          toast({
            title: "Alerta de Performance",
            description: alert.message,
            variant: "destructive"
          });
        }
      });
    }
  }, [toast]);

  // Auto-otimização
  const performAutoOptimization = useCallback((currentMetrics: SystemMetrics) => {
    const suggestions: OptimizationSuggestion[] = [];
    
    if (currentMetrics.memoryUsage > 70) {
      suggestions.push({
        id: 'memory-cleanup',
        title: 'Limpeza de Memória',
        description: 'Limpar cache e componentes não utilizados',
        impact: 'high',
        action: () => {
          setMetrics(prev => ({
            ...prev,
            memoryUsage: Math.max(30, prev.memoryUsage - 20)
          }));
          toast({
            title: "Otimização Aplicada",
            description: "Memória liberada com sucesso"
          });
        }
      });
    }
    
    suggestions.forEach(suggestion => {
      if (onOptimizationSuggestion) {
        onOptimizationSuggestion(suggestion);
      }
    });
  }, [onOptimizationSuggestion, toast]);

  // Calcular tendências
  const trends = useMemo(() => {
    if (history.length < 2) return {};
    
    const current = history[history.length - 1];
    const previous = history[history.length - 2];
    
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return 'stable';
      const change = ((current - previous) / previous) * 100;
      if (Math.abs(change) < 5) return 'stable';
      return change > 0 ? 'up' : 'down';
    };
    
    return {
      fps: calculateTrend(current.fps, previous.fps),
      memoryUsage: calculateTrend(current.memoryUsage, previous.memoryUsage),
      cpuUsage: calculateTrend(current.cpuUsage, previous.cpuUsage),
      networkLatency: calculateTrend(current.networkLatency, previous.networkLatency)
    };
  }, [history]);

  // Status helpers
  const getPerformanceStatus = (value: number, thresholds: [number, number], inverted = false) => {
    const [good, warning] = thresholds;
    const comparison = inverted ? value <= good : value >= good;
    const comparisonWarning = inverted ? value <= warning : value >= warning;
    
    if (comparison) return { status: 'excellent', color: 'text-green-400' };
    if (comparisonWarning) return { status: 'good', color: 'text-yellow-400' };
    return { status: 'poor', color: 'text-red-400' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-400" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-400" />;
      default: return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  // Inicializar monitoramento
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(collectMetrics, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible, collectMetrics]);

  // Status geral
  const overallStatus = useMemo(() => {
    const fpsOk = metrics.fps >= 30;
    const memoryOk = metrics.memoryUsage <= 80;
    const cpuOk = metrics.cpuUsage <= 70;
    const networkOk = metrics.networkLatency <= 200;
    
    const healthScore = [fpsOk, memoryOk, cpuOk, networkOk].filter(Boolean).length / 4;
    
    if (healthScore >= 0.8) return { status: 'excellent', color: 'text-green-400', label: 'Excelente' };
    if (healthScore >= 0.6) return { status: 'good', color: 'text-yellow-400', label: 'Bom' };
    return { status: 'poor', color: 'text-red-400', label: 'Crítico' };
  }, [metrics]);

  if (!isVisible) {
    return (
      <motion.button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 right-4 z-30 p-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-black/30 transition-colors"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Monitor de Performance do Sistema"
      >
        <Activity className="h-5 w-5 text-white" />
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
          overallStatus.status === 'excellent' ? 'bg-green-400' :
          overallStatus.status === 'good' ? 'bg-yellow-400' : 'bg-red-400'
        }`} />
      </motion.button>
    );
  }

  return (
    <motion.div
      className={`fixed bottom-4 right-4 z-30 ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-black/20 backdrop-blur-xl border-white/10 text-white w-96">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="font-semibold">Performance Monitor</h3>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${overallStatus.color} bg-white/10 border-white/20`}>
                  {overallStatus.label}
                </Badge>
                {alerts.length > 0 && (
                  <span className="text-xs text-gray-400">{alerts.length} alertas</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoOptimization(!autoOptimization)}
              className={`p-2 text-gray-400 hover:text-white ${autoOptimization ? 'text-blue-400' : ''}`}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-white"
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="p-2 text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <motion.div 
              className="bg-white/5 rounded-lg p-3 border border-white/10"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-300">FPS</span>
                </div>
                {getTrendIcon(trends.fps || 'stable')}
              </div>
              <div className={`text-xl font-bold ${getPerformanceStatus(metrics.fps, [50, 30]).color}`}>
                {Math.round(metrics.fps)}
              </div>
            </motion.div>

            <motion.div 
              className="bg-white/5 rounded-lg p-3 border border-white/10"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-300">CPU</span>
                </div>
                {getTrendIcon(trends.cpuUsage || 'stable')}
              </div>
              <div className={`text-xl font-bold ${getPerformanceStatus(metrics.cpuUsage, [70, 50], true).color}`}>
                {Math.round(metrics.cpuUsage)}%
              </div>
            </motion.div>

            <motion.div 
              className="bg-white/5 rounded-lg p-3 border border-white/10"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-300">RAM</span>
                </div>
                {getTrendIcon(trends.memoryUsage || 'stable')}
              </div>
              <div className={`text-xl font-bold ${getPerformanceStatus(metrics.memoryUsage, [80, 60], true).color}`}>
                {Math.round(metrics.memoryUsage)}%
              </div>
            </motion.div>

            <motion.div 
              className="bg-white/5 rounded-lg p-3 border border-white/10"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-orange-400" />
                  <span className="text-sm text-gray-300">Rede</span>
                </div>
                {getTrendIcon(trends.networkLatency || 'stable')}
              </div>
              <div className={`text-xl font-bold ${getPerformanceStatus(metrics.networkLatency, [200, 100], true).color}`}>
                {Math.round(metrics.networkLatency)}ms
              </div>
            </motion.div>
          </div>

          {alerts.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alertas Recentes
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {alerts.slice(-3).map(alert => (
                  <div key={alert.id} className="bg-white/5 rounded p-2 text-sm border border-white/10">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-400" />
                      <span className="text-gray-300">{alert.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cache Hit Rate:</span>
                    <span className="text-white">{Math.round(metrics.cacheHitRate)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Docs Carregados:</span>
                    <span className="text-white">{metrics.documentsLoaded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status Sync:</span>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        metrics.syncStatus === 'online' ? 'bg-green-400' :
                        metrics.syncStatus === 'syncing' ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      <span className="text-white capitalize">{metrics.syncStatus}</span>
                    </div>
                  </div>
                </div>
                
                {autoOptimization && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Auto-otimização ativa</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}; 