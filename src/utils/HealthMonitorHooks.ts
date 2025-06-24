import { useState, useEffect } from 'react';
import type { SystemHealth} from './HealthMonitorCore';
import { ApplicationHealthMonitor, HealthMetric } from './HealthMonitorCore';

export function useHealthMonitor() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitor] = useState(() => ApplicationHealthMonitor.getInstance());

  useEffect(() => {
    const unsubscribe = monitor.subscribe((healthData) => {
      setHealth(healthData);
    });

    return unsubscribe;
  }, [monitor]);

  const startMonitoring = (intervalMs?: number) => {
    monitor.startMonitoring(intervalMs);
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    monitor.stopMonitoring();
    setIsMonitoring(false);
  };

  const autoFix = async (issueId: string): Promise<boolean> => {
    return monitor.autoFix(issueId);
  };

  const getSystemHealth = (): SystemHealth => {
    return monitor.getSystemHealth();
  };

  const refreshMetrics = () => {
    // Force a metrics collection
    setHealth(monitor.getSystemHealth());
  };

  return {
    health,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    autoFix,
    getSystemHealth,
    refreshMetrics,
    monitor
  };
} 