import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Settings, Play, Pause, RotateCcw, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { GraphFilters } from './types';
import { cn } from '@/lib/utils';

interface GraphControlsProps {
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
      className="absolute top-4 left-4 z-10 space-y-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-3 bg-black/90 backdrop-blur-sm border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={filters.searchQuery}
              onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
              placeholder="Buscar nós..."
              className="pl-10 bg-black/50 border-white/20 text-white placeholder-gray-400"
            />
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-black/90 backdrop-blur-sm border-white/10">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPause}
            className="text-white hover:bg-white/10"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShowPathFindingChange(!showPathFinding)}
            className={cn(
              "text-white hover:bg-white/10",
              showPathFinding && "bg-blue-600/30 text-blue-200"
            )}
          >
            <Target className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-white hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className={cn("text-white hover:bg-white/10", showSettings && "bg-white/20")}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="p-4 bg-black/90 backdrop-blur-sm border-white/10 space-y-4 w-80">
            <h3 className="text-white font-medium">Configurações</h3>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Física Ativa</label>
              <Switch
                checked={layoutSettings.physics}
                onCheckedChange={(physics) => 
                  onLayoutSettingsChange({ ...layoutSettings, physics })
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
                  onLayoutSettingsChange({ ...layoutSettings, linkDistance: value })
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
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "outline"}
                    size="sm"
                    onClick={() => onViewModeChange(mode)}
                    className="text-xs h-auto py-2 px-3 flex flex-col gap-1"
                    title={description}
                  >
                    <span className="font-medium">{label}</span>
                    <span className="text-[10px] opacity-70 leading-none">{description}</span>
                  </Button>
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
                    onFiltersChange({ ...filters, minConnections: value })
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
                    onFiltersChange({ ...filters, showOrphans })
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