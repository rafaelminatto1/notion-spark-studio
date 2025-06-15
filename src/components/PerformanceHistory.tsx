import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  networkLatency: number;
  timestamp: number;
}

interface PerformanceHistoryProps {
  history: PerformanceMetrics[];
  onClear: () => void;
  onExport: () => void;
}

export const PerformanceHistory: React.FC<PerformanceHistoryProps> = ({
  history,
  onClear,
  onExport
}) => {
  if (history.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">
          Nenhum dado de histórico disponível
        </div>
      </Card>
    );
  }

  const chartData = {
    labels: history.map(h => new Date(h.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'FPS',
        data: history.map(h => h.fps),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Memória (%)',
        data: history.map(h => h.memoryUsage),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      },
      {
        label: 'Renderização (ms)',
        data: history.map(h => h.renderTime),
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1
      },
      {
        label: 'Latência (ms)',
        data: history.map(h => h.networkLatency),
        borderColor: 'rgb(255, 159, 64)',
        tension: 0.1
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Histórico de Performance'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Histórico de Performance</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </div>
      </div>

      <div className="h-64">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="mt-4 text-sm text-gray-500">
        {history.length} pontos de dados coletados
      </div>
    </Card>
  );
}; 