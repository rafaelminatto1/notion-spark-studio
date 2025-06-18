import React from 'react';
import { ArrowUpLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FileItem } from '@/types';

interface BacklinksProps {
  backlinks: FileItem[];
  onNavigate: (fileId: string) => void;
  className?: string;
}

export const Backlinks: React.FC<BacklinksProps> = ({
  backlinks,
  onNavigate,
  className
}) => {
  if (backlinks.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpLeft className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-300">Backlinks</h3>
        </div>
        <p className="text-xs text-gray-500">Nenhuma referência encontrada</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <ArrowUpLeft className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-medium text-gray-300">
          Backlinks ({backlinks.length})
        </h3>
      </div>
      
      <div className="space-y-2">
        {backlinks.map(file => (
          <Button
            key={file.id}
            variant="ghost"
            size="sm"
            onClick={() => { onNavigate(file.id); }}
            className="backlink-item w-full justify-start gap-2 h-auto p-2 text-left hover:bg-notion-dark-hover"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {file.emoji && <span className="text-sm">{file.emoji}</span>}
              <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-300 truncate">{file.name}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};
