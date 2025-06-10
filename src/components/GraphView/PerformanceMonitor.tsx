import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Cpu, 
  Timer, 
  Zap, 
  Eye, 
  EyeOff,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  nodeCount: number;
  visibleNodes: number;
  memoryUsage: number;
  workerStats: {
    totalWorkers: number;
    activeWorkers: number;
    queueSize: number;
    completedTasks: number;
    avgExecutionTime: number;
    utilization: number;
  };
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  metrics,
  isVisible = false,
  onToggleVisibility,
  className = ''
}) => {
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Track performance history
  useEffect(() => {
    if (isVisible) {
      setHistory(prev => {
        const newHistory = [...prev, metrics].slice(-30); // Keep last 30 measurements
        return newHistory;
      });
    }
  }, [metrics, isVisible]);

  // Calculate trends
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
      renderTime: calculateTrend(current.renderTime, previous.renderTime),
      memoryUsage: calculateTrend(current.memoryUsage, previous.memoryUsage),
      utilization: calculateTrend(current.workerStats.utilization, previous.workerStats.utilization)
    };
  }, [history]);

  // Get performance status
  const getPerformanceStatus = (value: number, thresholds: [number, number]) => {
    const [good, warning] = thresholds;
    if (value >= good) return { status: 'excellent', color: 'text-green-400' };
    if (value >= warning) return { status: 'good', color: 'text-yellow-400' };
    return { status: 'poor', color: 'text-red-400' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-400" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-400" />;
      default: return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  const fpsStatus = getPerformanceStatus(metrics.fps, [50, 30]);
  const renderTimeStatus = getPerformanceStatus(100 - metrics.renderTime, [80, 60]); // Inverted (lower is better)
  const memoryStatus = getPerformanceStatus(100 - metrics.memoryUsage, [70, 50]); // Inverted

  if (!isVisible) {
    return (
      <motion.button
        onClick={onToggleVisibility}
        className="fixed bottom-4 left-4 z-30 graph-button p-2"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Mostrar monitor de performance"
      >
        <Activity className="h-4 w-4" />
      </motion.button>
    );
  }

  return (
    <motion.div
      className={`fixed bottom-4 left-4 z-30 ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="graph-card p-4 w-80">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            <h3 className="text-white font-semibold">Performance Monitor</h3>
            <Badge 
              variant="secondary" 
              className={`text-xs ${fpsStatus.color} bg-black/20`}
            >
              {fpsStatus.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="graph-button p-1 text-gray-400"
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleVisibility}
              className="graph-button p-1 text-gray-400"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div 
            className="analytics-metric p-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span className="text-xs text-gray-400">FPS</span>
              </div>
              {getTrendIcon(trends.fps || 'stable')}
            </div>
            <div className={`text-lg font-bold ${fpsStatus.color}`}>
              {Math.round(metrics.fps)}
            </div>
          </motion.div>

          <motion.div 
            className="analytics-metric p-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                <span className="text-xs text-gray-400">Render</span>
              </div>
              {getTrendIcon(trends.renderTime || 'stable')}
            </div>
            <div className={`text-lg font-bold ${renderTimeStatus.color}`}>
              {metrics.renderTime.toFixed(1)}ms
            </div>
          </motion.div>
        </div>

        {/* Node Information */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Nós Renderizados</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono">
                {metrics.visibleNodes.toLocaleString()}
              </span>
              <span className="text-gray-500">
                / {metrics.nodeCount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, (metrics.visibleNodes / Math.max(metrics.nodeCount, 1)) * 100)}%` 
              }}
            />
          </div>
          <div className="text-xs text-gray-500">
            Otimização: {Math.round(100 - (metrics.visibleNodes / Math.max(metrics.nodeCount, 1)) * 100)}% dos nós culled
          </div>
        </div>

        {/* Expanded Stats */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Worker Stats */}
              <div className="border-t border-white/10 pt-4 mb-4">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Web Workers
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-blue-400 font-bold">
                      {metrics.workerStats.activeWorkers}/{metrics.workerStats.totalWorkers}
                    </div>
                    <div className="text-gray-500">Ativos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-400 font-bold">
                      {metrics.workerStats.queueSize}
                    </div>
                    <div className="text-gray-500">Fila</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold">
                      {metrics.workerStats.utilization}%
                    </div>
                    <div className="text-gray-500">Uso</div>
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Memória
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Uso atual</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono ${memoryStatus.color}`}>
                      {metrics.memoryUsage.toFixed(1)} MB
                    </span>
                    {getTrendIcon(trends.memoryUsage || 'stable')}
                  </div>
                </div>
              </div>

              {/* Performance Tips */}
              {(metrics.fps < 30 || metrics.renderTime > 50) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg"
                >
                  <div className="text-xs text-yellow-400 font-medium mb-1">
                    💡 Dica de Performance
                  </div>
                  <div className="text-xs text-gray-300">
                    {metrics.fps < 30 && "Considere reduzir o número de nós visíveis ou desabilitar animações."}
                    {metrics.renderTime > 50 && "Tempo de renderização alto. Experimente filtrar mais nós."}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}; 