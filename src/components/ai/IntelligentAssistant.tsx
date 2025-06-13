import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Send, 
  Mic, 
  Square, 
  Brain, 
  Sparkles, 
  FileText, 
  Search, 
  Settings, 
  Lightbulb,
  Code,
  MessageCircle,
  Zap,
  Target,
  Clock,
  Users,
  X,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: AssistantAction[];
  metadata?: {
    files?: string[];
    confidence?: number;
    executionTime?: number;
  };
}

interface AssistantAction {
  id: string;
  label: string;
  description: string;
  type: 'navigation' | 'creation' | 'automation' | 'analysis' | 'search';
  icon: React.ReactNode;
  command: string;
  parameters?: Record<string, any>;
}

interface IntelligentAssistantProps {
  files: FileItem[];
  currentFileId?: string;
  onFileSelect: (fileId: string) => void;
  onCreateFile?: (name: string, type: string) => void;
  onExecuteCommand?: (command: string, params?: any) => void;
  className?: string;
}

export const IntelligentAssistant: React.FC<IntelligentAssistantProps> = ({
  files,
  currentFileId,
  onFileSelect,
  onCreateFile,
  onExecuteCommand,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Comandos disponíveis do assistente
  const availableCommands = [
    {
      pattern: /criar (?:arquivo|documento|nota) (?:sobre|de|para) (.+)/i,
      action: 'create_file',
      description: 'Criar um novo arquivo sobre um tópico'
    },
    {
      pattern: /encontrar|buscar|procurar (.+)/i,
      action: 'search_content',
      description: 'Buscar conteúdo nos arquivos'
    },
    {
      pattern: /analisar (?:projeto|workspace|arquivos)/i,
      action: 'analyze_workspace',
      description: 'Analisar o estado do workspace'
    },
    {
      pattern: /organizar (?:arquivos|tags|projeto)/i,
      action: 'organize_files',
      description: 'Sugerir organização dos arquivos'
    },
    {
      pattern: /resumir (?:arquivo|documento) (.+)/i,
      action: 'summarize_file',
      description: 'Resumir conteúdo de um arquivo'
    },
    {
      pattern: /sugerir (?:melhorias|ideias|próximos passos)/i,
      action: 'suggest_improvements',
      description: 'Sugerir melhorias e próximos passos'
    }
  ];

  // Inicializar reconhecimento de voz
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Scroll automático para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detectar atalho de teclado (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const processUserInput = useCallback(async (input: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simular processamento da IA
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Analisar comando e gerar resposta
    const command = availableCommands.find(cmd => cmd.pattern.test(input));
    let response = '';
    let actions: AssistantAction[] = [];
    let metadata = { confidence: 85, executionTime: 1200 };

    if (command) {
      switch (command.action) {
        case 'create_file':
          const match = input.match(command.pattern);
          const topic = match ? match[1] : 'novo arquivo';
          response = `Vou criar um arquivo sobre "${topic}". Que tipo de documento você prefere?`;
          actions = [
            {
              id: 'create-doc',
              label: 'Documento',
              description: 'Criar documento de texto',
              type: 'creation',
              icon: <FileText className="h-4 w-4" />,
              command: 'create_file',
              parameters: { name: topic, type: 'document' }
            },
            {
              id: 'create-note',
              label: 'Nota Rápida',
              description: 'Criar nota simples',
              type: 'creation',
              icon: <MessageCircle className="h-4 w-4" />,
              command: 'create_file',
              parameters: { name: topic, type: 'note' }
            }
          ];
          break;

        case 'search_content':
          const searchMatch = input.match(command.pattern);
          const searchTerm = searchMatch ? searchMatch[1] : '';
          const relatedFiles = files.filter(f => 
            f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
          ).slice(0, 5);

          response = `Encontrei ${relatedFiles.length} arquivo(s) relacionado(s) a "${searchTerm}":`;
          actions = relatedFiles.map(file => ({
            id: `open-${file.id}`,
            label: file.name,
            description: `Abrir ${file.name}`,
            type: 'navigation' as const,
            icon: <FileText className="h-4 w-4" />,
            command: 'open_file',
            parameters: { fileId: file.id }
          }));
          metadata.files = relatedFiles.map(f => f.name);
          break;

        case 'analyze_workspace':
          const totalFiles = files.length;
          const recentFiles = files.filter(f => {
            const daysDiff = (Date.now() - new Date(f.lastModified).getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
          }).length;
          const taggedFiles = files.filter(f => f.tags && f.tags.length > 0).length;

          response = `📊 **Análise do Workspace:**\n\n• Total de arquivos: ${totalFiles}\n• Arquivos modificados recentemente: ${recentFiles}\n• Arquivos com tags: ${taggedFiles} (${Math.round((taggedFiles/totalFiles)*100)}%)\n• Taxa de organização: ${taggedFiles > totalFiles * 0.7 ? 'Boa' : 'Pode melhorar'}`;
          
          actions = [
            {
              id: 'organize-files',
              label: 'Organizar Arquivos',
              description: 'Sugerir organização automática',
              type: 'automation',
              icon: <Zap className="h-4 w-4" />,
              command: 'organize_workspace',
              parameters: {}
            }
          ];
          break;

        case 'suggest_improvements':
          response = `💡 **Sugestões de Melhorias:**\n\n1. **Organização**: Adicione tags aos arquivos sem classificação\n2. **Produtividade**: Configure atalhos para ações frequentes\n3. **Colaboração**: Compartilhe documentos importantes com a equipe\n4. **Backup**: Configure sincronização automática`;
          
          actions = [
            {
              id: 'auto-tag',
              label: 'Auto-Tag Files',
              description: 'Adicionar tags automaticamente',
              type: 'automation',
              icon: <Brain className="h-4 w-4" />,
              command: 'auto_tag_files',
              parameters: {}
            },
            {
              id: 'setup-shortcuts',
              label: 'Configurar Atalhos',
              description: 'Personalizar atalhos de teclado',
              type: 'automation',
              icon: <Settings className="h-4 w-4" />,
              command: 'setup_shortcuts',
              parameters: {}
            }
          ];
          break;

        default:
          response = `Entendi que você quer "${input}". Como posso ajudar especificamente?`;
      }
    } else {
      // Resposta genérica inteligente
      if (input.toLowerCase().includes('help') || input.toLowerCase().includes('ajuda')) {
        response = `🤖 **Como posso ajudar:**\n\n• "Criar arquivo sobre [tópico]"\n• "Buscar [termo]"\n• "Analisar projeto"\n• "Organizar arquivos"\n• "Sugerir melhorias"\n\nOu simplesmente me diga o que precisa!`;
      } else if (input.toLowerCase().includes('obrigado') || input.toLowerCase().includes('thanks')) {
        response = `De nada! Estou aqui sempre que precisar. 😊`;
      } else {
        response = `Interessante! Baseado no seu contexto atual com ${files.length} arquivos, posso ajudar você a organizar, encontrar informações ou criar novos conteúdos. O que você gostaria de fazer?`;
        
        actions = [
          {
            id: 'create-new',
            label: 'Criar Novo Arquivo',
            description: 'Iniciar criação de conteúdo',
            type: 'creation',
            icon: <FileText className="h-4 w-4" />,
            command: 'create_file',
            parameters: {}
          },
          {
            id: 'search-all',
            label: 'Buscar Conteúdo',
            description: 'Procurar nos arquivos existentes',
            type: 'search',
            icon: <Search className="h-4 w-4" />,
            command: 'search_files',
            parameters: {}
          }
        ];
      }
    }

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: response,
      timestamp: new Date(),
      actions,
      metadata
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);

    // Text-to-speech se habilitado
    if (voiceEnabled && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(response.replace(/[*#•]/g, ''));
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
    }
  }, [files, voiceEnabled]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    await processUserInput(inputValue);
    setInputValue('');
  };

  const handleActionClick = (action: AssistantAction) => {
    switch (action.command) {
      case 'open_file':
        onFileSelect(action.parameters?.fileId);
        break;
      case 'create_file':
        onCreateFile?.(action.parameters?.name || 'Novo arquivo', action.parameters?.type || 'document');
        break;
      default:
        onExecuteCommand?.(action.command, action.parameters);
    }

    // Feedback para o usuário
    const feedbackMessage: Message = {
      id: `system-${Date.now()}`,
      type: 'system',
      content: `✅ Executado: ${action.label}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, feedbackMessage]);
  };

  const startVoiceRecognition = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="relative h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl border-0"
          >
            <Bot className="h-6 w-6 text-white" />
            <motion.div
              className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="absolute bottom-16 right-0 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap"
        >
          Pressione Ctrl+K para abrir
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700",
          isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
              <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                Assistant AI
              </h3>
              {!isMinimized && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Pronto para ajudar • {messages.length} mensagens
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVoice}
              className={cn(
                "h-8 w-8 p-0",
                voiceEnabled ? "text-green-600" : "text-gray-400"
              )}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4 h-[460px]">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="p-4 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Olá! Como posso ajudar?
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Digite sua pergunta ou use comandos como "criar arquivo sobre..." ou "buscar..."
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      message.type === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.type !== 'user' && (
                      <div className="flex-shrink-0">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          message.type === 'assistant' 
                            ? "bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900"
                            : "bg-gray-100 dark:bg-gray-800"
                        )}>
                          {message.type === 'assistant' ? (
                            <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          ) : (
                            <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className={cn(
                      "max-w-[280px] rounded-lg px-3 py-2 text-sm",
                      message.type === 'user'
                        ? "bg-blue-600 text-white ml-auto"
                        : message.type === 'system'
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    )}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.actions.map((action) => (
                            <Button
                              key={action.id}
                              variant="outline"
                              size="sm"
                              onClick={() => handleActionClick(action)}
                              className="w-full justify-start text-xs h-8"
                            >
                              {action.icon}
                              <span className="ml-2">{action.label}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      {message.metadata && (
                        <div className="mt-2 text-xs opacity-70">
                          {message.metadata.confidence && (
                            <span>Confiança: {message.metadata.confidence}%</span>
                          )}
                          {message.metadata.executionTime && (
                            <span className="ml-2">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {message.metadata.executionTime}ms
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                      <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Digite sua mensagem..."
                    className="pr-10"
                    disabled={isTyping}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startVoiceRecognition}
                    disabled={isListening || !recognitionRef.current}
                    className={cn(
                      "absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0",
                      isListening ? "text-red-500 animate-pulse" : "text-gray-400"
                    )}
                  >
                    {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="h-10 w-10 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                Pressione Enter para enviar • Use comandos ou pergunte livremente
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}; 