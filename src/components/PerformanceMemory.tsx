import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Database, HardDrive, Memory } from 'lucide-react';

interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  objects: {
    name: string;
    size: number;
    count: number;
  }[];
}

interface PerformanceMemoryProps {
  metrics: MemoryMetrics;
}

export const PerformanceMemory: React.FC<PerformanceMemoryProps> = ({ metrics }) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getMemoryUsagePercentage = () => {
    return (metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100;
  };

  const getMemoryColor = (percentage: number) => {
    if (percentage >= 85) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Métricas de Memória</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Memory className="h-5 w-5" />
          <div>
            <p className="text-sm text-gray-500">Memória Usada</p>
            <p className="font-semibold">{formatBytes(metrics.usedJSHeapSize)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <HardDrive className="h-5 w-5" />
          <div>
            <p className="text-sm text-gray-500">Memória Total</p>
            <p className="font-semibold">{formatBytes(metrics.totalJSHeapSize)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <div>
            <p className="text-sm text-gray-500">Limite</p>
            <p className="font-semibold">{formatBytes(metrics.jsHeapSizeLimit)}</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-500">Uso de Memória</span>
          <span className="text-sm font-medium">
            {getMemoryUsagePercentage().toFixed(1)}%
          </span>
        </div>
        <Progress
          value={getMemoryUsagePercentage()}
          className={getMemoryColor(getMemoryUsagePercentage())}
        />
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Objetos em Memória</h4>
        <div className="space-y-2">
          {metrics.objects.map((obj, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center space-x-2">
                <span className="font-medium">{obj.name}</span>
                <Badge variant="secondary">{obj.count}</Badge>
              </div>
              <span className="text-sm text-gray-500">
                {formatBytes(obj.size)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}; 