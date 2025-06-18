import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Settings, Play, Pause, RotateCcw, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import type { GraphFilters } from './types';
import { cn } from '@/lib/utils';

interface GraphControlsProps {
  className?: string;
  onTogglePathFinding: () => void;
  pathFindingMode: boolean;
  onToggleAnalytics: () => void;
  onToggleLiveUpdates: () => void;
  liveUpdates: boolean;
  filters: GraphFilters;
  onFiltersChange: (filters: GraphFilters) => void;
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  layoutSettings: any;
  onLayoutSettingsChange: (settings: any) => void;
  showPathFinding: boolean;
  onShowPathFindingChange: (show: boolean) => void;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  layoutSettings,
  onLayoutSettingsChange,
  showPathFinding,
  onShowPathFindingChange
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    onFiltersChange({
      ...filters,
      searchQuery: '',
      tags: [],
      minConnections: 0,
      showOrphans: true,
    });
  };

  return (
    <motion.div 
      className="controls-panel absolute top-4 left-4 z-10 space-y-3"
      initial={{ opacity: 0, x: -30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card className="graph-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={filters.searchQuery}
                onChange={(e) => { onFiltersChange({ ...filters, searchQuery: e.target.value }); }}
                placeholder="🔍 Buscar arquivos, tags..."
                className="graph-search pl-10"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card className="graph-card p-3">
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                className="graph-button text-white p-2"
                title={isPlaying ? "Pausar simulação" : "Iniciar simulação"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { onShowPathFindingChange(!showPathFinding); }}
                className={cn(
                  "graph-button text-white p-2",
                  showPathFinding && "active"
                )}
                title="Modo pathfinding - encontre conexões entre arquivos"
              >
                <Target className="h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="graph-button text-white p-2"
                title="Resetar filtros"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowSettings(!showSettings); }}
                className={cn("graph-button text-white p-2", showSettings && "active")}
                title="Configurações avançadas"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="graph-card p-6 space-y-6 w-96">
            <h3 className="text-white font-medium">Configurações</h3>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Física Ativa</label>
              <Switch
                checked={layoutSettings.physics}
                onCheckedChange={(physics) => 
                  { onLayoutSettingsChange({ ...layoutSettings, physics }); }
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">
                Distância dos Links: {layoutSettings.linkDistance}
              </label>
              <Slider
                value={[layoutSettings.linkDistance]}
                onValueChange={([value]) => 
                  { onLayoutSettingsChange({ ...layoutSettings, linkDistance: value }); }
                }
                max={300}
                min={50}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Modo de Visualização</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { mode: 'force', label: '⚡ Force', description: 'Dinâmico baseado em física' },
                  { mode: 'hierarchical', label: '🌳 Hierárquico', description: 'Estrutura de árvore' },
                  { mode: 'circular', label: '🔄 Circular', description: 'Disposição em círculo' },
                  { mode: 'timeline', label: '📅 Timeline', description: 'Por data de modificação' },
                  { mode: 'cluster', label: '🎯 Clusters', description: 'Agrupamentos inteligentes' }
                ].map(({ mode, label, description }) => (
                  <motion.div key={mode} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant={viewMode === mode ? "default" : "outline"}
                      size="sm"
                      onClick={() => { onViewModeChange(mode); }}
                      className={cn(
                        "graph-button text-xs h-auto py-3 px-4 flex flex-col gap-1 w-full",
                        viewMode === mode && "active"
                      )}
                      title={description}
                    >
                      <span className="font-medium">{label}</span>
                      <span className="text-[10px] opacity-70 leading-none">{description}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Filtros</label>
              
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Conexões Mínimas: {filters.minConnections}</label>
                <Slider
                  value={[filters.minConnections]}
                  onValueChange={([value]) => 
                    { onFiltersChange({ ...filters, minConnections: value }); }
                  }
                  max={20}
                  min={0}
                  step={1}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-500">Mostrar Órfãos</label>
                <Switch
                  checked={filters.showOrphans}
                  onCheckedChange={(showOrphans) => 
                    { onFiltersChange({ ...filters, showOrphans }); }
                  }
                />
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}; 