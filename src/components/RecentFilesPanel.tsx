
import React from 'react';
import { Clock, FileText, Folder, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentFilesPanelProps {
  recentFiles: FileItem[];
  onFileSelect: (fileId: string) => void;
  onRemoveFromRecent: (fileId: string) => void;
  onClearAll: () => void;
  className?: string;
}

export const RecentFilesPanel: React.FC<RecentFilesPanelProps> = ({
  recentFiles,
  onFileSelect,
  onRemoveFromRecent,
  onClearAll,
  className
}) => {
  if (recentFiles.length === 0) {
    return (
      <div className={cn("p-6 text-center text-gray-400", className)}>
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum arquivo recente</p>
        <p className="text-sm mt-1">Os arquivos que você acessar aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Arquivos Recentes
        </h3>
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          Limpar Tudo
        </Button>
      </div>

      <div className="space-y-2">
        {recentFiles.map(file => (
          <div
            key={file.id}
            className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
            onClick={() => onFileSelect(file.id)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {file.emoji && (
                <span className="text-lg">{file.emoji}</span>
              )}
              {file.type === 'folder' ? (
                <Folder className="h-4 w-4 text-blue-400 flex-shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-gray-400">
                  {formatDistanceToNow(new Date(file.updatedAt), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromRecent(file.id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
