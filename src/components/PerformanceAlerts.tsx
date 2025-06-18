import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
  metric: string;
}

interface PerformanceAlertsProps {
  alerts: PerformanceAlert[];
  onDismiss?: (alertId: string) => void;
}

export const PerformanceAlerts: React.FC<PerformanceAlertsProps> = ({
  alerts,
  onDismiss
}) => {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <Alert
          key={alert.id}
          variant={alert.type === 'error' ? 'destructive' : 'default'}
          className={cn(
            'transition-all duration-200',
            alert.type === 'warning' && "bg-yellow-50 dark:bg-yellow-950/20",
            alert.type === 'info' && "bg-blue-50 dark:bg-blue-950/20"
          )}
        >
          {alert.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {alert.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
          {alert.type === 'info' && <Info className="h-4 w-4" />}
          
          <AlertTitle>
            {alert.type === 'error' && 'Erro de Performance'}
            {alert.type === 'warning' && 'Aviso de Performance'}
            {alert.type === 'info' && 'Informação de Performance'}
          </AlertTitle>
          
          <AlertDescription>
            <div className="flex justify-between items-center">
              <span>{alert.message}</span>
              {onDismiss && (
                <button
                  onClick={() => { onDismiss(alert.id); }}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Dismiss
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}; 