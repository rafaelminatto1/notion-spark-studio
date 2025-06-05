
import { useState, useCallback, useEffect } from 'react';
import { FileItem } from '@/types';

export interface FileVersion {
  id: string;
  fileId: string;
  content: string;
  timestamp: Date;
  description?: string;
  size: number;
}

export const useVersionHistory = (fileId: string | null) => {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const maxVersions = 50;

  const addVersion = useCallback((file: FileItem, description?: string) => {
    if (!isEnabled || !file.content) return;

    const newVersion: FileVersion = {
      id: crypto.randomUUID(),
      fileId: file.id,
      content: file.content,
      timestamp: new Date(),
      description,
      size: new Blob([file.content]).size
    };

    setVersions(prev => {
      const fileVersions = prev.filter(v => v.fileId === file.id);
      const otherVersions = prev.filter(v => v.fileId !== file.id);
      
      // Verificar se o conteúdo mudou
      const lastVersion = fileVersions[0];
      if (lastVersion && lastVersion.content === file.content) {
        return prev; // Não salvar se o conteúdo não mudou
      }

      const updatedFileVersions = [newVersion, ...fileVersions].slice(0, maxVersions);
      return [...updatedFileVersions, ...otherVersions];
    });
  }, [isEnabled]);

  const getFileVersions = useCallback((targetFileId: string) => {
    return versions
      .filter(v => v.fileId === targetFileId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [versions]);

  const restoreVersion = useCallback((versionId: string): string | null => {
    const version = versions.find(v => v.id === versionId);
    return version ? version.content : null;
  }, [versions]);

  const deleteVersion = useCallback((versionId: string) => {
    setVersions(prev => prev.filter(v => v.id !== versionId));
  }, []);

  const compareVersions = useCallback((versionId1: string, versionId2: string) => {
    const version1 = versions.find(v => v.id === versionId1);
    const version2 = versions.find(v => v.id === versionId2);
    
    if (!version1 || !version2) return null;

    // Simples comparação linha por linha
    const lines1 = version1.content.split('\n');
    const lines2 = version2.content.split('\n');
    
    return {
      version1,
      version2,
      differences: {
        added: lines2.filter(line => !lines1.includes(line)),
        removed: lines1.filter(line => !lines2.includes(line)),
        linesChanged: Math.abs(lines1.length - lines2.length)
      }
    };
  }, [versions]);

  const getVersionStats = useCallback(() => {
    const totalVersions = versions.length;
    const totalSize = versions.reduce((acc, v) => acc + v.size, 0);
    const avgSize = totalVersions > 0 ? totalSize / totalVersions : 0;
    
    return {
      totalVersions,
      totalSize,
      avgSize: Math.round(avgSize),
      oldestVersion: versions.length > 0 ? 
        versions.reduce((oldest, v) => v.timestamp < oldest.timestamp ? v : oldest) : null
    };
  }, [versions]);

  const cleanupOldVersions = useCallback((daysToKeep: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    setVersions(prev => prev.filter(v => v.timestamp > cutoffDate));
  }, []);

  return {
    versions: fileId ? getFileVersions(fileId) : [],
    addVersion,
    getFileVersions,
    restoreVersion,
    deleteVersion,
    compareVersions,
    getVersionStats,
    cleanupOldVersions,
    isEnabled,
    setIsEnabled
  };
};
