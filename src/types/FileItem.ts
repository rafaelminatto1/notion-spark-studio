export interface FileItem {
  id: string;
  name: string;
  title: string;
  content?: string;
  type: 'file' | 'folder' | 'database';
  parentId?: string;
  path: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  lastModified: Date;
  tags?: string[];
  description?: string;
  views?: number;
  collaborators?: string[];
  isShared?: boolean;
  isFavorite?: boolean;
  database?: any; // Para arquivos do tipo database
  metadata?: {
    wordCount?: number;
    author?: string;
    language?: string;
    isTemplate?: boolean;
    isShared?: boolean;
    accessLevel?: 'private' | 'shared' | 'public';
  };
}

export interface DatabaseItem {
  id: string;
  name: string;
  title: string;
  type: 'database';
  parentId?: string;
  path: string;
  size: number;
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