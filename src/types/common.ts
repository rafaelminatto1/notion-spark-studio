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