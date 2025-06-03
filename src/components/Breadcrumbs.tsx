
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileItem } from '@/types';

interface BreadcrumbsProps {
  currentFile: FileItem | undefined;
  files: FileItem[];
  onNavigate: (fileId: string) => void;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  currentFile,
  files,
  onNavigate,
  className
}) => {
  const getBreadcrumbPath = (): FileItem[] => {
    if (!currentFile) return [];
    
    const path: FileItem[] = [];
    let current = currentFile;
    
    while (current) {
      path.unshift(current);
      if (current.parentId) {
        const parent = files.find(f => f.id === current.parentId);
        if (parent) {
          current = parent;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    return path;
  };

  const breadcrumbPath = getBreadcrumbPath();

  if (breadcrumbPath.length === 0) {
    return (
      <div className={className}>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-400 hover:text-white"
        >
          <Home className="h-4 w-4" />
          Home
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {/* Navigate to home */}}
        className="gap-2 text-gray-400 hover:text-white"
      >
        <Home className="h-4 w-4" />
      </Button>
      
      {breadcrumbPath.map((item, index) => (
        <React.Fragment key={item.id}>
          <ChevronRight className="h-4 w-4 text-gray-600" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(item.id)}
            className={`text-sm ${
              index === breadcrumbPath.length - 1 
                ? 'text-white font-medium' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {item.emoji && <span className="mr-1">{item.emoji}</span>}
            {item.name}
          </Button>
        </React.Fragment>
      ))}
    </div>
  );
};
