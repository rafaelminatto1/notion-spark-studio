
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDailyNotes } from '@/hooks/useDailyNotes';
import type { FileItem } from '@/types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  FileText,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DailyNotesPanelProps {
  files: FileItem[];
  onCreateFile: (name: string, parentId?: string, type?: 'file' | 'folder') => Promise<string>;
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void;
  onNavigateToFile: (fileId: string) => void;
  className?: string;
}

export const DailyNotesPanel: React.FC<DailyNotesPanelProps> = ({
  files,
  onCreateFile,
  onUpdateFile,
  onNavigateToFile,
  className
}) => {
  const {
    currentDate,
    setCurrentDate,
    formatDateForDisplay,
    getCurrentDailyNote,
    openDailyNote,
    goToNextDay,
    goToPreviousDay,
    goToToday,
    openTodayNote
  } = useDailyNotes({
    files,
    onCreateFile,
    onUpdateFile,
    onNavigateToFile
  });

  const currentNote = getCurrentDailyNote();
  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className={cn("p-4 space-y-4", className)}>
      <Card className="bg-notion-dark border-notion-dark-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Daily Notes
            </CardTitle>
            <Button
              onClick={openTodayNote}
              size="sm"
              variant="ghost"
              className="text-notion-purple hover:text-white hover:bg-notion-purple"
            >
              <Clock className="h-4 w-4 mr-1" />
              Hoje
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Date Navigation */}
          <div className="flex items-center justify-between bg-notion-dark-hover rounded-lg p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousDay}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 text-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-notion-dark-border"
                  >
                    {formatDateForDisplay(currentDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => date && setCurrentDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextDay}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Note Status */}
          <div className="space-y-3">
            {currentNote ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-green-300">
                      Nota criada
                    </span>
                  </div>
                  <Button
                    onClick={() => openDailyNote(currentDate)}
                    size="sm"
                    variant="ghost"
                    className="text-green-300 hover:text-white hover:bg-green-500/20"
                  >
                    Abrir
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-blue-300">
                      {isToday ? 'Criar nota de hoje' : 'Criar nota do dia'}
                    </span>
                  </div>
                  <Button
                    onClick={() => openDailyNote(currentDate)}
                    size="sm"
                    variant="ghost"
                    className="text-blue-300 hover:text-white hover:bg-blue-500/20"
                  >
                    Criar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t border-notion-dark-border">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setCurrentDate(yesterday);
                }}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                Ontem
              </Button>
              <Button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setCurrentDate(tomorrow);
                }}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                Amanhã
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
