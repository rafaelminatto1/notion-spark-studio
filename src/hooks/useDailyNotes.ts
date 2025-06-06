
import { useState, useEffect, useCallback } from 'react';
import { FileItem } from '@/types';
import { format, startOfDay, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UseDailyNotesProps {
  files: FileItem[];
  onCreateFile: (name: string, parentId?: string, type?: 'file' | 'folder') => Promise<string>;
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void;
  onNavigateToFile: (fileId: string) => void;
}

export const useDailyNotes = ({
  files,
  onCreateFile,
  onUpdateFile,
  onNavigateToFile
}: UseDailyNotesProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyNotesFolder, setDailyNotesFolder] = useState<FileItem | null>(null);

  // Encontra ou cria a pasta de Daily Notes
  useEffect(() => {
    const findOrCreateDailyNotesFolder = async () => {
      let folder = files.find(f => f.name === 'Daily Notes' && f.type === 'folder');
      
      if (!folder) {
        const folderId = await onCreateFile('Daily Notes', undefined, 'folder');
        folder = files.find(f => f.id === folderId);
        if (folder) {
          onUpdateFile(folder.id, { emoji: '📅' });
        }
      }
      
      setDailyNotesFolder(folder || null);
    };

    findOrCreateDailyNotesFolder();
  }, [files, onCreateFile, onUpdateFile]);

  const formatDateForFilename = (date: Date) => {
    return format(date, 'yyyy-MM-dd', { locale: ptBR });
  };

  const formatDateForDisplay = (date: Date) => {
    return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getDailyNoteForDate = (date: Date) => {
    const filename = formatDateForFilename(date);
    return files.find(f => 
      f.name === filename && 
      f.type === 'file' && 
      f.parentId === dailyNotesFolder?.id
    );
  };

  const createDailyNote = useCallback(async (date: Date) => {
    if (!dailyNotesFolder) return null;

    const filename = formatDateForFilename(date);
    const displayDate = formatDateForDisplay(date);
    
    const template = `# ${displayDate}

## 📝 Tarefas do Dia
- [ ] 

## 🎯 Objetivos
- 

## 📖 Notas
- 

## 🤔 Reflexões
- 

---
*Criado automaticamente em ${format(new Date(), 'HH:mm')}``;

    const fileId = await onCreateFile(filename, dailyNotesFolder.id, 'file');
    
    if (fileId) {
      onUpdateFile(fileId, {
        content: template,
        emoji: '📝',
        tags: ['daily-notes', 'journal']
      });
    }

    return fileId;
  }, [dailyNotesFolder, onCreateFile, onUpdateFile]);

  const openDailyNote = useCallback(async (date: Date) => {
    let dailyNote = getDailyNoteForDate(date);
    
    if (!dailyNote) {
      const fileId = await createDailyNote(date);
      if (fileId) {
        dailyNote = files.find(f => f.id === fileId);
      }
    }
    
    if (dailyNote) {
      onNavigateToFile(dailyNote.id);
    }
  }, [files, createDailyNote, onNavigateToFile, getDailyNoteForDate]);

  const goToNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1));
  };

  const goToPreviousDay = () => {
    setCurrentDate(prev => subDays(prev, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getCurrentDailyNote = () => {
    return getDailyNoteForDate(currentDate);
  };

  const openTodayNote = () => {
    const today = new Date();
    setCurrentDate(today);
    openDailyNote(today);
  };

  return {
    currentDate,
    setCurrentDate,
    formatDateForDisplay,
    getCurrentDailyNote,
    openDailyNote,
    createDailyNote,
    goToNextDay,
    goToPreviousDay,
    goToToday,
    openTodayNote,
    dailyNotesFolder
  };
};
