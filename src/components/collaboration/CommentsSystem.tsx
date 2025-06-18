import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Reply, 
  Heart, 
  ThumbsUp, 
  ThumbsDown, 
  Smile, 
  Edit3, 
  Trash2, 
  Pin, 
  Check, 
  X,
  AtSign,
  Hash,
  Link2,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: Date;
  updatedAt?: Date;
  position: {
    start: number;
    end: number;
    text: string; // The text being commented on
  };
  thread?: Comment[];
  reactions: {
    type: 'like' | 'love' | 'laugh' | 'dislike';
    userId: string;
    userName: string;
  }[];
  mentions: {
    userId: string;
    userName: string;
  }[];
  isPinned: boolean;
  isResolved: boolean;
  tags: string[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

interface CommentsSystemProps {
  comments: Comment[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  documentContent: string;
  onAddComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'reactions' | 'thread' | 'isPinned' | 'isResolved'>) => void;
  onUpdateComment: (commentId: string, updates: Partial<Comment>) => void;
  onDeleteComment: (commentId: string) => void;
  onReplyToComment: (parentId: string, reply: Omit<Comment, 'id' | 'createdAt' | 'reactions' | 'thread' | 'isPinned' | 'isResolved'>) => void;
  onReactionAdd: (commentId: string, reaction: { type: 'like' | 'love' | 'laugh' | 'dislike'; userId: string; userName: string }) => void;
  onReactionRemove: (commentId: string, userId: string, type: string) => void;
  onMentionUser: (userName: string) => void;
  availableUsers: { id: string; name: string; avatar?: string }[];
  className?: string;
}

export const CommentsSystem: React.FC<CommentsSystemProps> = ({
  comments,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  documentContent,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onReplyToComment,
  onReactionAdd,
  onReactionRemove,
  onMentionUser,
  availableUsers,
  className
}) => {
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [selectedText, setSelectedText] = useState<{ start: number; end: number; text: string } | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'pinned' | 'mine'>('all');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle text selection for commenting
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    if (selectedText.length > 0) {
      const start = range.startOffset;
      const end = range.endOffset;
      
      setSelectedText({
        start,
        end,
        text: selectedText
      });
    }
  }, []);

  // Handle mention detection and suggestions
  const handleMentionInput = useCallback((content: string, setCursor: (pos: number) => void) => {
    const mentionMatch = content.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, []);

  // Filter comments based on current filter
  const filteredComments = useMemo(() => {
    return comments.filter(comment => {
      switch (filter) {
        case 'unresolved':
          return !comment.isResolved;
        case 'pinned':
          return comment.isPinned;
        case 'mine':
          return comment.authorId === currentUserId;
        default:
          return true;
      }
    });
  }, [comments, filter, currentUserId]);

  // Get mention suggestions
  const mentionSuggestions = useMemo(() => {
    if (!mentionQuery) return availableUsers.slice(0, 5);
    return availableUsers.filter(user => 
      user.name.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 5);
  }, [availableUsers, mentionQuery]);

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedText) return;

    const mentions = extractMentions(newComment);
    const tags = extractTags(newComment);

    onAddComment({
      content: newComment,
      authorId: currentUserId,
      authorName: currentUserName,
      authorAvatar: currentUserAvatar,
      position: selectedText,
      mentions,
      tags
    });

    setNewComment('');
    setSelectedText(null);
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim()) return;

    const mentions = extractMentions(replyContent);
    const tags = extractTags(replyContent);

    onReplyToComment(parentId, {
      content: replyContent,
      authorId: currentUserId,
      authorName: currentUserName,
      authorAvatar: currentUserAvatar,
      position: { start: 0, end: 0, text: '' }, // Replies don't need position
      mentions,
      tags
    });

    setReplyContent('');
    setReplyingTo(null);
  };

  const extractMentions = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const mentions: { userId: string; userName: string }[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      const userName = match[1];
      const user = availableUsers.find(u => u.name === userName);
      if (user) {
        mentions.push({ userId: user.id, userName: user.name });
      }
    }

    return mentions;
  };

  const extractTags = (content: string) => {
    const tagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }

    return tags;
  };

  const ReactionButton = ({ comment, type, icon: Icon }: { 
    comment: Comment; 
    type: 'like' | 'love' | 'laugh' | 'dislike';
    icon: React.ElementType;
  }) => {
    const userReaction = comment.reactions.find(r => r.userId === currentUserId && r.type === type);
    const count = comment.reactions.filter(r => r.type === type).length;

    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-7 px-2 text-xs gap-1",
          userReaction ? "bg-blue-500/20 text-blue-400" : "text-gray-400 hover:text-white"
        )}
        onClick={() => {
          if (userReaction) {
            onReactionRemove(comment.id, currentUserId, type);
          } else {
            onReactionAdd(comment.id, { type, userId: currentUserId, userName: currentUserName });
          }
        }}
      >
        <Icon className="w-3 h-3" />
        {count > 0 && <span>{count}</span>}
      </Button>
    );
  };

  const CommentCard = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "bg-workspace-surface/50 rounded-lg p-4 border border-white/10",
        isReply && "ml-6 border-l-2 border-blue-500/50",
        comment.isPinned && "ring-1 ring-yellow-500/50",
        comment.isResolved && "opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.authorAvatar} />
            <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white text-sm">{comment.authorName}</span>
              {comment.isPinned && <Pin className="w-3 h-3 text-yellow-500" />}
              {comment.isResolved && <Check className="w-3 h-3 text-green-500" />}
            </div>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: ptBR })}
              {comment.updatedAt && comment.updatedAt > comment.createdAt && ' (editado)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => { setShowEmojiPicker(showEmojiPicker === comment.id ? null : comment.id); }}
          >
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Quoted text */}
      {comment.position.text && (
        <div className="mb-3 p-2 bg-gray-800/50 rounded border-l-2 border-blue-500/50">
          <span className="text-sm text-gray-300 italic">"{comment.position.text}"</span>
        </div>
      )}

      {/* Content */}
      {editingComment === comment.id ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => { setEditContent(e.target.value); }}
            className="min-h-20"
            placeholder="Editar comentário..."
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                onUpdateComment(comment.id, { content: editContent });
                setEditingComment(null);
              }}
            >
              Salvar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setEditingComment(null); }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-sm text-gray-200 leading-relaxed">
            {comment.content}
          </p>
          
          {/* Tags */}
          {comment.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {comment.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Mentions */}
          {comment.mentions.length > 0 && (
            <div className="flex gap-1 mt-2">
              {comment.mentions.map(mention => (
                <Badge key={mention.userId} variant="outline" className="text-xs">
                  @{mention.userName}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center gap-1 mb-3">
        <ReactionButton comment={comment} type="like" icon={ThumbsUp} />
        <ReactionButton comment={comment} type="love" icon={Heart} />
        <ReactionButton comment={comment} type="laugh" icon={Smile} />
        <ReactionButton comment={comment} type="dislike" icon={ThumbsDown} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); }}
          >
            <Reply className="w-3 h-3" />
            Responder
          </Button>

          {comment.authorId === currentUserId && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  setEditingComment(comment.id);
                  setEditContent(comment.content);
                }}
              >
                <Edit3 className="w-3 h-3" />
                Editar
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-red-400 hover:text-red-300"
                onClick={() => { onDeleteComment(comment.id); }}
              >
                <Trash2 className="w-3 h-3" />
                Excluir
              </Button>
            </>
          )}
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => { onUpdateComment(comment.id, { isPinned: !comment.isPinned }); }}
          >
            <Pin className={cn("w-3 h-3", comment.isPinned && "text-yellow-500")} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => { onUpdateComment(comment.id, { isResolved: !comment.isResolved }); }}
          >
            <Check className={cn("w-3 h-3", comment.isResolved && "text-green-500")} />
          </Button>
        </div>
      </div>

      {/* Reply form */}
      {replyingTo === comment.id && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 space-y-2 pl-6 border-l-2 border-blue-500/30"
        >
          <Textarea
            value={replyContent}
            onChange={(e) => {
              setReplyContent(e.target.value);
              handleMentionInput(e.target.value, () => {});
            }}
            placeholder="Escrever resposta... (use @ para mencionar)"
            className="min-h-20"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => { handleReply(comment.id); }}
              disabled={!replyContent.trim()}
            >
              Responder
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplyingTo(null);
                setReplyContent('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </motion.div>
      )}

      {/* Thread replies */}
      {comment.thread && comment.thread.length > 0 && (
        <div className="mt-4 space-y-3">
          <AnimatePresence>
            {comment.thread.map(reply => (
              <CommentCard key={reply.id} comment={reply} isReply />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'unresolved', 'pinned', 'mine'] as const).map(filterType => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setFilter(filterType); }}
              className="text-xs"
            >
              {filterType === 'all' && 'Todos'}
              {filterType === 'unresolved' && 'Não resolvidos'}
              {filterType === 'pinned' && 'Fixados'}
              {filterType === 'mine' && 'Meus'}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <MessageCircle className="w-4 h-4" />
          <span>{filteredComments.length} comentários</span>
        </div>
      </div>

      {/* New comment form */}
      {selectedText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-workspace-surface/50 rounded-lg p-4 border border-blue-500/50"
        >
          <div className="mb-3 p-2 bg-gray-800/50 rounded border-l-2 border-blue-500/50">
            <span className="text-sm text-gray-300 italic">"{selectedText.text}"</span>
          </div>
          
          <Textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
              handleMentionInput(e.target.value, () => {});
            }}
            placeholder="Adicionar comentário... (use @ para mencionar, # para tags)"
            className="min-h-20 mb-3"
          />

          {/* Mention suggestions */}
          {showMentions && (
            <div className="mb-3 bg-workspace-surface rounded-lg border border-white/10 overflow-hidden">
              {mentionSuggestions.map(user => (
                <button
                  key={user.id}
                  className="w-full flex items-center gap-2 p-2 hover:bg-white/5 text-left"
                  onClick={() => {
                    const newContent = newComment.replace(/@\w*$/, `@${user.name} `);
                    setNewComment(newContent);
                    setShowMentions(false);
                    onMentionUser(user.name);
                  }}
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              Comentar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedText(null);
                setNewComment('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </motion.div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredComments.map(comment => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </AnimatePresence>

        {filteredComments.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum comentário encontrado</p>
            <p className="text-sm mt-1">Selecione um texto para adicionar um comentário</p>
          </div>
        )}
      </div>

      {/* Selection helper */}
      <div className="fixed bottom-4 right-4 bg-workspace-surface/90 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-lg z-50">
        <div className="text-xs text-gray-400 mb-2">💡 Dica:</div>
        <div className="text-xs text-gray-300">
          Selecione um texto no documento para comentar
        </div>
      </div>
    </div>
  );
};

export default CommentsSystem; 