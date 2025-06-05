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
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  files = [],
  onNavigateToFile,
  onCreateFile,
  className
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
    }, 0);
  }, [content, onChange]);

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
    }, 0);
  }, [content, onChange]);

  const handleTextChangeWithAutocomplete = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onChange(newContent);
    
    if (textareaRef.current) {
      handleTextChange(newContent, textareaRef.current.selectionStart);
    }
  }, [onChange, handleTextChange]);

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
                    },
                    // ... keep existing code (img, video, table, th, td, code components)
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
    <div className={cn("flex flex-col h-full", className)}>
      {/* Enhanced Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-workspace-border bg-workspace-surface">
        <div className="flex items-center gap-1 flex-wrap">
          {toolbarActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={action.action}
              className="h-8 w-8 p-0 hover:bg-workspace-border rounded-lg transition-all duration-200"
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          ))}
          
          <div className="h-6 w-px bg-workspace-border mx-2" />
          <MediaManager onInsertMedia={insertMedia} />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={cn("gap-2", showLineNumbers && "bg-notion-purple text-white")}
          >
            <LineChart className="h-4 w-4" />
            Linhas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSplitView(!splitView);
              if (!splitView) setShowPreview(true);
            }}
            className={cn("gap-2", splitView && "bg-notion-purple text-white")}
          >
            Split View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className={cn("gap-2", showPreview && !splitView && "bg-notion-purple text-white")}
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Editar' : 'Preview'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZenMode(true)}
            className="gap-2 hover:bg-purple-500/20"
            title="Modo Foco (Ctrl+Enter)"
          >
            <Maximize2 className="h-4 w-4" />
            Foco
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex min-h-0">
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
                "flex-1 border-none resize-none bg-transparent text-workspace-text leading-relaxed font-mono text-sm focus:ring-0 focus:outline-none p-4",
                showLineNumbers && "pl-16"
              )}
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
                  // ... keep existing code (img, video, table, th, td, code components)
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
