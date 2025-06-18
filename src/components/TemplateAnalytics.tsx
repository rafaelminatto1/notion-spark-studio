import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  FileText,
  X,
  RefreshCw,
  Download,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTemplateMetrics } from '@/hooks/useTemplateMetrics';

interface TemplateAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const TemplateAnalytics: React.FC<TemplateAnalyticsProps> = ({
  isOpen,
  onClose,
  className
}) => {
  const {
    metrics,
    getMostUsedTemplates,
    getTotalUsage,
    getUsageByCategory,
    resetMetrics
  } = useTemplateMetrics();

  const [viewMode, setViewMode] = useState<'overview' | 'categories' | 'templates'>('overview');

  if (!isOpen) return null;

  const totalUsage = getTotalUsage();
  const mostUsed = getMostUsedTemplates(5);
  const usageByCategory = getUsageByCategory();
  const categories = Object.keys(usageByCategory);

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalUsage,
      metrics,
      usageByCategory
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-6xl max-h-[90vh] m-4 bg-gradient-to-br from-background via-background/95 to-background border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Analytics de Templates</h2>
              <p className="text-sm text-gray-400">Insights sobre o uso de templates</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={exportData}
              variant="ghost"
              size="sm"
              className="gap-2 text-blue-400 hover:text-blue-300"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button
              onClick={resetMetrics}
              variant="ghost"
              size="sm"
              className="gap-2 text-red-400 hover:text-red-300"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="rounded-full p-2 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-white/10 bg-workspace-surface/30">
          <Button
            onClick={() => { setViewMode('overview'); }}
            variant={viewMode === 'overview' ? 'default' : 'ghost'}
            className="rounded-none border-b-2 border-transparent data-[active=true]:border-purple-500"
            data-active={viewMode === 'overview'}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Visão Geral
          </Button>
          <Button
            onClick={() => { setViewMode('categories'); }}
            variant={viewMode === 'categories' ? 'default' : 'ghost'}
            className="rounded-none border-b-2 border-transparent data-[active=true]:border-purple-500"
            data-active={viewMode === 'categories'}
          >
            <FileText className="h-4 w-4 mr-2" />
            Categorias
          </Button>
          <Button
            onClick={() => { setViewMode('templates'); }}
            variant={viewMode === 'templates' ? 'default' : 'ghost'}
            className="rounded-none border-b-2 border-transparent data-[active=true]:border-purple-500"
            data-active={viewMode === 'templates'}
          >
            <Clock className="h-4 w-4 mr-2" />
            Templates
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          
          {/* Overview */}
          {viewMode === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{totalUsage}</h3>
                      <p className="text-sm text-gray-400">Templates Utilizados</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-8 w-8 text-purple-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{metrics.length}</h3>
                      <p className="text-sm text-gray-400">Templates Únicos</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-green-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{categories.length}</h3>
                      <p className="text-sm text-gray-400">Categorias Ativas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Most Used Templates */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">📊 Templates Mais Utilizados</h3>
                <div className="space-y-2">
                  {mostUsed.map((template, index) => (
                    <div 
                      key={template.id}
                      className="flex items-center justify-between p-3 bg-workspace-surface/50 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{template.name}</h4>
                          <p className="text-xs text-gray-400">{template.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-purple-400">{template.usageCount}x</p>
                        <p className="text-xs text-gray-400">
                          {formatDate(template.lastUsed)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Categories View */}
          {viewMode === 'categories' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">📁 Uso por Categoria</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(category => {
                  const count = usageByCategory[category];
                  const percentage = totalUsage > 0 ? (count / totalUsage) * 100 : 0;
                  
                  return (
                    <div key={category} className="p-4 bg-workspace-surface/50 border border-white/10 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">{category}</h4>
                        <span className="text-sm text-purple-400">{count}x</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{percentage.toFixed(1)}% do total</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Templates Detail View */}
          {viewMode === 'templates' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">📋 Detalhes dos Templates</h3>
              <div className="space-y-3">
                {metrics
                  .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
                  .map(template => (
                    <div 
                      key={template.id}
                      className="p-4 bg-workspace-surface/50 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{template.name}</h4>
                          <p className="text-sm text-gray-400">{template.category}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>📊 {template.usageCount} usos</span>
                            <span>📝 {template.averageContentLength} chars médio</span>
                            <span>🕒 {formatDate(template.lastUsed)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold">{template.usageCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {metrics.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum dado ainda</h3>
              <p className="text-gray-400">Comece a usar templates para ver as métricas aqui</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
