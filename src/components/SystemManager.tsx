
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Save, 
  Download, 
  Upload, 
  History, 
  Shield, 
  Zap, 
  FileText,
  AlertTriangle,
  Info,
  Clock,
  HardDrive,
  Activity
} from 'lucide-react';
import { FileItem } from '@/types';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useImportExport } from '@/hooks/useImportExport';
import { useVersionHistory } from '@/hooks/useVersionHistory';
import { useValidation } from '@/hooks/useValidation';
import { usePerformance } from '@/hooks/usePerformance';
import { HealthDashboard } from './HealthDashboard';

interface SystemManagerProps {
  files: FileItem[];
  currentFile?: FileItem;
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void;
  onCreateFile: (name: string, parentId?: string, type?: 'file' | 'folder') => Promise<string>;
}

export const SystemManager: React.FC<SystemManagerProps> = ({
  files,
  currentFile,
  onUpdateFile,
  onCreateFile
}) => {
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  const { forceSave, getTimeSinceLastSave } = useAutoSave({
    file: currentFile,
    onUpdateFile,
    enabled: autoSaveEnabled
  });

  const { exportFiles, exportAsMarkdown, importFiles } = useImportExport(
    files,
    onCreateFile,
    onUpdateFile
  );

  const { 
    versions, 
    addVersion, 
    restoreVersion, 
    getVersionStats,
    isEnabled: versioningEnabled,
    setIsEnabled: setVersioningEnabled
  } = useVersionHistory(currentFile?.id || null);

  const { validateFile, validateMultipleFiles } = useValidation();
  const { metrics, getPerformanceRecommendations } = usePerformance(files);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importFiles(file);
    }
  };

  const currentFileValidation = currentFile ? validateFile(currentFile) : null;
  const multipleValidation = validateMultipleFiles(files);
  const versionStats = getVersionStats();
  const recommendations = getPerformanceRecommendations();

  return (
    <div className="p-6 space-y-6 bg-background">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciamento do Sistema</h2>
        <Badge variant="secondary">
          {files.length} arquivo(s)
        </Badge>
      </div>

      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="autosave">Auto-save</TabsTrigger>
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          <TabsTrigger value="versions">Versões</TabsTrigger>
          <TabsTrigger value="validation">Validação</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health Check
              </CardTitle>
              <CardDescription>
                Monitoramento da integridade e saúde do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HealthDashboard
                files={files}
                onUpdateFile={onUpdateFile}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="autosave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Auto-save
              </CardTitle>
              <CardDescription>
                Salvamento automático dos arquivos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Habilitar auto-save</span>
                <Switch
                  checked={autoSaveEnabled}
                  onCheckedChange={setAutoSaveEnabled}
                />
              </div>
              
              {currentFile && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Arquivo atual: {currentFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Último save: {getTimeSinceLastSave()}s atrás
                  </p>
                  <Button onClick={forceSave} size="sm">
                    Salvar agora
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import-export" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => exportFiles({
                    includeMetadata: true,
                    format: 'json',
                    includeMedia: false
                  })} 
                  className="w-full"
                >
                  Exportar todos os arquivos
                </Button>
                {currentFile && (
                  <Button 
                    onClick={() => exportAsMarkdown(currentFile.id)} 
                    variant="outline" 
                    className="w-full"
                  >
                    Exportar como Markdown
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Versões
              </CardTitle>
              <CardDescription>
                {versionStats.totalVersions} versão(ões) salva(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Habilitar versionamento</span>
                <Switch
                  checked={versioningEnabled}
                  onCheckedChange={setVersioningEnabled}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Tamanho total: {Math.round(versionStats.totalSize / 1024)}KB
                </p>
                <p className="text-sm text-muted-foreground">
                  Tamanho médio: {versionStats.avgSize} bytes
                </p>
              </div>

              {currentFile && versions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Versões do arquivo atual:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {versions.slice(0, 5).map((version) => (
                      <div key={version.id} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                        <span>{version.timestamp.toLocaleString()}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const content = restoreVersion(version.id);
                            if (content && currentFile) {
                              onUpdateFile(currentFile.id, { content });
                            }
                          }}
                        >
                          Restaurar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Validação
              </CardTitle>
              <CardDescription>
                {multipleValidation.validFiles}/{multipleValidation.totalFiles} arquivos válidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm">
                    {multipleValidation.filesWithErrors.length} erro(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm">
                    {multipleValidation.filesWithWarnings.length} aviso(s)
                  </span>
                </div>
              </div>

              {currentFile && currentFileValidation && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Arquivo atual:</h4>
                  {!currentFileValidation.isValid && (
                    <div className="space-y-1">
                      {currentFileValidation.errors.map((error, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          {error.message}
                        </div>
                      ))}
                      {currentFileValidation.warnings.map((warning, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-warning">
                          <AlertTriangle className="h-3 w-3" />
                          {warning.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance
              </CardTitle>
              <CardDescription>
                Métricas e otimizações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Tempo de render: {metrics.renderTime.toFixed(1)}ms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Arquivos: {metrics.fileCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-sm">Tamanho médio: {metrics.averageFileSize} bytes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-sm">Memória: {metrics.memoryUsage}MB</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Maiores arquivos:</h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {metrics.largestFiles.slice(0, 3).map(({ file, size }) => (
                      <div key={file.id} className="text-xs flex justify-between">
                        <span className="truncate">{file.name}</span>
                        <span>{Math.round(size / 1024)}KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recomendações:</h4>
                  <div className="space-y-1">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="h-3 w-3" />
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
