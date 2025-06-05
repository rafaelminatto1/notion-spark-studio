
import { useState, useCallback, useEffect, useRef } from 'react';
import { FileItem } from '@/types';

export interface PerformanceMetrics {
  renderTime: number;
  fileLoadTime: number;
  searchTime: number;
  memoryUsage: number;
  fileCount: number;
  averageFileSize: number;
  largestFiles: Array<{ file: FileItem; size: number }>;
}

export const usePerformance = (files: FileItem[]) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    fileLoadTime: 0,
    searchTime: 0,
    memoryUsage: 0,
    fileCount: 0,
    averageFileSize: 0,
    largestFiles: []
  });

  const renderStartTime = useRef<number>(0);
  const searchStartTime = useRef<number>(0);

  const startRenderTimer = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderTimer = useCallback(() => {
    if (renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics(prev => ({ ...prev, renderTime }));
      renderStartTime.current = 0;
    }
  }, []);

  const startSearchTimer = useCallback(() => {
    searchStartTime.current = performance.now();
  }, []);

  const endSearchTimer = useCallback(() => {
    if (searchStartTime.current > 0) {
      const searchTime = performance.now() - searchStartTime.current;
      setMetrics(prev => ({ ...prev, searchTime }));
      searchStartTime.current = 0;
    }
  }, []);

  const measureFileLoadTime = useCallback(async (loadFunction: () => Promise<void>) => {
    const startTime = performance.now();
    await loadFunction();
    const fileLoadTime = performance.now() - startTime;
    setMetrics(prev => ({ ...prev, fileLoadTime }));
  }, []);

  const calculateFileMetrics = useCallback(() => {
    const fileSizes = files.map(file => {
      const content = file.content || '';
      return {
        file,
        size: new Blob([content]).size
      };
    });

    const totalSize = fileSizes.reduce((acc, { size }) => acc + size, 0);
    const averageFileSize = files.length > 0 ? totalSize / files.length : 0;
    const largestFiles = fileSizes
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    setMetrics(prev => ({
      ...prev,
      fileCount: files.length,
      averageFileSize: Math.round(averageFileSize),
      largestFiles
    }));
  }, [files]);

  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      setMetrics(prev => ({ ...prev, memoryUsage: Math.round(memoryUsage) }));
    }
  }, []);

  const optimizeData = useCallback(() => {
    // Limpar dados desnecessários
    if (typeof window !== 'undefined') {
      // Limpar cache de imagens não utilizadas
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.complete || img.naturalHeight === 0) {
          img.src = '';
        }
      });
    }
  }, []);

  const getPerformanceRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    if (metrics.fileCount > 1000) {
      recommendations.push('Considere arquivar arquivos antigos para melhorar a performance');
    }

    if (metrics.averageFileSize > 50000) { // 50KB
      recommendations.push('Arquivos muito grandes podem afetar a performance');
    }

    if (metrics.renderTime > 100) {
      recommendations.push('Tempo de renderização alto - considere otimizações');
    }

    if (metrics.memoryUsage > 100) { // 100MB
      recommendations.push('Alto uso de memória detectado');
    }

    if (metrics.searchTime > 500) {
      recommendations.push('Busca lenta - considere implementar índices');
    }

    return recommendations;
  }, [metrics]);

  useEffect(() => {
    calculateFileMetrics();
    getMemoryUsage();
  }, [calculateFileMetrics, getMemoryUsage]);

  return {
    metrics,
    startRenderTimer,
    endRenderTimer,
    startSearchTimer,
    endSearchTimer,
    measureFileLoadTime,
    optimizeData,
    getPerformanceRecommendations
  };
};
