// Tipos para monitoramento de saúde do sistema
// Modulariza tipos em arquivo separado para melhor organização

export interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: {
    warning: number;
    critical: number;
  };
  description: string;
  lastUpdated: Date;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  score: number;
  metrics: HealthMetric[];
  issues: HealthIssue[];
  recommendations: HealthRecommendation[];
}

export interface HealthIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  solution: string;
  autoFixable: boolean;
  timestamp: Date;
}

export interface HealthRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  implementation: () => Promise<void>;
}

export interface HealthConfig {
  monitoringInterval: number;
  performanceThresholds: {
    fps: { warning: number; critical: number };
    responseTime: { warning: number; critical: number };
    bundleSize: { warning: number; critical: number };
    memory: { warning: number; critical: number };
    storage: { warning: number; critical: number };
    latency: { warning: number; critical: number };
  };
  autoFix: boolean;
  notifications: boolean;
}

export interface StorageMetrics {
  used: number;
  total: number;
  percentage: number;
}

export interface NetworkMetrics {
  isOnline: boolean;
  latency: number;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export interface PerformanceMetrics {
  fps: number;
  responseTime: number;
  bundleSize: number;
  loadTime: number;
}

export interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
  gc?: {
    collections: number;
    time: number;
  };
}

export type HealthObserver = (health: SystemHealth) => void;

export type MetricStatus = 'healthy' | 'warning' | 'critical';

export interface MetricCollector {
  collect(): Promise<Record<string, HealthMetric>>;
}

// Error types
export class HealthMonitorError extends Error {
  constructor(message: string, public code: string, public originalError?: unknown) {
    super(message);
    this.name = 'HealthMonitorError';
  }
}

export class MetricCollectionError extends HealthMonitorError {
  constructor(metricId: string, originalError?: unknown) {
    super(`Failed to collect metric: ${metricId}`, 'METRIC_COLLECTION_FAILED', originalError);
  }
} 