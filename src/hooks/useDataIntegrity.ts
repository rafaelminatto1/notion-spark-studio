
import { useCallback } from 'react';
import type { FileItem } from '@/types';

interface IntegrityIssue {
  type: 'orphan' | 'circular' | 'invalid_parent' | 'missing_data' | 'corruption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  fileId: string;
  message: string;
  fix?: () => void;
}

interface IntegrityReport {
  issues: IntegrityIssue[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  health: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export const useDataIntegrity = () => {
  const validateFileStructure = useCallback((files: FileItem[]): IntegrityReport => {
    const issues: IntegrityIssue[] = [];
    const fileMap = new Map(files.map(f => [f.id, f]));

    files.forEach(file => {
      // Verificar pais órfãos
      if (file.parentId && !fileMap.has(file.parentId)) {
        issues.push({
          type: 'orphan',
          severity: 'high',
          fileId: file.id,
          message: `Arquivo "${file.name}" tem pai inexistente: ${file.parentId}`,
          fix: () => {
            // Remove o parentId inválido
            file.parentId = undefined;
          }
        });
      }

      // Verificar referências circulares
      const visited = new Set<string>();
      let current = file;
      while (current.parentId && !visited.has(current.id)) {
        visited.add(current.id);
        const parent = fileMap.get(current.parentId);
        if (!parent) break;
        
        if (visited.has(parent.id)) {
          issues.push({
            type: 'circular',
            severity: 'critical',
            fileId: file.id,
            message: `Referência circular detectada em "${file.name}"`
          });
          break;
        }
        current = parent;
      }

      // Verificar dados obrigatórios
      if (!file.name || file.name.trim() === '') {
        issues.push({
          type: 'missing_data',
          severity: 'critical',
          fileId: file.id,
          message: 'Arquivo sem nome'
        });
      }

      if (!file.createdAt || !file.updatedAt) {
        issues.push({
          type: 'missing_data',
          severity: 'medium',
          fileId: file.id,
          message: 'Arquivo sem timestamps'
        });
      }

      // Verificar integridade de datas
      if (file.createdAt && file.updatedAt && 
          new Date(file.updatedAt) < new Date(file.createdAt)) {
        issues.push({
          type: 'corruption',
          severity: 'medium',
          fileId: file.id,
          message: 'Data de atualização anterior à criação'
        });
      }

      // Verificar conteúdo de pastas
      if (file.type === 'folder' && file.content) {
        issues.push({
          type: 'corruption',
          severity: 'low',
          fileId: file.id,
          message: 'Pasta não deveria ter conteúdo'
        });
      }
    });

    const summary = {
      total: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length
    };

    let health: IntegrityReport['health'] = 'excellent';
    if (summary.critical > 0) health = 'critical';
    else if (summary.high > 2) health = 'poor';
    else if (summary.high > 0 || summary.medium > 5) health = 'fair';
    else if (summary.medium > 0 || summary.low > 10) health = 'good';

    return { issues, summary, health };
  }, []);

  const fixAutomaticIssues = useCallback((files: FileItem[], issues: IntegrityIssue[]) => {
    let fixedCount = 0;

    issues.forEach(issue => {
      if (issue.fix) {
        issue.fix();
        fixedCount++;
      }
    });

    return fixedCount;
  }, []);

  const cleanOrphanedData = useCallback((files: FileItem[]) => {
    const validIds = new Set(files.map(f => f.id));
    const cleaned: FileItem[] = [];

    files.forEach(file => {
      // Limpar parentId inválidos
      if (file.parentId && !validIds.has(file.parentId)) {
        file.parentId = undefined;
      }

      // Limpar tags vazias
      if (file.tags) {
        file.tags = file.tags.filter(tag => tag.trim() !== '');
        if (file.tags.length === 0) {
          delete file.tags;
        }
      }

      cleaned.push(file);
    });

    return cleaned;
  }, []);

  const generateHealthReport = useCallback((files: FileItem[]) => {
    const report = validateFileStructure(files);
    const totalFiles = files.length;
    const folders = files.filter(f => f.type === 'folder').length;
    const filesWithContent = files.filter(f => f.type === 'file' && f.content).length;
    const totalSize = files.reduce((acc, f) => 
      acc + (f.content ? new Blob([f.content]).size : 0), 0
    );

    return {
      ...report,
      stats: {
        totalFiles,
        folders,
        filesWithContent,
        averageFileSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0,
        totalSize: Math.round(totalSize / 1024) // KB
      }
    };
  }, [validateFileStructure]);

  return {
    validateFileStructure,
    fixAutomaticIssues,
    cleanOrphanedData,
    generateHealthReport
  };
};
