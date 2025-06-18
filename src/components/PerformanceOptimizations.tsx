import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Cpu, Network, Zap } from 'lucide-react';

interface PerformanceOptimization {
  id: string;
  type: 'memory' | 'rendering' | 'network' | 'bundle';
  description: string;
  impact: 'low' | 'medium' | 'high';
  applied: boolean;
  automatic: boolean;
}

interface PerformanceOptimizationsProps {
  optimizations: PerformanceOptimization[];
  onApply: (optimizationId: string) => void;
}

export const PerformanceOptimizations: React.FC<PerformanceOptimizationsProps> = ({
  optimizations,
  onApply
}) => {
  if (optimizations.length === 0) {
    return null;
  }

  const getOptimizationIcon = (type: PerformanceOptimization['type']) => {
    switch (type) {
      case 'memory':
        return <Cpu className="h-5 w-5" />;
      case 'rendering':
        return <Zap className="h-5 w-5" />;
      case 'network':
        return <Network className="h-5 w-5" />;
      case 'bundle':
        return <Clock className="h-5 w-5" />;
    }
  };

  const getImpactColor = (impact: PerformanceOptimization['impact']) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Otimizações Sugeridas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {optimizations.map(optimization => (
          <Card key={optimization.id} className="p-4">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                {getOptimizationIcon(optimization.type)}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{optimization.description}</h4>
                  <Badge
                    variant="secondary"
                    className={getImpactColor(optimization.impact)}
                  >
                    Impacto {optimization.impact}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  {optimization.applied ? (
                    <Badge variant="success" className="flex items-center space-x-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Aplicada</span>
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => { onApply(optimization.id); }}
                      disabled={optimization.automatic}
                    >
                      {optimization.automatic ? 'Automática' : 'Aplicar'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}; 