// Tipos comuns para substituir 'any' em todo o projeto

export type UnknownRecord = Record<string, unknown>;
export type StringRecord = Record<string, string>;
export type NumberRecord = Record<string, number>;
export type BooleanRecord = Record<string, boolean>;

// Tipos para valores de formulário
export type FormValue = string | number | boolean | Date | null | undefined;
export type FormValues = Record<string, FormValue>;

// Tipos para configurações genéricas
export interface GenericSetting<T = FormValue> {
  key: string;
  value: T;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect';
  label: string;
  description?: string;
  options?: Array<{ value: T; label: string }>;
}

// Tipos para eventos genéricos
export interface GenericEventData {
  type: string;
  timestamp: number;
  userId?: string;
  metadata?: UnknownRecord;
}

// Tipos para navegação
export interface NavigationParams {
  [key: string]: string | number | boolean | undefined;
}

// Tipos para operações genéricas
export interface GenericOperation<T = unknown> {
  id: string;
  type: string;
  entity: string;
  entityId: string;
  data: T;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Tipos para cache
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

// Tipos para filtros genéricos
export interface GenericFilter {
  key: string;
  value: FormValue | FormValue[];
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'between' | 'greaterThan' | 'lessThan';
}

// Tipos para coordenadas e posicionamento
export interface Coordinates {
  x: number;
  y: number;
}

export interface Bounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Tipos para D3 e visualizações
export interface D3Node {
  id: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  size?: number;
  group?: string;
  [key: string]: unknown;
}

export interface D3Link {
  source: string | D3Node;
  target: string | D3Node;
  strength?: number;
  distance?: number;
  bidirectional?: boolean;
  [key: string]: unknown;
}

// Tipos para lista virtualizada
export interface VirtualizedItem<T = UnknownRecord> {
  id: string;
  data: T;
  height?: number;
  isLoaded?: boolean;
}

// Tipos para componentes de renderização
export interface RenderItemProps<T = UnknownRecord> {
  item: T;
  index: number;
  isSelected?: boolean;
  isActive?: boolean;
  style?: React.CSSProperties;
}

// Tipos para propriedades de componentes flexíveis
export interface FlexibleComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  [key: string]: unknown;
}

// Tipos para detalhes de eventos customizados
export interface CustomEventDetail<T = UnknownRecord> {
  type: string;
  data: T;
  timestamp: number;
}

export interface PerformanceAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  autoFixable: boolean;
}

export interface PerformanceOptimization {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImprovement: string;
  applied: boolean;
  implementation: () => Promise<void>;
}

export interface UserBehaviorPattern {
  userId: string;
  actions: UserAction[];
  temporalPatterns: {
    hourly: Record<number, number>;
    weekly: Record<number, number>;
    seasonal: Record<string, number>;
  };
  performanceCorrelations: Record<string, number>;
  commonSequences: string[][];
  predictedActions: string[];
  avgActionInterval: number;
  actionFrequency: 'low' | 'medium' | 'high';
  problematicActions: string[];
  performanceByActionType: Record<string, any>;
  lastUpdated: number;
}

export interface UserAction {
  type: string;
  timestamp: number;
  context: Record<string, unknown>;
  performance: Partial<PerformanceMetrics>;
}

export interface OptimizationStrategy {
  id: string;
  name: string;
  type: 'preload' | 'cache' | 'rendering' | 'memory' | 'network';
  confidence: number;
  autoApply: boolean;
  parameters: Record<string, any>;
  estimatedImprovement: number;
  results?: {
    applied: boolean;
    success: boolean;
    timestamp: number;
    metrics: Record<string, any>;
  };
}

export interface RealTimeEvent {
  id: string;
  type: 'cursor' | 'selection' | 'edit' | 'comment' | 'presence';
  userId: string;
  timestamp: number;
  data: Record<string, any>;
  documentId: string;
}

export interface CollaborationState {
  activeUsers: CollaborativeUser[];
  cursors: Record<string, CursorPosition>;
  selections: Record<string, SelectionRange>;
  conflicts: OperationalConflict[];
  operationQueue: OperationalTransform[];
}

export interface CollaborativeUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  lastActivity: number;
  isTyping: boolean;
  currentDocument?: string;
}

export interface CursorPosition {
  line: number;
  column: number;
  userId: string;
  timestamp: number;
}

export interface SelectionRange {
  start: { line: number; column: number };
  end: { line: number; column: number };
  userId: string;
  timestamp: number;
}

export interface OperationalTransform {
  id: string;
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
  applied: boolean;
}

export interface OperationalConflict {
  id: string;
  operations: OperationalTransform[];
  resolution: 'user_choice' | 'automatic' | 'pending';
  timestamp: number;
}

export interface AdvancedAnalytics {
  userJourney: UserJourneyStep[];
  featureUsage: FeatureUsageMetrics;
  performanceInsights: PerformanceInsight[];
  conversionFunnels: ConversionFunnel[];
  retentionMetrics: RetentionMetric[];
}

export interface UserJourneyStep {
  id: string;
  userId: string;
  action: string;
  page: string;
  timestamp: number;
  duration: number;
  metadata: Record<string, any>;
}

export interface FeatureUsageMetrics {
  featureId: string;
  usageCount: number;
  uniqueUsers: number;
  avgSessionTime: number;
  conversionRate: number;
  satisfactionScore: number;
}

export interface PerformanceInsight {
  id: string;
  type: 'bottleneck' | 'optimization' | 'regression';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  recommendation: string;
  automatable: boolean;
  estimatedGain: number;
}

export interface ConversionFunnel {
  id: string;
  name: string;
  steps: FunnelStep[];
  conversionRate: number;
  dropOffPoints: string[];
  optimizations: string[];
}

export interface FunnelStep {
  name: string;
  users: number;
  conversionRate: number;
  avgTimeSpent: number;
}

export interface RetentionMetric {
  period: 'daily' | 'weekly' | 'monthly';
  cohortDate: string;
  day0: number;
  day1: number;
  day7: number;
  day30: number;
  ltv: number;
}

// 🧠 AI Performance Optimizer Types
export interface PerformancePattern {
  id: string;
  type: 'component' | 'route' | 'action' | 'data';
  pattern: string;
  frequency: number;
  impact: number;
  optimization?: OptimizationSuggestion;
}

export interface OptimizationSuggestion {
  type: 'preload' | 'cache' | 'lazy' | 'memoize' | 'defer';
  confidence: number;
  description: string;
  implementation: string;
  estimatedImprovement: number;
}

export interface UserBehaviorData {
  sessionId: string;
  timestamp: number;
  route: string;
  component: string;
  action: string;
  duration: number;
  performance: {
    renderTime: number;
    memoryUsage: number;
    fps: number;
  };
}

export interface OptimizationMetrics {
  totalOptimizations: number;
  averageImprovement: number;
  predictedBottlenecks: number;
  userSatisfactionScore: number;
  adaptiveScore: number;
}

// 🤝 Real-Time Collaboration Types
export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  status: 'active' | 'idle' | 'away' | 'offline';
  cursor?: CursorPosition;
  selection?: SelectionRange;
  lastActivity: number;
}

export interface CursorPosition {
  x: number;
  y: number;
  elementId?: string;
  textOffset?: number;
}

export interface SelectionRange {
  start: number;
  end: number;
  text: string;
  elementId: string;
}

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
  userId: string;
  timestamp: number;
  version: number;
}

export interface DocumentState {
  id: string;
  content: string;
  version: number;
  operations: Operation[];
  lastModified: number;
  collaborators: CollaborationUser[];
}

export interface CollaborationMetrics {
  activeUsers: number;
  operationsPerSecond: number;
  syncLatency: number;
  conflictResolutions: number;
  dataTransferred: number;
  syncEfficiency: number;
}

// 📊 Advanced Analytics Types
export interface UserEvent {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: number;
  type: 'click' | 'view' | 'edit' | 'search' | 'create' | 'delete' | 'share';
  action: string;
  category: string;
  properties: Record<string, any>;
  performance?: PerformanceEventData;
  device?: DeviceInfo;
  location?: LocationInfo;
}

export interface PerformanceEventData {
  pageLoadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  networkLatency: number;
  fps: number;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  screenResolution: string;
  connectionType: string;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  timezone: string;
  language: string;
}

export interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  data: any;
  actionable: boolean;
  recommendation?: string;
}

export interface UserJourney {
  userId: string;
  sessionId: string;
  steps: UserEvent[];
  duration: number;
  conversionRate: number;
  dropoffPoints: string[];
  satisfactionScore: number;
}

export interface ConversionFunnel {
  name: string;
  steps: string[];
  conversionRates: number[];
  dropoffRates: number[];
  totalUsers: number;
  totalConversions: number;
}

export interface CohortAnalysis {
  cohort: string;
  period: string;
  retentionRates: number[];
  ltv: number;
  churnRate: number;
  engagementScore: number;
}

export interface AnalyticsMetrics {
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  retentionRate: number;
  engagementScore: number;
  performanceScore: number;
}

export interface MetricsTrend {
  metric: string;
  period: 'hour' | 'day' | 'week' | 'month';
  values: number[];
  trend: 'up' | 'down' | 'stable';
  change: number;
  prediction: number[];
}

// 🎯 Advanced Systems Integration Types
export interface AdvancedSystemsConfig {
  aiOptimizer: {
    enabled: boolean;
    autoApply: boolean;
    confidenceThreshold: number;
    learningMode: boolean;
  };
  collaboration: {
    enabled: boolean;
    wsUrl: string;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
  };
  analytics: {
    enabled: boolean;
    trackingLevel: 'basic' | 'detailed' | 'comprehensive';
    retentionPeriod: number;
    realTimeInsights: boolean;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
  resources: {
    cpu: number;
    memory: number;
    storage: number;
  };
  services: {
    aiOptimizer: boolean;
    collaboration: boolean;
    analytics: boolean;
  };
}

export interface SystemMetrics {
  timestamp: number;
  performance: OptimizationMetrics;
  collaboration: CollaborationMetrics;
  analytics: AnalyticsMetrics;
  health: SystemHealth;
} 