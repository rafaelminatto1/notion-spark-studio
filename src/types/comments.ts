export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: Date;
  updatedAt: Date;
  x: number;
  y: number;
  resolved: boolean;
  parentId?: string;
  reactions?: CommentReaction[];
}

export interface CommentReaction {
  id: string;
  userId: string;
  type: 'like' | 'love' | 'laugh' | 'angry' | 'sad';
  createdAt: Date;
}

export interface CommentMention {
  id: string;
  userId: string;
  userName: string;
  startIndex: number;
  endIndex: number;
  createdAt: Date;
}

export interface CommentThread {
  id: string;
  documentId: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentAnnotation {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'highlight' | 'underline' | 'strikethrough';
  color: string;
  start: number;
  end: number;
  createdAt: string;
  updatedAt: string;
} 