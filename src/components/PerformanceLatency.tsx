import React from 'react';
import { Card } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LatencyMetrics {
  current: number;
  average: number;
  min: number;
  max: number;
  history: {
    timestamp: number;
    latency: number;
  }[];
}

interface PerformanceLatencyProps {
  metrics: LatencyMetrics;
}

export const PerformanceLatency: React.FC<PerformanceLatencyProps> = ({ metrics }) => {
  const getLatencyColor = (latency: number) => {
    if (latency >= 200) return 'text-red-500';
    if (latency >= 100) return 'text-yellow-500';
    return 'text-green-500';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Métricas de Latência</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-500">Latência Atual</div>
          <div className={`text-2xl font-bold ${getLatencyColor(metrics.current)}`}>
            {metrics.current.toFixed(2)}ms
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Latência Média</div>
          <div className={`text-2xl font-bold ${getLatencyColor(metrics.average)}`}>
            {metrics.average.toFixed(2)}ms
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Latência Mínima</div>
          <div className="text-2xl font-bold text-green-500">
            {metrics.min.toFixed(2)}ms
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Latência Máxima</div>
          <div className={`text-2xl font-bold ${getLatencyColor(metrics.max)}`}>
            {metrics.max.toFixed(2)}ms
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metrics.history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, Math.max(metrics.max * 1.2, 100)]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              labelFormatter={formatTimestamp}
              formatter={(value: number) => [`${value.toFixed(2)}ms`, 'Latência']}
            />
            <Line
              type="monotone"
              dataKey="latency"
              stroke="#8884d8"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}; 