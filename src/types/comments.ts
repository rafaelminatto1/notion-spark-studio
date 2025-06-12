export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  position: {
    x: number;
    y: number;
  };
  reactions: Reaction[];
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  id: string;
  commentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  emoji: string;
  createdAt: string;
}

export interface CommentThread {
  id: string;
  documentId: string;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentMention {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
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