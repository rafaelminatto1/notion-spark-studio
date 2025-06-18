import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Palette, 
  Zap, 
  Eye, 
  Cpu, 
  Network,
  RotateCcw,
  Save,
  Download,
  Upload,
  Monitor,
  Smartphone
} from 'lucide-react';
import type { LayoutSettings, GraphFilters } from './types';
import { toast } from '@/components/ui/use-toast';

interface GraphSettingsProps {
  layoutSettings: LayoutSettings;
  onLayoutSettingsChange: (settings: LayoutSettings) => void;
  filters: GraphFilters;
  onFiltersChange: (filters: GraphFilters) => void;
  className?: string;
}

interface AdvancedSettings {
  performance: {
    enableVirtualization: boolean;
    maxVisibleNodes: number;
    enableWebGL: boolean;
    frameRate: number;
    enableLOD: boolean;
  };
  visual: {
    enableAnimations: boolean;
    animationSpeed: number;
    nodeGlowEffect: boolean;
    edgeGlowEffect: boolean;
    particleSystem: boolean;
    colorScheme: 'default' | 'dark' | 'neon' | 'pastel' | 'high-contrast';
  };
  interaction: {
    enableHaptics: boolean;
    enableSounds: boolean;
    dragSensitivity: number;
    zoomSensitivity: number;
    enableGestures: boolean;
  };
  ai: {
    enableSmartLayout: boolean;
    enableCommunityDetection: boolean;
    enablePathSuggestions: boolean;
    enableSemanticClustering: boolean;
  };
}

export const GraphSettings: React.FC<GraphSettingsProps> = ({
  layoutSettings,
  onLayoutSettingsChange,
  filters,
  onFiltersChange,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'visual' | 'performance' | 'ai'>('layout');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    performance: {
      enableVirtualization: true,
      maxVisibleNodes: 1000,
      enableWebGL: false,
      frameRate: 60,
      enableLOD: true,
    },
    visual: {
      enableAnimations: true,
      animationSpeed: 1,
      nodeGlowEffect: true,
      edgeGlowEffect: false,
      particleSystem: false,
      colorScheme: 'default',
    },
    interaction: {
      enableHaptics: true,
      enableSounds: false,
      dragSensitivity: 1,
      zoomSensitivity: 1,
      enableGestures: true,
    },
    ai: {
      enableSmartLayout: true,
      enableCommunityDetection: true,
      enablePathSuggestions: true,
      enableSemanticClustering: false,
    },
  });

  const handleLayoutChange = useCallback((key: keyof LayoutSettings, value: any) => {
    onLayoutSettingsChange({
      ...layoutSettings,
      [key]: value
    });
  }, [layoutSettings, onLayoutSettingsChange]);

  const handleAdvancedChange = useCallback((category: keyof AdvancedSettings, key: string, value: any) => {
    setAdvancedSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  }, []);

  const handleReset = useCallback(() => {
    onLayoutSettingsChange({
      type: 'force',
      forceStrength: 1,
      linkDistance: 120,
      collisionRadius: 15,
      centeringStrength: 0.3,
      physics: true,
    });
    
    toast({
      title: "⚙️ Configurações resetadas!",
      description: "Todas as configurações foram restauradas para o padrão",
    });
  }, [onLayoutSettingsChange]);

  const handleExportSettings = useCallback(() => {
    const settings = {
      layout: layoutSettings,
      advanced: advancedSettings,
      filters,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graph-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "💾 Configurações exportadas!",
      description: "Arquivo de configurações foi baixado",
    });
  }, [layoutSettings, advancedSettings, filters]);

  const colorSchemes = [
    { value: 'default', label: 'Padrão', color: '#3b82f6' },
    { value: 'dark', label: 'Escuro', color: '#1f2937' },
    { value: 'neon', label: 'Neon', color: '#8b5cf6' },
    { value: 'pastel', label: 'Pastel', color: '#f472b6' },
    { value: 'high-contrast', label: 'Alto Contraste', color: '#ffffff' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Configurações do Grafo
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Personalize visualização, performance e comportamento
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowAdvanced(!showAdvanced); }}
            className="gap-2"
          >
            <Cpu className="h-4 w-4" />
            {showAdvanced ? 'Simples' : 'Avançado'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSettings}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <Separator />

      {/* Configurações básicas */}
      <AnimatePresence mode="wait">
        {!showAdvanced ? (
          <motion.div
            key="basic"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Layout */}
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Layout e Física
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Tipo de Layout</Label>
                    <Select 
                      value={layoutSettings.type} 
                      onValueChange={(value) => { handleLayoutChange('type', value); }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="force">Força</SelectItem>
                        <SelectItem value="circular">Circular</SelectItem>
                        <SelectItem value="hierarchical">Hierárquico</SelectItem>
                        <SelectItem value="grid">Grade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Física</Label>
                      <Switch 
                        checked={layoutSettings.physics} 
                        onCheckedChange={(checked) => { handleLayoutChange('physics', checked); }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">
                      Força de Repulsão: {layoutSettings.forceStrength}
                    </Label>
                    <Slider
                      value={[layoutSettings.forceStrength]}
                      onValueChange={([value]) => { handleLayoutChange('forceStrength', value); }}
                      min={0.1}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">
                      Distância dos Links: {layoutSettings.linkDistance}px
                    </Label>
                    <Slider
                      value={[layoutSettings.linkDistance]}
                      onValueChange={([value]) => { handleLayoutChange('linkDistance', value); }}
                      min={50}
                      max={300}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">
                      Raio de Colisão: {layoutSettings.collisionRadius}px
                    </Label>
                    <Slider
                      value={[layoutSettings.collisionRadius]}
                      onValueChange={([value]) => { handleLayoutChange('collisionRadius', value); }}
                      min={5}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visual */}
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Aparência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm">Esquema de Cores</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {colorSchemes.map((scheme) => (
                      <button
                        key={scheme.value}
                        onClick={() => { handleAdvancedChange('visual', 'colorScheme', scheme.value); }}
                        className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                          advancedSettings.visual.colorScheme === scheme.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: scheme.color }}
                        />
                        <span className="text-sm font-medium">{scheme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Efeito Glow nos Nós</Label>
                  <Switch 
                    checked={advancedSettings.visual.nodeGlowEffect} 
                    onCheckedChange={(checked) => { handleAdvancedChange('visual', 'nodeGlowEffect', checked); }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Animações</Label>
                  <Switch 
                    checked={advancedSettings.visual.enableAnimations} 
                    onCheckedChange={(checked) => { handleAdvancedChange('visual', 'enableAnimations', checked); }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="advanced"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab as any} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="visual">Visual</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="ai">IA & Auto</TabsTrigger>
              </TabsList>

              <TabsContent value="layout" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Configurações de Layout Avançadas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Força de Centralização: {layoutSettings.centeringStrength}</Label>
                      <Slider
                        value={[layoutSettings.centeringStrength]}
                        onValueChange={([value]) => { handleLayoutChange('centeringStrength', value); }}
                        min={0}
                        max={1}
                        step={0.1}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visual" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Efeitos Visuais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Velocidade das Animações: {advancedSettings.visual.animationSpeed}x</Label>
                      <Slider
                        value={[advancedSettings.visual.animationSpeed]}
                        onValueChange={([value]) => { handleAdvancedChange('visual', 'animationSpeed', value); }}
                        min={0.1}
                        max={3}
                        step={0.1}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Sistema de Partículas</Label>
                      <Switch 
                        checked={advancedSettings.visual.particleSystem} 
                        onCheckedChange={(checked) => { handleAdvancedChange('visual', 'particleSystem', checked); }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Glow nas Conexões</Label>
                      <Switch 
                        checked={advancedSettings.visual.edgeGlowEffect} 
                        onCheckedChange={(checked) => { handleAdvancedChange('visual', 'edgeGlowEffect', checked); }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Otimização de Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Virtualização de Nós</Label>
                      <Switch 
                        checked={advancedSettings.performance.enableVirtualization} 
                        onCheckedChange={(checked) => { handleAdvancedChange('performance', 'enableVirtualization', checked); }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Máximo de Nós Visíveis: {advancedSettings.performance.maxVisibleNodes}</Label>
                      <Slider
                        value={[advancedSettings.performance.maxVisibleNodes]}
                        onValueChange={([value]) => { handleAdvancedChange('performance', 'maxVisibleNodes', value); }}
                        min={100}
                        max={5000}
                        step={100}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>WebGL (Experimental)</Label>
                      <Switch 
                        checked={advancedSettings.performance.enableWebGL} 
                        onCheckedChange={(checked) => { handleAdvancedChange('performance', 'enableWebGL', checked); }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Level of Detail (LOD)</Label>
                      <Switch 
                        checked={advancedSettings.performance.enableLOD} 
                        onCheckedChange={(checked) => { handleAdvancedChange('performance', 'enableLOD', checked); }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Inteligência Artificial</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Layout Inteligente</Label>
                        <p className="text-xs text-gray-500">IA otimiza automaticamente o layout</p>
                      </div>
                      <Switch 
                        checked={advancedSettings.ai.enableSmartLayout} 
                        onCheckedChange={(checked) => { handleAdvancedChange('ai', 'enableSmartLayout', checked); }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Detecção de Comunidades</Label>
                        <p className="text-xs text-gray-500">Identifica grupos relacionados</p>
                      </div>
                      <Switch 
                        checked={advancedSettings.ai.enableCommunityDetection} 
                        onCheckedChange={(checked) => { handleAdvancedChange('ai', 'enableCommunityDetection', checked); }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Sugestões de Caminhos</Label>
                        <p className="text-xs text-gray-500">Sugere conexões relevantes</p>
                      </div>
                      <Switch 
                        checked={advancedSettings.ai.enablePathSuggestions} 
                        onCheckedChange={(checked) => { handleAdvancedChange('ai', 'enablePathSuggestions', checked); }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Clustering Semântico</Label>
                        <p className="text-xs text-gray-500">Agrupa por similaridade de conteúdo</p>
                        <Badge variant="secondary" className="text-xs mt-1">Beta</Badge>
                      </div>
                      <Switch 
                        checked={advancedSettings.ai.enableSemanticClustering} 
                        onCheckedChange={(checked) => { handleAdvancedChange('ai', 'enableSemanticClustering', checked); }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 