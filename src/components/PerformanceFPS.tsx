import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap } from 'lucide-react';

interface FPSMetrics {
  current: number;
  average: number;
  min: number;
  max: number;
  history: {
    timestamp: number;
    fps: number;
  }[];
}

interface PerformanceFPSProps {
  metrics: FPSMetrics;
}

export const PerformanceFPS: React.FC<PerformanceFPSProps> = ({ metrics }) => {
  const getFPSColor = (fps: number) => {
    if (fps <= 20) return 'text-red-500';
    if (fps <= 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Métricas de FPS</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <div>
            <p className="text-sm text-gray-500">FPS Atual</p>
            <p className={`text-2xl font-bold ${getFPSColor(metrics.current)}`}>
              {metrics.current}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Média</p>
          <p className={`text-2xl font-bold ${getFPSColor(metrics.average)}`}>
            {metrics.average.toFixed(1)}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Mínimo</p>
          <p className={`text-2xl font-bold ${getFPSColor(metrics.min)}`}>
            {metrics.min}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Máximo</p>
          <p className={`text-2xl font-bold ${getFPSColor(metrics.max)}`}>
            {metrics.max}
          </p>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metrics.history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, Math.max(60, metrics.max)]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              labelFormatter={formatTimestamp}
              formatter={(value: number) => [`${value} FPS`, 'FPS']}
            />
            <Line
              type="monotone"
              dataKey="fps"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}; 