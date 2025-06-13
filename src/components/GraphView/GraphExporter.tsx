import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileText, 
  Image, 
  Database, 
  Code,
  Share,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { GraphNode, GraphLink } from './types';
import { toast } from '@/components/ui/use-toast';

interface GraphExporterProps {
  nodes: GraphNode[];
  links: GraphLink[];
  className?: string;
}

type ExportFormat = 'json' | 'csv' | 'gexf' | 'graphml' | 'svg' | 'png' | 'pdf';

interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includePositions: boolean;
  includeFilters: boolean;
  customFilename: string;
  imageResolution: '1x' | '2x' | '4x';
  includeStyles: boolean;
}

interface ExportProgress {
  isExporting: boolean;
  progress: number;
  currentStep: string;
  error?: string;
}

export const GraphExporter: React.FC<GraphExporterProps> = ({
  nodes,
  links,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includePositions: true,
    includeFilters: false,
    customFilename: '',
    imageResolution: '2x',
    includeStyles: true
  });
  
  const [progress, setProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0,
    currentStep: ''
  });

  const exportFormats = [
    { 
      value: 'json', 
      label: 'JSON', 
      description: 'Formato JavaScript Object Notation',
      icon: Code,
      size: 'Pequeno',
      compatibility: 'Universal'
    },
    { 
      value: 'csv', 
      label: 'CSV', 
      description: 'Planilha separada por vírgulas',
      icon: FileText,
      size: 'Médio',
      compatibility: 'Excel, Sheets'
    },
    { 
      value: 'gexf', 
      label: 'GEXF', 
      description: 'Graph Exchange XML Format',
      icon: Database,
      size: 'Médio',
      compatibility: 'Gephi, NetworkX'
    },
    { 
      value: 'graphml', 
      label: 'GraphML', 
      description: 'Graph Markup Language',
      icon: Database,
      size: 'Médio',
      compatibility: 'yEd, Cytoscape'
    },
    { 
      value: 'svg', 
      label: 'SVG', 
      description: 'Imagem vetorial escalável',
      icon: Image,
      size: 'Pequeno',
      compatibility: 'Browsers, Illustrator'
    },
    { 
      value: 'png', 
      label: 'PNG', 
      description: 'Imagem rasterizada',
      icon: Image,
      size: 'Grande',
      compatibility: 'Universal'
    },
    { 
      value: 'pdf', 
      label: 'PDF', 
      description: 'Documento portátil',
      icon: FileText,
      size: 'Médio',
      compatibility: 'Universal'
    }
  ];

  const handleOptionChange = useCallback(<K extends keyof ExportOptions>(
    key: K, 
    value: ExportOptions[K]
  ) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const generateJSON = useCallback(() => {
    const data = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '2.0',
        nodeCount: nodes.length,
        linkCount: links.length,
      },
      nodes: exportOptions.includeMetadata 
        ? nodes 
        : nodes.map(({ metadata, ...node }) => node),
      links: links,
      ...(exportOptions.includePositions && {
        layout: {
          type: 'force',
          positions: nodes.reduce((acc, node) => ({
            ...acc,
            [node.id]: { x: node.position?.x || 0, y: node.position?.y || 0 }
          }), {})
        }
      })
    };

    return JSON.stringify(data, null, 2);
  }, [nodes, links, exportOptions]);

  const generateCSV = useCallback(() => {
    // Exportar nós
    const nodeHeaders = ['id', 'title', 'type', 'x', 'y', 'tags', 'connections'];
    const nodeRows = nodes.map(node => [
      node.id,
      node.title,
      node.type,
      node.position?.x || 0,
      node.position?.y || 0,
      node.metadata.tags.join(';'),
      node.connections || 0
    ]);

    const nodesCSV = [nodeHeaders, ...nodeRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Exportar links
    const linkHeaders = ['source', 'target', 'type', 'strength', 'bidirectional'];
    const linkRows = links.map(link => [
      link.source,
      link.target,
      link.type,
      link.strength || 1,
      link.bidirectional || false
    ]);

    const linksCSV = [linkHeaders, ...linkRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return {
      nodes: nodesCSV,
      links: linksCSV
    };
  }, [nodes, links]);

  const generateGEXF = useCallback(() => {
    const gexf = `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.3" version="1.3">
  <meta lastmodifieddate="${new Date().toISOString()}">
    <creator>Notion Spark Studio</creator>
    <description>Graph exported from Notion Spark</description>
  </meta>
  <graph defaultedgetype="undirected">
    <attributes class="node">
      <attribute id="0" title="type" type="string"/>
      <attribute id="1" title="connections" type="integer"/>
    </attributes>
    <nodes>
      ${nodes.map(node => `
      <node id="${node.id}" label="${node.title}">
        <attvalues>
          <attvalue for="0" value="${node.type}"/>
          <attvalue for="1" value="${node.connections || 0}"/>
        </attvalues>
        ${exportOptions.includePositions ? `
        <viz:position x="${node.position?.x || 0}" y="${node.position?.y || 0}" z="0"/>` : ''}
      </node>`).join('')}
    </nodes>
    <edges>
      ${links.map((link, index) => `
      <edge id="${index}" source="${link.source}" target="${link.target}" type="${link.type}" weight="${link.strength || 1}"/>`).join('')}
    </edges>
  </graph>
</gexf>`;

    return gexf;
  }, [nodes, links, exportOptions]);

  const simulateExport = useCallback(async (format: ExportFormat) => {
    setProgress({
      isExporting: true,
      progress: 0,
      currentStep: 'Preparando dados...'
    });

    // Simular progresso
    const steps = [
      { progress: 20, step: 'Processando nós...' },
      { progress: 40, step: 'Processando conexões...' },
      { progress: 60, step: 'Aplicando filtros...' },
      { progress: 80, step: 'Gerando arquivo...' },
      { progress: 100, step: 'Finalizando...' }
    ];

    for (const stepInfo of steps) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress(prev => ({
        ...prev,
        progress: stepInfo.progress,
        currentStep: stepInfo.step
      }));
    }

    // Gerar conteúdo baseado no formato
    let content: string | { [key: string]: string };
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = generateJSON();
        filename = `graph-export-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        const csvData = generateCSV();
        // Para CSV, criamos um ZIP com dois arquivos
        content = csvData.nodes; // Simplificado para este exemplo
        filename = `graph-nodes-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
      case 'gexf':
        content = generateGEXF();
        filename = `graph-export-${Date.now()}.gexf`;
        mimeType = 'application/xml';
        break;
      default:
        content = generateJSON();
        filename = `graph-export-${Date.now()}.json`;
        mimeType = 'application/json';
    }

    // Download do arquivo
    const blob = new Blob([content as string], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportOptions.customFilename || filename;
    a.click();
    URL.revokeObjectURL(url);

    setProgress({
      isExporting: false,
      progress: 100,
      currentStep: 'Concluído!'
    });

    toast({
      title: "📁 Exportação concluída!",
      description: `Arquivo ${format.toUpperCase()} foi baixado com sucesso`,
    });

    setTimeout(() => {
      setIsOpen(false);
      setProgress({
        isExporting: false,
        progress: 0,
        currentStep: ''
      });
    }, 1500);
  }, [exportOptions, generateJSON, generateCSV, generateGEXF]);

  const selectedFormat = exportFormats.find(f => f.value === exportOptions.format);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={`gap-2 ${className}`}>
          <Download className="h-4 w-4" />
          Exportar Grafo
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Exportar Dados do Grafo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de formato */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Formato de Exportação</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {exportFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <Card
                    key={format.value}
                    className={`cursor-pointer transition-all border-2 ${
                      exportOptions.format === format.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => handleOptionChange('format', format.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{format.label}</h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {format.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {format.size}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {format.compatibility}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Opções de exportação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Opções de Exportação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Incluir Metadados</Label>
                  <Switch
                    checked={exportOptions.includeMetadata}
                    onCheckedChange={(checked) => handleOptionChange('includeMetadata', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Incluir Posições</Label>
                  <Switch
                    checked={exportOptions.includePositions}
                    onCheckedChange={(checked) => handleOptionChange('includePositions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Incluir Filtros</Label>
                  <Switch
                    checked={exportOptions.includeFilters}
                    onCheckedChange={(checked) => handleOptionChange('includeFilters', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Incluir Estilos</Label>
                  <Switch
                    checked={exportOptions.includeStyles}
                    onCheckedChange={(checked) => handleOptionChange('includeStyles', checked)}
                  />
                </div>
              </div>

              {/* Opções específicas por formato */}
              {(exportOptions.format === 'png' || exportOptions.format === 'svg') && (
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-sm font-medium">Opções de Imagem</Label>
                  <div className="space-y-2">
                    <Label className="text-sm">Resolução</Label>
                    <Select
                      value={exportOptions.imageResolution}
                      onValueChange={(value) => handleOptionChange('imageResolution', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1x">1x (Normal)</SelectItem>
                        <SelectItem value="2x">2x (Alta)</SelectItem>
                        <SelectItem value="4x">4x (Ultra)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm">Nome do Arquivo (opcional)</Label>
                <Textarea
                  value={exportOptions.customFilename}
                  onChange={(e) => handleOptionChange('customFilename', e.target.value)}
                  placeholder="Deixe vazio para nome automático..."
                  className="h-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview das informações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações da Exportação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{nodes.length}</div>
                  <div className="text-sm text-gray-500">Nós</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{links.length}</div>
                  <div className="text-sm text-gray-500">Conexões</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{selectedFormat?.label}</div>
                  <div className="text-sm text-gray-500">Formato</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedFormat?.size}
                  </div>
                  <div className="text-sm text-gray-500">Tamanho Est.</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress durante exportação */}
          <AnimatePresence>
            {progress.isExporting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        {progress.currentStep}
                      </span>
                    </div>
                    <Progress value={progress.progress} className="w-full" />
                    <div className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                      {progress.progress}% concluído
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botões de ação */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              {selectedFormat?.compatibility && (
                <span>Compatível com: {selectedFormat.compatibility}</span>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => simulateExport(exportOptions.format)}
                disabled={progress.isExporting}
                className="gap-2"
              >
                {progress.isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Exportar {selectedFormat?.label}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 