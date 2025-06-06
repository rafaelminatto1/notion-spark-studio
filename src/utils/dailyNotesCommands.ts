
import { FileItem } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DailyNotesCommand {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  action: () => void;
  type: 'daily-notes';
}

interface CreateDailyNotesCommandsProps {
  files: FileItem[];
  onCreateFile: (name: string, parentId?: string, type?: 'file' | 'folder') => Promise<string>;
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void;
  onNavigateToFile: (fileId: string) => void;
}

export const createDailyNotesCommands = ({
  files,
  onCreateFile,
  onUpdateFile,
  onNavigateToFile
}: CreateDailyNotesCommandsProps): DailyNotesCommand[] => {
  const today = new Date();
  const todayFilename = format(today, 'yyyy-MM-dd');
  const dailyNotesFolder = files.find(f => f.name === 'Daily Notes' && f.type === 'folder');
  
  const todayNote = files.find(f => 
    f.name === todayFilename && 
    f.type === 'file' && 
    f.parentId === dailyNotesFolder?.id
  );

  const createDailyNote = async (date: Date) => {
    if (!dailyNotesFolder) return;

    const filename = format(date, 'yyyy-MM-dd');
    const displayDate = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    
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
*Criado automaticamente em ${format(new Date(), 'HH:mm')}*`;

    const fileId = await onCreateFile(filename, dailyNotesFolder.id, 'file');
    
    if (fileId) {
      onUpdateFile(fileId, {
        content: template,
        emoji: '📝',
        tags: ['daily-notes', 'journal']
      });
      onNavigateToFile(fileId);
    }
  };

  const commands: DailyNotesCommand[] = [];

  // Comando para hoje
  if (todayNote) {
    commands.push({
      id: 'open-today-note',
      title: 'Abrir nota de hoje',
      subtitle: format(today, "d 'de' MMMM", { locale: ptBR }),
      icon: '📝',
      action: () => onNavigateToFile(todayNote.id),
      type: 'daily-notes'
    });
  } else {
    commands.push({
      id: 'create-today-note',
      title: 'Criar nota de hoje',
      subtitle: format(today, "d 'de' MMMM", { locale: ptBR }),
      icon: '➕',
      action: () => createDailyNote(today),
      type: 'daily-notes'
    });
  }

  // Comando para ontem
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFilename = format(yesterday, 'yyyy-MM-dd');
  const yesterdayNote = files.find(f => 
    f.name === yesterdayFilename && 
    f.type === 'file' && 
    f.parentId === dailyNotesFolder?.id
  );

  if (yesterdayNote) {
    commands.push({
      id: 'open-yesterday-note',
      title: 'Abrir nota de ontem',
      subtitle: format(yesterday, "d 'de' MMMM", { locale: ptBR }),
      icon: '📖',
      action: () => onNavigateToFile(yesterdayNote.id),
      type: 'daily-notes'
    });
  }

  return commands;
};
