export interface DatabaseItem {
  id: string;
  name: string;
  title: string;
  type: 'database';
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date;
  properties: {
    [key: string]: DatabaseProperty;
  };
  items: DatabaseRow[];
  metadata?: {
    description?: string;
    author?: string;
    tags?: string[];
  };
}

export interface DatabaseProperty {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox' | 'url' | 'email' | 'phone' | 'formula' | 'relation' | 'rollup' | 'created_time' | 'created_by' | 'last_edited_time' | 'last_edited_by';
  config?: {
    options?: Array<{ id: string; name: string; color: string }>;
    format?: string;
    formula?: string;
  };
}

export interface DatabaseRow {
  id: string;
  properties: {
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
} 