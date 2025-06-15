import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ComponentMetrics {
  name: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  memoryUsage: number;
  isSlowComponent: boolean;
}

interface PerformanceComponentsProps {
  components: ComponentMetrics[];
}

export const PerformanceComponents: React.FC<PerformanceComponentsProps> = ({
  components
}) => {
  if (components.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">
          Nenhum dado de componente disponível
        </div>
      </Card>
    );
  }

  const sortedComponents = [...components].sort((a, b) => {
    if (a.isSlowComponent && !b.isSlowComponent) return -1;
    if (!a.isSlowComponent && b.isSlowComponent) return 1;
    return b.renderCount - a.renderCount;
  });

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Métricas de Componentes</h3>
      
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {sortedComponents.map((component) => (
            <div
              key={component.name}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{component.name}</span>
                  {component.isSlowComponent && (
                    <Badge variant="destructive" className="text-xs">
                      Lento
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-500 space-y-1">
                  <div>
                    {component.renderCount} renderizações •{' '}
                    {component.averageRenderTime.toFixed(1)}ms média
                  </div>
                  <div>
                    Última renderização: {component.lastRenderTime.toFixed(1)}ms •{' '}
                    Memória: {component.memoryUsage.toFixed(1)}MB
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge
                  variant={component.isSlowComponent ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {component.renderCount} renders
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}; 