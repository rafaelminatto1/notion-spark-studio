import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  Database,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  Gauge
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PerformanceAnalyzer, 
  BundleAnalyzer, 
  IntelligentPreloader,
  AdvancedCacheManager 
} from '@/utils/PerformanceOptimizer';
import { useSmartCache } from '@/utils/SmartCache';
import { useBackupSystem } from '@/utils/BackupSystem';

// Tipos para métricas
interface PerformanceMetric {
  label: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'poor';
  change?: number;
}

interface SystemHealth {
  overall: number;
  categories: {
    performance: number;
    cache: number;
    bundle: number;
    network: number;
  };
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 85,
    categories: {
      performance: 90,
      cache: 85,
      bundle: 80,
      network: 88
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [bundleReport, setBundleReport] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  
  const cache = useSmartCache();
  const backup = useBackupSystem();

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    setIsLoading(true);
    
    try {
      // Análise de performance
      const performanceData = await PerformanceAnalyzer.analyzeBundle();
      
      // Relatório de bundle
      const report = BundleAnalyzer.getPerformanceReport();
      setBundleReport(report);
      
      // Stats de cache
      const stats = cache.getStats();
      setCacheStats(stats);
      
      // Converter para métricas display
      const newMetrics: PerformanceMetric[] = [
        {
          label: 'Bundle Size',
          value: performanceData.bundleSize / 1024 / 1024, // MB
          unit: 'MB',
          status: performanceData.bundleSize > 2 * 1024 * 1024 ? 'warning' : 'good',
          change: -5.2
        },
        {
          label: 'Load Time',
          value: performanceData.loadTime,
          unit: 'ms',
          status: performanceData.loadTime > 3000 ? 'poor' : performanceData.loadTime > 1500 ? 'warning' : 'excellent',
          change: -12.8
        },
        {
          label: 'Cache Hit Rate',
          value: performanceData.cacheHitRate,
          unit: '%',
          status: performanceData.cacheHitRate > 80 ? 'excellent' : performanceData.cacheHitRate > 60 ? 'good' : 'warning',
          change: +8.4
        },
        {
          label: 'Memory Usage',
          value: performanceData.memoryUsage,
          unit: '%',
          status: performanceData.memoryUsage > 80 ? 'warning' : 'good',
          change: -3.1
        }
      ];
      
      setMetrics(newMetrics);
      
      // Calcular health score
      const healthScore = calculateHealthScore(newMetrics);
      setSystemHealth(healthScore);
      
    } catch (error) {
      console.error('Erro ao carregar dados de performance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHealthScore = (metrics: PerformanceMetric[]): SystemHealth => {
    const scores = metrics.map(metric => {
      switch (metric.status) {
        case 'excellent': return 100;
        case 'good': return 80;
        case 'warning': return 60;
        case 'poor': return 30;
        default: return 50;
      }
    });
    
    const overall = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    return {
      overall,
      categories: {
        performance: scores[1] || 80, // Load time
        cache: scores[2] || 80,      // Cache hit rate
        bundle: scores[0] || 80,     // Bundle size
        network: overall             // Overall network performance
      }
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const runOptimizations = async () => {
    setIsLoading(true);
    
    try {
      // Simular otimizações
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Gerar sugestões
      const suggestions = PerformanceAnalyzer.generateOptimizationSuggestions();
      
      for (const suggestion of suggestions) {
        await suggestion.implementation();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Recarregar dados
      await loadPerformanceData();
      
    } catch (error) {
      console.error('Erro durante otimizações:', error);
    }
  };

  const clearAllCaches = async () => {
    try {
      await cache.clear();
      await AdvancedCacheManager.initialize();
      await loadPerformanceData();
    } catch (error) {
      console.error('Erro ao limpar caches:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Analisando performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600 mt-2">Monitoramento em tempo real da performance do sistema</p>
        </div>
        
        <div className="flex gap-3">
          <Button onClick={loadPerformanceData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={runOptimizations} variant="default" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Otimizar
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Health Score Geral
          </CardTitle>
          <CardDescription>
            Avaliação geral da saúde do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl font-bold text-green-600">
              {Math.round(systemHealth.overall)}%
            </div>
            <Badge className={systemHealth.overall > 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
              {systemHealth.overall > 80 ? 'Excelente' : 'Bom'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(systemHealth.categories).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-semibold mb-1">{Math.round(value)}%</div>
                <div className="text-sm text-gray-600 capitalize">{key}</div>
                <Progress value={value} className="mt-2 h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="bundles">Bundles</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="optimizations">Otimizações</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-600">
                        {metric.label}
                      </div>
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {metric.value.toFixed(1)}{metric.unit}
                    </div>
                    {metric.change && (
                      <div className={`flex items-center text-sm ${
                        metric.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.change > 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(metric.change).toFixed(1)}%
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bundles" className="space-y-6">
          {bundleReport && (
            <Card>
              <CardHeader>
                <CardTitle>Bundle Analysis</CardTitle>
                <CardDescription>
                  Análise detalhada dos chunks carregados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <div className="text-2xl font-bold">{bundleReport.totalChunks}</div>
                    <div className="text-sm text-gray-600">Total Chunks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {(bundleReport.totalSize / 1024 / 1024).toFixed(2)}MB
                    </div>
                    <div className="text-sm text-gray-600">Total Size</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {bundleReport.avgLoadTime.toFixed(0)}ms
                    </div>
                    <div className="text-sm text-gray-600">Avg Load Time</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Most Efficient Chunks</h4>
                    {bundleReport.mostEfficient.map((chunk: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <span className="font-medium">{chunk.name}</span>
                        <span className="text-sm text-gray-600">
                          {(chunk.efficiency * 1000).toFixed(0)} bytes/ms
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">Least Efficient Chunks</h4>
                    {bundleReport.leastEfficient.map((chunk: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <span className="font-medium">{chunk.name}</span>
                        <span className="text-sm text-gray-600">
                          {(chunk.efficiency * 1000).toFixed(0)} bytes/ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cache" className="space-y-6">
          {cacheStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cache Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Entries:</span>
                      <span className="font-semibold">{cacheStats.totalEntries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Size:</span>
                      <span className="font-semibold">
                        {(cacheStats.totalSize / 1024).toFixed(2)} KB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hit Rate:</span>
                      <span className="font-semibold text-green-600">
                        {cacheStats.hitRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory Usage:</span>
                      <span className="font-semibold">
                        {cacheStats.memoryUsage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={clearAllCaches}
                    variant="destructive" 
                    size="sm" 
                    className="w-full mt-4"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Caches
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Hot & Cold Keys</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-red-500 mb-2">Hot Keys</h4>
                      {cache.getHotKeys().slice(0, 5).map((key: string, index: number) => (
                        <div key={index} className="text-sm py-1 border-b">
                          {key}
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-blue-500 mb-2">Cold Keys</h4>
                      {cache.getColdKeys().slice(0, 5).map((key: string, index: number) => (
                        <div key={index} className="text-sm py-1 border-b">
                          {key}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Suggestions</CardTitle>
              <CardDescription>
                Sugestões automáticas baseadas na análise atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PerformanceAnalyzer.generateOptimizationSuggestions().map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className={`p-2 rounded-full ${
                      suggestion.priority === 'critical' ? 'bg-red-100 text-red-600' :
                      suggestion.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                      suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {suggestion.priority === 'critical' ? <AlertTriangle className="h-5 w-5" /> : 
                       suggestion.priority === 'high' ? <Info className="h-5 w-5" /> :
                       <CheckCircle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{suggestion.description}</h4>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.impact}</p>
                      <Badge className="mt-2" variant="outline">
                        {suggestion.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 