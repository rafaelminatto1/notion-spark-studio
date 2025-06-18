
import { useState, useEffect, useCallback } from 'react';
import type { FileItem } from '@/types';

const RECENT_FILES_KEY = 'notion-spark-recent-files';
const MAX_RECENT_FILES = 10;

export const useRecentFiles = () => {
  const [recentFiles, setRecentFiles] = useState<string[]>([]);

  // Load recent files from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_FILES_KEY);
    if (stored) {
      try {
        setRecentFiles(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading recent files:', error);
      }
    }
  }, []);

  // Save recent files to localStorage
  const saveToStorage = useCallback((files: string[]) => {
    try {
      localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(files));
    } catch (error) {
      console.error('Error saving recent files:', error);
    }
  }, []);

  // Add file to recent files
  const addRecentFile = useCallback((fileId: string) => {
    setRecentFiles(prev => {
      const filtered = prev.filter(id => id !== fileId);
      const newRecent = [fileId, ...filtered].slice(0, MAX_RECENT_FILES);
      saveToStorage(newRecent);
      return newRecent;
    });
  }, [saveToStorage]);

  // Remove file from recent files
  const removeRecentFile = useCallback((fileId: string) => {
    setRecentFiles(prev => {
      const newRecent = prev.filter(id => id !== fileId);
      saveToStorage(newRecent);
      return newRecent;
    });
  }, [saveToStorage]);

  // Clear all recent files
  const clearRecentFiles = useCallback(() => {
    setRecentFiles([]);
    localStorage.removeItem(RECENT_FILES_KEY);
  }, []);

  // Get recent files with file data
  const getRecentFilesWithData = useCallback((allFiles: FileItem[]) => {
    return recentFiles
      .map(fileId => allFiles.find(f => f.id === fileId))
      .filter(Boolean) as FileItem[];
  }, [recentFiles]);

  return {
    recentFiles,
    addRecentFile,
    removeRecentFile,
    clearRecentFiles,
    getRecentFilesWithData
  };
};
