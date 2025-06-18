import { useState, useEffect, useCallback } from 'react';

interface TemplateMetric {
  id: string;
  name: string;
  category: string;
  usageCount: number;
  lastUsed: string;
  averageContentLength: number;
}

interface UseTemplateMetricsReturn {
  metrics: TemplateMetric[];
  trackTemplateUsage: (templateId: string, templateName: string, category: string, contentLength: number) => void;
  getMostUsedTemplates: (limit?: number) => TemplateMetric[];
  getTemplatesByCategory: (category: string) => TemplateMetric[];
  getTotalUsage: () => number;
  getUsageByCategory: () => Record<string, number>;
  resetMetrics: () => void;
}

const STORAGE_KEY = 'notion-spark-template-metrics';

export function useTemplateMetrics(): UseTemplateMetricsReturn {
  const [metrics, setMetrics] = useState<TemplateMetric[]>([]);

  // Carregar métricas do localStorage na inicialização
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedMetrics = JSON.parse(stored);
        setMetrics(parsedMetrics);
      }
    } catch (error) {
      console.warn('Erro ao carregar métricas de templates:', error);
    }
  }, []);

  // Salvar métricas no localStorage sempre que mudarem
  useEffect(() => {
    if (metrics.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
      } catch (error) {
        console.warn('Erro ao salvar métricas de templates:', error);
      }
    }
  }, [metrics]);

  const trackTemplateUsage = useCallback((
    templateId: string, 
    templateName: string, 
    category: string, 
    contentLength: number
  ) => {
    setMetrics(currentMetrics => {
      const existingIndex = currentMetrics.findIndex(m => m.id === templateId);
      const now = new Date().toISOString();

      if (existingIndex >= 0) {
        // Atualizar métrica existente
        const updated = [...currentMetrics];
        const existing = updated[existingIndex];
        const newUsageCount = existing.usageCount + 1;
        const newAverageLength = Math.round(
          (existing.averageContentLength * existing.usageCount + contentLength) / newUsageCount
        );

        updated[existingIndex] = {
          ...existing,
          usageCount: newUsageCount,
          lastUsed: now,
          averageContentLength: newAverageLength
        };

        return updated;
      } else {
        // Criar nova métrica
        const newMetric: TemplateMetric = {
          id: templateId,
          name: templateName,
          category,
          usageCount: 1,
          lastUsed: now,
          averageContentLength: contentLength
        };

        return [...currentMetrics, newMetric];
      }
    });
  }, []);

  const getMostUsedTemplates = useCallback((limit = 5) => {
    return [...metrics]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }, [metrics]);

  const getTemplatesByCategory = useCallback((category: string) => {
    return metrics.filter(m => m.category === category);
  }, [metrics]);

  const getTotalUsage = useCallback(() => {
    return metrics.reduce((total, metric) => total + metric.usageCount, 0);
  }, [metrics]);

  const getUsageByCategory = useCallback(() => {
    return metrics.reduce<Record<string, number>>((acc, metric) => {
      acc[metric.category] = (acc[metric.category] || 0) + metric.usageCount;
      return acc;
    }, {});
  }, [metrics]);

  const resetMetrics = useCallback(() => {
    setMetrics([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    metrics,
    trackTemplateUsage,
    getMostUsedTemplates,
    getTemplatesByCategory,
    getTotalUsage,
    getUsageByCategory,
    resetMetrics
  };
} 