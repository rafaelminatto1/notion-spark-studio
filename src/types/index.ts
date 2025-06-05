export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId?: string;
  content?: string;
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
  type: 'text' | 'heading' | 'image' | 'video' | 'code' | 'quote' | 'list';
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
