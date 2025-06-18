import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Heading1,
  Heading2,
  Heading3,
  ChevronDown,
  Check,
  X,
  Keyboard,
  Eye,
  EyeOff,
  Undo,
  Redo,
  Mic,
  Camera,
  Paperclip
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos para o editor mobile
interface MobileEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface FormattingOption {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  action: (selection: Selection, textarea: HTMLTextAreaElement) => void;
  shortcut?: string;
}

interface KeyboardInfo {
  height: number;
  visible: boolean;
}

// Hook para detectar teclado virtual
const useVirtualKeyboard = () => {
  const [keyboardInfo, setKeyboardInfo] = useState<KeyboardInfo>({
    height: 0,
    visible: false
  });

  useEffect(() => {
    // Altura inicial da viewport
    const initialHeight = window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDiff = initialHeight - currentHeight;
      
      setKeyboardInfo({
        height: Math.max(0, heightDiff),
        visible: heightDiff > 150 // Consideramos que o teclado está visível se a diferença for > 150px
      });
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => window.visualViewport?.removeEventListener('resize', handleViewportChange);
    } else {
      window.addEventListener('resize', handleViewportChange);
      return () => { window.removeEventListener('resize', handleViewportChange); };
    }
  }, []);

  return keyboardInfo;
};

// Hook para formatação de texto
const useTextFormatting = (textareaRef: React.RefObject<HTMLTextAreaElement>) => {
  const applyFormatting = useCallback((format: string, value?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let newText = '';
    let newCursorPos = start;

    switch (format) {
      case 'bold':
        if (selectedText) {
          newText = `${beforeText}**${selectedText}**${afterText}`;
          newCursorPos = end + 4;
        } else {
          newText = `${beforeText}****${afterText}`;
          newCursorPos = start + 2;
        }
        break;
        
      case 'italic':
        if (selectedText) {
          newText = `${beforeText}_${selectedText}_${afterText}`;
          newCursorPos = end + 2;
        } else {
          newText = `${beforeText}__${afterText}`;
          newCursorPos = start + 1;
        }
        break;
        
      case 'heading1':
        const line = beforeText.split('\n').pop() + selectedText;
        const lineStart = beforeText.lastIndexOf('\n') + 1;
        newText = `${beforeText.substring(0, lineStart)}# ${line}${afterText}`;
        newCursorPos = start + 2;
        break;
        
      case 'heading2':
        const line2 = beforeText.split('\n').pop() + selectedText;
        const lineStart2 = beforeText.lastIndexOf('\n') + 1;
        newText = `${beforeText.substring(0, lineStart2)}## ${line2}${afterText}`;
        newCursorPos = start + 3;
        break;
        
      case 'list':
        newText = `${beforeText}\n- ${selectedText || 'Item da lista'}${afterText}`;
        newCursorPos = selectedText ? end + 4 : start + 17;
        break;
        
      case 'orderedList':
        newText = `${beforeText}\n1. ${selectedText || 'Item da lista'}${afterText}`;
        newCursorPos = selectedText ? end + 5 : start + 18;
        break;
        
      case 'quote':
        newText = `${beforeText}\n> ${selectedText || 'Citação'}${afterText}`;
        newCursorPos = selectedText ? end + 4 : start + 12;
        break;
        
      case 'code':
        if (selectedText) {
          newText = `${beforeText}\`${selectedText}\`${afterText}`;
          newCursorPos = end + 2;
        } else {
          newText = `${beforeText}\`\`${afterText}`;
          newCursorPos = start + 1;
        }
        break;
        
      case 'link':
        const url = value || 'https://';
        if (selectedText) {
          newText = `${beforeText}[${selectedText}](${url})${afterText}`;
          newCursorPos = end + 4 + url.length;
        } else {
          newText = `${beforeText}[texto do link](${url})${afterText}`;
          newCursorPos = start + 15 + url.length;
        }
        break;
        
      default:
        return;
    }

    // Aplicar mudanças
    textarea.value = newText;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();

    // Disparar evento de mudança
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
  }, [textareaRef]);

  return { applyFormatting };
};

// Componente de toolbar adaptável
interface MobileToolbarProps {
  onFormat: (format: string, value?: string) => void;
  keyboardVisible: boolean;
}

const MobileToolbar: React.FC<MobileToolbarProps> = ({ onFormat, keyboardVisible }) => {
  const [activeSection, setActiveSection] = useState<'basic' | 'advanced' | 'media'>('basic');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const basicTools: FormattingOption[] = [
    { id: 'bold', label: 'Negrito', icon: Bold, action: () => { onFormat('bold'); }, shortcut: 'Ctrl+B' },
    { id: 'italic', label: 'Itálico', icon: Italic, action: () => { onFormat('italic'); }, shortcut: 'Ctrl+I' },
    { id: 'heading1', label: 'Título 1', icon: Heading1, action: () => { onFormat('heading1'); } },
    { id: 'heading2', label: 'Título 2', icon: Heading2, action: () => { onFormat('heading2'); } },
    { id: 'list', label: 'Lista', icon: List, action: () => { onFormat('list'); } },
    { id: 'quote', label: 'Citação', icon: Quote, action: () => { onFormat('quote'); } }
  ];

  const advancedTools: FormattingOption[] = [
    { id: 'orderedList', label: 'Lista Numerada', icon: ListOrdered, action: () => { onFormat('orderedList'); } },
    { id: 'code', label: 'Código', icon: Code, action: () => { onFormat('code'); } },
    { id: 'link', label: 'Link', icon: Link, action: () => { setShowLinkInput(true); } },
    { id: 'underline', label: 'Sublinhado', icon: Underline, action: () => { onFormat('underline'); } }
  ];

  const mediaTools: FormattingOption[] = [
    { id: 'image', label: 'Imagem', icon: Image, action: () => { console.log('Adicionar imagem'); } },
    { id: 'camera', label: 'Câmera', icon: Camera, action: () => { console.log('Abrir câmera'); } },
    { id: 'voice', label: 'Áudio', icon: Mic, action: () => { console.log('Gravar áudio'); } },
    { id: 'file', label: 'Arquivo', icon: Paperclip, action: () => { console.log('Anexar arquivo'); } }
  ];

  const handleLinkSubmit = () => {
    onFormat('link', linkUrl);
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const currentTools = activeSection === 'basic' ? basicTools : 
                     activeSection === 'advanced' ? advancedTools : mediaTools;

  return (
    <>
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: keyboardVisible ? 0 : 60 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50"
      >
        {/* Section tabs */}
        <div className="flex items-center border-b border-gray-100 px-4 py-2">
          {[
            { id: 'basic', label: 'Básico' },
            { id: 'advanced', label: 'Avançado' },
            { id: 'media', label: 'Mídia' }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => { setActiveSection(section.id as any); }}
              className={cn(
                "px-3 py-1 text-sm rounded-full transition-colors mr-2",
                activeSection === section.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {section.label}
            </button>
          ))}
        </div>

        {/* Tools */}
        <div className="flex items-center gap-1 px-4 py-3 overflow-x-auto">
          {currentTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                if (textareaRef.current) {
                  const selection = textareaRef.current.selectionStart;
                  const endSelection = textareaRef.current.selectionEnd;
                  const currentSelection = {
                    start: selection,
                    end: endSelection
                  } as Selection;
                  tool.action(currentSelection, textareaRef.current);
                }
              }}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
              title={tool.label}
            >
              <tool.icon className="h-5 w-5 text-gray-700" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Link input modal */}
      <AnimatePresence>
        {showLinkInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-semibold mb-4">Adicionar Link</h3>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => { setLinkUrl(e.target.value); }}
                placeholder="https://exemplo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowLinkInput(false); }}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLinkSubmit}
                  disabled={!linkUrl.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Componente de preview mode
interface PreviewModeProps {
  content: string;
  onClose: () => void;
}

const PreviewMode: React.FC<PreviewModeProps> = ({ content, onClose }) => {
  // Função simples para converter markdown básico para HTML
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Preview</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto h-full pb-20">
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
      </div>
    </motion.div>
  );
};

// Componente principal do editor mobile
export const MobileEditor: React.FC<MobileEditorProps> = ({
  content,
  onChange,
  placeholder = "Comece a escrever...",
  disabled = false,
  className
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const keyboardInfo = useVirtualKeyboard();
  const { applyFormatting } = useTextFormatting(textareaRef);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustTextareaHeight();
  }, [onChange, adjustTextareaHeight]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Estatísticas do texto
  const stats = {
    characters: content.length,
    words: content.trim() ? content.trim().split(/\s+/).length : 0,
    lines: content.split('\n').length
  };

  return (
    <div className={cn("relative h-full bg-white", className)}>
      {/* Header com controles */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {stats.characters} caracteres • {stats.words} palavras
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowPreview(true); }}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Preview"
          >
            <Eye className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div 
        className="flex-1 relative"
        style={{ 
          paddingBottom: keyboardInfo.visible ? keyboardInfo.height + 120 : 20 
        }}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full min-h-full p-4 resize-none border-0 outline-none text-base leading-relaxed",
            "placeholder-gray-400 bg-transparent",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.6'
          }}
        />

        {/* Focus indicator */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 right-4"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Toolbar */}
      <MobileToolbar
        onFormat={applyFormatting}
        keyboardVisible={keyboardInfo.visible}
      />

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <PreviewMode
            content={content}
            onClose={() => { setShowPreview(false); }}
          />
        )}
      </AnimatePresence>

      {/* Status bar quando não há teclado */}
      {!keyboardInfo.visible && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2"
        >
          <span>Linhas: {stats.lines}</span>
          <span>•</span>
          <span>
            {content.length > 0 ? 'Digitando...' : 'Aguardando entrada'}
          </span>
          <span>•</span>
          <span>Mobile Editor</span>
        </motion.div>
      )}
    </div>
  );
};

export default MobileEditor; 