import React, { useState, useCallback, useEffect } from 'react';
import { 
  Star, 
  Calendar, 
  Tag, 
  Share2, 
  MoreHorizontal,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Eye,
  Edit3,
  Layout,
  Type,
  Sparkles,
  X,
  Brain,
  FileText,
  PlusCircle,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { FileItem } from '@/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Block } from '@/components/editor/BlockEditor';
import { BlockEditor } from '@/components/editor/BlockEditor';
import type { Template } from '@/components/editor/TemplateSystem';
import { TemplateSystem } from '@/components/editor/TemplateSystem';
import { AIContentSuggestions } from './ai/AIContentSuggestions';
import { SmartWritingAssistant } from './ai/SmartWritingAssistant';
import { AutoTagging } from './ai/AutoTagging';
import { AdvancedAnalytics } from './ai/AdvancedAnalytics';
import { PerformanceOptimizer } from './ai/PerformanceOptimizer';
import { CollaborationIntegration } from './collaboration/CollaborationIntegration';
import { ConditionalTemplates } from './templates/ConditionalTemplates';
import { usePermissions } from './permissions/PermissionsEngine';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NoteEditorPanelProps {
  note: FileItem | null;
  onUpdateNote: (noteId: string, updates: Partial<FileItem>) => void;
  onToggleFavorite: (noteId: string) => void;
  isFavorite: boolean;
}

export const NoteEditorPanel: React.FC<NoteEditorPanelProps> = ({
  note,
  onUpdateNote,
  onToggleFavorite,
  isFavorite
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(note?.name || '');
  const [content, setContent] = useState(note?.content || '');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editorMode, setEditorMode] = useState<'text' | 'blocks'>('text');
  const [showTemplates, setShowTemplates] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [activeAITab, setActiveAITab] = useState('suggestions');
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showConditionalTemplates, setShowConditionalTemplates] = useState(false);

  // Permissions and collaboration
  const { checkPermission, state: permissionsState } = usePermissions();
  const canEdit = note ? checkPermission(permissionsState.currentUser.id, note.id, 'update') : false;
  const canComment = note ? checkPermission(permissionsState.currentUser.id, note.id, 'comment') : false;
  const canCollaborate = canEdit || canComment;

  // Update local state when note changes
  useEffect(() => {
    if (note?.name !== undefined) {
      setTitle(note.name || '');
      setContent(note.content || '');
    }
  }, [note?.id]);

  // Auto-save functionality
  useEffect(() => {
    if (!note?.id || content === note.content) return;

    const timeoutId = setTimeout(() => {
      setIsAutoSaving(true);
      onUpdateNote(note.id, { 
        content, 
        updatedAt: new Date() 
      });
      setLastSaved(new Date());
      setTimeout(() => { setIsAutoSaving(false); }, 1000);
    }, 1000); // Auto-save after 1 second of inactivity

    return () => { clearTimeout(timeoutId); };
  }, [content, note, onUpdateNote]);

  const handleTitleSave = useCallback(() => {
    if (note && note.id && title.trim() !== note.name) {
      onUpdateNote(note.id, { name: title.trim() });
    }
    setIsEditingTitle(false);
  }, [note, title, onUpdateNote]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTitleSave();
    }
    if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitle(note?.name || '');
    }
  };

  const insertFormatting = (format: string) => {
    const textarea = document.querySelector('#note-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'texto em negrito'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'texto em itálico'}*`;
        break;
      case 'code':
        formattedText = selectedText.includes('\n') 
          ? `\`\`\`\n${selectedText || 'código'}\n\`\`\``
          : `\`${selectedText || 'código'}\``;
        break;
      case 'quote':
        formattedText = `> ${selectedText || 'citação'}`;
        break;
      case 'list':
        formattedText = `- ${selectedText || 'item da lista'}`;
        break;
      case 'link':
        formattedText = `[${selectedText || 'texto do link'}](url)`;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Set cursor position
    setTimeout(() => {
      const newCursorPos = start + formattedText.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const addTag = () => {
    if (note && newTag.trim()) {
      const currentTags = note.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        onUpdateNote(note.id, { 
          tags: [...currentTags, newTag.trim()]
        });
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (note) {
      const currentTags = note.tags || [];
      onUpdateNote(note.id, { 
        tags: currentTags.filter(tag => tag !== tagToRemove)
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // BlockEditor handlers
  const handleBlocksChange = useCallback((newBlocks: Block[]) => {
    setBlocks(newBlocks);
    if (note && note.id) {
      const blockContent = JSON.stringify(newBlocks);
      onUpdateNote(note.id, { content: blockContent });
    }
  }, [note, onUpdateNote]);

  const handleTemplateSelect = useCallback((template: Template) => {
    setBlocks(template.blocks);
    setEditorMode('blocks');
    if (note && note.id) {
      const blockContent = JSON.stringify(template.blocks);
      onUpdateNote(note.id, { 
        content: blockContent,
        name: note.name || template.name 
      });
    }
  }, [note, onUpdateNote]);

  const toggleEditorMode = useCallback(() => {
    if (editorMode === 'text') {
      // Convert text to blocks
      const textBlocks: Block[] = content
        .split('\n\n')
        .filter(text => text.trim())
        .map((text, index) => ({
          id: `block-${index}`,
          type: 'paragraph' as const,
          content: text.trim()
        }));
      setBlocks(textBlocks.length > 0 ? textBlocks : [{ id: '1', type: 'paragraph', content: '' }]);
      setEditorMode('blocks');
    } else {
      // Convert blocks to text
      const textContent = blocks
        .map(block => block.content)
        .join('\n\n');
      setContent(textContent);
      setEditorMode('text');
    }
  }, [editorMode, content, blocks]);

  // Initialize blocks from existing content
  useEffect(() => {
    if (note && note.content && editorMode === 'blocks') {
      try {
        const parsedBlocks = JSON.parse(note.content);
        if (Array.isArray(parsedBlocks)) {
          setBlocks(parsedBlocks);
        }
      } catch {
        // If content is not JSON, convert text to blocks
        const textBlocks: Block[] = note.content
          .split('\n\n')
          .filter(text => text.trim())
          .map((text, index) => ({
            id: `block-${index}`,
            type: 'paragraph' as const,
            content: text.trim()
          }));
        setBlocks(textBlocks.length > 0 ? textBlocks : [{ id: '1', type: 'paragraph', content: '' }]);
      }
    }
  }, [note?.id, note?.content, editorMode]);

  if (!note) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Edit3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">
            Selecione uma nota para editar
          </h3>
          <p className="text-gray-400">
            Escolha uma nota da lista ou crie uma nova
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-[#f7faff] dark:bg-[#181f2a] rounded-xl shadow-md p-0 md:p-6 max-w-4xl mx-auto mt-6">
      {/* Header do Editor */}
      <div className="flex items-center justify-between border-b border-[#e3e8f0] dark:border-[#232b3b] px-4 py-3 bg-white dark:bg-[#232b3b] rounded-t-xl">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-[#2563eb] dark:text-[#60a5fa]" />
          <span className="text-xl font-bold text-[#1a2233] dark:text-white truncate">
            {note?.name ?? 'Sem título'}
          </span>
          {isFavorite && <Star className="h-5 w-5 text-[#22c55e] dark:text-[#4ade80]" />}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="border-[#2563eb] text-[#2563eb] dark:border-[#60a5fa] dark:text-[#60a5fa]">
            Compartilhar
          </Button>
          <Button size="sm" variant="outline" className="border-[#22c55e] text-[#22c55e] dark:border-[#4ade80] dark:text-[#4ade80]" onClick={() => { onToggleFavorite(note.id); }}>
            {isFavorite ? 'Remover dos Favoritos' : 'Favoritar'}
          </Button>
        </div>
      </div>
      {/* Toolbar de formatação */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#f7faff] dark:bg-[#232b3b] border-b border-[#e3e8f0] dark:border-[#232b3b]">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => { insertFormatting('bold'); }}
          title="Negrito (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => { insertFormatting('italic'); }}
          title="Itálico (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => { insertFormatting('code'); }}
          title="Código"
        >
          <Code className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        {/* Editor Mode Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-3 text-xs",
            editorMode === 'blocks' && "bg-emerald-100 text-emerald-700"
          )}
          onClick={toggleEditorMode}
          title={editorMode === 'text' ? 'Mudar para Editor de Blocos' : 'Mudar para Editor de Texto'}
        >
          {editorMode === 'text' ? <Layout className="h-3 w-3 mr-1" /> : <Type className="h-3 w-3 mr-1" />}
          {editorMode === 'text' ? 'Blocos' : 'Texto'}
        </Button>
        
        {/* Templates Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={() => { setShowTemplates(true); }}
          title="Escolher Template"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Templates
        </Button>

        {/* Conditional Templates Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={() => { setShowConditionalTemplates(true); }}
          title="Templates Inteligentes"
        >
          <Brain className="h-3 w-3 mr-1" />
          Smart
        </Button>

        {/* Collaboration Button */}
        {canCollaborate && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 text-xs",
              showCollaboration && "bg-blue-100 text-blue-700"
            )}
            onClick={() => { setShowCollaboration(!showCollaboration); }}
            title="Colaboração em Tempo Real"
          >
            <Layers className="h-3 w-3 mr-1" />
            Colaborar
          </Button>
        )}
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => { insertFormatting('list'); }}
          title="Lista"
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => { insertFormatting('quote'); }}
          title="Citação"
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => { insertFormatting('link'); }}
          title="Link"
        >
          <Link className="h-4 w-4" />
        </Button>
        
        <div className="flex-1" />
        
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-3 text-xs",
            isPreviewMode && "bg-blue-100 text-blue-700"
          )}
          onClick={() => { setIsPreviewMode(!isPreviewMode); }}
        >
          <Eye className="h-3 w-3 mr-1" />
          Preview
        </Button>
      </div>

      {/* Editor de conteúdo */}
      <div className="flex-1 p-4 md:p-8 bg-white dark:bg-[#232b3b] rounded-b-xl overflow-auto">
        {isPreviewMode ? (
          <div className="prose prose-sm max-w-none">
            {content ? (
              <div dangerouslySetInnerHTML={{ 
                __html: content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/`(.*?)`/g, '<code>$1</code>')
                  .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
                  .replace(/^- (.*$)/gm, '<li>$1</li>')
                  .replace(/\n/g, '<br>')
              }} />
            ) : (
              <p className="text-gray-400 text-center py-8">
                Comece a escrever para ver o preview...
              </p>
            )}
          </div>
        ) : editorMode === 'blocks' ? (
          <div className="h-full">
            <BlockEditor
              initialBlocks={blocks}
              onChange={handleBlocksChange}
              placeholder="Digite / para ver comandos ou escolha um template..."
              className="h-full"
            />
          </div>
        ) : (
          <Textarea
            id="note-content"
            value={content}
            onChange={(e) => { setContent(e.target.value); }}
            placeholder="Comece a escrever..."
            className="w-full h-full resize-none border-none focus:ring-0 text-base leading-relaxed bg-transparent"
            style={{ minHeight: '400px' }}
          />
        )}
      </div>

      {/* Footer with Tags and Metadata */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        {/* Tags */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Tags</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {note.tags?.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-red-100 hover:text-red-800"
                onClick={() => { removeTag(tag); }}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => { setNewTag(e.target.value); }}
              placeholder="Adicionar tag..."
              className="text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <Button onClick={addTag} size="sm" variant="outline">
              Adicionar
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Criado em {formatDate(note.createdAt.toString())}</span>
          <span>•</span>
          <span>Modificado em {formatDate(note.updatedAt.toString())}</span>
        </div>
      </div>

      {/* Template System Modal */}
      <TemplateSystem
        isOpen={showTemplates}
        onClose={() => { setShowTemplates(false); }}
        onSelectTemplate={handleTemplateSelect}
      />

      {/* AI Assistant Panel */}
      <AnimatePresence>
        {showAIPanel && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-white border-l border-slate-200 shadow-xl z-50 overflow-y-auto"
          >
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Assistente IA</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowAIPanel(false); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Tabs value={activeAITab} onValueChange={setActiveAITab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
                  <TabsTrigger value="writing">Escrita</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-3 mt-2">
                  <TabsTrigger value="tagging">Tags</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="p-4">
              {activeAITab === 'suggestions' && (
                <AIContentSuggestions
                  currentFile={note}
                  allFiles={[]}
                  onApplySuggestion={(suggestion) => {
                    if (suggestion.type === 'content' || suggestion.type === 'improvement') {
                      setContent(suggestion.content);
                    }
                  }}
                  onUpdateContent={setContent}
                />
              )}

              {activeAITab === 'writing' && (
                <SmartWritingAssistant
                  content={content}
                  onContentChange={setContent}
                  enabled={true}
                  language="pt-BR"
                  mode="advanced"
                />
              )}

              {activeAITab === 'tagging' && (
                <AutoTagging
                  files={[]}
                  currentFile={note}
                  onApplyTags={(fileId, tags) => {
                    onUpdateNote(fileId, { tags });
                  }}
                  onApplyOrganization={(suggestion) => {
                    // Handle organization suggestions
                    console.log('Apply organization:', suggestion);
                  }}
                  autoMode={false}
                />
              )}

              {activeAITab === 'analytics' && (
                <AdvancedAnalytics
                  files={[]}
                />
              )}

              {activeAITab === 'performance' && (
                <PerformanceOptimizer
                  enabled={true}
                  autoOptimize={false}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed right-4 top-20 z-40"
        onClick={() => { setShowAIPanel(!showAIPanel); }}
      >
        <Brain className="h-4 w-4 mr-2" />
        IA
      </Button>

      {/* Conditional Templates Modal */}
      <AnimatePresence>
        {showConditionalTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Templates Inteligentes</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowConditionalTemplates(false); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <ConditionalTemplates
                  onTemplateSelect={(template, variables) => {
                    // Process template with variables and apply to content
                    let processedContent = template.content;
                    Object.entries(variables).forEach(([key, value]) => {
                      const placeholder = new RegExp(`{{${key}}}`, 'g');
                      processedContent = processedContent.replace(placeholder, String(value || ''));
                    });
                    
                    // Add system variables
                    processedContent = processedContent.replace(/{{date}}/g, new Date().toLocaleDateString('pt-BR'));
                    processedContent = processedContent.replace(/{{current_time}}/g, new Date().toLocaleString('pt-BR'));
                    
                    setContent(processedContent);
                    setShowConditionalTemplates(false);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collaboration Integration */}
      {showCollaboration && note && canCollaborate && (
        <CollaborationIntegration
          documentId={note.id}
          currentUser={{
            id: permissionsState.currentUser.id,
            name: 'Usuário Atual',
            email: 'usuario@exemplo.com',
            color: '#3B82F6',
            isOnline: true,
            lastActivity: new Date(),
            permissions: canEdit ? ['read', 'update', 'comment'] : ['read', 'comment']
          }}
          content={content}
          onContentChange={(newContent) => {
            setContent(newContent);
            if (note?.id) {
              onUpdateNote(note.id, { content: newContent });
            }
          }}
          isEnabled={canCollaborate}
          maxCollaborators={10}
        />
      )}

      {/* Enhanced Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Button
            variant={editorMode === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setEditorMode('text'); }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Texto
          </Button>
          <Button
            variant={editorMode === 'blocks' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setEditorMode('blocks'); }}
          >
            <Layers className="h-4 w-4 mr-2" />
            Blocos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowTemplates(true); }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowAIPanel(true); }}
            className={cn(showAIPanel && "bg-blue-50 border-blue-200")}
          >
            <Brain className="h-4 w-4 mr-2" />
            Assistente IA
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">
            {content.split(' ').length} palavras
          </span>
          <div className="w-2 h-2 rounded-full bg-green-500" title="Salvamento automático ativo" />
        </div>
      </div>
    </div>
  );
}; 