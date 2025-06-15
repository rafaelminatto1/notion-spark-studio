import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, AlertCircle, Zap, Cpu, Clock, Network } from 'lucide-react';

interface PerformanceAlert {
  type: 'warning' | 'error';
  message: string;
  timestamp: number;
}

interface PerformanceToastAlertsProps {
  alerts: PerformanceAlert[];
  isMonitoring: boolean;
}

export const PerformanceToastAlerts: React.FC<PerformanceToastAlertsProps> = ({
  alerts,
  isMonitoring
}) => {
  useEffect(() => {
    if (!isMonitoring || alerts.length === 0) return;

    // Pegar apenas os alertas mais recentes (últimos 5 segundos)
    const recentAlerts = alerts.filter(
      alert => Date.now() - alert.timestamp < 5000
    );

    recentAlerts.forEach(alert => {
      const getIcon = () => {
        if (alert.message.includes('FPS')) return <Zap className="w-4 h-4" />;
        if (alert.message.includes('memória')) return <Cpu className="w-4 h-4" />;
        if (alert.message.includes('renderização')) return <Clock className="w-4 h-4" />;
        if (alert.message.includes('latência')) return <Network className="w-4 h-4" />;
        return alert.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />;
      };

      const toastOptions = {
        icon: getIcon(),
        duration: alert.type === 'error' ? 8000 : 5000,
        className: alert.type === 'error' 
          ? 'border-red-500 bg-red-50 text-red-900' 
          : 'border-yellow-500 bg-yellow-50 text-yellow-900',
        action: {
          label: 'Ver Detalhes',
          onClick: () => {
            // Scroll para o monitor de performance
            const performanceSection = document.getElementById('performance-monitor');
            if (performanceSection) {
              performanceSection.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }
      };

      if (alert.type === 'error') {
        toast.error(alert.message, toastOptions);
      } else {
        toast.warning(alert.message, toastOptions);
      }
    });
  }, [alerts, isMonitoring]);

  return null; // Este componente não renderiza nada visualmente
};

// Hook personalizado para usar alertas de performance
export const usePerformanceToasts = (alerts: PerformanceAlert[], isMonitoring: boolean) => {
  useEffect(() => {
    if (!isMonitoring) return;

    // Agrupar alertas por tipo para evitar spam
    const alertGroups = alerts.reduce((groups, alert) => {
      const key = alert.message.split(' ')[0]; // Primeira palavra como chave
      if (!groups[key]) groups[key] = [];
      groups[key].push(alert);
      return groups;
    }, {} as Record<string, PerformanceAlert[]>);

    Object.entries(alertGroups).forEach(([type, typeAlerts]) => {
      const recentAlerts = typeAlerts.filter(
        alert => Date.now() - alert.timestamp < 3000
      );

      if (recentAlerts.length > 0) {
        const latestAlert = recentAlerts[recentAlerts.length - 1];
        
        const getToastConfig = (alert: PerformanceAlert) => {
          const baseConfig = {
            duration: alert.type === 'error' ? 6000 : 4000,
            action: {
              label: 'Otimizar',
              onClick: () => {
                const optimizationsSection = document.getElementById('performance-optimizations');
                if (optimizationsSection) {
                  optimizationsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }
            }
          };

          if (alert.message.includes('FPS')) {
            return {
              ...baseConfig,
              icon: <Zap className="w-4 h-4 text-blue-500" />,
              description: 'Considere otimizar a renderização dos componentes'
            };
          }

          if (alert.message.includes('memória')) {
            return {
              ...baseConfig,
              icon: <Cpu className="w-4 h-4 text-purple-500" />,
              description: 'Verifique possíveis vazamentos de memória'
            };
          }

          if (alert.message.includes('renderização')) {
            return {
              ...baseConfig,
              icon: <Clock className="w-4 h-4 text-orange-500" />,
              description: 'Implemente memoização nos componentes lentos'
            };
          }

          if (alert.message.includes('latência')) {
            return {
              ...baseConfig,
              icon: <Network className="w-4 h-4 text-green-500" />,
              description: 'Verifique a conexão de rede'
            };
          }

          return {
            ...baseConfig,
            icon: alert.type === 'error' 
              ? <AlertCircle className="w-4 h-4 text-red-500" /> 
              : <AlertTriangle className="w-4 h-4 text-yellow-500" />
          };
        };

        const config = getToastConfig(latestAlert);

        if (latestAlert.type === 'error') {
          toast.error(latestAlert.message, config);
        } else {
          toast.warning(latestAlert.message, config);
        }
      }
    });
  }, [alerts, isMonitoring]);
}; 