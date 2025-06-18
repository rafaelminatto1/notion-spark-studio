
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';
import { useDailyNotes } from '@/hooks/useDailyNotes';
import type { FileItem } from '@/types';
import { format } from 'date-fns';

interface DailyNotesButtonProps {
  files: FileItem[];
  onCreateFile: (name: string, parentId?: string, type?: 'file' | 'folder') => Promise<string>;
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void;
  onNavigateToFile: (fileId: string) => void;
}

export const DailyNotesButton: React.FC<DailyNotesButtonProps> = ({
  files,
  onCreateFile,
  onUpdateFile,
  onNavigateToFile
}) => {
  const { openTodayNote, getCurrentDailyNote } = useDailyNotes({
    files,
    onCreateFile,
    onUpdateFile,
    onNavigateToFile
  });

  const todayNote = getCurrentDailyNote();
  const today = format(new Date(), 'dd/MM');

  return (
    <Button
      onClick={openTodayNote}
      variant="ghost"
      size="sm"
      className="gap-2 text-gray-400 hover:text-white hover:bg-notion-dark-hover"
      title={todayNote ? 'Abrir nota de hoje' : 'Criar nota de hoje'}
    >
      <Calendar className="h-4 w-4" />
      <span className="hidden sm:inline">{today}</span>
      {!todayNote && <Plus className="h-3 w-3" />}
    </Button>
  );
};
