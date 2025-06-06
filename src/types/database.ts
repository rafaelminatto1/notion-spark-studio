
export interface DatabaseProperty {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox' | 'url' | 'email' | 'phone' | 'formula' | 'relation' | 'rollup';
  options?: {
    selectOptions?: { id: string; name: string; color: string }[];
    formula?: string;
    relationTarget?: string;
    rollupProperty?: string;
    rollupFunction?: 'count' | 'sum' | 'average' | 'min' | 'max';
  };
}

export interface DatabaseRow {
  id: string;
  properties: Record<string, any>;
  pageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Database {
  id: string;
  name: string;
  description?: string;
  properties: DatabaseProperty[];
  rows: DatabaseRow[];
  views: DatabaseView[];
  defaultView: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseView {
  id: string;
  name: string;
  type: 'table' | 'kanban' | 'calendar' | 'gallery' | 'list';
  filters: DatabaseFilter[];
  sorts: DatabaseSort[];
  groupBy?: string;
  visibleProperties: string[];
}

export interface DatabaseFilter {
  id: string;
  propertyId: string;
  condition: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than' | 'on_or_after' | 'on_or_before';
  value: any;
}

export interface DatabaseSort {
  id: string;
  propertyId: string;
  direction: 'asc' | 'desc';
}
