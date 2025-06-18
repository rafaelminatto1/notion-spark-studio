import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield,
  Cloud, 
  Download, 
  Upload, 
  RefreshCw, 
  Archive, 
  History, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  HardDrive, 
  Wifi, 
  WifiOff,
  Settings,
  Zap,
  Eye,
  RotateCcw,
  Save,
  Database,
  FileText,
  Folder,
  Calendar,
  Filter,
  Search,
  Play,
  Pause,
  MoreHorizontal,
  Target,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Tipos para o sistema de backup
interface BackupJob {
  id: string;
  name: string;
  type: 'manual' | 'scheduled' | 'incremental' | 'differential' | 'full';
  status: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  size: number;
  files: number;
  destination: 'local' | 'cloud' | 'hybrid';
  retention: number; // dias
  priority: 'low' | 'medium' | 'high';
  errorMessage?: string;
}

interface BackupVersion {
  id: string;
  version: string;
  timestamp: Date;
  size: number;
  files: number;
  type: 'full' | 'incremental' | 'differential';
  description: string;
  tags: string[];
  isVerified: boolean;
  checksumValid: boolean;
}

interface SyncSession {
  id: string;
  device: string;
  status: 'syncing' | 'synced' | 'conflict' | 'error';
  lastSync: Date;
  changes: number;
  conflictFiles: string[];
  syncDirection: 'up' | 'down' | 'both';
}

interface BackupSettings {
  autoBackup: boolean;
  backupInterval: number; // minutos
  retention: number; // dias
  compression: boolean;
  encryption: boolean;
  cloudSync: boolean;
  realtimeSync: boolean;
  bandwidthLimit: number; // MB/s
  excludePatterns: string[];
  includePatterns: string[];
  verifyBackups: boolean;
  smartScheduling: boolean;
}

interface IntelligentBackupSystemProps {
  className?: string;
}

export const IntelligentBackupSystem: React.FC<IntelligentBackupSystemProps> = ({
  className = ''
}) => {
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [backupVersions, setBackupVersions] = useState<BackupVersion[]>([]);
  const [syncSessions, setSyncSessions] = useState<SyncSession[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [currentBackup, setCurrentBackup] = useState<BackupJob | null>(null);
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackup: true,
    backupInterval: 30,
    retention: 30,
    compression: true,
    encryption: true,
    cloudSync: true,
    realtimeSync: true,
    bandwidthLimit: 10,
    excludePatterns: ['*.tmp', 'node_modules/', '.git/'],
    includePatterns: ['*.md', '*.json', '*.ts', '*.tsx'],
    verifyBackups: true,
    smartScheduling: true
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  const backupWorkerRef = useRef<Worker>();

  // Simulação de dados de backup
  useEffect(() => {
    const mockJobs: BackupJob[] = [
      {
        id: 'backup_1',
        name: 'Backup Completo - Documentos',
        type: 'full',
        status: 'completed',
        progress: 100,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 30 * 60 * 1000),
        size: 2.4 * 1024 * 1024 * 1024, // 2.4 GB
        files: 1247,
        destination: 'cloud',
        retention: 30,
        priority: 'high'
      },
      {
        id: 'backup_2',
        name: 'Sync Incremental - Workspace',
        type: 'incremental',
        status: 'running',
        progress: 67,
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
        size: 156 * 1024 * 1024, // 156 MB
        files: 89,
        destination: 'hybrid',
        retention: 7,
        priority: 'medium'
      },
      {
        id: 'backup_3',
        name: 'Backup Manual - Projeto X',
        type: 'manual',
        status: 'failed',
        progress: 45,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        size: 0,
        files: 0,
        destination: 'local',
        retention: 14,
        priority: 'low',
        errorMessage: 'Espaço insuficiente no disco local'
      }
    ];

    const mockVersions: BackupVersion[] = [
      {
        id: 'v1',
        version: '2024.01.15.001',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        size: 2.1 * 1024 * 1024 * 1024,
        files: 1205,
        type: 'full',
        description: 'Backup completo antes da atualização do sistema',
        tags: ['stable', 'pre-update'],
        isVerified: true,
        checksumValid: true
      },
      {
        id: 'v2',
        version: '2024.01.15.002',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        size: 145 * 1024 * 1024,
        files: 67,
        type: 'incremental',
        description: 'Alterações do workspace de desenvolvimento',
        tags: ['dev', 'incremental'],
        isVerified: true,
        checksumValid: true
      },
      {
        id: 'v3',
        version: '2024.01.15.003',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        size: 89 * 1024 * 1024,
        files: 34,
        type: 'incremental',
        description: 'Documentação e assets atualizados',
        tags: ['docs', 'assets'],
        isVerified: false,
        checksumValid: false
      }
    ];

    const mockSessions: SyncSession[] = [
      {
        id: 'sync_1',
        device: 'MacBook Pro - Rafael',
        status: 'synced',
        lastSync: new Date(Date.now() - 5 * 60 * 1000),
        changes: 12,
        conflictFiles: [],
        syncDirection: 'both'
      },
      {
        id: 'sync_2',
        device: 'iPad - Móvel',
        status: 'syncing',
        lastSync: new Date(Date.now() - 2 * 60 * 1000),
        changes: 3,
        conflictFiles: [],
        syncDirection: 'down'
      },
      {
        id: 'sync_3',
        device: 'Windows Desktop',
        status: 'conflict',
        lastSync: new Date(Date.now() - 30 * 60 * 1000),
        changes: 8,
        conflictFiles: ['document1.md', 'notes.txt'],
        syncDirection: 'both'
      }
    ];

    setBackupJobs(mockJobs);
    setBackupVersions(mockVersions);
    setSyncSessions(mockSessions);

    // Simular backup em andamento
    const runningJob = mockJobs.find(job => job.status === 'running');
    if (runningJob) {
      setCurrentBackup(runningJob);
    }
  }, []);

  // Simulação de progresso de backup
  useEffect(() => {
    if (!currentBackup || currentBackup.status !== 'running') return;

    const interval = setInterval(() => {
      setCurrentBackup(prev => {
        if (!prev || prev.progress >= 100) return prev;
        
        const newProgress = Math.min(prev.progress + Math.random() * 5, 100);
        const updatedBackup = { ...prev, progress: newProgress };
        
        if (newProgress >= 100) {
          updatedBackup.status = 'completed';
          updatedBackup.completedAt = new Date();
        }

        setBackupJobs(jobs => 
          jobs.map(job => job.id === prev.id ? updatedBackup : job)
        );

        return updatedBackup;
      });
    }, 2000);

    return () => { clearInterval(interval); };
  }, [currentBackup]);

  // Iniciar backup manual
  const startManualBackup = () => {
    const newBackup: BackupJob = {
      id: `backup_${Date.now()}`,
      name: 'Backup Manual',
      type: 'manual',
      status: 'running',
      progress: 0,
      createdAt: new Date(),
      size: 0,
      files: 0,
      destination: 'cloud',
      retention: 30,
      priority: 'high'
    };

    setBackupJobs(prev => [newBackup, ...prev]);
    setCurrentBackup(newBackup);
  };

  // Restaurar versão
  const restoreVersion = (version: BackupVersion) => {
    // Implementar lógica de restauração
    console.log('Restaurando versão:', version.version);
  };

  // Resolver conflito de sincronização
  const resolveConflict = (sessionId: string, resolution: 'local' | 'remote' | 'merge') => {
    setSyncSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'synced', conflictFiles: [] }
          : session
      )
    );
  };

  // Filtros e busca
  const filteredJobs = useMemo(() => {
    let filtered = backupJobs;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(job => job.status === selectedFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(job => 
        job.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [backupJobs, selectedFilter, searchQuery]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalSize = backupJobs.reduce((sum, job) => sum + job.size, 0);
    const totalFiles = backupJobs.reduce((sum, job) => sum + job.files, 0);
    const successRate = backupJobs.length > 0 
      ? (backupJobs.filter(job => job.status === 'completed').length / backupJobs.length) * 100 
      : 0;
    
    return {
      totalBackups: backupJobs.length,
      totalSize,
      totalFiles,
      successRate,
      lastBackup: backupJobs.find(job => job.status === 'completed')?.completedAt
    };
  }, [backupJobs]);

  // Formatação de tamanho
  const formatSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Status de backup
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'running': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'paused': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Ícone de status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com status geral */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Sistema de Backup Inteligente</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Proteção automática e sincronização em tempo real
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded ${
                isConnected ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span className="text-xs">{isConnected ? 'Online' : 'Offline'}</span>
              </div>
              <Button onClick={startManualBackup} disabled={!!currentBackup}>
                <Save className="h-4 w-4 mr-2" />
                Backup Manual
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalBackups}</div>
              <div className="text-sm text-gray-500">Total de Backups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatSize(stats.totalSize)}</div>
              <div className="text-sm text-gray-500">Dados Protegidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalFiles.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Arquivos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.round(stats.successRate)}%</div>
              <div className="text-sm text-gray-500">Taxa de Sucesso</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup em andamento */}
      {currentBackup && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                  <span>Backup em Andamento</span>
                </CardTitle>
                <Badge variant="secondary">{currentBackup.type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{currentBackup.name}</span>
                  <span>{Math.round(currentBackup.progress)}%</span>
                </div>
                <Progress value={currentBackup.progress} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Iniciado: {currentBackup.createdAt.toLocaleTimeString()}</span>
                  <span>{formatSize(currentBackup.size)} • {currentBackup.files} arquivos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="versions">Versões</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-4">
          {/* Controles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar backups..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); }}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="running">Em andamento</SelectItem>
                  <SelectItem value="failed">Falharam</SelectItem>
                  <SelectItem value="paused">Pausados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{filteredJobs.length} jobs</Badge>
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                Histórico
              </Button>
            </div>
          </div>

          {/* Lista de backups */}
          <div className="space-y-3">
            <AnimatePresence>
              {filteredJobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`border-l-4 ${getStatusColor(job.status)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <h4 className="font-medium">{job.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{job.type}</span>
                              <span>{job.destination}</span>
                              <span>{formatSize(job.size)}</span>
                              <span>{job.files} arquivos</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={job.priority === 'high' ? 'destructive' : 'secondary'}>
                            {job.priority}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Baixar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restaurar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {job.status === 'running' && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progresso</span>
                            <span>{Math.round(job.progress)}%</span>
                          </div>
                          <Progress value={job.progress} className="h-1" />
                        </div>
                      )}
                      
                      {job.errorMessage && (
                        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600">
                          {job.errorMessage}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                        <span>Criado: {job.createdAt.toLocaleString()}</span>
                        {job.completedAt && (
                          <span>Concluído: {job.completedAt.toLocaleString()}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Versões de Backup</h3>
              <Badge variant="secondary">{backupVersions.length} versões</Badge>
            </div>
            
            {backupVersions.map((version) => (
              <Card key={version.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        version.type === 'full' ? 'bg-blue-100 text-blue-600' : 
                        'bg-green-100 text-green-600'
                      }`}>
                        {version.type === 'full' ? <Database className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                      </div>
                      <div>
                        <h4 className="font-medium">Versão {version.version}</h4>
                        <p className="text-sm text-gray-500">{version.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {version.isVerified && version.checksumValid && (
                        <Badge variant="default" className="bg-green-50 text-green-600 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verificado
                        </Badge>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { restoreVersion(version); }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-500">Tamanho:</span>
                      <span className="ml-2 font-medium">{formatSize(version.size)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Arquivos:</span>
                      <span className="ml-2 font-medium">{version.files}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Data:</span>
                      <span className="ml-2 font-medium">{version.timestamp.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {version.tags.length > 0 && (
                    <div className="flex space-x-1 mt-3">
                      {version.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Sessões de Sincronização</h3>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar Agora
              </Button>
            </div>
            
            {syncSessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`h-3 w-3 rounded-full ${
                        session.status === 'synced' ? 'bg-green-500' :
                        session.status === 'syncing' ? 'bg-blue-500 animate-pulse' :
                        session.status === 'conflict' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <h4 className="font-medium">{session.device}</h4>
                        <p className="text-sm text-gray-500">
                          Última sincronização: {session.lastSync.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        session.status === 'synced' ? 'default' :
                        session.status === 'syncing' ? 'secondary' :
                        session.status === 'conflict' ? 'destructive' : 'destructive'
                      }>
                        {session.status}
                      </Badge>
                      {session.syncDirection === 'both' ? (
                        <RefreshCw className="h-4 w-4 text-gray-400" />
                      ) : session.syncDirection === 'up' ? (
                        <Upload className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Download className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {session.status === 'conflict' && session.conflictFiles.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Conflitos Detectados
                        </span>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => { resolveConflict(session.id, 'local'); }}
                          >
                            Manter Local
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => { resolveConflict(session.id, 'remote'); }}
                          >
                            Manter Remoto
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => { resolveConflict(session.id, 'merge'); }}
                          >
                            Mesclar
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {session.conflictFiles.map((file) => (
                          <div key={file} className="text-xs text-yellow-700 dark:text-yellow-300">
                            • {file}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
                    <span>{session.changes} alterações</span>
                    <span>{session.syncDirection} sync</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Backup Automático</label>
                    <Switch
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => 
                        { setSettings(prev => ({ ...prev, autoBackup: checked })); }
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Intervalo de Backup (minutos)</label>
                    <Slider
                      value={[settings.backupInterval]}
                      onValueChange={([value]) => 
                        { setSettings(prev => ({ ...prev, backupInterval: value })); }
                      }
                      max={1440}
                      min={5}
                      step={5}
                    />
                    <span className="text-xs text-gray-500">{settings.backupInterval} minutos</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Retenção (dias)</label>
                    <Slider
                      value={[settings.retention]}
                      onValueChange={([value]) => 
                        { setSettings(prev => ({ ...prev, retention: value })); }
                      }
                      max={365}
                      min={1}
                      step={1}
                    />
                    <span className="text-xs text-gray-500">{settings.retention} dias</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Compressão</label>
                    <Switch
                      checked={settings.compression}
                      onCheckedChange={(checked) => 
                        { setSettings(prev => ({ ...prev, compression: checked })); }
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Criptografia</label>
                    <Switch
                      checked={settings.encryption}
                      onCheckedChange={(checked) => 
                        { setSettings(prev => ({ ...prev, encryption: checked })); }
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Sincronização em Nuvem</label>
                    <Switch
                      checked={settings.cloudSync}
                      onCheckedChange={(checked) => 
                        { setSettings(prev => ({ ...prev, cloudSync: checked })); }
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Sincronização em Tempo Real</label>
                    <Switch
                      checked={settings.realtimeSync}
                      onCheckedChange={(checked) => 
                        { setSettings(prev => ({ ...prev, realtimeSync: checked })); }
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligentBackupSystem; 