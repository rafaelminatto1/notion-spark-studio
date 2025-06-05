
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Wrench,
  FileText,
  HardDrive,
  Clock
} from 'lucide-react';
import { FileItem } from '@/types';
import { useDataIntegrity } from '@/hooks/useDataIntegrity';
import { useBackupSystem } from '@/hooks/useBackupSystem';

interface HealthDashboardProps {
  files: FileItem[];
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  files,
  onUpdateFile
}) => {
  const { 
    validateFileStructure, 
    fixAutomaticIssues, 
    cleanOrphanedData,
    generateHealthReport 
  } = useDataIntegrity();
  
  const {
    backups,
    createBackup,
    getBackupStats,
    autoBackupEnabled,
    setAutoBackupEnabled
  } = useBackupSystem(files);

  const [healthReport, setHealthReport] = useState<any>(null);
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    const report = generateHealthReport(files);
    setHealthReport(report);
  }, [files, generateHealthReport]);

  const handleAutoFix = async () => {
    if (!healthReport) return;
    
    setIsFixing(true);
    
    try {
      // Criar backup antes de fazer correções
      await createBackup();
      
      // Aplicar correções automáticas
      const fixedCount = fixAutomaticIssues(files, healthReport.issues);
      const cleanedFiles = cleanOrphanedData(files);
      
      // Atualizar arquivos
      cleanedFiles.forEach(file => {
        onUpdateFile(file.id, file);
      });
      
      // Gerar novo relatório
      const newReport = generateHealthReport(cleanedFiles);
      setHealthReport(newReport);
      
      console.log(`${fixedCount} problemas corrigidos automaticamente`);
    } catch (error) {
      console.error('Erro ao aplicar correções:', error);
    } finally {
      setIsFixing(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'good': return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'fair': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const backupStats = getBackupStats();

  if (!healthReport) {
    return <div>Carregando análise...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Health Dashboard</h3>
        <div className="flex items-center gap-2">
          {getHealthIcon(healthReport.health)}
          <span className={`font-medium ${getHealthColor(healthReport.health)}`}>
            Status: {healthReport.health}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Geral */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Integridade dos Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Problemas encontrados:</span>
              <Badge variant={healthReport.summary.total > 0 ? "destructive" : "secondary"}>
                {healthReport.summary.total}
              </Badge>
            </div>
            
            {healthReport.summary.total > 0 && (
              <div className="space-y-1">
                {healthReport.summary.critical > 0 && (
                  <div className="flex justify-between text-xs">
                    <span>Críticos:</span>
                    <span className="text-red-600">{healthReport.summary.critical}</span>
                  </div>
                )}
                {healthReport.summary.high > 0 && (
                  <div className="flex justify-between text-xs">
                    <span>Altos:</span>
                    <span className="text-orange-600">{healthReport.summary.high}</span>
                  </div>
                )}
                {healthReport.summary.medium > 0 && (
                  <div className="flex justify-between text-xs">
                    <span>Médios:</span>
                    <span className="text-yellow-600">{healthReport.summary.medium}</span>
                  </div>
                )}
              </div>
            )}

            {healthReport.summary.total > 0 && (
              <Button 
                size="sm" 
                onClick={handleAutoFix}
                disabled={isFixing}
                className="w-full"
              >
                <Wrench className="h-3 w-3 mr-1" />
                {isFixing ? 'Corrigindo...' : 'Corrigir Automaticamente'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas dos Arquivos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>Total de arquivos:</span>
              </div>
              <span className="font-medium">{healthReport.stats.totalFiles}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                <span>Tamanho total:</span>
              </div>
              <span className="font-medium">{healthReport.stats.totalSize}KB</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Com conteúdo:</span>
              <span className="font-medium">{healthReport.stats.filesWithContent}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Pastas:</span>
              <span className="font-medium">{healthReport.stats.folders}</span>
            </div>
          </CardContent>
        </Card>

        {/* Status dos Backups */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Sistema de Backup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Backups:</span>
              </div>
              <span className="font-medium">{backupStats.totalBackups}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Tamanho total:</span>
              <span className="font-medium">{backupStats.totalSize}KB</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Auto-backup:</span>
              <Badge variant={autoBackupEnabled ? "default" : "secondary"}>
                {autoBackupEnabled ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            <Button 
              size="sm" 
              variant="outline"
              onClick={() => createBackup()}
              className="w-full"
            >
              Criar Backup Manual
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Problemas */}
      {healthReport.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Problemas Detectados</CardTitle>
            <CardDescription>
              Lista detalhada dos problemas encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {healthReport.issues.slice(0, 10).map((issue: any, index: number) => (
                <div key={index} className="flex items-start gap-2 text-sm p-2 bg-muted rounded">
                  <AlertTriangle className={`h-3 w-3 mt-0.5 ${
                    issue.severity === 'critical' ? 'text-red-600' :
                    issue.severity === 'high' ? 'text-orange-600' :
                    issue.severity === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium">{issue.message}</div>
                    <div className="text-xs text-muted-foreground">
                      Arquivo: {files.find(f => f.id === issue.fileId)?.name || 'Desconhecido'}
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      issue.severity === 'critical' ? 'border-red-600 text-red-600' :
                      issue.severity === 'high' ? 'border-orange-600 text-orange-600' :
                      issue.severity === 'medium' ? 'border-yellow-600 text-yellow-600' :
                      'border-blue-600 text-blue-600'
                    }`}
                  >
                    {issue.severity}
                  </Badge>
                </div>
              ))}
              
              {healthReport.issues.length > 10 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  ... e mais {healthReport.issues.length - 10} problema(s)
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
