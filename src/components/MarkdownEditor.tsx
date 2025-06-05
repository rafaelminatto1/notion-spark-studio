
import React, { useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Code, 
  Quote,
  Table,
  CheckSquare,
  Eye,
  EyeOff,
  Type,
  Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  className
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    // Reposicionar cursor
    setTimeout(() => {
      const newStart = start + beforeText.length;
      const newEnd = newStart + textToUse.length;
      textarea.setSelectionRange(newStart, newEnd);
      textarea.focus();
    }, 0);
  }, [content, onChange]);

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
      label: 'Lista Numerada',
      action: () => insertText('1. ', '', 'item numerado')
    },
    {
      icon: Link,
      label: 'Link',
      action: () => insertText('[', '](url)', 'texto do link')
    },
    {
      icon: Image,
      label: 'Imagem',
      action: () => insertText('![', '](url)', 'alt text')
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
      }
    }

    // Tab para indentação
    if (e.key === 'Tab') {
      e.preventDefault();
      insertText('  ');
    }
  }, [insertText]);

  // Componente customizado para checkboxes interativos
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

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-notion-dark-border bg-notion-dark-hover">
        <div className="flex items-center gap-1 flex-wrap">
          {toolbarActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={action.action}
              className="h-8 w-8 p-0 hover:bg-notion-dark-border"
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex min-h-0">
        {/* Editor */}
        {(!showPreview || splitView) && (
          <div className={cn("flex-1 flex flex-col", splitView && "border-r border-notion-dark-border")}>
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="# Comece a escrever em Markdown...

**Negrito** e *itálico*
- Lista
- [x] Checkbox marcado
- [ ] Checkbox desmarcado

[Link](https://example.com)
![Imagem](url-da-imagem)

```javascript
const codigo = 'syntax highlighting';
```

> Citação

| Coluna 1 | Coluna 2 |
|----------|----------|
| Célula 1 | Célula 2 |

$$E = mc^2$$
"
              className="flex-1 border-none resize-none bg-transparent text-gray-200 leading-relaxed font-mono text-sm focus:ring-0 focus:outline-none p-4"
            />
          </div>
        )}

        {/* Preview */}
        {showPreview && (
          <div className={cn("flex-1 overflow-auto bg-notion-dark", !splitView && "w-full")}>
            <div className="p-4 prose prose-invert prose-gray max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                components={{
                  input: CheckboxComponent,
                  // Customizar outros componentes se necessário
                  img: ({ src, alt, ...props }) => (
                    <img
                      src={src}
                      alt={alt}
                      className="max-w-full h-auto rounded-lg shadow-lg"
                      {...props}
                    />
                  ),
                  table: ({ children, ...props }) => (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-600" {...props}>
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children, ...props }) => (
                    <th className="border border-gray-600 px-4 py-2 bg-gray-800 text-left" {...props}>
                      {children}
                    </th>
                  ),
                  td: ({ children, ...props }) => (
                    <td className="border border-gray-600 px-4 py-2" {...props}>
                      {children}
                    </td>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
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
