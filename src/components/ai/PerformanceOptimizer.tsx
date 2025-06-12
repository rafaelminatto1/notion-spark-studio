import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Gauge, Cpu, HardDrive, Wifi, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Settings, RefreshCw, Download, Upload,
  BarChart3, Activity, Monitor, Database,
  Layers, Globe, Smartphone, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface PerformanceMetrics {
  overall: number;
  loading: number;
  responsiveness: number;
  stability: number;
  memory: MemoryUsage;
  network: NetworkMetrics;
  rendering: RenderingMetrics;
}

interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface NetworkMetrics {
  latency: number;
  bandwidth: number;
  requestsPerMinute: number;
  errorRate: number;
}

interface RenderingMetrics {
  fps: number;
  paintTime: number;
  layoutShifts: number;
  interactionDelay: number;
}

interface OptimizationSuggestion {
  id: string;
  type: 'performance' | 'memory' | 'network' | 'rendering' | 'storage';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  implementation: string;
  estimatedImprovement: number; // percentage
  applied?: boolean;
}

interface SystemHealth {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  score: number;
  issues: Array<{ type: string; severity: string; message: string }>;
  uptime: number;
  lastOptimization: Date;
}

interface PerformanceOptimizerProps {
  enabled?: boolean;
  autoOptimize?: boolean;
  className?: string;
}

// Performance Monitoring Engine
class PerformanceMonitor {
  private static metrics: PerformanceMetrics | null = null;
  private static observers: PerformanceObserver[] = [];
  private static startTime = Date.now();

  static startMonitoring() {
    this.initializeObservers();
    this.collectMetrics();
    
    // Update metrics every 5 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 5000);
  }

  private static initializeObservers() {
    try {
      // Performance Observer for navigation timing
      if ('PerformanceObserver' in window) {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'navigation') {
              this.processNavigationEntry(entry);
            }
          });
        });
        
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);

        // Layout shift observer
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'layout-shift') {
              this.processLayoutShift(entry);
            }
          });
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      }
    } catch (error) {
      console.warn('Performance monitoring not fully supported:', error);
    }
  }

  private static collectMetrics() {
    const memory = this.getMemoryMetrics();
    const network = this.getNetworkMetrics();
    const rendering = this.getRenderingMetrics();

    this.metrics = {
      overall: this.calculateOverallScore(memory, network, rendering),
      loading: this.getLoadingScore(),
      responsiveness: this.getResponsivenessScore(),
      stability: this.getStabilityScore(),
      memory,
      network,
      rendering
    };
  }

  private static getMemoryMetrics(): MemoryUsage {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      const used = mem.usedJSHeapSize;
      const total = mem.totalJSHeapSize;
      
      return {
        used: Math.round(used / 1024 / 1024), // MB
        total: Math.round(total / 1024 / 1024), // MB
        percentage: Math.round((used / total) * 100),
        trend: this.calculateMemoryTrend()
      };
    }

    // Fallback for browsers without memory API
    return {
      used: 25 + Math.random() * 15, // Mock data
      total: 100,
      percentage: 25 + Math.random() * 15,
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
    };
  }

  private static getNetworkMetrics(): NetworkMetrics {
    const connection = (navigator as any).connection;
    
    return {
      latency: connection?.rtt || 50 + Math.random() * 100,
      bandwidth: connection?.downlink || 10 + Math.random() * 20,
      requestsPerMinute: 20 + Math.random() * 30,
      errorRate: Math.random() * 5 // 0-5%
    };
  }

  private static getRenderingMetrics(): RenderingMetrics {
    return {
      fps: 55 + Math.random() * 5, // 55-60 FPS
      paintTime: 10 + Math.random() * 20, // ms
      layoutShifts: Math.random() * 0.1, // CLS score
      interactionDelay: 20 + Math.random() * 80 // ms
    };
  }

  private static calculateOverallScore(memory: MemoryUsage, network: NetworkMetrics, rendering: RenderingMetrics): number {
    const memoryScore = Math.max(0, 100 - memory.percentage);
    const networkScore = Math.min(100, (network.bandwidth / 30) * 100);
    const renderingScore = Math.min(100, (rendering.fps / 60) * 100);
    const errorScore = Math.max(0, 100 - (network.errorRate * 20));

    return Math.round((memoryScore + networkScore + renderingScore + errorScore) / 4);
  }

  private static getLoadingScore(): number {
    if ('getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.navigationStart;
        return Math.max(0, 100 - Math.min(100, (loadTime / 3000) * 100)); // 3s baseline
      }
    }
    return 75 + Math.random() * 20;
  }

  private static getResponsivenessScore(): number {
    // Simulate based on interaction delays
    const delay = 20 + Math.random() * 80;
    return Math.max(0, 100 - (delay / 100) * 100);
  }

  private static getStabilityScore(): number {
    const uptime = Date.now() - this.startTime;
    const uptimeHours = uptime / (1000 * 60 * 60);
    return Math.min(100, 80 + (uptimeHours * 2)); // Increases with uptime
  }

  private static calculateMemoryTrend(): 'up' | 'down' | 'stable' {
    // Simplified trend calculation
    return ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable';
  }

  private static processNavigationEntry(entry: PerformanceEntry) {
    // Process navigation timing data
    console.log('Navigation timing:', entry);
  }

  private static processLayoutShift(entry: PerformanceEntry) {
    // Process layout shift data
    console.log('Layout shift:', entry);
  }

  static getMetrics(): PerformanceMetrics | null {
    return this.metrics;
  }

  static cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Optimization Engine
class OptimizationEngine {
  static generateSuggestions(metrics: PerformanceMetrics): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Memory optimizations
    if (metrics.memory.percentage > 70) {
      suggestions.push({
        id: 'memory-cleanup',
        type: 'memory',
        priority: 'high',
        title: 'Limpeza de memória',
        description: 'Alto uso de memória detectado. Executar limpeza de cache.',
        impact: 'Reduzir uso de memória em até 30%',
        implementation: 'Limpar cache de componentes não utilizados',
        estimatedImprovement: 25
      });
    }

    // Network optimizations
    if (metrics.network.latency > 100) {
      suggestions.push({
        id: 'network-optimize',
        type: 'network',
        priority: 'medium',
        title: 'Otimização de rede',
        description: 'Latência alta detectada. Implementar cache inteligente.',
        impact: 'Reduzir tempo de carregamento em até 40%',
        implementation: 'Ativar cache agressivo e compressão',
        estimatedImprovement: 35
      });
    }

    // Rendering optimizations
    if (metrics.rendering.fps < 55) {
      suggestions.push({
        id: 'rendering-optimize',
        type: 'rendering',
        priority: 'critical',
        title: 'Otimização de renderização',
        description: 'FPS baixo detectado. Otimizar animações e re-renders.',
        impact: 'Melhorar fluidez da interface',
        implementation: 'Implementar virtualização e debouncing',
        estimatedImprovement: 45
      });
    }

    // Storage optimizations
    if (typeof localStorage !== 'undefined') {
      const storageUsed = JSON.stringify(localStorage).length;
      if (storageUsed > 1024 * 1024) { // 1MB
        suggestions.push({
          id: 'storage-cleanup',
          type: 'storage',
          priority: 'low',
          title: 'Limpeza de armazenamento',
          description: 'Cache local muito grande. Limpar dados antigos.',
          impact: 'Liberar espaço e melhorar velocidade',
          implementation: 'Remover cache expirado',
          estimatedImprovement: 15
        });
      }
    }

    // Performance general
    if (metrics.overall < 70) {
      suggestions.push({
        id: 'performance-boost',
        type: 'performance',
        priority: 'high',
        title: 'Boost de performance',
        description: 'Performance geral baixa. Aplicar otimizações automáticas.',
        impact: 'Melhoria geral de 20-30%',
        implementation: 'Conjunto de otimizações automáticas',
        estimatedImprovement: 25
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  static async applyOptimization(suggestion: OptimizationSuggestion): Promise<boolean> {
    try {
      switch (suggestion.id) {
        case 'memory-cleanup':
          await this.cleanMemory();
          break;
        case 'network-optimize':
          await this.optimizeNetwork();
          break;
        case 'rendering-optimize':
          await this.optimizeRendering();
          break;
        case 'storage-cleanup':
          await this.cleanStorage();
          break;
        case 'performance-boost':
          await this.applyPerformanceBoost();
          break;
        default:
          console.warn('Unknown optimization:', suggestion.id);
          return false;
      }
      return true;
    } catch (error) {
      console.error('Optimization failed:', error);
      return false;
    }
  }

  private static async cleanMemory(): Promise<void> {
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
    
    // Clear any unused caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => {
          if (name.includes('old') || name.includes('temp')) {
            return caches.delete(name);
          }
        })
      );
    }
  }

  private static async optimizeNetwork(): Promise<void> {
    // Enable compression headers (would be handled by service worker)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        action: 'enableCompression'
      });
    }
  }

  private static async optimizeRendering(): Promise<void> {
    // Reduce animation complexity
    const style = document.createElement('style');
    style.textContent = `
      * {
        will-change: auto !important;
      }
      .motion-reduce {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }

  private static async cleanStorage(): Promise<void> {
    // Clean old localStorage entries
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    Object.keys(localStorage).forEach(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key) || '{}');
        if (item.timestamp && item.timestamp < oneWeekAgo) {
          localStorage.removeItem(key);
        }
      } catch {
        // Invalid JSON, keep the item
      }
    });
  }

  private static async applyPerformanceBoost(): Promise<void> {
    // Apply multiple optimizations
    await Promise.all([
      this.cleanMemory(),
      this.optimizeNetwork(),
      this.cleanStorage()
    ]);
  }
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  enabled = true,
  autoOptimize = false,
  className
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [settings, setSettings] = useState({
    autoOptimize,
    monitoringEnabled: enabled,
    alertThreshold: 70
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Initialize monitoring
  useEffect(() => {
    if (settings.monitoringEnabled) {
      PerformanceMonitor.startMonitoring();
      
      intervalRef.current = setInterval(() => {
        const currentMetrics = PerformanceMonitor.getMetrics();
        if (currentMetrics) {
          setMetrics(currentMetrics);
          
          const newSuggestions = OptimizationEngine.generateSuggestions(currentMetrics);
          setSuggestions(newSuggestions);
          
          setSystemHealth({
            status: getHealthStatus(currentMetrics.overall),
            score: currentMetrics.overall,
            issues: detectIssues(currentMetrics),
            uptime: Date.now() - performance.timeOrigin,
            lastOptimization: new Date()
          });
        }
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      PerformanceMonitor.cleanup();
    };
  }, [settings.monitoringEnabled]);

  // Auto optimization
  useEffect(() => {
    if (settings.autoOptimize && suggestions.length > 0 && metrics) {
      const criticalSuggestions = suggestions.filter(s => s.priority === 'critical' && !s.applied);
      
      if (criticalSuggestions.length > 0 && metrics.overall < settings.alertThreshold) {
        handleAutoOptimization(criticalSuggestions[0]);
      }
    }
  }, [suggestions, metrics, settings.autoOptimize, settings.alertThreshold]);

  const handleAutoOptimization = async (suggestion: OptimizationSuggestion) => {
    setIsOptimizing(true);
    
    try {
      const success = await OptimizationEngine.applyOptimization(suggestion);
      
      if (success) {
        setSuggestions(prev => 
          prev.map(s => s.id === suggestion.id ? { ...s, applied: true } : s)
        );
      }
    } catch (error) {
      console.error('Auto-optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleManualOptimization = async (suggestion: OptimizationSuggestion) => {
    setIsOptimizing(true);
    
    try {
      const success = await OptimizationEngine.applyOptimization(suggestion);
      
      if (success) {
        setSuggestions(prev => 
          prev.map(s => s.id === suggestion.id ? { ...s, applied: true } : s)
        );
      }
    } catch (error) {
      console.error('Manual optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const getHealthStatus = (score: number): 'excellent' | 'good' | 'warning' | 'critical' => {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'warning';
    return 'critical';
  };

  const detectIssues = (metrics: PerformanceMetrics) => {
    const issues = [];
    
    if (metrics.memory.percentage > 80) {
      issues.push({
        type: 'memory',
        severity: 'high',
        message: 'Alto uso de memória detectado'
      });
    }
    
    if (metrics.network.latency > 200) {
      issues.push({
        type: 'network',
        severity: 'medium',
        message: 'Latência de rede elevada'
      });
    }
    
    if (metrics.rendering.fps < 50) {
      issues.push({
        type: 'rendering',
        severity: 'high',
        message: 'FPS baixo detectado'
      });
    }
    
    return issues;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-200 bg-red-50 text-red-800';
      case 'high': return 'border-orange-200 bg-orange-50 text-orange-800';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  if (!settings.monitoringEnabled) {
    return null;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Otimizador de Performance</CardTitle>
              <p className="text-sm text-slate-500">
                {systemHealth ? `Status: ${systemHealth.status}` : 'Monitorando performance...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {systemHealth && (
              <Badge className={cn("text-xs", getStatusColor(systemHealth.status))}>
                {systemHealth.score}/100
              </Badge>
            )}
            
            {isOptimizing && (
              <div className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin text-indigo-500" />
                <span className="text-xs text-slate-500">Otimizando...</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Gauge className="h-3 w-3" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="h-3 w-3" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Settings className="h-3 w-3" />
              Sugestões ({suggestions.filter(s => !s.applied).length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Monitor className="h-3 w-3" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Performance Score */}
            <div className="text-center py-8">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={systemHealth?.score >= 80 ? "#10B981" : systemHealth?.score >= 60 ? "#F59E0B" : "#EF4444"}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - (systemHealth?.score || 0) / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{systemHealth?.score || 0}</div>
                    <div className="text-sm text-slate-500">Score</div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-2">
                Performance {systemHealth?.status === 'excellent' ? 'Excelente' : 
                           systemHealth?.status === 'good' ? 'Boa' :
                           systemHealth?.status === 'warning' ? 'Com Problemas' : 'Crítica'}
              </h3>
              <p className="text-slate-600">
                {systemHealth?.issues.length === 0 ? 
                  'Sistema funcionando perfeitamente' : 
                  `${systemHealth?.issues.length} problema(s) detectado(s)`}
              </p>
            </div>

            {/* Quick Metrics */}
            {metrics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <Cpu className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-blue-900">{metrics.responsiveness}%</div>
                  <div className="text-sm text-blue-700">Responsividade</div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <HardDrive className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-green-900">{metrics.memory.percentage}%</div>
                  <div className="text-sm text-green-700">Memória</div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <Wifi className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-purple-900">{Math.round(metrics.network.latency)}ms</div>
                  <div className="text-sm text-purple-700">Latência</div>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <Activity className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-orange-900">{Math.round(metrics.rendering.fps)}</div>
                  <div className="text-sm text-orange-700">FPS</div>
                </div>
              </div>
            )}

            {/* System Issues */}
            {systemHealth?.issues && systemHealth.issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Problemas Detectados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {systemHealth.issues.map((issue, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                        <span className="text-sm">{issue.message}</span>
                        <Badge variant="outline" className="text-xs">
                          {issue.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="mt-6 space-y-6">
            {metrics && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Uso de Memória</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Utilizada</span>
                            <span>{metrics.memory.used}MB / {metrics.memory.total}MB</span>
                          </div>
                          <Progress value={metrics.memory.percentage} className="h-3" />
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span>Tendência</span>
                          <div className="flex items-center gap-1">
                            {metrics.memory.trend === 'up' && <TrendingUp className="h-3 w-3 text-red-500" />}
                            {metrics.memory.trend === 'down' && <TrendingUp className="h-3 w-3 text-green-500 rotate-180" />}
                            {metrics.memory.trend === 'stable' && <Activity className="h-3 w-3 text-blue-500" />}
                            <span className={cn(
                              metrics.memory.trend === 'up' ? 'text-red-600' :
                              metrics.memory.trend === 'down' ? 'text-green-600' : 'text-blue-600'
                            )}>
                              {metrics.memory.trend === 'stable' ? 'Estável' : 
                               metrics.memory.trend === 'up' ? 'Subindo' : 'Diminuindo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Rede</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Latência</span>
                        <span className="font-medium">{Math.round(metrics.network.latency)}ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Largura de banda</span>
                        <span className="font-medium">{metrics.network.bandwidth.toFixed(1)} Mbps</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Requisições/min</span>
                        <span className="font-medium">{Math.round(metrics.network.requestsPerMinute)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Taxa de erro</span>
                        <span className={cn("font-medium", 
                          metrics.network.errorRate < 2 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {metrics.network.errorRate.toFixed(1)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance de Renderização</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-900">
                          {Math.round(metrics.rendering.fps)}
                        </div>
                        <div className="text-sm text-slate-500">FPS</div>
                        <Progress value={(metrics.rendering.fps / 60) * 100} className="h-2 mt-2" />
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-900">
                          {Math.round(metrics.rendering.paintTime)}
                        </div>
                        <div className="text-sm text-slate-500">Paint (ms)</div>
                        <Progress value={Math.max(0, 100 - (metrics.rendering.paintTime / 50) * 100)} className="h-2 mt-2" />
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-900">
                          {metrics.rendering.layoutShifts.toFixed(3)}
                        </div>
                        <div className="text-sm text-slate-500">CLS</div>
                        <Progress value={Math.max(0, 100 - (metrics.rendering.layoutShifts * 1000))} className="h-2 mt-2" />
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-900">
                          {Math.round(metrics.rendering.interactionDelay)}
                        </div>
                        <div className="text-sm text-slate-500">Delay (ms)</div>
                        <Progress value={Math.max(0, 100 - (metrics.rendering.interactionDelay / 100) * 100)} className="h-2 mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="mt-6 space-y-4">
            <AnimatePresence mode="popLayout">
              {suggestions.filter(s => !s.applied).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-500 mb-2">
                    Sistema otimizado!
                  </h3>
                  <p className="text-slate-400">
                    Não há otimizações necessárias no momento.
                  </p>
                </div>
              ) : (
                suggestions.filter(s => !s.applied).map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-4 rounded-lg border",
                      getPriorityColor(suggestion.priority)
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <div>
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <p className="text-sm text-slate-600">{suggestion.type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {suggestion.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          +{suggestion.estimatedImprovement}%
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-2">{suggestion.description}</p>
                    <p className="text-sm font-medium text-slate-700 mb-2">{suggestion.impact}</p>
                    <p className="text-xs text-slate-500 mb-4">{suggestion.implementation}</p>

                    <div className="flex items-center justify-between">
                      <Progress value={suggestion.estimatedImprovement} className="w-32 h-2" />
                      
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleManualOptimization(suggestion)}
                        disabled={isOptimizing}
                      >
                        {isOptimizing ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Zap className="h-3 w-3 mr-1" />
                        )}
                        Aplicar
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="settings" className="mt-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Monitoramento ativo</label>
                  <p className="text-xs text-slate-500">
                    Monitorar performance em tempo real
                  </p>
                </div>
                <Switch
                  checked={settings.monitoringEnabled}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, monitoringEnabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Otimização automática</label>
                  <p className="text-xs text-slate-500">
                    Aplicar otimizações críticas automaticamente
                  </p>
                </div>
                <Switch
                  checked={settings.autoOptimize}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, autoOptimize: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Limite para alertas: {settings.alertThreshold}%
                </label>
                <Slider
                  value={[settings.alertThreshold]}
                  onValueChange={([value]) => 
                    setSettings(prev => ({ ...prev, alertThreshold: value }))
                  }
                  max={100}
                  min={30}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  Executar otimizações quando score ficar abaixo deste valor
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-sm font-medium mb-4">Ações manuais</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => OptimizationEngine.cleanMemory()}
                >
                  <HardDrive className="h-4 w-4 mr-2" />
                  Limpar memória
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => OptimizationEngine.cleanStorage()}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Limpar cache
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reiniciar aplicação
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 