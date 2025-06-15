import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Zap, CheckCircle, AlertTriangle } from 'lucide-react';

interface OptimizationItem {
  id: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  applied: boolean;
}

interface SystemOptimizerProps {
  className?: string;
}

export const SystemOptimizer: React.FC<SystemOptimizerProps> = ({ className = '' }) => {
  const [optimizations, setOptimizations] = useState<OptimizationItem[]>([
    {
      id: 'memory-cleanup',
      title: 'Limpeza de Memória',
      description: 'Remove objetos não utilizados da memória',
      impact: 'high',
      applied: false
    },
    {
      id: 'cache-optimization',
      title: 'Otimização de Cache',
      description: 'Melhora estratégias de cache para performance',
      impact: 'medium',
      applied: false
    },
    {
      id: 'render-optimization',
      title: 'Otimização de Renderização',
      description: 'Reduz re-renders desnecessários',
      impact: 'high',
      applied: false
    }
  ]);

  const [performanceScore, setPerformanceScore] = useState(75);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const applyOptimization = async (id: string) => {
    setIsOptimizing(true);
    
    // Simular otimização
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setOptimizations(prev => 
      prev.map(opt => 
        opt.id === id ? { ...opt, applied: true } : opt
      )
    );
    
    // Melhorar score
    setPerformanceScore(prev => Math.min(100, prev + 10));
    setIsOptimizing(false);
  };

  const appliedCount = optimizations.filter(opt => opt.applied).length;
  const totalCount = optimizations.length;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            System Performance Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Score de Performance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Performance Score</span>
                <span className="text-2xl font-bold text-blue-600">{performanceScore}</span>
              </div>
              <Progress value={performanceScore} className="h-2" />
              <p className="text-xs text-gray-600">
                {performanceScore >= 90 ? 'Excelente' : 
                 performanceScore >= 70 ? 'Bom' : 
                 performanceScore >= 50 ? 'Regular' : 'Precisa Melhorar'}
              </p>
            </div>

            {/* Progresso das Otimizações */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Otimizações Aplicadas</span>
                <span className="text-lg font-semibold">{appliedCount}/{totalCount}</span>
              </div>
              <Progress value={(appliedCount / totalCount) * 100} className="h-2" />
              <p className="text-xs text-gray-600">
                {appliedCount === totalCount ? 'Sistema totalmente otimizado!' : 
                 `${totalCount - appliedCount} otimizações disponíveis`}
              </p>
            </div>
          </div>

          {/* Lista de Otimizações */}
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Otimizações Disponíveis</h3>
            {optimizations.map((optimization) => (
              <div 
                key={optimization.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  {optimization.applied ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {optimization.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {optimization.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getImpactColor(optimization.impact)}>
                    {optimization.impact}
                  </Badge>
                  <Button
                    size="sm"
                    variant={optimization.applied ? "outline" : "default"}
                    onClick={() => applyOptimization(optimization.id)}
                    disabled={optimization.applied || isOptimizing}
                  >
                    {optimization.applied ? (
                      'Aplicado'
                    ) : isOptimizing ? (
                      'Aplicando...'
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-1" />
                        Aplicar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {appliedCount === totalCount && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Sistema Totalmente Otimizado!</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Todas as otimizações foram aplicadas com sucesso. O sistema está rodando em performance máxima.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 