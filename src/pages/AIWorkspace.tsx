import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Zap, 
  FileText, 
  Download, 
  Upload,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Settings
} from 'lucide-react';
import { useSmartCache, useCachedData } from '@/utils/SmartCache';
import { useBackupSystem } from '@/utils/BackupSystem';
import { useToast } from '@/hooks/use-toast';

// Simulação de processamento de IA
const processWithAI = async (content: string, type: string) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const responses = {
    summarize: `📝 **Resumo Executivo**\n\n${content.slice(0, 100)}...\n\n**Pontos Principais:**\n• Conceito central identificado\n• Estrutura lógica analisada\n• Conclusões extraídas`,
    enhance: `✨ **Versão Aprimorada**\n\n${content}\n\n**Melhorias Aplicadas:**\n• Clareza e fluidez otimizadas\n• Estrutura reorganizada\n• Vocabulário enriquecido\n• Coesão textual melhorada`,
    translate: `🌐 **Tradução (EN)**\n\n[Translated version of the content]\n\n**Translation Notes:**\n• Context preserved\n• Cultural adaptations made\n• Technical terms localized`,
    analyze: `🔍 **Análise Detalhada**\n\n**Sentimento:** Neutro/Positivo\n**Complexidade:** Média\n**Temas Identificados:**\n• Tema principal\n• Subtemas relevantes\n**Sugestões:**\n• Expandir seção X\n• Adicionar exemplos\n• Melhorar conclusão`
  };
  
  return responses[type as keyof typeof responses] || 'Processamento concluído com sucesso!';
};

const AIWorkspace: React.FC = () => {
  const { toast } = useToast();
  const cache = useSmartCache();
  const backupSystem = useBackupSystem();
  
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedTool, setSelectedTool] = useState<string>('');

  // Cache para histórico de processamentos
  const { 
    data: processingHistory, 
    refresh: refreshHistory 
  } = useCachedData(
    'ai-processing-history',
    async () => {
      const stored = localStorage.getItem('ai-processing-history');
      return stored ? JSON.parse(stored) : [];
    },
    { 
      ttl: 60 * 60 * 1000, // 1 hora
      priority: 'low',
      tags: ['ai', 'history']
    }
  );

  const aiTools = [
    { id: 'summarize', name: 'Resumir', icon: FileText, description: 'Criar resumo executivo' },
    { id: 'enhance', name: 'Aprimorar', icon: Sparkles, description: 'Melhorar qualidade do texto' },
    { id: 'translate', name: 'Traduzir', icon: MessageSquare, description: 'Traduzir para outros idiomas' },
    { id: 'analyze', name: 'Analisar', icon: Brain, description: 'Análise detalhada de conteúdo' }
  ];

  const handleProcess = async (toolId: string) => {
    if (!inputText.trim()) {
      toast({
        title: "Texto necessário",
        description: "Por favor, insira algum texto para processar",
        variant: "destructive"
      });
      return;
    }

    setSelectedTool(toolId);
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Criar backup antes do processamento
      await backupSystem.createBackup('auto');

      // Simular progresso
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Processar com IA
      const result = await processWithAI(inputText, toolId);
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      setOutputText(result);

      // Salvar no histórico
      const newEntry = {
        id: Date.now(),
        input: inputText.slice(0, 100) + (inputText.length > 100 ? '...' : ''),
        output: result.slice(0, 100) + (result.length > 100 ? '...' : ''),
        tool: toolId,
        timestamp: new Date().toISOString()
      };

      const currentHistory = processingHistory || [];
      const updatedHistory = [newEntry, ...currentHistory.slice(0, 9)]; // Manter apenas 10 entradas
      
      localStorage.setItem('ai-processing-history', JSON.stringify(updatedHistory));
      await cache.invalidate('ai-processing-history');
      await refreshHistory();

      toast({
        title: "Processamento concluído!",
        description: `Texto processado com ${aiTools.find(t => t.id === toolId)?.name}`,
        variant: "default"
      });

    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: "Não foi possível processar o texto",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setSelectedTool('');
    }
  };

  const handleClearHistory = async () => {
    localStorage.removeItem('ai-processing-history');
    await cache.invalidate('ai-processing-history');
    await refreshHistory();
    
    toast({
      title: "Histórico limpo",
      description: "Histórico de processamentos removido",
      variant: "default"
    });
  };

  const handleExportResult = () => {
    if (!outputText) {
      toast({
        title: "Nenhum resultado",
        description: "Não há resultado para exportar",
        variant: "destructive"
      });
      return;
    }

    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-result-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Resultado exportado",
      description: "Arquivo baixado com sucesso",
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8" />
              IA Workspace
            </h1>
            <p className="text-muted-foreground">
              Processe e aprimore seu conteúdo com inteligência artificial
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              IA Ativa
            </Badge>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>

        {/* Progresso de Processamento */}
        {isProcessing && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processando com {aiTools.find(t => t.id === selectedTool)?.name}...</span>
                  <span>{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ferramentas de IA */}
        <Card>
          <CardHeader>
            <CardTitle>Ferramentas de IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {aiTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Button
                    key={tool.id}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => handleProcess(tool.id)}
                    disabled={isProcessing}
                  >
                    <Icon className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">{tool.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Texto de Entrada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Cole ou digite seu texto aqui para processar com IA..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[300px] resize-none"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{inputText.length} caracteres</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInputText('')}
                  disabled={!inputText}
                >
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Resultado Processado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="min-h-[300px] p-3 bg-muted rounded-md">
                {outputText ? (
                  <div className="whitespace-pre-wrap text-sm">{outputText}</div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>O resultado aparecerá aqui após o processamento</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {outputText.length} caracteres
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOutputText('')}
                    disabled={!outputText}
                  >
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportResult}
                    disabled={!outputText}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Histórico de Processamentos</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearHistory}
                disabled={!processingHistory?.length}
              >
                Limpar Histórico
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {processingHistory?.length > 0 ? (
              <div className="space-y-3">
                {processingHistory.map((entry: any) => (
                  <div key={entry.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">
                        {aiTools.find(t => t.id === entry.tool)?.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><strong>Entrada:</strong> {entry.input}</p>
                      <p><strong>Resultado:</strong> {entry.output}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum processamento realizado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dicas */}
        <Card>
          <CardHeader>
            <CardTitle>Dicas de Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">📝 Resumir</h4>
                <p className="text-muted-foreground">
                  Ideal para textos longos, artigos e documentos. Extrai os pontos principais.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">✨ Aprimorar</h4>
                <p className="text-muted-foreground">
                  Melhora a qualidade, clareza e fluidez do texto mantendo o significado.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">🌐 Traduzir</h4>
                <p className="text-muted-foreground">
                  Tradução contextual preservando nuances e adaptações culturais.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">🔍 Analisar</h4>
                <p className="text-muted-foreground">
                  Análise profunda de sentimento, temas e sugestões de melhoria.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIWorkspace; 