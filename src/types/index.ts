export interface FileItem {
  id: string;
  name: string;
  title?: string;
  content: string;
  parentId?: string;
  type: 'file' | 'folder';
  path?: string;
  size?: number;
  lastModified?: string | Date;
  views?: number;
  collaborators?: string[];
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  favorite?: boolean;
  shared?: boolean;
  tags?: string[];
  color?: string;
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

export interface TextOperation {
  id: string;
  type: 'insert' | 'delete' | 'retain';
  position: number;
  text?: string;
  length?: number;
  userId: string;
  userName: string;
  documentVersion: number;
  timestamp: number;
}

// Re-export database types
export * from './database';
