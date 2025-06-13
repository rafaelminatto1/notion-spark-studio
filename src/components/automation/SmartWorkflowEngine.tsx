import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Play, 
  Pause, 
  Square,
  Settings, 
  Clock, 
  Target, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  FileText,
  Tag,
  Users,
  Brain,
  Workflow,
  Timer,
  BarChart3,
  TrendingUp,
  Calendar,
  Bell,
  Filter,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Trash2,
  Edit,
  Save,
  X,
  Plus,
  Copy,
  Download,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  schedule?: WorkflowSchedule;
  stats: {
    executions: number;
    lastRun?: Date;
    successRate: number;
    avgExecutionTime: number;
  };
}

interface WorkflowTrigger {
  type: 'file_created' | 'file_modified' | 'time_based' | 'tag_added' | 'manual' | 'user_action';
  config: Record<string, any>;
}

interface WorkflowCondition {
  type: 'file_type' | 'file_size' | 'tag_exists' | 'content_contains' | 'time_range' | 'user_is';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: any;
}

interface WorkflowAction {
  type: 'add_tags' | 'move_file' | 'create_backup' | 'send_notification' | 'generate_summary' | 'update_metadata';
  config: Record<string, any>;
  delay?: number;
}

interface WorkflowSchedule {
  type: 'interval' | 'daily' | 'weekly' | 'monthly';
  config: {
    time?: string;
    days?: number[];
    interval?: number;
  };
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  progress: number;
  logs: WorkflowLog[];
  result?: any;
}

interface WorkflowLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
}

interface SmartWorkflowEngineProps {
  files: FileItem[];
  currentUser?: { id: string; name: string };
  onFileUpdate?: (fileId: string, updates: Partial<FileItem>) => void;
  onNotification?: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  className?: string;
}

export const SmartWorkflowEngine: React.FC<SmartWorkflowEngineProps> = ({
  files,
  currentUser,
  onFileUpdate,
  onNotification,
  className
}) => {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [isEngineRunning, setIsEngineRunning] = useState(true);
  const [activeTab, setActiveTab] = useState<'workflows' | 'executions' | 'analytics' | 'settings'>('workflows');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  // Workflows predefinidos
  const defaultWorkflows: WorkflowRule[] = [
    {
      id: 'auto-tag-documents',
      name: 'Auto-Tag Documents',
      description: 'Adiciona tags automaticamente baseado no conteúdo dos documentos',
      enabled: true,
      trigger: { type: 'file_created', config: {} },
      conditions: [
        { type: 'file_type', operator: 'equals', value: 'document' }
      ],
      actions: [
        { type: 'add_tags', config: { ai_generated: true }, delay: 1000 }
      ],
      stats: { executions: 24, successRate: 95, avgExecutionTime: 1200, lastRun: new Date(Date.now() - 3600000) }
    },
    {
      id: 'daily-backup',
      name: 'Daily Backup',
      description: 'Cria backup automático dos arquivos importantes diariamente',
      enabled: true,
      trigger: { type: 'time_based', config: {} },
      conditions: [],
      actions: [
        { type: 'create_backup', config: { important_only: true } }
      ],
      schedule: { type: 'daily', config: { time: '02:00' } },
      stats: { executions: 7, successRate: 100, avgExecutionTime: 5400, lastRun: new Date(Date.now() - 86400000) }
    },
    {
      id: 'organize-downloads',
      name: 'Organize Downloads',
      description: 'Organiza automaticamente arquivos baixados por tipo e data',
      enabled: false,
      trigger: { type: 'file_created', config: { folder: 'downloads' } },
      conditions: [],
      actions: [
        { type: 'move_file', config: { organize_by: 'type_and_date' } },
        { type: 'add_tags', config: { tags: ['auto-organized'] } }
      ],
      stats: { executions: 0, successRate: 0, avgExecutionTime: 0 }
    },
    {
      id: 'collaboration-alerts',
      name: 'Collaboration Alerts',
      description: 'Notifica sobre mudanças em arquivos compartilhados',
      enabled: true,
      trigger: { type: 'file_modified', config: {} },
      conditions: [
        { type: 'tag_exists', operator: 'equals', value: 'shared' }
      ],
      actions: [
        { type: 'send_notification', config: { type: 'collaboration' } }
      ],
      stats: { executions: 12, successRate: 100, avgExecutionTime: 300, lastRun: new Date(Date.now() - 1800000) }
    },
    {
      id: 'smart-summaries',
      name: 'Smart Summaries',
      description: 'Gera resumos automáticos para documentos longos',
      enabled: true,
      trigger: { type: 'file_created', config: {} },
      conditions: [
        { type: 'content_contains', operator: 'greater_than', value: 1000 }
      ],
      actions: [
        { type: 'generate_summary', config: { max_length: 200 } },
        { type: 'add_tags', config: { tags: ['summarized'] } }
      ],
      stats: { executions: 8, successRate: 87, avgExecutionTime: 2800, lastRun: new Date(Date.now() - 7200000) }
    }
  ];

  // Inicializar workflows
  useEffect(() => {
    setWorkflows(defaultWorkflows);
  }, []);

  // Executar workflows automaticamente
  useEffect(() => {
    if (!isEngineRunning) return;

    const interval = setInterval(() => {
      workflows.forEach(workflow => {
        if (workflow.enabled && shouldExecuteWorkflow(workflow)) {
          executeWorkflow(workflow);
        }
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [workflows, isEngineRunning, files]);

  const shouldExecuteWorkflow = (workflow: WorkflowRule): boolean => {
    // Lógica simplificada para determinar se um workflow deve ser executado
    if (workflow.trigger.type === 'time_based' && workflow.schedule) {
      const now = new Date();
      const lastRun = workflow.stats.lastRun;
      
      if (!lastRun) return true;
      
      const timeSinceLastRun = now.getTime() - lastRun.getTime();
      
      switch (workflow.schedule.type) {
        case 'daily':
          return timeSinceLastRun > 24 * 60 * 60 * 1000;
        case 'interval':
          return timeSinceLastRun > (workflow.schedule.config.interval || 3600) * 1000;
        default:
          return false;
      }
    }
    
    return false;
  };

  const executeWorkflow = useCallback(async (workflow: WorkflowRule) => {
    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}`,
      workflowId: workflow.id,
      status: 'running',
      startTime: new Date(),
      progress: 0,
      logs: []
    };

    setExecutions(prev => [execution, ...prev.slice(0, 19)]); // Keep last 20 executions

    try {
      // Simular execução do workflow
      execution.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `Iniciando workflow: ${workflow.name}`
      });

      // Verificar condições
      const conditionsMet = workflow.conditions.every(condition => {
        // Lógica simplificada de verificação de condições
        return true; // Assumir que todas as condições são atendidas para demo
      });

      if (!conditionsMet) {
        execution.status = 'completed';
        execution.progress = 100;
        execution.logs.push({
          timestamp: new Date(),
          level: 'info',
          message: 'Condições não atendidas, workflow não executado'
        });
        return;
      }

      // Executar ações
      for (let i = 0; i < workflow.actions.length; i++) {
        const action = workflow.actions[i];
        execution.progress = ((i + 1) / workflow.actions.length) * 100;

        await new Promise(resolve => setTimeout(resolve, action.delay || 500));

        await executeAction(action, execution);
      }

      execution.status = 'completed';
      execution.endTime = new Date();
      execution.progress = 100;

      // Atualizar estatísticas
      setWorkflows(prev => prev.map(w => 
        w.id === workflow.id 
          ? {
              ...w,
              stats: {
                ...w.stats,
                executions: w.stats.executions + 1,
                lastRun: new Date(),
                successRate: Math.round(((w.stats.successRate * w.stats.executions) + 100) / (w.stats.executions + 1)),
                avgExecutionTime: Math.round(((w.stats.avgExecutionTime * w.stats.executions) + (execution.endTime!.getTime() - execution.startTime.getTime())) / (w.stats.executions + 1))
              }
            }
          : w
      ));

      onNotification?.(`Workflow "${workflow.name}" executado com sucesso`, 'success');

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Erro na execução: ${error}`
      });

      onNotification?.(`Erro no workflow "${workflow.name}"`, 'error');
    }

    setExecutions(prev => prev.map(e => e.id === execution.id ? execution : e));
  }, [onNotification]);

  const executeAction = async (action: WorkflowAction, execution: WorkflowExecution) => {
    switch (action.type) {
      case 'add_tags':
        execution.logs.push({
          timestamp: new Date(),
          level: 'info',
          message: `Adicionando tags: ${action.config.tags?.join(', ') || 'auto-generated'}`
        });
        break;

      case 'create_backup':
        execution.logs.push({
          timestamp: new Date(),
          level: 'info',
          message: 'Criando backup dos arquivos importantes'
        });
        break;

      case 'send_notification':
        execution.logs.push({
          timestamp: new Date(),
          level: 'info',
          message: 'Enviando notificação'
        });
        break;

      case 'generate_summary':
        execution.logs.push({
          timestamp: new Date(),
          level: 'info',
          message: 'Gerando resumo automático'
        });
        break;

      case 'move_file':
        execution.logs.push({
          timestamp: new Date(),
          level: 'info',
          message: 'Organizando arquivo'
        });
        break;

      default:
        execution.logs.push({
          timestamp: new Date(),
          level: 'warning',
          message: `Ação não implementada: ${action.type}`
        });
    }
  };

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId ? { ...w, enabled: !w.enabled } : w
    ));
  };

  const runWorkflowManually = (workflow: WorkflowRule) => {
    executeWorkflow(workflow);
  };

  const workflowStats = useMemo(() => {
    const total = workflows.length;
    const enabled = workflows.filter(w => w.enabled).length;
    const totalExecutions = workflows.reduce((sum, w) => sum + w.stats.executions, 0);
    const avgSuccessRate = workflows.length > 0 
      ? Math.round(workflows.reduce((sum, w) => sum + w.stats.successRate, 0) / workflows.length)
      : 0;

    return { total, enabled, totalExecutions, avgSuccessRate };
  }, [workflows]);

  const getStatusIcon = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <Square className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionIcon = (type: WorkflowAction['type']) => {
    switch (type) {
      case 'add_tags': return <Tag className="h-3 w-3" />;
      case 'move_file': return <FileText className="h-3 w-3" />;
      case 'create_backup': return <RefreshCw className="h-3 w-3" />;
      case 'send_notification': return <Bell className="h-3 w-3" />;
      case 'generate_summary': return <Brain className="h-3 w-3" />;
      default: return <Settings className="h-3 w-3" />;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900">
                <Workflow className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Smart Workflow Engine</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automação inteligente para seu workspace
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Engine</span>
                <Switch
                  checked={isEngineRunning}
                  onCheckedChange={setIsEngineRunning}
                />
                <Badge variant={isEngineRunning ? 'default' : 'secondary'}>
                  {isEngineRunning ? 'Ativo' : 'Pausado'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Workflows</span>
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {workflowStats.enabled}/{workflowStats.total}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Execuções</span>
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                {workflowStats.totalExecutions}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Taxa de Sucesso</span>
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                {workflowStats.avgSuccessRate}%
              </div>
            </div>

            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Ativos</span>
              </div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                {executions.filter(e => e.status === 'running').length}
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="executions">Execuções</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="workflows" className="space-y-4">
              {workflows.map((workflow, index) => (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {workflow.name}
                        </h4>
                        <Switch
                          checked={workflow.enabled}
                          onCheckedChange={() => toggleWorkflow(workflow.id)}
                        />
                        <Badge variant={workflow.enabled ? 'default' : 'secondary'}>
                          {workflow.enabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {workflow.schedule && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {workflow.schedule.type}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {workflow.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          Execuções: {workflow.stats.executions}
                        </span>
                        <span>
                          Sucesso: {workflow.stats.successRate}%
                        </span>
                        {workflow.stats.lastRun && (
                          <span>
                            Última: {workflow.stats.lastRun.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {workflow.actions.map((action, i) => (
                          <Badge key={i} variant="outline" className="text-xs flex items-center gap-1">
                            {getActionIcon(action.type)}
                            {action.type.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runWorkflowManually(workflow)}
                        disabled={!isEngineRunning}
                        className="flex items-center gap-1"
                      >
                        <Play className="h-3 w-3" />
                        Executar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedWorkflow(workflow.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {workflow.stats.executions > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Performance</span>
                        <span>{workflow.stats.avgExecutionTime}ms avg</span>
                      </div>
                      <Progress value={workflow.stats.successRate} className="h-2" />
                    </div>
                  )}
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="executions" className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-3">
                {executions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Timer className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma execução registrada ainda</p>
                  </div>
                ) : (
                  executions.map((execution, index) => {
                    const workflow = workflows.find(w => w.id === execution.workflowId);
                    return (
                      <motion.div
                        key={execution.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(execution.status)}
                            <div>
                              <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                                {workflow?.name || 'Workflow não encontrado'}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {execution.startTime.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant={execution.status === 'completed' ? 'default' : 
                                   execution.status === 'failed' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {execution.status}
                          </Badge>
                        </div>
                        
                        {execution.status === 'running' && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Progresso</span>
                              <span>{Math.round(execution.progress)}%</span>
                            </div>
                            <Progress value={execution.progress} className="h-2" />
                          </div>
                        )}
                        
                        {execution.logs.length > 0 && (
                          <div className="space-y-1">
                            {execution.logs.slice(-3).map((log, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span className={cn(
                                  "w-2 h-2 rounded-full",
                                  log.level === 'error' ? 'bg-red-500' :
                                  log.level === 'warning' ? 'bg-yellow-500' :
                                  log.level === 'success' ? 'bg-green-500' : 'bg-blue-500'
                                )} />
                                <span className="text-gray-600 dark:text-gray-400">
                                  {log.message}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {execution.endTime && (
                          <div className="mt-2 text-xs text-gray-500">
                            Duração: {execution.endTime.getTime() - execution.startTime.getTime()}ms
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Execuções por Workflow
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {workflows.map(workflow => (
                        <div key={workflow.id} className="flex items-center justify-between">
                          <span className="text-sm">{workflow.name}</span>
                          <Badge variant="outline">{workflow.stats.executions}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Taxa de Sucesso Média</span>
                          <span>{workflowStats.avgSuccessRate}%</span>
                        </div>
                        <Progress value={workflowStats.avgSuccessRate} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Workflows Ativos</span>
                          <span>{Math.round((workflowStats.enabled / workflowStats.total) * 100)}%</span>
                        </div>
                        <Progress value={(workflowStats.enabled / workflowStats.total) * 100} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Configurações do Engine</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Auto-start Engine</label>
                      <p className="text-xs text-gray-500">Iniciar engine automaticamente</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Notificações</label>
                      <p className="text-xs text-gray-500">Receber notificações de execução</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Logs Detalhados</label>
                      <p className="text-xs text-gray-500">Salvar logs completos de execução</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações Avançadas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}; 