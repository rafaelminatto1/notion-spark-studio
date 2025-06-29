'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  MessageSquare,
  Sparkles,
  Clock,
  Globe
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

// Mock auth hook since it's missing
const useAuth = () => ({
  user: { id: '1', email: 'user@example.com' },
  loading: false
});

const DocumentEditor: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
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
      navigate('/login');
    }
  }, [user, loading, navigate]);

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
          content: templateContent ? decodeURIComponent(templateContent) : `# Bem-vindo ao Editor Colaborativo ✨

## Funcionalidades em tempo real

- 📝 **Edição colaborativa** - Veja outros usuários editando em tempo real
- 💬 **Comentários** - Adicione comentários e discussões
- 👥 **Presença** - Veja quem está online
- 🔄 **Auto-save** - Suas alterações são salvas automaticamente

## Como usar

1. **Digite aqui** para começar a escrever
2. **Convide pessoas** usando o botão de usuários
3. **Adicione comentários** selecionando texto
4. **Compartilhe** seu documento quando estiver pronto

---

*Este é um exemplo de documento rico. Edite à vontade!*`,
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
          title: 'Projeto Colaborativo',
          content: `# Projeto Colaborativo em Andamento 🚀

## Status do Projeto

✅ **Concluído**
- Sistema de presença em tempo real
- Editor colaborativo
- Interface moderna e responsiva

🔄 **Em Progresso**
- Sistema de comentários
- Notificações push
- Integração com APIs externas

📋 **Próximos Passos**
- [ ] Implementar versionamento
- [ ] Adicionar templates
- [ ] Sistema de permissões avançado

## Equipe

- **João Silva** - Líder do Projeto
- **Maria Santos** - Designer UX/UI
- **Pedro Costa** - Desenvolvedor Backend

---

**Última atualização:** ${new Date().toLocaleDateString('pt-BR')}`,
          created_at: '2025-01-20T10:00:00Z',
          updated_at: new Date().toISOString(),
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
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
    navigate('/editor/new');
  };

  const deleteDocument = () => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      navigate('/dashboard');
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-slate-300 font-medium">Carregando editor...</p>
        </div>
      </div>
    );
  }

  if (!user || !document) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header melhorado */}
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleStar}
                className={`p-2 rounded-full transition-all duration-200 ${
                  document.is_starred 
                    ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' 
                    : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800/50'
                }`}
              >
                <Star className={`h-4 w-4 ${document.is_starred ? 'fill-current' : ''}`} />
              </button>
              
              {document.is_public && (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                  <Globe className="h-3 w-3 mr-1" />
                  Público
                </Badge>
              )}
            </div>
          </div>

          {/* Presença de usuários */}
          <div className="flex items-center space-x-4">
            <PresenceIndicator
              users={onlineUsers}
              onlineCount={onlineCount}
              onInviteUser={() => console.log('Invite user')}
              onMentionUser={(userId) => console.log('Mention user:', userId)}
              onStartChat={() => setShowChatPanel(true)}
            />
          </div>

          <div className="flex items-center space-x-3">
            {/* Status de salvamento melhorado */}
            <div className="text-sm text-slate-400 flex items-center space-x-2">
              {isSaving ? (
                <div className="flex items-center space-x-2 text-blue-400">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-400"></div>
                  <span>Salvando...</span>
                </div>
              ) : hasUnsavedChanges ? (
                <div className="flex items-center space-x-2 text-amber-400">
                  <div className="h-2 w-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <span>Não salvo</span>
                </div>
              ) : lastSaved ? (
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Clock className="h-3 w-3" />
                  <span>Salvo {lastSaved.toLocaleTimeString()}</span>
                </div>
              ) : null}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={saveDocument}
              disabled={isSaving || !hasUnsavedChanges}
              className="border-slate-600/50 text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-purple-500/30 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            >
              <Share className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="border-slate-600/50 text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
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
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end"
                className="bg-slate-900/95 backdrop-blur-md border-slate-700/50"
              >
                <DropdownMenuItem className="text-slate-200 hover:bg-slate-800/50">
                  <Copy className="h-4 w-4 mr-2 text-blue-400" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-200 hover:bg-slate-800/50">
                  <Download className="h-4 w-4 mr-2 text-emerald-400" />
                  Exportar
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700/50" />
                <DropdownMenuItem className="text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Editor principal melhorado */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Título com design melhor */}
        <div className="mb-8">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Digite o título do documento..."
            className="text-4xl font-bold border-none px-0 py-4 bg-transparent text-slate-100 placeholder:text-slate-500 focus:ring-0 focus:outline-none"
            style={{ fontSize: '2.5rem', lineHeight: '3rem' }}
            disabled={!isEditing}
          />
        </div>

        {/* Conteúdo com visual moderno */}
        <div className="prose prose-lg prose-invert max-w-none">
          {isEditing ? (
            <div
              ref={contentRef}
              contentEditable
              onInput={handleContentChange}
              onBlur={handleContentChange}
              dangerouslySetInnerHTML={{ __html: content }}
              className="min-h-96 p-6 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none transition-all duration-200 text-slate-200"
              style={{
                lineHeight: '1.7',
                fontSize: '16px'
              }}
            />
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: content }}
              className="min-h-96 p-6 rounded-xl bg-slate-800/20 border border-slate-700/20 text-slate-200"
              style={{
                lineHeight: '1.7',
                fontSize: '16px'
              }}
            />
          )}
        </div>

        {/* Informações do documento melhoradas */}
        <div className="mt-12 pt-8 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>Criado em {new Date(document.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>Última edição: {new Date(document.updated_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Cursors colaborativos */}
      <CollaborativeCursors
        cursors={otherCursors}
        editorRef={contentRef}
        onCursorMove={(position, selection) => updateCursor(position, selection)}
      />
    </div>
  );
};

export default DocumentEditor;
