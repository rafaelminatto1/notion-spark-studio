'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Users, MessageSquare, FileText, Tag, Share2, Save, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface FileData {
  id: string;
  name: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  emoji?: string;
  tags?: string[];
  is_public: boolean;
  show_in_sidebar: boolean;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  position_start?: number;
  position_end?: number;
  selection_text?: string;
  created_at: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface UserPresence {
  user_id: string;
  status: string;
  cursor_position?: number;
  selection_start?: number;
  selection_end?: number;
  last_seen: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

export default function EditorPage() {
  const params = useParams();
  const { user } = useAuthContext();
  const [file, setFile] = useState<FileData | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{start: number, end: number} | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showPresencePanel, setShowPresencePanel] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (params.id && typeof params.id === 'string') {
      loadFile(params.id);
      setupRealtimeSubscription(params.id);
    }
  }, [params.id]);

  const loadFile = async (fileId: string) => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) throw error;

      setFile(data);
      setContent(data.content || '');
      setTitle(data.name);
      loadComments(fileId);
    } catch (error) {
      console.error('Error loading file:', error);
      toast.error('Erro ao carregar arquivo');
    }
  };

  const setupRealtimeSubscription = (fileId: string) => {
    // Subscribe to presence updates
    const presenceChannel = supabase.channel(`file-${fileId}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState();
        const users = Object.values(presenceState).flat() as UserPresence[];
        setOnlineUsers(users.filter(u => u.user_id !== user?.id));
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe();

    // Track current user presence
    if (user) {
      presenceChannel.track({
        user_id: user.id,
        status: 'online',
        cursor_position: 0,
        last_seen: new Date().toISOString(),
      });
    }

    return () => {
      presenceChannel.unsubscribe();
    };
  };

  const loadComments = async (fileId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (name, avatar)
        `)
        .eq('document_id', fileId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSave = useCallback(async () => {
    if (!file || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('files')
        .update({
          name: title,
          content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', file.id);

      if (error) throw error;

      setLastSaved(new Date());
      toast.success('Arquivo salvo com sucesso');
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Erro ao salvar arquivo');
    } finally {
      setSaving(false);
    }
  }, [file, user, title, content]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      if (file && content !== (file.content || '')) {
        handleSave();
      }
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, file, handleSave]);

  const handleTextSelection = () => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;
      
      if (start !== end) {
        const selected = content.substring(start, end);
        setSelectedText(selected);
        setSelectionRange({ start, end });
        setShowCommentDialog(true);
      }
    }
  };

  const createHighlighter = useCallback(() => {
    if (typeof document === 'undefined') return;
    
    const walker = document.createTreeWalker?.(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    // Process text nodes for highlighting
    let node;
    while (node = walker?.nextNode()) {
      // Highlight logic here
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleSave]);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                placeholder="Título do documento"
              />
              {file.emoji && (
                <span className="text-2xl">{file.emoji}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {lastSaved && (
                <span className="text-sm text-muted-foreground">
                  Salvo às {format(lastSaved, 'HH:mm', { locale: ptBR })}
                </span>
              )}
              
              <Button 
                onClick={handleSave} 
                disabled={saving}
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPresencePanel(!showPresencePanel)}
              >
                <Users className="w-4 h-4 mr-2" />
                {onlineUsers.length}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-0">
                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onSelect={handleTextSelection}
                  className="w-full h-96 p-6 border-none outline-none resize-none font-mono text-sm leading-relaxed"
                  placeholder="Comece a escrever..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* File Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Informações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  Criado em {format(new Date(file.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                  Modificado em {format(new Date(file.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </div>
                <div className="flex items-center text-sm">
                  {file.is_public ? (
                    <>
                      <Eye className="w-4 h-4 mr-2 text-green-500" />
                      Público
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 mr-2 text-muted-foreground" />
                      Privado
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Online Users */}
            {showPresencePanel && onlineUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Online ({onlineUsers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {onlineUsers.map((presence) => (
                      <div key={presence.user_id} className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={presence.user?.avatar} />
                          <AvatarFallback>
                            {presence.user?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{presence.user?.name || 'Usuário'}</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Comentários ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-primary/20 pl-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={comment.user?.avatar} />
                            <AvatarFallback>
                              {comment.user?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{comment.user?.name || 'Usuário'}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), 'HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                        {comment.selection_text && (
                          <div className="text-xs bg-muted p-1 rounded mb-1">
                            "{comment.selection_text}"
                          </div>
                        )}
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum comentário ainda
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Tags */}
            {file.tags && file.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {file.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
