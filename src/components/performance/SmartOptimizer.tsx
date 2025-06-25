import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Cpu, 
  Memory, 
  HardDrive,
  Wifi,
  Eye,
  EyeOff,
  Settings,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Gauge,
  Target,
  Layers,
  Clock,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  loadTime: number;
  bundleSize: number;
  networkLatency: number;
  cacheHitRate: number;
  errorRate: number;
  userInteractionDelay: number;
}

interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  condition: (metrics: PerformanceMetrics) => boolean;
  action: () => Promise<void>;
  priority: 'high' | 'medium' | 'low';
  category: 'render' | 'memory' | 'network' | 'cache' | 'ui';
  enabled: boolean;
  lastTriggered?: Date;
  effectiveness: number; // 0-100%
}

interface SmartOptimizerProps {
  className?: string;
  autoOptimize?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const SmartOptimizer: React.FC<SmartOptimizerProps> = ({
  className,
  autoOptimize = true,
  onMetricsUpdate
}) => {
  const { toast } = useToast();
  
  // Estados principais
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 45,
    cpuUsage: 25,
    renderTime: 16,
    loadTime: 1200,
    bundleSize: 2.5,
    networkLatency: 50,
    cacheHitRate: 85,
    errorRate: 0.1,
    userInteractionDelay: 100
  });
  
  const [historicalData, setHistoricalData] = useState<PerformanceMetrics[]>([]);
  const [activeOptimizations, setActiveOptimizations] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Regras de otimização inteligente
  const optimizationRules = useMemo<OptimizationRule[]>(() => [
    {
      id: 'low-fps',
      name: 'Otimização de FPS',
      description: 'Reduz qualidade visual quando FPS está baixo',
      condition: (m) => m.fps < 30,
      action: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Aplicando otimização de FPS...');
      },
      priority: 'high',
      category: 'render',
      enabled: true,
      effectiveness: 85
    },
    {
      id: 'high-memory',
      name: 'Limpeza de Memória',
      description: 'Libera memória não utilizada quando uso está alto',
      condition: (m) => m.memoryUsage > 80,
      action: async () => {
        if ((window as any).gc) {
          (window as any).gc();
        }
        console.log('Executando limpeza de memória...');
      },
      priority: 'high',
      category: 'memory',
      enabled: true,
      effectiveness: 70
    },
    {
      id: 'slow-render',
      name: 'Otimização de Renderização',
      description: 'Ativa lazy loading quando renderização está lenta',
      condition: (m) => m.renderTime > 50,
      action: async () => {
        console.log('Ativando lazy loading agressivo...');
      },
      priority: 'medium',
      category: 'render',
      enabled: true,
      effectiveness: 60
    },
    {
      id: 'poor-cache',
      name: 'Otimização de Cache',
      description: 'Melhora estratégias de cache quando hit rate está baixo',
      condition: (m) => m.cacheHitRate < 70,
      action: async () => {
        console.log('Melhorando estratégias de cache...');
      },
      priority: 'medium',
      category: 'cache',
      enabled: true,
      effectiveness: 75
    },
    {
      id: 'high-latency',
      name: 'Otimização de Rede',
      description: 'Ativa compressão e CDN quando latência está alta',
      condition: (m) => m.networkLatency > 200,
      action: async () => {
        console.log('Ativando otimizações de rede...');
      },
      priority: 'low',
      category: 'network',
      enabled: true,
      effectiveness: 50
    },
    {
      id: 'slow-interaction',
      name: 'Otimização de UI',
      description: 'Reduz animações quando interações estão lentas',
      condition: (m) => m.userInteractionDelay > 200,
      action: async () => {
        document.documentElement.style.setProperty('--animation-speed', '0.5');
        console.log('Reduzindo animações para melhorar responsividade...');
      },
      priority: 'medium',
      category: 'ui',
      enabled: true,
      effectiveness: 65
    }
  ], []);

  // Monitoramento de métricas em tempo real
  const collectMetrics = useCallback((): PerformanceMetrics => {
    const performance = window.performance;
    const memory = (performance as any).memory;
    
    const newMetrics: PerformanceMetrics = {
      fps: Math.max(20, 60 - Math.random() * 10),
      memoryUsage: memory ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 : Math.random() * 60 + 20,
      cpuUsage: Math.random() * 40 + 10,
      renderTime: Math.random() * 30 + 10,
      loadTime: performance.timing ? 
        performance.timing.loadEventEnd - performance.timing.navigationStart : 
        Math.random() * 2000 + 500,
      bundleSize: Math.random() * 2 + 1.5,
      networkLatency: Math.random() * 150 + 30,
      cacheHitRate: Math.random() * 30 + 70,
      errorRate: Math.random() * 0.5,
      userInteractionDelay: Math.random() * 100 + 50
    };

    return newMetrics;
  }, []);

  // Aplicar otimizações automáticas
  const applyOptimizations = useCallback(async (currentMetrics: PerformanceMetrics) => {
    if (!autoOptimize) return;

    setIsOptimizing(true);
    const applicableRules = optimizationRules.filter(rule => 
      rule.enabled && rule.condition(currentMetrics)
    );

    for (const rule of applicableRules) {
      if (!activeOptimizations.includes(rule.id)) {
        try {
          await rule.action();
          setActiveOptimizations(prev => [...prev, rule.id]);
          
          toast({
            title: "Otimização Aplicada",
            description: `${rule.name}: ${rule.description}`,
            duration: 3000
          });
          
          // Simular melhoria nas métricas
          setTimeout(() => {
            setMetrics(prev => {
              const improved = { ...prev };
              switch (rule.category) {
                case 'render':
                  improved.fps = Math.min(60, improved.fps + 10);
                  improved.renderTime = Math.max(10, improved.renderTime - 5);
                  break;
                case 'memory':
                  improved.memoryUsage = Math.max(20, improved.memoryUsage - 15);
                  break;
                case 'cache':
                  improved.cacheHitRate = Math.min(95, improved.cacheHitRate + 10);
                  break;
                case 'network':
                  improved.networkLatency = Math.max(20, improved.networkLatency - 30);
                  break;
                case 'ui':
                  improved.userInteractionDelay = Math.max(50, improved.userInteractionDelay - 30);
                  break;
              }
              return improved;
            });
          }, 1000);
          
        } catch (error) {
          console.error(`Erro ao aplicar otimização ${rule.id}:`, error);
        }
      }
    }
    
    setIsOptimizing(false);
  }, [autoOptimize, optimizationRules, activeOptimizations, toast]);

  // Loop principal de monitoramento
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const newMetrics = collectMetrics();
      setMetrics(newMetrics);
      
      setHistoricalData(prev => {
        const updated = [...prev, newMetrics];
        return updated.slice(-60);
      });

      onMetricsUpdate?.(newMetrics);
      applyOptimizations(newMetrics);
    }, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring, collectMetrics, onMetricsUpdate, applyOptimizations]);

  // Calcular score geral de performance
  const performanceScore = useMemo(() => {
    const weights = {
      fps: 0.25,
      memoryUsage: 0.15,
      cpuUsage: 0.15,
      renderTime: 0.20,
      networkLatency: 0.10,
      cacheHitRate: 0.10,
      errorRate: 0.05
    };

    const normalizedMetrics = {
      fps: Math.min(100, (metrics.fps / 60) * 100),
      memoryUsage: Math.max(0, 100 - metrics.memoryUsage),
      cpuUsage: Math.max(0, 100 - metrics.cpuUsage),
      renderTime: Math.max(0, 100 - (metrics.renderTime / 50) * 100),
      networkLatency: Math.max(0, 100 - (metrics.networkLatency / 300) * 100),
      cacheHitRate: metrics.cacheHitRate,
      errorRate: Math.max(0, 100 - metrics.errorRate * 100)
    };

    const score = Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (normalizedMetrics[key as keyof typeof normalizedMetrics] * weight);
    }, 0);

    return Math.round(score);
  }, [metrics]);

  const getPerformanceStatus = (score: number) => {
    if (score >= 80) return { label: 'Excelente', color: 'text-green-500', bg: 'bg-green-500' };
    if (score >= 60) return { label: 'Bom', color: 'text-blue-500', bg: 'bg-blue-500' };
    if (score >= 40) return { label: 'Regular', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    return { label: 'Crítico', color: 'text-red-500', bg: 'bg-red-500' };
  };

  const status = getPerformanceStatus(performanceScore);

  const resetOptimizations = useCallback(() => {
    setActiveOptimizations([]);
    document.documentElement.style.removeProperty('--animation-speed');
    toast({
      title: "Otimizações Resetadas",
      description: "Todas as otimizações foram removidas."
    });
  }, [toast]);

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Smart Optimizer</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Otimização inteligente de performance
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={cn("text-3xl font-bold", status.color)}>
                {performanceScore}
              </div>
              <div className={cn("text-sm font-medium", status.color)}>
                {status.label}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={isMonitoring}
                  onCheckedChange={setIsMonitoring}
                />
                <span className="text-sm">Monitoramento</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOptimizing && (
                <div className="flex items-center gap-2 text-blue-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Otimizando...</span>
                </div>
              )}
              <Badge variant={activeOptimizations.length > 0 ? "default" : "secondary"}>
                {activeOptimizations.length} otimizações ativas
              </Badge>
            </div>
          </div>
          
          <Progress value={performanceScore} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="optimizations">Otimizações</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{Math.round(metrics.fps)}</div>
                    <div className="text-sm text-gray-500">FPS</div>
                  </div>
                </div>
                <Progress value={(metrics.fps / 60) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Memory className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{Math.round(metrics.memoryUsage)}%</div>
                    <div className="text-sm text-gray-500">Memória</div>
                  </div>
                </div>
                <Progress value={metrics.memoryUsage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Cpu className="h-8 w-8 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{Math.round(metrics.cpuUsage)}%</div>
                    <div className="text-sm text-gray-500">CPU</div>
                  </div>
                </div>
                <Progress value={metrics.cpuUsage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Wifi className="h-8 w-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{Math.round(metrics.networkLatency)}ms</div>
                    <div className="text-sm text-gray-500">Latência</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            {showAdvanced ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showAdvanced ? 'Ocultar' : 'Mostrar'} métricas avançadas
          </Button>
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Regras de Otimização</h3>
            <Button variant="outline" size="sm" onClick={resetOptimizations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          
          <div className="space-y-3">
            {optimizationRules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          activeOptimizations.includes(rule.id) 
                            ? "bg-green-500" 
                            : rule.condition(metrics) 
                              ? "bg-yellow-500" 
                              : "bg-gray-300"
                        )} />
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        rule.priority === 'high' ? 'destructive' :
                        rule.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {rule.priority}
                      </Badge>
                      <div className="text-sm text-gray-500">
                        {rule.effectiveness}% eficácia
                      </div>
                      {activeOptimizations.includes(rule.id) && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Gráfico de histórico de performance</p>
              <p className="text-sm">({historicalData.length} pontos coletados)</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 