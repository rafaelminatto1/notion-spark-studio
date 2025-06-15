
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { LinkAutocomplete } from '@/components/LinkAutocomplete';
import { LinkPreview } from '@/components/LinkPreview';
import { MediaManager } from '@/components/MediaManager';
import { useLinkAutocomplete } from '@/hooks/useLinkAutocomplete';
import { FileItem } from '@/types';
import { parseLinks } from '@/utils/linkParser';
import { cn } from '@/lib/utils';

interface AdvancedEditorProps {
  content: string;
  onChange: (content: string) => void;
  files: FileItem[];
  onNavigateToFile: (fileId: string) => void;
  onCreateFile: (name: string) => void;
  className?: string;
}

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  content,
  onChange,
  files,
  onNavigateToFile,
  onCreateFile,
  className
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);

  const {
    isOpen,
    suggestions,
    position,
    selectedIndex,
    handleTextChange,
    handleKeyDown,
    selectSuggestion,
    closeSuggestions
  } = useLinkAutocomplete({
    files,
    onCreateFile: async (name: string) => {
      onCreateFile(name);
      return name;
    },
    onNavigateToFile
  });

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.max(textarea.scrollHeight, 200);
      textarea.style.height = newHeight + 'px';
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newContent);
    handleTextChange(newContent, cursorPos);
    adjustHeight();
  }, [onChange, handleTextChange, adjustHeight]);

  const handleMouseEnter = useCallback((e: React.MouseEvent, linkText: string) => {
    const targetFile = files.find(f => f.name === linkText && f.type === 'file');
    if (targetFile) {
      setPreviewFile(targetFile);
      setPreviewPosition({ x: e.clientX, y: e.clientY });
      setShowPreview(true);
    }
  }, [files]);

  const handleMouseLeave = useCallback(() => {
    setShowPreview(false);
    setPreviewFile(null);
  }, []);

  const renderContentWithLinks = () => {
    const links = parseLinks(content);
    
    return (
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <MediaManager onInsertMedia={insertMedia} />
        </div>
        
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Comece a escrever... 

Use [[ para criar links entre documentos
Use o botão 'Mídia' para inserir imagens e vídeos
"
          className={cn(
            "min-h-[200px] max-h-[60vh] bg-transparent border-none resize-none text-foreground leading-relaxed text-base focus:ring-0 focus:outline-none pr-20 overflow-y-auto",
            className
          )}
          style={{ height: 'auto' }}
        />
        
        {links.length > 0 && (
          <div className="absolute inset-0 pointer-events-none whitespace-pre-wrap text-base leading-relaxed p-3 overflow-hidden">
            {content.split(/(\[\[[^\]]+\]\])/).map((part, index) => {
              const linkMatch = part.match(/\[\[([^\]]+)\]\]/);
              if (linkMatch) {
                const linkText = linkMatch[1];
                const fileExists = files.some(f => f.name === linkText && f.type === 'file');
                
                return (
                  <span
                    key={index}
                    className={cn(
                      "pointer-events-auto cursor-pointer underline",
                      fileExists ? "text-blue-400 hover:text-blue-300" : "text-red-400 hover:text-red-300"
                    )}
                    onMouseEnter={(e) => handleMouseEnter(e, linkText)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => {
                      const file = files.find(f => f.name === linkText && f.type === 'file');
                      if (file) {
                        onNavigateToFile(file.id);
                      } else {
                        onCreateFile(linkText);
                      }
                    }}
                  >
                    {part}
                  </span>
                );
              }
              return <span key={index} className="text-transparent">{part}</span>;
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {renderContentWithLinks()}
      
      <LinkAutocomplete
        isOpen={isOpen}
        suggestions={suggestions}
        position={position}
        selectedIndex={selectedIndex}
        onSelect={selectSuggestion}
        onClose={closeSuggestions}
      />
      
      <LinkPreview
        file={previewFile}
        position={previewPosition}
        isVisible={showPreview}
        onNavigate={onNavigateToFile}
      />
    </div>
  );
};
