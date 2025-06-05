
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { LinkAutocomplete } from '@/components/LinkAutocomplete';
import { LinkPreview } from '@/components/LinkPreview';
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);

  const {
    isOpen,
    query,
    suggestions,
    position,
    openAutocomplete,
    closeAutocomplete,
    setQuery
  } = useLinkAutocomplete(files);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isOpen) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev === 0 ? suggestions.length - 1 : prev - 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            handleSelectSuggestion(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closeAutocomplete();
          break;
      }
    }
  }, [isOpen, suggestions, selectedIndex, closeAutocomplete]);

  const handleSelectSuggestion = useCallback((suggestion: any) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);
    
    // Encontrar o início do link
    const linkStart = textBeforeCursor.lastIndexOf('[[');
    const beforeLink = content.slice(0, linkStart);
    const newLink = `[[${suggestion.name}]]`;
    
    const newContent = beforeLink + newLink + textAfterCursor;
    onChange(newContent);
    
    // Se o arquivo não existe, criar
    if (!suggestion.exists && suggestion.name !== 'create-new') {
      onCreateFile(suggestion.name);
    }
    
    closeAutocomplete();
    
    // Reposicionar cursor
    setTimeout(() => {
      const newPos = linkStart + newLink.length;
      textarea.setSelectionRange(newPos, newPos);
      textarea.focus();
    }, 0);
  }, [content, onChange, onCreateFile, closeAutocomplete]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newContent);
    
    // Detectar se está digitando um link
    const textBeforeCursor = newContent.slice(0, cursorPos);
    const linkMatch = textBeforeCursor.match(/\[\[([^\]]*?)$/);
    
    if (linkMatch) {
      const query = linkMatch[1];
      const rect = e.target.getBoundingClientRect();
      const x = rect.left + 20;
      const y = rect.top + 60;
      
      openAutocomplete(query, x, y);
      setSelectedIndex(0);
    } else {
      closeAutocomplete();
    }
  }, [onChange, openAutocomplete, closeAutocomplete]);

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

  // Renderizar conteúdo com links destacados
  const renderContentWithLinks = () => {
    const links = parseLinks(content);
    
    if (links.length === 0) {
      return (
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Comece a escrever... Use [[ para criar links"
          className={cn(
            "min-h-96 bg-transparent border-none resize-none text-gray-200 leading-relaxed text-base focus:ring-0 focus:outline-none",
            className
          )}
        />
      );
    }

    return (
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Comece a escrever... Use [[ para criar links"
          className={cn(
            "min-h-96 bg-transparent border-none resize-none text-gray-200 leading-relaxed text-base focus:ring-0 focus:outline-none",
            className
          )}
        />
        
        {/* Overlay com links destacados */}
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
      </div>
    );
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  return (
    <div className="relative">
      {renderContentWithLinks()}
      
      <LinkAutocomplete
        isOpen={isOpen}
        suggestions={suggestions}
        position={position}
        selectedIndex={selectedIndex}
        onSelect={handleSelectSuggestion}
        onClose={closeAutocomplete}
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
