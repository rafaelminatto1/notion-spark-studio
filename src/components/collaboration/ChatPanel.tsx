'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MessageSquare, 
  Send, 
  Smile, 
  Paperclip, 
  MoreHorizontal,
  Reply,
  Edit3,
  Trash2,
  AtSign,
  Clock,
  Check,
  CheckCheck,
  Pin,
  X
} from 'lucide-react';

interface ChatMessage {
  id: string;
  document_id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'system' | 'file' | 'mention';
  mentioned_users?: string[];
  reply_to?: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  reactions?: MessageReaction[];
  read_by?: string[];
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  user?: {
    full_name?: string;
  };
}

interface ChatPanelProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onlineUsers: any[];
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  documentId,
  isOpen,
  onClose,
  onlineUsers
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carregar mensagens
  useEffect(() => {
    if (documentId && isOpen) {
      loadMessages();
      setupRealtimeSubscription();
    }
  }, [documentId, isOpen]);

  // Auto scroll para última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focar input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const loadMessages = async () => {
    try {
      // Simular mensagens para demonstração
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          document_id: documentId,
          user_id: 'user1',
          message: 'Pessoal, comecei a trabalhar na seção de metodologia. Alguém pode revisar?',
          message_type: 'text',
          is_edited: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          user: {
            id: 'user1',
            email: 'joao@empresa.com',
            full_name: 'João Silva',
            avatar_url: ''
          },
          reactions: [
            {
              id: 'r1',
              message_id: '1',
              user_id: 'user2',
              reaction: '👍',
              user: { full_name: 'Maria Santos' }
            }
          ],
          read_by: ['user1', 'user2']
        },
        {
          id: '2',
          document_id: documentId,
          user_id: 'user2',
          message: 'Claro! Vou dar uma olhada agora. Ficou muito bom o início!',
          message_type: 'text',
          reply_to: '1',
          is_edited: false,
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          user: {
            id: 'user2',
            email: 'maria@empresa.com',
            full_name: 'Maria Santos',
            avatar_url: ''
          },
          read_by: ['user1', 'user2']
        },
        {
          id: '3',
          document_id: documentId,
          user_id: 'system',
          message: 'Pedro Costa entrou no documento',
          message_type: 'system',
          is_edited: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          read_by: ['user1', 'user2']
        },
        {
          id: '4',
          document_id: documentId,
          user_id: user!.id,
          message: `@João Silva @Maria Santos Que tal fazermos uma call rápida para alinhar os próximos passos?`,
          message_type: 'mention',
          mentioned_users: ['user1', 'user2'],
          is_edited: false,
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          user: {
            id: user!.id,
            email: user!.email!,
            full_name: 'Você',
            avatar_url: ''
          },
          reactions: [
            {
              id: 'r2',
              message_id: '4',
              user_id: 'user1',
              reaction: '✅',
              user: { full_name: 'João Silva' }
            }
          ],
          read_by: [user!.id]
        }
      ];

      setMessages(mockMessages);
      
      // Simular mensagens não lidas
      const unread = mockMessages.filter(m => 
        !m.read_by?.includes(user!.id) && m.user_id !== user!.id
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    // Simular indicador de digitação
    const typingInterval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance
        setIsTyping(['user1']);
        setTimeout(() => setIsTyping([]), 2000);
      }
    }, 5000);

    return () => clearInterval(typingInterval);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const message: ChatMessage = {
        id: Date.now().toString(),
        document_id: documentId,
        user_id: user.id,
        message: newMessage,
        message_type: newMessage.includes('@') ? 'mention' : 'text',
        mentioned_users: extractMentions(newMessage),
        reply_to: replyingTo || undefined,
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email!,
          full_name: 'Você',
          avatar_url: ''
        },
        reactions: [],
        read_by: [user.id]
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentions = text.match(/@\w+/g);
    return mentions ? mentions.map(m => m.substring(1)) : [];
  };

  const toggleReaction = async (messageId: string, reaction: string) => {
    if (!user) return;

    try {
      setMessages(prev => prev.map(message => {
        if (message.id === messageId) {
          const existingReaction = message.reactions?.find(
            r => r.user_id === user.id && r.reaction === reaction
          );

          if (existingReaction) {
            // Remover reação
            return {
              ...message,
              reactions: message.reactions?.filter(r => r.id !== existingReaction.id)
            };
          } else {
            // Adicionar reação
            const newReaction: MessageReaction = {
              id: Date.now().toString(),
              message_id: messageId,
              user_id: user.id,
              reaction,
              user: { full_name: 'Você' }
            };
            return {
              ...message,
              reactions: [...(message.reactions || []), newReaction]
            };
          }
        }
        return message;
      }));
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const startEdit = (message: ChatMessage) => {
    setEditingMessage(message.id);
    setEditText(message.message);
  };

  const saveEdit = async (messageId: string) => {
    try {
      setMessages(prev => prev.map(message => 
        message.id === messageId 
          ? { 
              ...message, 
              message: editText, 
              is_edited: true,
              edited_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : message
      ));
      setEditingMessage(null);
      setEditText('');
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const getRepliedMessage = (replyToId: string) => {
    return messages.find(m => m.id === replyToId);
  };

  const groupReactions = (reactions: MessageReaction[]) => {
    const grouped: { [key: string]: MessageReaction[] } = {};
    reactions.forEach(reaction => {
      if (!grouped[reaction.reaction]) {
        grouped[reaction.reaction] = [];
      }
      grouped[reaction.reaction].push(reaction);
    });
    return grouped;
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'mention': return <AtSign className="h-3 w-3 text-blue-600" />;
      case 'file': return <Paperclip className="h-3 w-3 text-gray-600" />;
      case 'system': return <Clock className="h-3 w-3 text-gray-500" />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold">Chat</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {onlineUsers.length > 0 && (
          <div className="flex items-center space-x-1 mt-2">
            <div className="flex -space-x-1">
              {onlineUsers.slice(0, 3).map((user, index) => (
                <Avatar key={index} className="h-5 w-5 border border-white">
                  <AvatarFallback className="text-xs">
                    {user.user?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {onlineUsers.length} online
            </span>
          </div>
        )}
      </div>

      {/* Mensagens */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {/* Mensagem respondida */}
              {message.reply_to && (
                <div className="pl-4 border-l-2 border-gray-200 ml-10">
                  {(() => {
                    const repliedMsg = getRepliedMessage(message.reply_to);
                    return repliedMsg ? (
                      <div className="text-xs text-gray-500">
                        <div className="flex items-center space-x-1 mb-1">
                          <Reply className="h-3 w-3" />
                          <span className="font-medium">
                            {repliedMsg.user?.full_name || repliedMsg.user?.email}
                          </span>
                        </div>
                        <p className="truncate">{repliedMsg.message}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              <div className={`flex space-x-3 ${
                message.message_type === 'system' ? 'justify-center' : ''
              }`}>
                {message.message_type !== 'system' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.user?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {message.user?.full_name?.charAt(0) || message.user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`flex-1 min-w-0 ${
                  message.message_type === 'system' ? 'text-center' : ''
                }`}>
                  {message.message_type === 'system' ? (
                    <div className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{message.message}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(message.created_at)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {message.user?.full_name || message.user?.email}
                        </span>
                        {getMessageIcon(message.message_type)}
                        <span className="text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                        {message.is_edited && (
                          <span className="text-xs text-gray-400">(editado)</span>
                        )}
                        {message.read_by && message.read_by.length > 1 && (
                          <CheckCheck className="h-3 w-3 text-blue-600" />
                        )}
                      </div>

                      {editingMessage === message.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveEdit(message.id);
                              } else if (e.key === 'Escape') {
                                setEditingMessage(null);
                              }
                            }}
                          />
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => saveEdit(message.id)}>
                              Salvar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setEditingMessage(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className={`text-sm ${
                          message.message_type === 'mention' 
                            ? 'bg-blue-50 border border-blue-200 rounded p-2' 
                            : 'text-gray-700'
                        }`}>
                          <p className="whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                        </div>
                      )}

                      {/* Reações */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(groupReactions(message.reactions)).map(([reaction, users]) => (
                            <Button
                              key={reaction}
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleReaction(message.id, reaction)}
                            >
                              {reaction} {users.length}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Ações */}
                      {message.message_type !== 'system' && (
                        <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(message.id)}
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
                                  onClick={() => toggleReaction(message.id, reaction)}
                                >
                                  {reaction}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {message.user_id === user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => startEdit(message)}>
                                  <Edit3 className="h-3 w-3 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => deleteMessage(message.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Indicador de digitação */}
          {isTyping.length > 0 && (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="text-sm">João está digitando...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Resposta ativa */}
      {replyingTo && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
          {(() => {
            const repliedMsg = getRepliedMessage(replyingTo);
            return repliedMsg ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  <Reply className="h-3 w-3 text-blue-600" />
                  <span className="text-blue-600">
                    Respondendo para {repliedMsg.user?.full_name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Input de mensagem */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              ref={inputRef}
              placeholder="Digite uma mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="text-sm"
            />
          </div>
          <Button
            size="sm"
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Paperclip className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <AtSign className="h-3 w-3" />
            </Button>
          </div>
          <span className="text-xs text-gray-500">
            Enter para enviar
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel; 