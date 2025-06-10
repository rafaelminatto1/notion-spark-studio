import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Eye, 
  EyeOff, 
  Cpu, 
  Zap,
  Timer,
  BarChart3,
  TrendingUp
} from 'lucide-react';

interface PerformanceDashboardProps {
  nodeCount: number;
  linkCount: number;
  visibleNodes?: number;
  className?: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  nodeCount,
  linkCount,
  visibleNodes = nodeCount,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [fps, setFps] = useState(60);
  const [frameCount, setFrameCount] = useState(0);
  const [lastTime, setLastTime] = useState(Date.now());

  // Calculate performance metrics
  useEffect(() => {
    const updateFps = () => {
      setFrameCount(prev => prev + 1);
      
      const now = Date.now();
      if (now - lastTime >= 1000) {
        const calculatedFps = (frameCount * 1000) / (now - lastTime);
        setFps(Math.round(calculatedFps));
        setFrameCount(0);
        setLastTime(now);
      }
      
      requestAnimationFrame(updateFps);
    };

    if (isVisible) {
      const animation = requestAnimationFrame(updateFps);
      return () => cancelAnimationFrame(animation);
    }
  }, [frameCount, lastTime, isVisible]);

  // Calculate optimization percentage
  const optimizationPercentage = nodeCount > 0 ? 
    Math.round(((nodeCount - visibleNodes) / nodeCount) * 100) : 0;

  // Performance status
  const getPerformanceStatus = () => {
    if (fps >= 50) return { status: 'Excelente', color: 'text-green-400', emoji: '🚀' };
    if (fps >= 30) return { status: 'Boa', color: 'text-yellow-400', emoji: '⚡' };
    return { status: 'Baixa', color: 'text-red-400', emoji: '🐌' };
  };

  const performanceStatus = getPerformanceStatus();

  // Memory estimation (rough calculation)
  const estimatedMemory = Math.round((nodeCount * 0.5 + linkCount * 0.3) / 1000);

  if (!isVisible) {
    return (
      <motion.button
        onClick={() => setIsVisible(true)}
        className={`graph-button p-2 ${className}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Mostrar dashboard de performance"
      >
        <Activity className="h-4 w-4" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className={`graph-card p-4 w-72 ${className}`}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            <h3 className="text-white font-semibold">Performance</h3>
            <Badge 
              variant="secondary" 
              className={`text-xs ${performanceStatus.color} bg-black/20`}
            >
              {performanceStatus.status}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="graph-button p-1 text-gray-400"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div 
            className="analytics-metric p-3"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3 w-3" />
              <span className="text-xs text-gray-400">FPS</span>
            </div>
            <div className={`text-xl font-bold ${performanceStatus.color}`}>
              {fps}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {performanceStatus.emoji} {performanceStatus.status}
            </div>
          </motion.div>

          <motion.div 
            className="analytics-metric p-3"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-3 w-3" />
              <span className="text-xs text-gray-400">Otimização</span>
            </div>
            <div className="text-xl font-bold text-purple-400">
              {optimizationPercentage}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {nodeCount - visibleNodes} nós culled
            </div>
          </motion.div>
        </div>

        {/* Graph Stats */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center gap-2">
              <BarChart3 className="h-3 w-3" />
              Total de Nós
            </span>
            <span className="text-white font-mono">{nodeCount.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Conexões
            </span>
            <span className="text-white font-mono">{linkCount.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center gap-2">
              <Eye className="h-3 w-3" />
              Visíveis
            </span>
            <span className="text-white font-mono">{visibleNodes.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center gap-2">
              <Cpu className="h-3 w-3" />
              Memória Est.
            </span>
            <span className="text-white font-mono">{estimatedMemory} MB</span>
          </div>
        </motion.div>

        {/* Performance Bar */}
        <motion.div 
          className="mt-4 pt-3 border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-400">Nós Renderizados</span>
            <span className="text-gray-300">
              {visibleNodes} / {nodeCount}
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ 
                width: `${(visibleNodes / Math.max(nodeCount, 1)) * 100}%` 
              }}
              transition={{ duration: 0.5, delay: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Performance Tips */}
        {fps < 30 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg"
          >
            <div className="text-xs text-yellow-400 font-medium mb-1">
              💡 Dica de Performance
            </div>
            <div className="text-xs text-gray-300">
              Performance baixa detectada. Considere filtrar mais nós ou reduzir animações.
            </div>
          </motion.div>
        )}

        {optimizationPercentage > 50 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-4 p-3 bg-green-400/10 border border-green-400/20 rounded-lg"
          >
            <div className="text-xs text-green-400 font-medium mb-1">
              🚀 Ótima Otimização!
            </div>
            <div className="text-xs text-gray-300">
              {optimizationPercentage}% dos nós estão sendo culled para melhor performance.
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}; 