import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Lightbulb,
  FileText,
  Search,
  Edit,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Zap,
  Brain,
  Mic,
  MicOff,
  Loader,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Settings,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileSystemContext } from '@/contexts/FileSystemContext';

// Tipos para o assistente IA
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: {
    noteId?: string;
    noteName?: string;
    selectedText?: string;
    action?: string;
  };
  suggestions?: AISuggestion[];
  feedback?: 'positive' | 'negative' | null;
  isTyping?: boolean;
  error?: string;
}

interface AISuggestion {
  id: string;
  type: 'action' | 'content' | 'question';
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  confidence: number;
}

interface AICapability {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  examples: string[];
  category: 'writing' | 'organization' | 'search' | 'analysis';
}

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  currentNoteId?: string;
  selectedText?: string;
  onApplySuggestion?: (suggestion: string, noteId?: string) => void;
  className?: string;
}

// Hook para simulação de IA
const useAIEngine = () => {
  const { files } = useFileSystemContext();
  const [isProcessing, setIsProcessing] = useState(false);

  // Capacidades do assistente
  const capabilities: AICapability[] = [
    {
      id: 'writing',
      name: 'Assistência de Escrita',
      description: 'Melhore seu texto, corrija gramática e sugira melhorias',
      icon: Edit,
      examples: [
        'Melhore este parágrafo',
        'Corrija a gramática',
        'Torne mais profissional'
      ],
      category: 'writing'
    },
    {
      id: 'summarize',
      name: 'Resumir Conteúdo',
      description: 'Crie resumos e extraia pontos principais',
      icon: FileText,
      examples: [
        'Resuma esta nota',
        'Extraia os pontos principais',
        'Crie um resumo executivo'
      ],
      category: 'analysis'
    },
    {
      id: 'organize',
      name: 'Organização',
      description: 'Estruture suas notas e crie hierarquias',
      icon: Brain,
      examples: [
        'Organize estas notas',
        'Crie uma estrutura',
        'Sugira categorias'
      ],
      category: 'organization'
    },
    {
      id: 'search',
      name: 'Busca Inteligente',
      description: 'Encontre informações relevantes em suas notas',
      icon: Search,
      examples: [
        'Encontre notas sobre projeto X',
        'Busque informações similares',
        'Relacione conceitos'
      ],
      category: 'search'
    }
  ];

  // Simular processamento de IA
  const processQuery = useCallback(async (query: string, context?: any): Promise<ChatMessage> => {
    setIsProcessing(true);
    
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));

    try {
      // Análise básica da query
      const queryLower = query.toLowerCase();
      let response = '';
      const suggestions: AISuggestion[] = [];

      // Respostas baseadas em palavras-chave
      if (queryLower.includes('resumir') || queryLower.includes('resumo')) {
        response = 'Posso ajudar você a resumir o conteúdo. ';
        if (context?.selectedText) {
          response += `Baseado no texto selecionado, aqui está um resumo:\n\n**Resumo:**\n${context.selectedText.slice(0, 100)}...\n\n**Pontos principais:**\n• Ponto 1\n• Ponto 2\n• Ponto 3`;
        } else {
          response += 'Selecione o texto que deseja resumir ou me informe qual nota deve ser resumida.';
        }
        
        suggestions.push({
          id: 'create_summary',
          type: 'action',
          title: 'Criar Nota de Resumo',
          description: 'Criar uma nova nota com o resumo gerado',
          icon: FileText,
          action: () => { console.log('Create summary note'); },
          confidence: 0.9
        });
      }
      
      else if (queryLower.includes('melhorar') || queryLower.includes('melhore')) {
        response = 'Posso ajudar a melhorar seu texto! ';
        if (context?.selectedText) {
          response += `Aqui estão algumas sugestões para o texto selecionado:\n\n**Texto original:**\n"${context.selectedText}"\n\n**Versão melhorada:**\n"${context.selectedText.replace(/\b\w/g, l => l.toUpperCase())} [versão otimizada]"\n\n**Sugestões:**\n• Use linguagem mais clara\n• Adicione exemplos concretos\n• Melhore a fluidez`;
        } else {
          response += 'Selecione o texto que deseja melhorar e eu fornecerei sugestões específicas.';
        }

        suggestions.push({
          id: 'apply_improvement',
          type: 'action',
          title: 'Aplicar Melhorias',
          description: 'Substituir texto original pelas melhorias sugeridas',
          icon: Zap,
          action: () => { console.log('Apply improvements'); },
          confidence: 0.85
        });
      }
      
      else if (queryLower.includes('organizar') || queryLower.includes('estrutura')) {
        response = `Posso ajudar a organizar suas notas! Analisando suas ${files.length} notas, sugiro:\n\n**Estrutura sugerida:**\n📁 Projetos (${files.filter(f => f.type === 'folder').length} notebooks)\n📄 Notas rápidas\n🔖 Ideias e insights\n\n**Ações recomendadas:**\n• Criar tags para categorização\n• Agrupar notas relacionadas\n• Estabelecer nomenclatura consistente`;
        
        suggestions.push(
          {
            id: 'create_structure',
            type: 'action',
            title: 'Criar Estrutura',
            description: 'Implementar a estrutura organizacional sugerida',
            icon: Brain,
            action: () => { console.log('Create structure'); },
            confidence: 0.8
          },
          {
            id: 'tag_notes',
            type: 'action',
            title: 'Sugerir Tags',
            description: 'Analisar e sugerir tags para todas as notas',
            icon: Lightbulb,
            action: () => { console.log('Suggest tags'); },
            confidence: 0.75
          }
        );
      }
      
      else if (queryLower.includes('buscar') || queryLower.includes('encontrar')) {
        const searchTerms = queryLower.split(' ').filter(word => 
          !['buscar', 'encontrar', 'procurar', 'sobre', 'de', 'da', 'do'].includes(word)
        );
        
        response = `Busquei por "${searchTerms.join(' ')}" em suas notas:\n\n`;
        
        // Simular resultados de busca
        const mockResults = files.slice(0, 3).map((file, index) => 
          `**${file.name}**\n→ ${index + 1} correspondência${index > 0 ? 's' : ''} encontrada${index > 0 ? 's' : ''}`
        ).join('\n\n');
        
        response += mockResults || 'Nenhum resultado encontrado para esta busca.';

        suggestions.push({
          id: 'advanced_search',
          type: 'action',
          title: 'Busca Avançada',
          description: 'Abrir ferramenta de busca semântica',
          icon: Search,
          action: () => { console.log('Open advanced search'); },
          confidence: 0.7
        });
      }
      
      else if (queryLower.includes('criar') || queryLower.includes('novo')) {
        response = 'Posso ajudar você a criar conteúdo! Que tipo de nota você gostaria de criar?\n\n**Sugestões baseadas em suas notas:**\n• Nota de projeto\n• Lista de tarefas\n• Brainstorming de ideias\n• Resumo de reunião\n• Anotações de estudo';
        
        suggestions.push(
          {
            id: 'create_project_note',
            type: 'content',
            title: 'Criar Nota de Projeto',
            description: 'Template estruturado para projetos',
            icon: FileText,
            action: () => { console.log('Create project note'); },
            confidence: 0.8
          },
          {
            id: 'create_meeting_notes',
            type: 'content',
            title: 'Criar Notas de Reunião',
            description: 'Template para atas de reunião',
            icon: FileText,
            action: () => { console.log('Create meeting notes'); },
            confidence: 0.75
          }
        );
      }
      
      else {
        // Resposta genérica inteligente
        response = `Entendi sua pergunta sobre "${query}". Posso ajudar das seguintes formas:\n\n• **Analisar** suas notas existentes\n• **Sugerir** melhorias no conteúdo\n• **Organizar** informações\n• **Buscar** conteúdo relacionado\n\nO que você gostaria que eu fizesse especificamente?`;
        
        suggestions.push(
          {
            id: 'analyze_content',
            type: 'question',
            title: 'Analisar Conteúdo',
            description: 'Analisar suas notas em busca de insights',
            icon: Brain,
            action: () => { console.log('Analyze content'); },
            confidence: 0.6
          },
          {
            id: 'show_capabilities',
            type: 'question',
            title: 'Ver Capacidades',
            description: 'Mostrar tudo que posso fazer',
            icon: Sparkles,
            action: () => { console.log('Show capabilities'); },
            confidence: 0.9
          }
        );
      }

      return {
        id: `msg_${Date.now()}`,
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        suggestions,
        feedback: null
      };
      
    } catch (error) {
      return {
        id: `msg_${Date.now()}`,
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
        timestamp: new Date(),
        error: 'Processing failed',
        feedback: null
      };
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

  return {
    capabilities,
    processQuery,
    isProcessing
  };
};

// Componente de mensagem individual
interface ChatMessageItemProps {
  message: ChatMessage;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
  onCopy?: (content: string) => void;
  onApplySuggestion?: (suggestion: AISuggestion) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ 
  message, 
  onFeedback, 
  onCopy,
  onApplySuggestion 
}) => {
  const isUser = message.type === 'user';
  const Icon = isUser ? User : Bot;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 p-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-blue-500" : "bg-purple-500"
      )}>
        <Icon className="h-4 w-4 text-white" />
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 max-w-[85%]",
        isUser ? "text-right" : "text-left"
      )}>
        {/* Message bubble */}
        <div className={cn(
          "inline-block p-3 rounded-lg",
          isUser 
            ? "bg-blue-500 text-white" 
            : "bg-gray-100 text-gray-900"
        )}>
          {message.isTyping ? (
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Digitando...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>

        {/* Error indicator */}
        {message.error && (
          <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
            <AlertCircle className="h-3 w-3" />
            Erro no processamento
          </div>
        )}

        {/* Timestamp */}
        <div className={cn(
          "text-xs text-gray-500 mt-1",
          isUser ? "text-right" : "text-left"
        )}>
          {message.timestamp.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>

        {/* Actions (only for assistant messages) */}
        {!isUser && !message.isTyping && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onCopy?.(message.content)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Copiar"
            >
              <Copy className="h-3 w-3" />
            </button>
            
            <button
              onClick={() => onFeedback?.(message.id, 'positive')}
              className={cn(
                "p-1 transition-colors",
                message.feedback === 'positive' 
                  ? "text-green-600" 
                  : "text-gray-400 hover:text-green-600"
              )}
              title="Útil"
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            
            <button
              onClick={() => onFeedback?.(message.id, 'negative')}
              className={cn(
                "p-1 transition-colors",
                message.feedback === 'negative' 
                  ? "text-red-600" 
                  : "text-gray-400 hover:text-red-600"
              )}
              title="Não útil"
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.suggestions.map((suggestion) => {
              const SuggestionIcon = suggestion.icon;
              return (
                <motion.button
                  key={suggestion.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onApplySuggestion?.(suggestion)}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left"
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    suggestion.type === 'action' ? "bg-blue-100 text-blue-600" :
                    suggestion.type === 'content' ? "bg-green-100 text-green-600" :
                    "bg-purple-100 text-purple-600"
                  )}>
                    <SuggestionIcon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">
                      {suggestion.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {suggestion.description}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Sparkles className="h-3 w-3" />
                    {Math.round(suggestion.confidence * 100)}%
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Componente de input com comandos rápidos
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isProcessing, 
  placeholder = "Digite sua pergunta..." 
}) => {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showQuickCommands, setShowQuickCommands] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const quickCommands = [
    { command: '/resumir', description: 'Resumir conteúdo selecionado' },
    { command: '/melhorar', description: 'Melhorar texto selecionado' },
    { command: '/organizar', description: 'Organizar notas' },
    { command: '/buscar', description: 'Buscar nas notas' },
    { command: '/criar', description: 'Criar nova nota' }
  ];

  const handleSend = useCallback(() => {
    if (message.trim() && !isProcessing) {
      onSendMessage(message.trim());
      setMessage('');
      setShowQuickCommands(false);
    }
  }, [message, isProcessing, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      setShowQuickCommands(false);
    }
  }, [handleSend]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Mostrar comandos rápidos se começar com /
    setShowQuickCommands(value.startsWith('/') && value.length > 1);
    
    // Auto-resize
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, []);

  const handleQuickCommand = useCallback((command: string) => {
    setMessage(`${command  } `);
    setShowQuickCommands(false);
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative">
      {/* Quick commands */}
      <AnimatePresence>
        {showQuickCommands && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            {quickCommands
              .filter(cmd => cmd.command.includes(message.slice(1)))
              .map((cmd) => (
                <button
                  key={cmd.command}
                  onClick={() => { handleQuickCommand(cmd.command); }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="font-mono text-sm text-blue-600">
                    {cmd.command}
                  </span>
                  <span className="text-sm text-gray-600">
                    {cmd.description}
                  </span>
                </button>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input container */}
      <div className="flex items-end gap-2 p-4 bg-white border-t border-gray-200">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={isProcessing}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500 disabled:opacity-50"
            style={{ maxHeight: '120px' }}
          />
          
          {/* Voice input button */}
          <button
            onClick={() => { setIsListening(!isListening); }}
            className={cn(
              "absolute right-2 top-2 p-1 rounded transition-colors",
              isListening 
                ? "text-red-500 hover:text-red-600" 
                : "text-gray-400 hover:text-gray-600"
            )}
            title={isListening ? "Parar gravação" : "Gravar áudio"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        </div>
        
        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || isProcessing}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Enviar mensagem"
        >
          {isProcessing ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

// Componente principal
export const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onToggle,
  currentNoteId,
  selectedText,
  onApplySuggestion,
  className
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { capabilities, processQuery, isProcessing } = useAIEngine();

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensagem de boas-vindas
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'assistant',
        content: `Olá! Sou seu assistente IA inteligente. Posso ajudar você com:\n\n• ✍️ **Escrita** - Melhore textos e corrija gramática\n• 📊 **Análise** - Resuma e extraia insights\n• 🗂️ **Organização** - Estruture suas notas\n• 🔍 **Busca** - Encontre informações relevantes\n\nComo posso ajudar você hoje?`,
        timestamp: new Date(),
        suggestions: [
          {
            id: 'show_capabilities',
            type: 'question',
            title: 'Ver Todas as Capacidades',
            description: 'Mostrar tudo que posso fazer',
            icon: Sparkles,
            action: () => { handleShowCapabilities(); },
            confidence: 0.9
          },
          {
            id: 'analyze_notes',
            type: 'action',
            title: 'Analisar Suas Notas',
            description: 'Revisar e sugerir melhorias',
            icon: Brain,
            action: () => handleSendMessage('Analise minhas notas e sugira melhorias'),
            confidence: 0.8
          }
        ]
      };
      
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(async (content: string) => {
    // Adicionar mensagem do usuário
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      type: 'user',
      content,
      timestamp: new Date(),
      context: {
        noteId: currentNoteId,
        selectedText
      }
    };

    setMessages(prev => [...prev, userMessage]);

    // Adicionar indicador de digitação
    const typingMessage: ChatMessage = {
      id: `typing_${Date.now()}`,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };

    setMessages(prev => [...prev, typingMessage]);

    try {
      // Processar com IA
      const aiResponse = await processQuery(content, userMessage.context);
      
      // Remover indicador de digitação e adicionar resposta
      setMessages(prev => prev.filter(m => !m.isTyping).concat(aiResponse));
      
    } catch (error) {
      // Remover typing e mostrar erro
      setMessages(prev => prev.filter(m => !m.isTyping).concat({
        id: `error_${Date.now()}`,
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente.',
        timestamp: new Date(),
        error: 'AI processing failed'
      }));
    }
  }, [currentNoteId, selectedText, processQuery]);

  const handleFeedback = useCallback((messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
  }, []);

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    // TODO: Mostrar toast de sucesso
  }, []);

  const handleApplySuggestion = useCallback((suggestion: AISuggestion) => {
    suggestion.action();
    
    // Adicionar mensagem de ação executada
    const actionMessage: ChatMessage = {
      id: `action_${Date.now()}`,
      type: 'system',
      content: `✅ Ação executada: ${suggestion.title}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, actionMessage]);
  }, []);

  const handleShowCapabilities = useCallback(() => {
    const capabilitiesContent = capabilities.map(cap => 
      `**${cap.name}**\n${cap.description}\n\n*Exemplos:*\n${cap.examples.map(ex => `• ${ex}`).join('\n')}`
    ).join('\n\n---\n\n');

    const capabilitiesMessage: ChatMessage = {
      id: `capabilities_${Date.now()}`,
      type: 'assistant',
      content: `Aqui estão todas as minhas capacidades:\n\n${capabilitiesContent}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, capabilitiesMessage]);
  }, [capabilities]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "fixed bottom-4 right-4 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden",
        isMinimized && "h-14",
        !isMinimized && "h-[600px]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-white/20 rounded-lg">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Assistente IA</h3>
            {!isMinimized && (
              <p className="text-xs opacity-90">
                {isProcessing ? 'Processando...' : 'Online'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsMinimized(!isMinimized); }}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          
          {!isMinimized && (
            <>
              <button
                onClick={clearChat}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Limpar chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              
              <button
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Configurações"
              >
                <Settings className="h-4 w-4" />
              </button>
            </>
          )}
          
          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Fechar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Comece uma conversa!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    onFeedback={handleFeedback}
                    onCopy={handleCopy}
                    onApplySuggestion={handleApplySuggestion}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <ChatInput
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            placeholder={selectedText ? "Pergunte sobre o texto selecionado..." : "Digite sua pergunta..."}
          />
        </>
      )}
    </motion.div>
  );
};

export default AIAssistant; 