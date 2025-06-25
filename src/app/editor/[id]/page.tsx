'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import FileUpload from '@/components/upload/FileUpload';
import CommentsPanel from '@/components/collaboration/CommentsPanel';
import ChatPanel from '@/components/collaboration/ChatPanel';
import PresenceIndicator from '@/components/collaboration/PresenceIndicator';
import CollaborativeCursors from '@/components/collaboration/CollaborativeCursors';
import { usePresence } from '@/hooks/usePresence';
import { 
  Save, 
  Share, 
  Settings, 
  ArrowLeft, 
  Eye, 
  Edit3,
  MoreHorizontal,
  Star,
  Trash2,
  Copy,
  Download,
  Users,
  Upload,
  Paperclip,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Document {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  is_starred: boolean;
  author_id: string;
}

const DocumentEditor: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const documentId = params?.id as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | undefined>();
  
  const contentRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Hook de presença para colaboração
  const {
    onlineUsers,
    cursors,
    isOnline,
    onlineCount,
    otherUsers,
    otherCursors,
    updateCursor,
    updateStatus
  } = usePresence(documentId);

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Carregar documento
  useEffect(() => {
    if (user && documentId) {
      loadDocument();
    }
  }, [user, documentId]);

  // Auto-save
  useEffect(() => {
    if (hasUnsavedChanges && document) {
      // Debounce save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveDocument();
      }, 2000); // Auto-save após 2 segundos
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, hasUnsavedChanges]);

  const loadDocument = async () => {
    try {
      if (documentId?.startsWith('new')) {
        // Verificar se há template nos parâmetros
        const templateTitle = searchParams?.get('title');
        const templateContent = searchParams?.get('content');
        
        // Criar novo documento
        const newDoc: Document = {
          id: documentId,
          title: templateTitle ? decodeURIComponent(templateTitle) : 'Documento sem título',
          content: templateContent ? decodeURIComponent(templateContent) : '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_public: false,
          is_starred: false,
          author_id: user!.id
        };
        setDocument(newDoc);
        setTitle(newDoc.title);
        setContent(newDoc.content);
      } else {
        // Simular carregamento de documento existente
        const existingDoc: Document = {
          id: documentId,
          title: 'Projeto Notion Spark Studio',
          content: `# Bem-vindo ao Notion Spark Studio

Este é um exemplo de documento rico com formatação.

## Funcionalidades

- ✅ Editor rico
- ✅ Auto-save
- ✅ Compartilhamento
- ✅ Colaboração em tempo real

## Próximos Passos

1. Implementar mais blocos de conteúdo
2. Adicionar suporte a imagens
3. Melhorar sistema de colaboração

---

**Nota**: Este é um documento de exemplo. Você pode editá-lo livremente!`,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-25T15:30:00Z',
          is_public: false,
          is_starred: true,
          author_id: user!.id
        };
        setDocument(existingDoc);
        setTitle(existingDoc.title);
        setContent(existingDoc.content);
      }
    } catch (error) {
      console.error('Error loading document:', error);
    }
  };

  const saveDocument = async () => {
    if (!document || isSaving) return;

    setIsSaving(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDocument(prev => prev ? {
        ...prev,
        title,
        content,
        updated_at: new Date().toISOString()
      } : null);
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.innerHTML;
      setContent(newContent);
      setHasUnsavedChanges(true);
    }
  };

  const toggleStar = () => {
    if (document) {
      setDocument({
        ...document,
        is_starred: !document.is_starred
      });
      setHasUnsavedChanges(true);
    }
  };

  const shareDocument = () => {
    // Implementar funcionalidade de compartilhamento
    console.log('Compartilhar documento');
  };

  const duplicateDocument = () => {
    router.push('/editor/new');
  };

  const deleteDocument = () => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      router.push('/dashboard');
    }
  };

  const handleUploadComplete = (files: any[]) => {
    // Inserir links dos arquivos no editor
    const fileLinks = files.map(file => {
      if (file.mime_type.startsWith('image/')) {
        return `![${file.original_filename}](${file.public_url})`;
      } else {
        return `[📎 ${file.original_filename}](${file.public_url})`;
      }
    }).join('\n\n');

    if (contentRef.current) {
      const currentContent = contentRef.current.innerHTML;
      contentRef.current.innerHTML = currentContent + '\n\n' + fileLinks;
      handleContentChange();
    }

    setShowUploadDialog(false);
  };

  // Funções de colaboração
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
      
      // Calcular posição da seleção
      const range = selection.getRangeAt(0);
      if (contentRef.current) {
        const startPos = getTextPosition(range.startContainer, range.startOffset);
        const endPos = getTextPosition(range.endContainer, range.endOffset);
        setSelectionRange({ start: startPos, end: endPos });
      }
    } else {
      setSelectedText('');
      setSelectionRange(undefined);
    }
  };

  const getTextPosition = (node: Node, offset: number): number => {
    if (!contentRef.current) return 0;
    
    const walker = document.createTreeWalker(
      contentRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );

    let position = 0;
    let currentNode;

    while (currentNode = walker.nextNode()) {
      if (currentNode === node) {
        return position + offset;
      }
      position += currentNode.textContent?.length || 0;
    }

    return position;
  };

  const handleCursorMove = (position: number, selection?: { start: number; end: number }) => {
    updateCursor(position, selection);
  };

  const handleMentionUser = (userId: string) => {
    // Implementar menção de usuário
    console.log('Mention user:', userId);
  };

  const handleStartChat = (userId: string) => {
    setShowChatPanel(true);
  };

  const handleInviteUser = () => {
    // Implementar convite de usuário
    console.log('Invite user');
  };

  // Detectar seleção de texto
  useEffect(() => {
    const handleSelectionChange = () => {
      handleTextSelection();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando editor...</span>
      </div>
    );
  }

  if (!user || !document) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleStar}
                className={`p-1 rounded ${document.is_starred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
              >
                <Star className={`h-4 w-4 ${document.is_starred ? 'fill-current' : ''}`} />
              </button>
              
              {document.is_public && (
                <Badge variant="outline" className="text-xs">
                  Público
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Status de salvamento */}
            <div className="text-sm text-gray-500">
              {isSaving ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-2"></div>
                  Salvando...
                </span>
              ) : hasUnsavedChanges ? (
                <span>Não salvo</span>
              ) : lastSaved ? (
                <span>Salvo {lastSaved.toLocaleTimeString()}</span>
              ) : null}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={saveDocument}
              disabled={isSaving || !hasUnsavedChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={shareDocument}
            >
              <Share className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>

            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Anexar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload de Arquivos</DialogTitle>
                </DialogHeader>
                <FileUpload
                  onUploadComplete={handleUploadComplete}
                  onUploadError={(error) => console.error('Upload error:', error)}
                  documentId={document?.id}
                  maxFiles={5}
                  maxSize={10}
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={duplicateDocument}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  Colaboradores
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={deleteDocument}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Título */}
        <div className="mb-8">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Título do documento"
            className="text-3xl font-bold border-none px-0 py-2 focus:ring-0 focus:outline-none bg-transparent"
            style={{ fontSize: '2rem', lineHeight: '2.5rem' }}
            disabled={!isEditing}
          />
        </div>

        {/* Conteúdo */}
        <div className="prose prose-lg max-w-none">
          {isEditing ? (
            <div
              ref={contentRef}
              contentEditable
              onInput={handleContentChange}
              onBlur={handleContentChange}
              dangerouslySetInnerHTML={{ __html: content }}
              className="min-h-96 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              style={{
                lineHeight: '1.6',
                fontSize: '16px'
              }}
            />
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: content }}
              className="min-h-96 p-4"
              style={{
                lineHeight: '1.6',
                fontSize: '16px'
              }}
            />
          )}
        </div>

        {/* Informações do documento */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Criado em {new Date(document.created_at).toLocaleDateString()}
            </div>
            <div>
              Última edição: {new Date(document.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentEditor; 