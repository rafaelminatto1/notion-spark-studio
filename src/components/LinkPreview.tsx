
import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';

interface LinkPreviewProps {
  file: FileItem | null;
  position: { x: number; y: number };
  isVisible: boolean;
  onNavigate: (fileId: string) => void;
  className?: string;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({
  file,
  position,
  isVisible,
  onNavigate,
  className
}) => {
  if (!isVisible || !file) return null;

  const preview = file.content?.slice(0, 200) || 'Arquivo vazio';

  return (
    <div
      className={cn(
        "fixed z-50 bg-notion-dark-hover border border-notion-dark-border rounded-lg shadow-lg p-4 max-w-sm",
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y + 20}px`
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        {file.emoji && <span className="text-lg">{file.emoji}</span>}
        <FileText className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-medium text-white truncate flex-1">
          {file.name}
        </h3>
        <button
          onClick={() => onNavigate(file.id)}
          className="text-gray-400 hover:text-white"
          title="Abrir arquivo"
        >
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
      
      <div className="text-sm text-gray-300 leading-relaxed mb-3">
        {preview}
        {file.content && file.content.length > 200 && '...'}
      </div>
      
      {file.tags && file.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {file.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-xs bg-notion-purple/20 text-notion-purple px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
          {file.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{file.tags.length - 3} mais
            </span>
          )}
        </div>
      )}
    </div>
  );
};
