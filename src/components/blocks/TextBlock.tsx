
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { Block } from '@/types';
import { cn } from '@/lib/utils';
import { MediaManagerEnhanced } from '@/components/MediaManagerEnhanced';
import { TemplateSelector } from '@/components/TemplateSelector';
import { TemplateQuickActions } from '@/components/TemplateQuickActions';
import { ResizeIndicator } from '@/components/ResizeIndicator';
import { useAutoResize } from '@/hooks/useAutoResize';
import { toast } from 'sonner';

interface TextBlockProps {
  block: Block;
  isSelected: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onFocus: () => void;
}

export const TextBlock: React.FC<TextBlockProps> = ({
  block,
  isSelected,
  onUpdate,
  onFocus
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-resize hook
  const { adjustHeight, isResizing, currentHeight, minHeight, maxHeight } = useAutoResize(textareaRef, block.content, {
    minHeight: 120,
    maxHeight: window.innerHeight * 0.6,
    lineHeight: 24,
    padding: 8
  });

  const insertMedia = useCallback((markdown: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = 
      `${block.content.substring(0, start)  
      }\n${  markdown  }\n${  
      block.content.substring(end)}`;
    
    onUpdate({ content: newContent });
    
    setTimeout(() => {
      const newPosition = start + markdown.length + 2;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  }, [block.content, onUpdate]);

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      // Paste será tratado pelo handlePaste
      return;
    }
  }, []);

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <TemplateQuickActions
          onSelectTemplate={(templateContent) => {
            onUpdate({ content: templateContent });
            setTimeout(() => { adjustHeight(); }, 100);
            toast.success('Template rápido aplicado! ⚡');
          }}
          className="opacity-60 hover:opacity-100 transition-opacity"
        />
        <TemplateSelector
          onSelectTemplate={(templateContent) => {
            onUpdate({ content: templateContent });
            setTimeout(() => { adjustHeight(); }, 100);
            toast.success('Template aplicado! 🎉');
          }}
          className="opacity-60 hover:opacity-100 transition-opacity"
        />
        <MediaManagerEnhanced onInsertMedia={insertMedia} className="opacity-60 hover:opacity-100 transition-opacity" />
      </div>

      {/* Resize Indicator */}
      <ResizeIndicator
        isResizing={isResizing}
        currentHeight={currentHeight}
        minHeight={minHeight}
        maxHeight={maxHeight}
        className="z-5"
      />
      
      <Textarea
        ref={textareaRef}
        value={block.content}
        onChange={(e) => {
          onUpdate({ content: e.target.value });
          adjustHeight();
        }}
        onFocus={onFocus}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        placeholder="✨ Digite algo...

💡 **Dicas Rápidas:**
• Use Templates para começar
• Ctrl+V para colar mídia
• Arraste e solte arquivos
• Markdown suportado

📝 **Exemplos:**
**negrito** *itálico* `código`
- [ ] Todo item
> Citação"
        className={cn(
          "w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-foreground overflow-hidden pr-20 transition-all duration-200 textarea-clean",
          isSelected && "ring-1 ring-notion-purple",
          isDragging && "ring-2 ring-blue-400 bg-blue-50/5"
        )}
        rows={1}
        style={{ 
          height: 'auto',
          minHeight: '120px',
          maxHeight: '60vh'
        }}
      />
    </div>
  );
};
