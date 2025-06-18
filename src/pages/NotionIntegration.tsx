import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Link, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Download,
  Upload,
  Settings
} from 'lucide-react';
import { useSmartCache, useCachedData } from '@/utils/SmartCache';
import { useBackupSystem } from '@/utils/BackupSystem';
import { useToast } from '@/hooks/use-toast';

// Simulação de dados da API Notion
const fetchNotionData = async () => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    connected: true,
    workspace: 'Meu Workspace',
    databases: [
      { id: '1', name: 'Projetos', pages: 24, lastSync: '2 min atrás' },
      { id: '2', name: 'Tarefas', pages: 156, lastSync: '5 min atrás' },
      { id: '3', name: 'Notas', pages: 89, lastSync: '1 hora atrás' },
      { id: '4', name: 'Documentos', pages: 67, lastSync: '3 horas atrás' }
    ],
    syncStats: {
      totalPages: 336,
      lastFullSync: '2024-01-15 14:30',
      syncFrequency: 'A cada 15 minutos',
      errorRate: 0.5
    }
  };
};

const NotionIntegration: React.FC = () => {
  const { toast } = useToast();
  const cache = useSmartCache();
  const backupSystem = useBackupSystem();
  
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Usar cache para dados da integração
  const { 
    data: notionData, 
    loading, 
    error, 
    refresh 
  } = useCachedData(
    'notion-integration-data',
    fetchNotionData,
    { 
      ttl: 10 * 60 * 1000, // 10 minutos
      priority: 'medium',
      tags: ['notion', 'integration']
    }
  );

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key necessária",
        description: "Por favor, insira sua API Key do Notion",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      // Criar backup antes da conexão
      await backupSystem.createBackup('manual');
      
      // Simular processo de conexão
      for (let i = 0; i <= 100; i += 10) {
        setSyncProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Invalidar cache para forçar refresh
      await cache.invalidateByTag('notion');
      await refresh();
      
      toast({
        title: "Conectado com sucesso!",
        description: "Integração com Notion estabelecida",
        variant: "default"
      });
      
    } catch (error) {
      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar com o Notion",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
      setSyncProgress(0);
    }
  };

  const handleSync = async (databaseId?: string) => {
    try {
      // Criar backup antes da sincronização
      await backupSystem.createBackup('auto');
      
      // Simular sincronização
      setSyncProgress(0);
      for (let i = 0; i <= 100; i += 20) {
        setSyncProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Invalidar cache específico ou geral
      if (databaseId) {
        await cache.invalidate(`notion-database-${databaseId}`);
      } else {
        await cache.invalidateByTag('notion');
      }
      
      await refresh();
      
      toast({
        title: "Sincronização concluída",
        description: databaseId ? "Database sincronizada" : "Todas as databases sincronizadas",
        variant: "default"
      });
      
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar os dados",
        variant: "destructive"
      });
    } finally {
      setSyncProgress(0);
    }
  };

  const handleExportData = async () => {
    try {
      // Criar backup completo para exportação
      const backupId = await backupSystem.createBackup('manual');
      const blob = await backupSystem.exportBackup(backupId);
      
      // Download do arquivo
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notion-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Dados exportados",
        description: "Backup dos dados do Notion criado com sucesso",
        variant: "default"
      });
      
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8" />
              Integração Notion
            </h1>
            <p className="text-muted-foreground">
              Conecte e sincronize seus dados do Notion
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {notionData?.connected ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Desconectado
              </Badge>
            )}
            <Button onClick={refresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Progresso de Sincronização */}
        {syncProgress > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sincronizando...</span>
                  <span>{syncProgress}%</span>
                </div>
                <Progress value={syncProgress} />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuração de Conexão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Configuração de Conexão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!notionData?.connected ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">API Key do Notion</label>
                    <Input
                      type="password"
                      placeholder="secret_..."
                      value={apiKey}
                      onChange={(e) => { setApiKey(e.target.value); }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Obtenha sua API Key em: notion.so/my-integrations
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleConnect} 
                    disabled={isConnecting}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <Link className="h-4 w-4 mr-2" />
                        Conectar ao Notion
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Conectado com sucesso!</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Workspace: {notionData.workspace}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleSync()} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sincronizar Tudo
                    </Button>
                    <Button onClick={handleExportData} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Dados
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas de Sincronização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Estatísticas de Sincronização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notionData?.syncStats ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{notionData.syncStats.totalPages}</div>
                      <div className="text-sm text-muted-foreground">Total de Páginas</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{notionData.syncStats.errorRate}%</div>
                      <div className="text-sm text-muted-foreground">Taxa de Erro</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Última Sincronização Completa:</span>
                      <span>{notionData.syncStats.lastFullSync}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Frequência:</span>
                      <span>{notionData.syncStats.syncFrequency}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Conecte ao Notion para ver estatísticas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Databases Conectadas */}
        {notionData?.connected && notionData.databases && (
          <Card>
            <CardHeader>
              <CardTitle>Databases Conectadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notionData.databases.map((database) => (
                  <div key={database.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{database.name}</h3>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSync(database.id)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sync
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{database.pages} páginas</p>
                      <p>Última sync: {database.lastSync}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como Configurar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="font-medium">Crie uma integração no Notion</p>
                  <p className="text-muted-foreground">Acesse notion.so/my-integrations e crie uma nova integração</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="font-medium">Copie a API Key</p>
                  <p className="text-muted-foreground">Cole a API Key no campo acima para conectar</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="font-medium">Compartilhe suas páginas</p>
                  <p className="text-muted-foreground">Adicione a integração às páginas que deseja sincronizar</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotionIntegration; 