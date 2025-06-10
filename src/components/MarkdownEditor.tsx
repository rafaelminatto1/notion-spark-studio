import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MediaManagerEnhanced } from '@/components/MediaManagerEnhanced';
import { MediaViewer } from '@/components/MediaViewer';
import { LinkAutocomplete } from '@/components/LinkAutocomplete';
import { LinkRenderer } from '@/components/LinkRenderer';
import { TemplateSelector } from '@/components/TemplateSelector';
import { TemplateQuickActions } from '@/components/TemplateQuickActions';
import { ResizeIndicator } from '@/components/ResizeIndicator';
import { TemplateAnalytics } from '@/components/TemplateAnalytics';
import { AppleGestures } from '@/components/AppleGestures';
import { AppleTemplateSelector } from '@/components/AppleTemplateSelector';
import { useLinkAutocomplete } from '@/hooks/useLinkAutocomplete';
import { useAutoResize } from '@/hooks/useAutoResize';
import { useAppleDevice } from '@/hooks/useAppleDevice';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link, 
  Code, 
  Quote,
  Table,
  CheckSquare,
  Eye,
  EyeOff,
  Type,
  Calculator,
  Maximize2,
  LineChart,
  Upload,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import '../styles/editor-animations.css';
import '../styles/apple-optimized.css';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  files?: any[];
  onNavigateToFile?: (fileName: string) => void;
  onCreateFile?: (name: string) => Promise<string>;
  className?: string;
  isMobile?: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  files = [],
  onNavigateToFile,
  onCreateFile,
  className,
  isMobile = false
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAppleTemplates, setShowAppleTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Apple device detection e otimizações
  const appleDevice = useAppleDevice();

  const {
    isOpen: autocompleteOpen,
    suggestions,
    position: autocompletePosition,
    selectedIndex,
    handleTextChange,
    handleKeyDown: handleAutocompleteKeyDown,
    selectSuggestion,
    closeSuggestions
  } = useLinkAutocomplete({
    files,
    onCreateFile,
    onNavigateToFile
  });

  // Auto-resize hook para textarea inteligente - otimizado para Apple
  const { adjustHeight, isResizing, currentHeight, minHeight, maxHeight } = useAutoResize(textareaRef, content, {
    minHeight: appleDevice.isTargetDevice ? (appleDevice.isIPad ? 400 : 300) : (isMobile ? 300 : 200),
    maxHeight: appleDevice.isTargetDevice 
      ? (appleDevice.isIPad ? window.innerHeight * 0.8 : window.innerHeight * 0.65)
      : (isMobile ? window.innerHeight * 0.6 : window.innerHeight * 0.7),
    lineHeight: appleDevice.isTargetDevice ? (appleDevice.isIPad ? 28 : 26) : 24,
    padding: appleDevice.isTargetDevice ? (appleDevice.isIPad ? 24 : 20) : 16
  });

  const insertText = useCallback((beforeText: string, afterText: string = '', selectText: string = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToUse = selectedText || selectText;
    
    const newText = beforeText + textToUse + afterText;
    const newContent = content.substring(0, start) + newText + content.substring(end);
    
    onChange(newContent);

    setTimeout(() => {
      const newStart = start + beforeText.length;
      const newEnd = newStart + textToUse.length;
      textarea.setSelectionRange(newStart, newEnd);
      textarea.focus();
      adjustHeight();
    }, 0);
  }, [content, onChange, adjustHeight]);

  const insertMedia = useCallback((markdown: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const newContent = content.substring(0, start) + '\n' + markdown + '\n' + content.substring(start);
    
    onChange(newContent);

    setTimeout(() => {
      const newPosition = start + markdown.length + 2;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
      adjustHeight();
    }, 0);
  }, [content, onChange, adjustHeight]);

  const handleFileUpload = useCallback(async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error(`Tipo de arquivo não suportado: ${file.type}`);
        continue;
      }

      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          let markdown = '';
          
          if (file.type.startsWith('image/')) {
            markdown = `![${file.name}](${result})`;
          } else if (file.type.startsWith('video/')) {
            markdown = `<video controls width="100%">\n  <source src="${result}" type="${file.type}">\n  Seu navegador não suporta vídeo.\n</video>`;
          }
          
          insertMedia(markdown);
          toast.success(`${file.type.startsWith('image/') ? 'Imagem' : 'Vídeo'} adicionado com sucesso!`);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        toast.error('Erro ao processar arquivo');
      }
    }
  }, [insertMedia]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/') || item.type.startsWith('video/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const fileList = new DataTransfer();
          fileList.items.add(file);
          handleFileUpload(fileList.files);
        }
      }
    }
  }, [handleFileUpload]);

  const handleTextChangeWithAutocomplete = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onChange(newContent);
    
    if (textareaRef.current) {
      handleTextChange(newContent, textareaRef.current.selectionStart);
    }
    adjustHeight();
  }, [onChange, handleTextChange, adjustHeight]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle autocomplete first
    const autocompleteHandled = handleAutocompleteKeyDown(e);
    if (autocompleteHandled) return;

    // Handle other shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertText('**', '**', 'texto em negrito');
          break;
        case 'i':
          e.preventDefault();
          insertText('*', '*', 'texto em itálico');
          break;
        case 'k':
          e.preventDefault();
          insertText('[', '](url)', 'texto do link');
          break;
        case 'Enter':
          e.preventDefault();
          setZenMode(!zenMode);
          break;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      insertText('  ');
    }
  }, [insertText, handleAutocompleteKeyDown, zenMode]);

  const toolbarActions = [
    {
      icon: Bold,
      label: 'Negrito',
      action: () => insertText('**', '**', 'texto em negrito')
    },
    {
      icon: Italic,
      label: 'Itálico',
      action: () => insertText('*', '*', 'texto em itálico')
    },
    {
      icon: Type,
      label: 'Título',
      action: () => insertText('# ', '', 'Título')
    },
    {
      icon: List,
      label: 'Lista',
      action: () => insertText('- ', '', 'item da lista')
    },
    {
      icon: ListOrdered,
      label: 'Numerada',
      action: () => insertText('1. ', '', 'item numerado')
    },
    {
      icon: Link,
      label: 'Link',
      action: () => insertText('[', '](url)', 'texto do link')
    },
    {
      icon: Code,
      label: 'Código',
      action: () => insertText('`', '`', 'código')
    },
    {
      icon: Quote,
      label: 'Citação',
      action: () => insertText('> ', '', 'citação')
    },
    {
      icon: Table,
      label: 'Tabela',
      action: () => insertText('| Coluna 1 | Coluna 2 |\n|----------|----------|\n| ', ' | Célula 2 |\n| Célula 3 | Célula 4 |', 'Célula 1')
    },
    {
      icon: LineChart,
      label: 'Analytics',
      action: () => setShowAnalytics(true)
    }
  ];

  const CheckboxComponent = ({ checked, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => {
        const newContent = content.replace(
          checked ? '- [x]' : '- [ ]',
          e.target.checked ? '- [x]' : '- [ ]'
        );
        onChange(newContent);
      }}
      className="mr-2"
      {...props}
    />
  );

  const renderLineNumbers = () => {
    if (!showLineNumbers) return null;
    const lines = content.split('\n');
    return (
      <div className="absolute left-0 top-0 w-12 h-full bg-workspace-surface border-r border-workspace-border text-xs text-gray-500 pointer-events-none">
        {lines.map((_, index) => (
          <div key={index} className="h-6 px-2 flex items-center justify-end">
            {index + 1}
          </div>
        ))}
      </div>
    );
  };

  if (zenMode) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-background/95 to-background flex flex-col">
        {/* Zen Mode Toolbar - Enhanced */}
        <div className="flex items-center justify-between p-4 glass-effect border-b border-white/10">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZenMode(false)}
              className="gap-2 btn-magic"
            >
              <Maximize2 className="h-4 w-4" />
              Sair do Modo Foco
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className={cn("gap-2 btn-magic", showPreview && "bg-gradient-to-r from-purple-500 to-blue-500")}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Editar' : 'Preview'}
            </Button>
          </div>
        </div>

        {/* Zen Mode Content */}
        <div className="flex-1 flex">
          {!showPreview && (
            <div className="flex-1 relative card-magic m-4">
              {/* Resize Indicator for Zen Mode */}
              <ResizeIndicator
                isResizing={isResizing}
                currentHeight={currentHeight}
                minHeight={minHeight}
                maxHeight={maxHeight}
              />
              
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={handleTextChangeWithAutocomplete}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                placeholder="# ✨ Modo Zen - Foque na escrita...

🧘 **Modo Foco Ativado**
• Sem distrações - apenas você e suas ideias
• Ctrl+Enter para sair do modo zen
• Ctrl+V para colar mídia
• [[ para links entre páginas

💡 **Use Templates para começar rapidamente**"
                className={cn(
                  "h-full border-none resize-none bg-transparent text-workspace-text leading-relaxed font-mono text-lg focus:ring-0 focus:outline-none p-8 max-w-4xl mx-auto input-magic",
                  isDragging && "ring-2 ring-blue-400 bg-blue-50/5"
                )}
                style={{ 
                  height: 'auto',
                  minHeight: '60vh',
                  maxHeight: '80vh'
                }}
              />
            </div>
          )}

          {showPreview && (
            <div className="flex-1 overflow-auto m-4 card-magic">
              <div className="p-8 prose prose-invert prose-gray max-w-4xl mx-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeHighlight]}
                  components={{
                    input: CheckboxComponent,
                    a: ({ href, children, ...props }) => {
                      if (href?.startsWith('[[') && href?.endsWith(']]')) {
                        const fileName = href.slice(2, -2);
                        const fileExists = files.some(f => f.name === fileName);
                        return (
                          <LinkRenderer
                            target={fileName}
                            onNavigate={onNavigateToFile || (() => {})}
                            fileExists={fileExists}
                          />
                        );
                      }
                      return <a href={href} {...props}>{children}</a>;
                    }
                  }}
                >
                  {content || '*Nada para mostrar ainda...*'}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full flex flex-col card-magic", className)}>
              {/* Enhanced Mobile Toolbar */}
      <div
        className={cn(
          "flex gap-1 items-center border-b overflow-x-auto scrollbar-magic",
          appleDevice.isTargetDevice
            ? `apple-container ${appleDevice.isIPhone ? 'iphone-toolbar' : 'ipad-toolbar'} ${appleDevice.hasDynamicIsland ? 'has-dynamic-island' : ''}`
            : "",
          isMobile
            ? "fixed top-0 left-0 right-0 h-20 px-3 py-2 glass-effect z-50 shadow-lg"
            : "sticky top-0 px-2 py-1 bg-background/80 backdrop-blur-sm"
        )}
        style={appleDevice.isTargetDevice ? {
          paddingTop: appleDevice.optimizedSpacing.toolbar,
          fontSize: appleDevice.fontSize.medium
        } : {}}
      >
        {/* Template Selector */}
        <div className="mr-2">
          <TemplateSelector
            onSelectTemplate={(templateContent) => {
              onChange(templateContent);
              setTimeout(() => adjustHeight(), 100);
              toast.success('Template aplicado! 🎉');
            }}
            className={isMobile ? "text-xs" : ""}
          />
        </div>

        {/* Quick Templates - Desktop only */}
        {!isMobile && (
          <div className="mr-2 border-r border-white/20 pr-2">
            <TemplateQuickActions
              onSelectTemplate={(templateContent) => {
                onChange(templateContent);
                setTimeout(() => adjustHeight(), 100);
                toast.success('Template rápido aplicado! ⚡');
              }}
            />
          </div>
        )}
        {toolbarActions.map(({ icon: Icon, label, action }, idx) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            size={isMobile ? "lg" : "sm"}
            className={cn(
              "flex flex-col items-center justify-center flex-shrink-0 floating-element transition-all duration-300",
              isMobile ? "mx-1 px-3 py-3 text-base h-16 w-16 rounded-2xl" : "mx-0.5 px-2 py-2 text-xs h-10 w-10 rounded-xl"
            )}
            onClick={action}
            aria-label={label}
          >
            <Icon className={isMobile ? "h-6 w-6 mb-1" : "h-4 w-4 mb-0.5"} />
            {isMobile && <span className="text-[10px] leading-tight font-medium">{label}</span>}
          </Button>
        ))}

        {/* Preview Toggle for Mobile */}
        {isMobile && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="flex flex-col items-center justify-center flex-shrink-0 mx-1 px-3 py-3 text-base h-16 w-16 rounded-2xl btn-magic"
            onClick={() => setShowPreview(!showPreview)}
            aria-label="Preview"
          >
            {showPreview ? <EyeOff className="h-6 w-6 mb-1" /> : <Eye className="h-6 w-6 mb-1" />}
            <span className="text-[10px] leading-tight font-medium">Preview</span>
          </Button>
        )}
      </div>
      
      {/* Enhanced Editor Area */}
      <div
        className={cn(
          "flex-1 overflow-auto w-full scrollbar-magic relative apple-scroll",
          appleDevice.isTargetDevice
            ? `apple-container ${appleDevice.isIPhone ? 'iphone-content' : 'ipad-content'}`
            : "",
          isMobile ? "pt-24 pb-24 px-3" : "pt-2 pb-2 px-0"
        )}
        style={appleDevice.isTargetDevice ? {
          paddingTop: appleDevice.optimizedSpacing.content,
          paddingBottom: appleDevice.optimizedSpacing.bottom
        } : {}}
      >
        {/* Drop Zone Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <div className="text-center text-blue-400">
              <Upload className="h-12 w-12 mx-auto mb-4 animate-bounce" />
              <p className="text-lg font-semibold">Solte suas imagens/vídeos aqui</p>
              <p className="text-sm opacity-70">Formatos suportados: JPG, PNG, GIF, MP4, WebM</p>
            </div>
          </div>
        )}

        {/* Editor with Apple Gestures */}
        {(!showPreview || splitView) && (
          <AppleGestures
            onSwipeLeft={() => appleDevice.isTargetDevice && setShowPreview(true)}
            onSwipeRight={() => appleDevice.isTargetDevice && setShowPreview(false)}
            onSwipeUp={() => appleDevice.isTargetDevice && setZenMode(true)}
            onLongPress={() => appleDevice.isTargetDevice && setShowAnalytics(true)}
            className={cn("flex-1 flex flex-col relative card-magic m-2", splitView && "border-r border-workspace-border")}
          >
            {renderLineNumbers()}
            
            {/* Resize Indicator */}
            <ResizeIndicator
              isResizing={isResizing}
              currentHeight={currentHeight}
              minHeight={minHeight}
              maxHeight={maxHeight}
            />
            
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextChangeWithAutocomplete}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              placeholder={appleDevice.isTargetDevice ? `# ✨ ${appleDevice.isIPad ? 'iPad' : 'iPhone'} Optimizado!

🍎 **Gestos Apple:**
• Swipe ← → para alternar preview
• Swipe ↑ para modo zen
• Long press para analytics
• Pinch para zoom

💡 **Dicas Rápidas:**
• Use Templates para começar rapidamente
• Ctrl+V para colar imagens/vídeos  
• [[ para links entre páginas

📚 **Markdown Básico:**
**Negrito** e *itálico*
- Lista
- [x] Checkbox ✅

[Link](https://example.com)
\`código\`
> Citação

🧮 **Fórmulas:** $$E = mc^2$$
` : `# ✨ Comece a escrever...

💡 **Dicas Rápidas:**
• Use Templates para começar rapidamente
• Ctrl+V para colar imagens/vídeos
• Arraste e solte arquivos aqui
• [[ para links entre páginas

📚 **Markdown Básico:**
**Negrito** e *itálico*
- Lista
- [x] Checkbox ✅
- [ ] Checkbox ⏳

[Link](https://example.com)
\`\`\`código\`\`\`
> Citação

| Tabela | Exemplo |
|--------|---------|
| Cell 1 | Cell 2  |

🧮 **Fórmulas:** $$E = mc^2$$
`}
              className={cn(
                "flex-1 border-none resize-none bg-transparent text-workspace-text leading-relaxed font-mono text-base focus:ring-0 focus:outline-none p-4 overflow-y-auto input-magic transition-all duration-300",
                appleDevice.isTargetDevice && "apple-editor",
                showLineNumbers && "pl-16",
                appleDevice.isTargetDevice ? appleDevice.fontSize.medium : (isMobile ? "text-lg" : "text-base"),
                isDragging && "ring-2 ring-blue-400 bg-blue-50/5"
              )}
              style={{ 
                height: 'auto',
                minHeight: appleDevice.isTargetDevice ? (appleDevice.isIPad ? '400px' : '300px') : (isMobile ? '300px' : '200px'),
                maxHeight: appleDevice.isTargetDevice ? '70vh' : (isMobile ? '60vh' : '70vh'),
                fontSize: appleDevice.isTargetDevice ? appleDevice.fontSize.medium : undefined,
                lineHeight: appleDevice.isTargetDevice ? '1.5' : undefined
              }}
            />
            
            {/* Link Autocomplete */}
            <LinkAutocomplete
              isOpen={autocompleteOpen}
              suggestions={suggestions}
              position={autocompletePosition}
              selectedIndex={selectedIndex}
              onSelect={selectSuggestion}
              onClose={closeSuggestions}
            />
          </AppleGestures>
        )}

        {/* Enhanced Preview */}
        {showPreview && (
          <div className={cn("flex-1 overflow-auto card-magic m-2", !splitView && "w-full")}>
            <div className="p-6 prose prose-invert prose-gray max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                components={{
                  input: CheckboxComponent,
                  a: ({ href, children, ...props }) => {
                    if (href?.startsWith('[[') && href?.endsWith(']]')) {
                      const fileName = href.slice(2, -2);
                      const fileExists = files.some(f => f.name === fileName);
                      return (
                        <LinkRenderer
                          target={fileName}
                          onNavigate={onNavigateToFile || (() => {})}
                          fileExists={fileExists}
                        />
                      );
                    }
                    return <a href={href} {...props}>{children}</a>;
                  },
                  img: ({ src, alt, ...props }) => (
                    <MediaViewer src={src} alt={alt} type="image" {...props} />
                  ),
                  video: ({ src, ...props }) => (
                    <MediaViewer src={src} type="video" {...props} />
                  ),
                  table: ({ ...props }) => (
                    <div className="overflow-auto card-magic p-4">
                      <table className="table-auto" {...props} />
                    </div>
                  ),
                  th: ({ ...props }) => (
                    <th className="px-4 py-2 border border-white/20" {...props} />
                  ),
                  td: ({ ...props }) => (
                    <td className="px-4 py-2 border border-white/20" {...props} />
                  )
                }}
              >
                {content || '*Nada para mostrar ainda...*'}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Media Manager - Enhanced for Mobile */}
      <div className={cn("absolute z-10", isMobile ? "top-24 right-4" : "top-4 right-4")}>
        <MediaManagerEnhanced onInsertMedia={insertMedia} />
      </div>

      {/* Template Analytics Modal */}
      <TemplateAnalytics
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
    </div>
  );
};
