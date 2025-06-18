
import { useEffect, useRef, useCallback } from 'react';
import type { FileItem } from '@/types';
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
  interval = 30000, // 30 segundos
  enabled = true
}: UseAutoSaveProps) => {
  const { toast } = useToast();
  const lastSavedContent = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveTime = useRef<Date>(new Date());
  const isTypingRef = useRef<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

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
      
      console.log('[useAutoSave] Content auto-saved for file:', file.name);
    }
  }, [file, onUpdateFile, enabled]);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Detectar se o usuário está digitando
    isTypingRef.current = true;
    
    // Resetar o timeout de digitação
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Considerar que parou de digitar após 3 segundos sem mudanças
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 3000);
    
    saveTimeoutRef.current = setTimeout(save, interval);
  }, [save, interval]);

  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    isTypingRef.current = false;
    save();
    
    toast({
      title: "Arquivo salvo",
      description: `${file?.name || 'Arquivo'} foi salvo manualmente`,
      duration: 1500,
    });
  }, [save, toast, file?.name]);

  useEffect(() => {
    if (file && enabled) {
      lastSavedContent.current = file.content || '';
      debouncedSave();
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
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
    lastSaveTime: lastSaveTime.current,
    isTyping: isTypingRef.current
  };
};
