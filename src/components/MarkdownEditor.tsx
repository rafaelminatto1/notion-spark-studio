import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MediaManager } from '@/components/MediaManager';
import { MediaViewer } from '@/components/MediaViewer';
import { LinkAutocomplete } from '@/components/LinkAutocomplete';
import { LinkRenderer } from '@/components/LinkRenderer';
import { useLinkAutocomplete } from '@/hooks/useLinkAutocomplete';
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
  LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.max(textarea.scrollHeight, isMobile ? 300 : 200);
      textarea.style.height = newHeight + 'px';
    }
  }, [isMobile]);

  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

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
      label: 'Negrito (Ctrl+B)',
      action: () => insertText('**', '**', 'texto em negrito')
    },
    {
      icon: Italic,
      label: 'Itálico (Ctrl+I)',
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
      label: 'Lista Numerada',
      action: () => insertText('1. ', '', 'item numerado')
    },
    {
      icon: Link,
      label: 'Link (Ctrl+K)',
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
      action: () => insertText('| Coluna 1 | Coluna 2 |\n|----------|----------|\n| ', ' | Célula 2 |', 'Célula 1')
    },
    {
      icon: CheckSquare,
      label: 'Checkbox',
      action: () => insertText('- [ ] ', '', 'tarefa')
    },
    {
      icon: Calculator,
      label: 'Fórmula Math',
      action: () => insertText('$$', '$$', 'E = mc^2')
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
      <div className="fixed inset-0 z-50 bg-workspace-bg flex flex-col">
        {/* Zen Mode Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-workspace-border bg-workspace-surface">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZenMode(false)}
              className="gap-2"
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
              className={cn("gap-2", showPreview && "bg-notion-purple text-white")}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Editar' : 'Preview'}
            </Button>
          </div>
        </div>

        {/* Zen Mode Content */}
        <div className="flex-1 flex">
          {!showPreview && (
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={handleTextChangeWithAutocomplete}
                onKeyDown={handleKeyDown}
                placeholder="# Comece a escrever em Markdown..."
                className="h-full border-none resize-none bg-transparent text-workspace-text leading-relaxed font-mono text-lg focus:ring-0 focus:outline-none p-8 max-w-4xl mx-auto"
                style={{ height: 'auto' }}
              />
            </div>
          )}

          {showPreview && (
            <div className="flex-1 overflow-auto bg-workspace-bg">
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
    <div className={cn("relative w-full h-full flex flex-col", className)}>
      {/* Toolbar fixa no topo em mobile */}
      <div
        className={cn(
          "flex gap-1 items-center border-b bg-background z-30 overflow-x-auto",
          isMobile
            ? "fixed top-0 left-0 right-0 h-16 px-2 py-1 shadow-lg border-b z-50"
            : "sticky top-0 px-2 py-1"
        )}
        style={isMobile ? { minHeight: 64 } : {}}
      >
        {toolbarActions.map(({ icon: Icon, label, action }, idx) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            size={isMobile ? "lg" : "sm"}
            className={cn(
              "flex flex-col items-center justify-center flex-shrink-0",
              isMobile ? "mx-1 px-2 py-2 text-base" : "mx-0.5 px-1 py-1 text-xs"
            )}
            onClick={action}
            aria-label={label}
          >
            <Icon className={isMobile ? "h-6 w-6 mb-0.5" : "h-4 w-4 mb-0.5"} />
            {isMobile && <span className="text-[10px] leading-tight">{label.split(' ')[0]}</span>}
          </Button>
        ))}
      </div>
      
      {/* Área de edição com padding extra no mobile */}
      <div
        className={cn(
          "flex-1 overflow-auto w-full",
          isMobile ? "pt-20 pb-24 px-2" : "pt-2 pb-2 px-0"
        )}
        style={isMobile ? { minHeight: 'calc(100vh - 80px)' } : {}}
      >
        {/* Editor */}
        {(!showPreview || splitView) && (
          <div className={cn("flex-1 flex flex-col relative", splitView && "border-r border-workspace-border")}>
            {renderLineNumbers()}
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextChangeWithAutocomplete}
              onKeyDown={handleKeyDown}
              placeholder="# Comece a escrever em Markdown...

**Negrito** e *itálico*
- Lista
- [x] Checkbox marcado
- [ ] Checkbox desmarcado

[Link](https://example.com)
[[Link interno]] - Use [[ para autocompletar

Use o botão 'Mídia' para inserir imagens e vídeos!

```javascript
const codigo = 'syntax highlighting';
```

> Citação

| Coluna 1 | Coluna 2 |
|----------|----------|
| Célula 1 | Célula 2 |

$$E = mc^2$$
"
              className={cn(
                "flex-1 border-none resize-none bg-transparent text-workspace-text leading-relaxed font-mono text-sm focus:ring-0 focus:outline-none p-4 overflow-y-auto",
                showLineNumbers && "pl-16",
                isMobile ? "min-h-[300px] max-h-[70vh]" : "min-h-[200px] max-h-[60vh]"
              )}
              style={{ height: 'auto' }}
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
          </div>
        )}

        {/* Preview */}
        {showPreview && (
          <div className={cn("flex-1 overflow-auto bg-workspace-bg", !splitView && "w-full")}>
            <div className="p-4 prose prose-invert prose-gray max-w-none">
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
                    <MediaViewer src={src} alt={alt} {...props} />
                  ),
                  video: ({ src, ...props }) => (
                    <MediaViewer src={src} type="video" {...props} />
                  ),
                  table: ({ ...props }) => (
                    <div className="overflow-auto">
                      <table className="table-auto" {...props} />
                    </div>
                  ),
                  th: ({ ...props }) => (
                    <th className="px-4 py-2 border" {...props} />
                  ),
                  td: ({ ...props }) => (
                    <td className="px-4 py-2 border" {...props} />
                  ),
                  code: ({ inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        children={String(children).replace(/\n$/, '')}
                        style={dracula}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      />
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
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
};
