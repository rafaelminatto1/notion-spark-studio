import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Zap, TrendingUp, Cpu, MemoryStick, Wifi, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface OptimizationMetrics {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
  overall: number;
}

interface OptimizationAction {
  id: string;
  name: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  category: 'performance' | 'memory' | 'network' | 'storage';
  executed: boolean;
  executedAt?: number;
  improvement?: number;
}

export const SmartOptimizer: React.FC = () => {
  const [metrics, setMetrics] = useState<OptimizationMetrics>({
    cpu: 85,
    memory: 72,
    network: 91,
    storage: 68,
    overall: 79
  });

  const [optimizations, setOptimizations] = useState<OptimizationAction[]>([
    {
      id: 'lazy-loading',
      name: 'Ativar Lazy Loading',
      description: 'Carregamento preguiçoso de componentes pesados',
      impact: 'high',
      category: 'performance',
      executed: false
    },
    {
      id: 'memory-cleanup',
      name: 'Limpeza de Memória',
      description: 'Limpar dados não utilizados da memória',
      impact: 'medium',
      category: 'memory',
      executed: false
    },
    {
      id: 'cache-optimization',
      name: 'Otimizar Cache',
      description: 'Melhorar estratégias de cache do navegador',
      impact: 'high',
      category: 'network',
      executed: false
    },
    {
      id: 'storage-compression',
      name: 'Comprimir Storage',
      description: 'Comprimir dados armazenados localmente',
      impact: 'medium',
      category: 'storage',
      executed: false
    },
    {
      id: 'bundle-splitting',
      name: 'Code Splitting',
      description: 'Dividir bundle JavaScript em chunks menores',
      impact: 'high',
      category: 'performance',
      executed: false
    },
    {
      id: 'prefetch-optimization',
      name: 'Prefetch Inteligente',
      description: 'Pré-carregar recursos baseado em padrões de uso',
      impact: 'medium',
      category: 'network',
      executed: false
    }
  ]);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);

  // Monitor performance metrics
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time metrics
      setMetrics(prev => ({
        cpu: Math.max(20, Math.min(95, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(30, Math.min(90, prev.memory + (Math.random() - 0.5) * 8)),
        network: Math.max(50, Math.min(100, prev.network + (Math.random() - 0.5) * 5)),
        storage: Math.max(40, Math.min(85, prev.storage + (Math.random() - 0.5) * 6)),
        overall: 0 // Will be calculated
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Calculate overall score
  useEffect(() => {
    const overall = (metrics.cpu + metrics.memory + metrics.network + metrics.storage) / 4;
    setMetrics(prev => ({ ...prev, overall }));
  }, [metrics.cpu, metrics.memory, metrics.network, metrics.storage]);

  // Auto-optimization when performance drops
  useEffect(() => {
    if (autoOptimize && metrics.overall < 70 && !isOptimizing) {
      const unexecutedOptimizations = optimizations.filter(opt => !opt.executed);
      if (unexecutedOptimizations.length > 0) {
        executeOptimization(unexecutedOptimizations[0].id);
      }
    }
  }, [metrics.overall, autoOptimize, isOptimizing, optimizations]);

  const executeOptimization = useCallback(async (optimizationId: string) => {
    if (isOptimizing) return;

    setIsOptimizing(true);
    
    try {
      // Simulate optimization execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setOptimizations(prev => prev.map(opt => 
        opt.id === optimizationId 
          ? { 
              ...opt, 
              executed: true, 
              executedAt: Date.now(),
              improvement: Math.random() * 15 + 5 // 5-20% improvement
            }
          : opt
      ));

      // Apply improvement to metrics
      const optimization = optimizations.find(opt => opt.id === optimizationId);
      if (optimization) {
        const improvement = Math.random() * 15 + 5;
        
        setMetrics(prev => {
          const newMetrics = { ...prev };
          
          switch (optimization.category) {
            case 'performance':
              newMetrics.cpu = Math.min(95, prev.cpu + improvement);
              break;
            case 'memory':
              newMetrics.memory = Math.min(95, prev.memory + improvement);
              break;
            case 'network':
              newMetrics.network = Math.min(95, prev.network + improvement);
              break;
            case 'storage':
              newMetrics.storage = Math.min(95, prev.storage + improvement);
              break;
          }
          
          return newMetrics;
        });
      }

      console.log(`[SmartOptimizer] Executed optimization: ${optimization?.name}`);
    } catch (error) {
      console.error('[SmartOptimizer] Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [isOptimizing, optimizations]);

  const executeAllOptimizations = useCallback(async () => {
    const unexecuted = optimizations.filter(opt => !opt.executed);
    
    for (const optimization of unexecuted) {
      await executeOptimization(optimization.id);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between optimizations
    }
  }, [optimizations, executeOptimization]);

  const resetOptimizations = useCallback(() => {
    setOptimizations(prev => prev.map(opt => ({
      ...opt,
      executed: false,
      executedAt: undefined,
      improvement: undefined
    })));
  }, []);

  const getMetricColor = (value: number) => {
    if (value >= 80) return 'text-green-500';
    if (value >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMetricBgColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'memory': return <MemoryStick className="w-4 h-4" />;
      case 'network': return <Wifi className="w-4 h-4" />;
      case 'storage': return <Activity className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Smart Optimizer
          </h2>
          <p className="text-muted-foreground">
            Otimização automática e inteligente de performance
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoOptimize(!autoOptimize)}
          >
            Auto: {autoOptimize ? 'ON' : 'OFF'}
          </Button>
          <Button
            onClick={executeAllOptimizations}
            disabled={isOptimizing}
            size="sm"
          >
            {isOptimizing ? 'Otimizando...' : 'Otimizar Tudo'}
          </Button>
        </div>
      </div>

      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getMetricColor(metrics.overall)}`}>
                {metrics.overall.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">
                {metrics.overall >= 80 ? 'Excelente' : metrics.overall >= 60 ? 'Bom' : 'Precisa Melhorar'}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  CPU
                </span>
                <span className="text-sm font-mono">{metrics.cpu.toFixed(0)}%</span>
              </div>
              <Progress value={metrics.cpu} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <MemoryStick className="w-4 h-4" />
                  Memória
                </span>
                <span className="text-sm font-mono">{metrics.memory.toFixed(0)}%</span>
              </div>
              <Progress value={metrics.memory} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Rede
                </span>
                <span className="text-sm font-mono">{metrics.network.toFixed(0)}%</span>
              </div>
              <Progress value={metrics.network} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Storage
                </span>
                <span className="text-sm font-mono">{metrics.storage.toFixed(0)}%</span>
              </div>
              <Progress value={metrics.storage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Otimizações Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizations.map((optimization) => (
              <div
                key={optimization.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {optimization.executed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getCategoryIcon(optimization.category)}
                      <h4 className="font-medium">{optimization.name}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getImpactColor(optimization.impact)}`}
                      >
                        {optimization.impact.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {optimization.description}
                    </p>
                    {optimization.executed && optimization.improvement && (
                      <p className="text-xs text-green-600 mt-1">
                        Melhoria: +{optimization.improvement.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!optimization.executed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => executeOptimization(optimization.id)}
                      disabled={isOptimizing}
                    >
                      {isOptimizing ? 'Executando...' : 'Executar'}
                    </Button>
                  )}
                  
                  {optimization.executed && optimization.executedAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(optimization.executedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {optimizations.every(opt => opt.executed) && (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Todas as otimizações foram executadas!
              </p>
              <Button variant="outline" onClick={resetOptimizations}>
                Resetar Otimizações
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status em Tempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{optimizations.filter(opt => opt.executed).length}</div>
              <div className="text-sm text-muted-foreground">Otimizações Ativas</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">
                {optimizations.filter(opt => opt.executed).reduce((sum, opt) => sum + (opt.improvement || 0), 0).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Melhoria Total</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{autoOptimize ? 'ON' : 'OFF'}</div>
              <div className="text-sm text-muted-foreground">Auto-Otimização</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className={`text-2xl font-bold ${getMetricColor(metrics.overall)}`}>
                {metrics.overall >= 80 ? '✓' : metrics.overall >= 60 ? '⚠' : '✗'}
              </div>
              <div className="text-sm text-muted-foreground">Status Sistema</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartOptimizer; 