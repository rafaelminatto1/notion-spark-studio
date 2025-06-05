
import { useEffect, useRef, useCallback } from 'react';
import { FileItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveProps {
  file: FileItem | undefined;
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void;
  interval?: number;
  enabled?: boolean;
}

export const useAutoSave = ({
  file,
  onUpdateFile,
  interval = 5000, // 5 segundos
  enabled = true
}: UseAutoSaveProps) => {
  const { toast } = useToast();
  const lastSavedContent = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveTime = useRef<Date>(new Date());

  const save = useCallback(() => {
    if (!file || !enabled) return;

    const currentContent = file.content || '';
    if (currentContent !== lastSavedContent.current) {
      onUpdateFile(file.id, { 
        content: currentContent,
        updatedAt: new Date()
      });
      lastSavedContent.current = currentContent;
      lastSaveTime.current = new Date();
      
      toast({
        title: "Auto-saved",
        description: `${file.name} foi salvo automaticamente`,
        duration: 2000,
      });
    }
  }, [file, onUpdateFile, enabled, toast]);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(save, interval);
  }, [save, interval]);

  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    save();
  }, [save]);

  useEffect(() => {
    if (file && enabled) {
      lastSavedContent.current = file.content || '';
      debouncedSave();
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [file?.content, debouncedSave, enabled]);

  const getTimeSinceLastSave = useCallback(() => {
    const now = new Date();
    const diff = now.getTime() - lastSaveTime.current.getTime();
    return Math.floor(diff / 1000);
  }, []);

  return {
    forceSave,
    getTimeSinceLastSave,
    lastSaveTime: lastSaveTime.current
  };
};
