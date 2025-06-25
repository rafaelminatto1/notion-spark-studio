'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase-unified';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MessageSquare, 
  Send, 
  MoreHorizontal, 
  Reply, 
  Check, 
  Edit3, 
  Trash2,
  Heart,
  ThumbsUp,
  Smile,
  AtSign,
  Pin,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Comment {
  id: string;
  document_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  position_start?: number;
  position_end?: number;
  selection_text?: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  replies?: Comment[];
  reactions?: CommentReaction[];
}

interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction: string;
  user?: {
    full_name?: string;
  };
}

interface CommentsPanelProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  selectedText?: string;
  selectionRange?: { start: number; end: number };
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({
  documentId,
  isOpen,
  onClose,
  selectedText,
  selectionRange
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Carregar comentários
  useEffect(() => {
    if (documentId && isOpen) {
      loadComments();
      setupRealtimeSubscription();
    }
  }, [documentId, isOpen]);

  const loadComments = async () => {
    try {
      setLoading(true);
      
      // Simular comentários para demonstração
      const mockComments: Comment[] = [
        {
          id: '1',
          document_id: documentId,
          user_id: 'user1',
          content: 'Ótimo ponto sobre a metodologia! Podemos expandir essa seção com mais detalhes sobre a implementação.',
          selection_text: selectedText || 'metodologia ágil',
          position_start: selectionRange?.start || 100,
          position_end: selectionRange?.end || 120,
          is_resolved: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          user: {
            id: 'user1',
            email: 'joao@empresa.com',
            full_name: 'João Silva',
            avatar_url: ''
          },
          reactions: [
            {
              id: 'r1',
              comment_id: '1',
              user_id: 'user2',
              reaction: '👍',
              user: { full_name: 'Maria Santos' }
            }
          ],
          replies: [
            {
              id: '2',
              document_id: documentId,
              user_id: 'user2',
              parent_id: '1',
              content: 'Concordo! Vou trabalhar nisso hoje à tarde.',
              is_resolved: false,
              created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              user: {
                id: 'user2',
                email: 'maria@empresa.com',
                full_name: 'Maria Santos',
                avatar_url: ''
              }
            }
          ]
        },
        {
          id: '3',
          document_id: documentId,
          user_id: user!.id,
          content: 'Precisamos revisar os números da seção de orçamento antes da apresentação.',
          is_resolved: true,
          resolved_by: user!.id,
          resolved_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          user: {
            id: user!.id,
            email: user!.email!,
            full_name: 'Você',
            avatar_url: ''
          },
          reactions: [
            {
              id: 'r2',
              comment_id: '3',
              user_id: 'user1',
              reaction: '✅',
              user: { full_name: 'João Silva' }
            }
          ]
        }
      ];

      setComments(mockComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Em implementação real, configuraria subscription do Supabase
    // para receber atualizações em tempo real
    console.log('Setting up realtime subscription for comments');
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const addComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      const comment: Comment = {
        id: Date.now().toString(),
        document_id: documentId,
        user_id: user.id,
        content: newComment,
        selection_text: selectedText,
        position_start: selectionRange?.start,
        position_end: selectionRange?.end,
        is_resolved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email!,
          full_name: 'Você',
          avatar_url: ''
        },
        reactions: []
      };

      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const addReply = async (parentId: string) => {
    if (!replyText.trim() || !user) return;

    try {
      const reply: Comment = {
        id: Date.now().toString(),
        document_id: documentId,
        user_id: user.id,
        parent_id: parentId,
        content: replyText,
        is_resolved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email!,
          full_name: 'Você',
          avatar_url: ''
        }
      };

      setComments(prev => prev.map(comment => 
        comment.id === parentId 
          ? { ...comment, replies: [...(comment.replies || []), reply] }
          : comment
      ));
      
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const toggleReaction = async (commentId: string, reaction: string) => {
    if (!user) return;

    try {
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          const existingReaction = comment.reactions?.find(
            r => r.user_id === user.id && r.reaction === reaction
          );

          if (existingReaction) {
            // Remover reação
            return {
              ...comment,
              reactions: comment.reactions?.filter(r => r.id !== existingReaction.id)
            };
          } else {
            // Adicionar reação
            const newReaction: CommentReaction = {
              id: Date.now().toString(),
              comment_id: commentId,
              user_id: user.id,
              reaction,
              user: { full_name: 'Você' }
            };
            return {
              ...comment,
              reactions: [...(comment.reactions || []), newReaction]
            };
          }
        }
        return comment;
      }));
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const resolveComment = async (commentId: string) => {
    try {
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              is_resolved: !comment.is_resolved,
              resolved_by: comment.is_resolved ? undefined : user!.id,
              resolved_at: comment.is_resolved ? undefined : new Date().toISOString()
            }
          : comment
      ));
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  };

  const saveEdit = async (commentId: string) => {
    try {
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: editText, updated_at: new Date().toISOString() }
          : comment
      ));
      setEditingComment(null);
      setEditText('');
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const groupReactions = (reactions: CommentReaction[]) => {
    const grouped: { [key: string]: CommentReaction[] } = {};
    reactions.forEach(reaction => {
      if (!grouped[reaction.reaction]) {
        grouped[reaction.reaction] = [];
      }
      grouped[reaction.reaction].push(reaction);
    });
    return grouped;
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold">Comentários</h3>
            <Badge variant="secondary" className="text-xs">
              {comments.length}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </div>

      {/* Novo Comentário */}
      <div className="p-4 border-b border-gray-100">
        {selectedText && (
          <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
            <div className="flex items-center space-x-1 text-blue-600 mb-1">
              <Pin className="h-3 w-3" />
              <span className="text-xs font-medium">Texto selecionado:</span>
            </div>
            <p className="text-gray-700 italic">"{selectedText}"</p>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="Adicionar comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  addComment();
                }
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <AtSign className="h-3 w-3" />
                </Button>
                <span className="text-xs text-gray-500">Ctrl+Enter para enviar</span>
              </div>
              <Button 
                size="sm" 
                onClick={addComment}
                disabled={!newComment.trim()}
                className="h-7"
              >
                <Send className="h-3 w-3 mr-1" />
                Comentar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Comentários */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              Carregando comentários...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Nenhum comentário ainda</p>
              <p className="text-sm">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div 
                key={comment.id} 
                className={`space-y-3 ${comment.is_resolved ? 'opacity-75' : ''}`}
              >
                <div className="flex space-x-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.user?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {comment.user?.full_name?.charAt(0) || comment.user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {comment.user?.full_name || comment.user?.email}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                      {comment.is_resolved && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolvido
                        </Badge>
                      )}
                    </div>

                    {comment.selection_text && (
                      <div className="mb-2 p-2 bg-gray-50 rounded text-xs">
                        <div className="flex items-center space-x-1 text-gray-600 mb-1">
                          <Pin className="h-3 w-3" />
                          <span>Comentário sobre:</span>
                        </div>
                        <p className="italic text-gray-700">"{comment.selection_text}"</p>
                      </div>
                    )}

                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="text-sm"
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => saveEdit(comment.id)}>
                            Salvar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditingComment(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}

                    {/* Reações */}
                    {comment.reactions && comment.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(groupReactions(comment.reactions)).map(([reaction, users]) => (
                          <Button
                            key={reaction}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => toggleReaction(comment.id, reaction)}
                          >
                            {reaction} {users.length}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center space-x-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(comment.id)}
                        className="h-6 px-2 text-xs"
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Responder
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Smile className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {['👍', '❤️', '😄', '😮', '😢', '👎'].map(reaction => (
                            <DropdownMenuItem
                              key={reaction}
                              onClick={() => toggleReaction(comment.id, reaction)}
                            >
                              {reaction}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resolveComment(comment.id)}
                        className="h-6 px-2 text-xs"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {comment.is_resolved ? 'Reabrir' : 'Resolver'}
                      </Button>

                      {comment.user_id === user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => startEdit(comment)}>
                              <Edit3 className="h-3 w-3 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteComment(comment.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Formulário de Resposta */}
                    {replyingTo === comment.id && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-200">
                        <div className="flex space-x-2">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              placeholder="Escrever resposta..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="min-h-[50px] text-sm resize-none"
                            />
                            <div className="flex space-x-2 mt-2">
                              <Button 
                                size="sm" 
                                onClick={() => addReply(comment.id)}
                                disabled={!replyText.trim()}
                                className="h-6"
                              >
                                Responder
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setReplyingTo(null)}
                                className="h-6"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Respostas */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex space-x-3">
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage src={reply.user?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {reply.user?.full_name?.charAt(0) || reply.user?.email?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {reply.user?.full_name || reply.user?.email}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Separador entre comentários */}
                <Separator className="my-4" />
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommentsPanel; 