import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Reply, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Heart, 
  HeartOff,
  Pin,
  PinOff,
  AtSign,
  Send,
  Smile,
  Paperclip,
  Eye,
  EyeOff,
  Clock,
  Check,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos para sistema de comentários
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: Date;
  edited?: Date;
  parentId?: string; // Para replies
  mentions: string[]; // IDs de usuários mencionados
  reactions: Record<string, string[]>; // emoji -> userIds
  attachments: Attachment[];
  isPinned: boolean;
  isResolved: boolean;
  position?: {
    line: number;
    column: number;
    selection?: string;
  };
  metadata: {
    deviceType: 'desktop' | 'mobile' | 'tablet';
    edited: boolean;
    readBy: string[]; // IDs dos usuários que leram
  };
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file' | 'link';
  size?: number;
}

export interface CommentThread {
  id: string;
  rootCommentId: string;
  comments: Comment[];
  participantIds: string[];
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  position: {
    line: number;
    column: number;
    selection?: string;
  };
}

interface ThreadedCommentsProps {
  threads: CommentThread[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onAddComment: (content: string, parentId?: string, mentions?: string[], position?: any) => void;
  onEditComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onReactToComment: (commentId: string, emoji: string) => void;
  onResolveThread: (threadId: string) => void;
  onPinComment: (commentId: string) => void;
  className?: string;
}

// Hook para gerenciar estado de comentários
const useCommentState = (currentUserId: string) => {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [mentionsQuery, setMentionsQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);

  const toggleThread = useCallback((threadId: string) => {
    setActiveThreadId(prev => prev === threadId ? null : threadId);
  }, []);

  const startReply = useCallback((commentId: string) => {
    setReplyingToId(commentId);
    setEditingId(null);
  }, []);

  const startEdit = useCallback((commentId: string) => {
    setEditingId(commentId);
    setReplyingToId(null);
  }, []);

  const cancelActions = useCallback(() => {
    setReplyingToId(null);
    setEditingId(null);
    setShowMentions(false);
    setMentionsQuery('');
  }, []);

  return {
    activeThreadId,
    replyingToId,
    editingId,
    showResolved,
    mentionsQuery,
    showMentions,
    setShowResolved,
    setMentionsQuery,
    setShowMentions,
    toggleThread,
    startReply,
    startEdit,
    cancelActions
  };
};

// Componente para detecção de menções
interface MentionSelectorProps {
  query: string;
  onSelect: (userId: string, userName: string) => void;
  onClose: () => void;
  users: { id: string; name: string; avatar?: string }[];
}

const MentionSelector: React.FC<MentionSelectorProps> = ({ query, onSelect, onClose, users }) => {
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }, [users, query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-10"
    >
      <div className="text-xs text-gray-500 mb-2">Mencionar usuário:</div>
      {filteredUsers.length > 0 ? (
        <div className="space-y-1">
          {filteredUsers.map(user => (
            <button
              key={user.id}
              onClick={() => { onSelect(user.id, user.name); }}
              className="flex items-center gap-2 w-full p-2 text-left hover:bg-gray-50 rounded"
            >
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                {user.name[0]}
              </div>
              <span className="text-sm">{user.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 p-2">Nenhum usuário encontrado</div>
      )}
    </motion.div>
  );
};

// Componente de editor de comentário
interface CommentEditorProps {
  placeholder: string;
  initialContent?: string;
  onSubmit: (content: string, mentions: string[]) => void;
  onCancel: () => void;
  autoFocus?: boolean;
}

const CommentEditor: React.FC<CommentEditorProps> = ({
  placeholder,
  initialContent = '',
  onSubmit,
  onCancel,
  autoFocus = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock users para demonstração
  const mockUsers = [
    { id: 'user-1', name: 'João Silva' },
    { id: 'user-2', name: 'Maria Santos' },
    { id: 'user-3', name: 'Pedro Costa' },
    { id: 'user-4', name: 'Ana Oliveira' }
  ];

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Detectar menções (@)
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      const textAfterAt = value.slice(atIndex + 1);
      const spaceIndex = textAfterAt.indexOf(' ');
      const query = spaceIndex === -1 ? textAfterAt : textAfterAt.slice(0, spaceIndex);
      
      if (query.length >= 0 && spaceIndex === -1) {
        setMentionQuery(query);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  }, []);

  const handleMentionSelect = useCallback((userId: string, userName: string) => {
    const atIndex = content.lastIndexOf('@');
    const beforeAt = content.slice(0, atIndex);
    const afterAt = content.slice(atIndex + 1);
    const spaceIndex = afterAt.indexOf(' ');
    const afterMention = spaceIndex === -1 ? '' : afterAt.slice(spaceIndex);
    
    const newContent = `${beforeAt}@${userName}${afterMention}`;
    setContent(newContent);
    setMentions(prev => [...prev, userId]);
    setShowMentions(false);
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [content]);

  const handleSubmit = useCallback(() => {
    if (content.trim()) {
      onSubmit(content.trim(), mentions);
      setContent('');
      setMentions([]);
    }
  }, [content, mentions, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [handleSubmit, onCancel]);

  return (
    <div className="relative">
      <div className="border border-gray-200 rounded-lg focus-within:border-blue-500 transition-colors">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full p-3 border-0 resize-none focus:outline-none rounded-t-lg"
          rows={3}
        />
        
        <div className="flex items-center justify-between p-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <div className="flex items-center gap-2">
            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <Smile className="h-4 w-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <Paperclip className="h-4 w-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <AtSign className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Send className="h-3 w-3" />
              Comentar
            </button>
          </div>
        </div>
      </div>

      {/* Seletor de menções */}
      <AnimatePresence>
        {showMentions && (
          <MentionSelector
            query={mentionQuery}
            onSelect={handleMentionSelect}
            onClose={() => { setShowMentions(false); }}
            users={mockUsers}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente de comentário individual
interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  currentUserId: string;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  onPin: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isReply = false,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin
}) => {
  const [showActions, setShowActions] = useState(false);
  const isOwner = comment.authorId === currentUserId;
  const isRead = comment.metadata.readBy.includes(currentUserId);

  const timeAgo = useMemo(() => {
    const now = new Date();
    const diff = now.getTime() - comment.timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'agora';
  }, [comment.timestamp]);

  const reactions = Object.entries(comment.reactions).filter(([_, userIds]) => userIds.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative",
        isReply && "ml-8 mt-2",
        !isRead && "bg-blue-50/30"
      )}
      onMouseEnter={() => { setShowActions(true); }}
      onMouseLeave={() => { setShowActions(false); }}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {comment.authorName[0]}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 text-sm">
              {comment.authorName}
            </span>
            <span className="text-xs text-gray-500">{timeAgo}</span>
            {comment.metadata.edited && (
              <span className="text-xs text-gray-400">(editado)</span>
            )}
            {comment.isPinned && (
              <Pin className="h-3 w-3 text-orange-500" />
            )}
            {!isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </div>

          {/* Conteúdo do comentário */}
          <div className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
            {comment.content}
          </div>

          {/* Seleção de código (se houver) */}
          {comment.position?.selection && (
            <div className="bg-gray-100 border-l-4 border-blue-500 p-2 mb-2 text-xs font-mono">
              <div className="text-gray-500 mb-1">
                Linha {comment.position.line}:
              </div>
              <div className="text-gray-700">
                {comment.position.selection}
              </div>
            </div>
          )}

          {/* Anexos */}
          {comment.attachments.length > 0 && (
            <div className="mb-2">
              {comment.attachments.map(attachment => (
                <div key={attachment.id} className="flex items-center gap-2 text-xs text-gray-600">
                  <Paperclip className="h-3 w-3" />
                  <span>{attachment.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reações */}
          {reactions.length > 0 && (
            <div className="flex gap-1 mb-2">
              {reactions.map(([emoji, userIds]) => (
                <button
                  key={emoji}
                  onClick={() => { onReact(emoji); }}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-colors",
                    userIds.includes(currentUserId)
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <span>{emoji}</span>
                  <span>{userIds.length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Ações */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 text-xs text-gray-500"
              >
                <button
                  onClick={onReply}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  <Reply className="h-3 w-3" />
                  Responder
                </button>
                
                <button
                  onClick={() => { onReact('👍'); }}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  <Heart className="h-3 w-3" />
                  Reagir
                </button>

                {isOwner && (
                  <>
                    <button
                      onClick={onEdit}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </button>
                    
                    <button
                      onClick={onDelete}
                      className="flex items-center gap-1 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Excluir
                    </button>
                  </>
                )}

                {!isReply && (
                  <button
                    onClick={onPin}
                    className="flex items-center gap-1 hover:text-orange-600 transition-colors"
                  >
                    {comment.isPinned ? (
                      <>
                        <PinOff className="h-3 w-3" />
                        Desfixar
                      </>
                    ) : (
                      <>
                        <Pin className="h-3 w-3" />
                        Fixar
                      </>
                    )}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Componente principal
export const ThreadedComments: React.FC<ThreadedCommentsProps> = ({
  threads,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onReactToComment,
  onResolveThread,
  onPinComment,
  className
}) => {
  const {
    activeThreadId,
    replyingToId,
    editingId,
    showResolved,
    setShowResolved,
    toggleThread,
    startReply,
    startEdit,
    cancelActions
  } = useCommentState(currentUserId);

  const visibleThreads = useMemo(() => {
    return threads.filter(thread => showResolved || !thread.isResolved);
  }, [threads, showResolved]);

  const pinnedComments = useMemo(() => {
    const pinned: Comment[] = [];
    threads.forEach(thread => {
      thread.comments.forEach(comment => {
        if (comment.isPinned) {
          pinned.push(comment);
        }
      });
    });
    return pinned.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [threads]);

  return (
    <div className={cn("threaded-comments", className)}>
      {/* Header com controles */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Comentários ({visibleThreads.length})
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowResolved(!showResolved); }}
            className={cn(
              "flex items-center gap-1 px-3 py-1 text-sm border rounded-lg transition-colors",
              showResolved
                ? "bg-gray-100 border-gray-300 text-gray-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            )}
          >
            {showResolved ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showResolved ? 'Ocultar resolvidos' : 'Mostrar resolvidos'}
          </button>
        </div>
      </div>

      {/* Comentários fixados */}
      {pinnedComments.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Pin className="h-4 w-4" />
            Comentários Fixados
          </h4>
          <div className="space-y-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            {pinnedComments.map(comment => (
              <CommentItem
                key={`pinned-${comment.id}`}
                comment={comment}
                currentUserId={currentUserId}
                onReply={() => { startReply(comment.id); }}
                onEdit={() => { startEdit(comment.id); }}
                onDelete={() => { onDeleteComment(comment.id); }}
                onReact={(emoji) => { onReactToComment(comment.id, emoji); }}
                onPin={() => { onPinComment(comment.id); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Threads de comentários */}
      <div className="space-y-4">
        {visibleThreads.map(thread => {
          const rootComment = thread.comments.find(c => c.id === thread.rootCommentId);
          const replies = thread.comments.filter(c => c.parentId === thread.rootCommentId);
          const isExpanded = activeThreadId === thread.id;

          if (!rootComment) return null;

          return (
            <motion.div
              key={thread.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "border border-gray-200 rounded-lg p-4",
                thread.isResolved && "bg-green-50 border-green-200"
              )}
            >
              {/* Thread header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { toggleThread(thread.id); }}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {replies.length > 0 && (
                      <span>
                        {replies.length} resposta{replies.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                  {thread.position.selection && (
                    <span className="text-xs text-gray-500">
                      Linha {thread.position.line}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {thread.isResolved ? (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Check className="h-3 w-3" />
                      Resolvido
                    </div>
                  ) : (
                    <button
                      onClick={() => { onResolveThread(thread.id); }}
                      className="text-xs text-gray-500 hover:text-green-600 transition-colors"
                    >
                      Marcar como resolvido
                    </button>
                  )}
                </div>
              </div>

              {/* Comentário raiz */}
              <CommentItem
                comment={rootComment}
                currentUserId={currentUserId}
                onReply={() => { startReply(rootComment.id); }}
                onEdit={() => { startEdit(rootComment.id); }}
                onDelete={() => { onDeleteComment(rootComment.id); }}
                onReact={(emoji) => { onReactToComment(rootComment.id, emoji); }}
                onPin={() => { onPinComment(rootComment.id); }}
              />

              {/* Respostas */}
              <AnimatePresence>
                {isExpanded && replies.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-3"
                  >
                    {replies.map(reply => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        isReply
                        currentUserId={currentUserId}
                        onReply={() => { startReply(reply.id); }}
                        onEdit={() => { startEdit(reply.id); }}
                        onDelete={() => { onDeleteComment(reply.id); }}
                        onReact={(emoji) => { onReactToComment(reply.id, emoji); }}
                        onPin={() => { onPinComment(reply.id); }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Editor de resposta */}
              {replyingToId === rootComment.id && (
                <div className="mt-4 ml-8">
                  <CommentEditor
                    placeholder="Escreva uma resposta..."
                    onSubmit={(content, mentions) => {
                      onAddComment(content, rootComment.id, mentions);
                      cancelActions();
                    }}
                    onCancel={cancelActions}
                    autoFocus
                  />
                </div>
              )}

              {/* Editor de edição */}
              {editingId === rootComment.id && (
                <div className="mt-4">
                  <CommentEditor
                    placeholder="Editar comentário..."
                    initialContent={rootComment.content}
                    onSubmit={(content) => {
                      onEditComment(rootComment.id, content);
                      cancelActions();
                    }}
                    onCancel={cancelActions}
                    autoFocus
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Novo comentário */}
      <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-lg">
        <CommentEditor
          placeholder="Adicione um comentário..."
          onSubmit={(content, mentions) => {
            onAddComment(content, undefined, mentions);
          }}
          onCancel={() => {}}
        />
      </div>

      {/* Estado vazio */}
      {visibleThreads.length === 0 && (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum comentário ainda
          </h3>
          <p className="text-gray-600">
            Seja o primeiro a comentar neste documento.
          </p>
        </div>
      )}
    </div>
  );
};

export default ThreadedComments; 