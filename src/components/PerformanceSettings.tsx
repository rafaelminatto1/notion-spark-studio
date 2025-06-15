import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Settings, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface PerformanceThresholds {
  fps: { warning: number; error: number };
  memoryUsage: { warning: number; error: number };
  renderTime: { warning: number; error: number };
  networkLatency: { warning: number; error: number };
  componentRenderTime: { warning: number; error: number };
}

interface PerformanceSettingsProps {
  thresholds: PerformanceThresholds;
  onThresholdsChange: (thresholds: PerformanceThresholds) => void;
  autoOptimization: boolean;
  onAutoOptimizationChange: (enabled: boolean) => void;
  alertsEnabled: boolean;
  onAlertsEnabledChange: (enabled: boolean) => void;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fps: { warning: 30, error: 20 },
  memoryUsage: { warning: 70, error: 85 },
  renderTime: { warning: 16, error: 32 },
  networkLatency: { warning: 100, error: 200 },
  componentRenderTime: { warning: 16, error: 32 }
};

export const PerformanceSettings: React.FC<PerformanceSettingsProps> = ({
  thresholds,
  onThresholdsChange,
  autoOptimization,
  onAutoOptimizationChange,
  alertsEnabled,
  onAlertsEnabledChange
}) => {
  const [localThresholds, setLocalThresholds] = useState<PerformanceThresholds>(thresholds);
  const [hasChanges, setHasChanges] = useState(false);

  const handleThresholdChange = (
    metric: keyof PerformanceThresholds,
    type: 'warning' | 'error',
    value: number
  ) => {
    const newThresholds = {
      ...localThresholds,
      [metric]: {
        ...localThresholds[metric],
        [type]: value
      }
    };

    setLocalThresholds(newThresholds);
    setHasChanges(true);
  };

  const handleSave = () => {
    onThresholdsChange(localThresholds);
    setHasChanges(false);
    toast.success('Configurações de performance salvas com sucesso!');
  };

  const handleReset = () => {
    setLocalThresholds(DEFAULT_THRESHOLDS);
    setHasChanges(true);
    toast.info('Configurações resetadas para os valores padrão');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Configurações de Performance</h3>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(localThresholds).map(([metric, values]) => (
            <div key={metric} className="space-y-3">
              <Label className="text-sm font-medium capitalize">
                {metric === 'fps' ? 'FPS' : 
                 metric === 'memoryUsage' ? 'Uso de Memória' :
                 metric === 'renderTime' ? 'Tempo de Renderização' :
                 metric === 'networkLatency' ? 'Latência de Rede' :
                 'Tempo de Renderização de Componente'}
              </Label>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-yellow-600 w-12">Aviso:</span>
                  <input
                    type="number"
                    value={values.warning}
                    onChange={(e) => handleThresholdChange(
                      metric as keyof PerformanceThresholds,
                      'warning',
                      Number(e.target.value)
                    )}
                    className="flex-1 px-2 py-1 text-xs border rounded"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-red-600 w-12">Erro:</span>
                  <input
                    type="number"
                    value={values.error}
                    onChange={(e) => handleThresholdChange(
                      metric as keyof PerformanceThresholds,
                      'error',
                      Number(e.target.value)
                    )}
                    className="flex-1 px-2 py-1 text-xs border rounded"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Alertas em Tempo Real</Label>
              <p className="text-xs text-gray-500">
                Exibir notificações quando limites forem ultrapassados
              </p>
            </div>
            <Switch
              checked={alertsEnabled}
              onCheckedChange={onAlertsEnabledChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Otimização Automática</Label>
              <p className="text-xs text-gray-500">
                Aplicar otimizações automaticamente quando possível
              </p>
            </div>
            <Switch
              checked={autoOptimization}
              onCheckedChange={onAutoOptimizationChange}
            />
          </div>
        </div>

        {hasChanges && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Você tem alterações não salvas. Clique em "Salvar" para aplicá-las.
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}; 