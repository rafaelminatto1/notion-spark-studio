

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'database';
  parentId?: string;
  content?: string;
  blocks?: Block[];
  database?: import('./database').Database;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  emoji?: string;
  description?: string;
  isPublic?: boolean;
  isProtected?: boolean;
  showInSidebar?: boolean;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  x: number;
  y: number;
  elementId: string;
}

export interface Block {
  id: string;
  type: 'text' | 'heading' | 'image' | 'video' | 'code' | 'quote' | 'list' | 'callout' | 'toggle' | 'table' | 'database' | 'embed-youtube' | 'embed-twitter' | 'embed-image' | 'embed-pdf' | 'embed-figma' | 'embed-codepen';
  content: string;
  properties?: Record<string, any>;
  comments?: Comment[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  emoji: string;
  category: string;
  createdAt: Date;
}

// Re-export database types
export * from './database';
