
import React from 'react';
import { Link2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LinkRendererProps {
  target: string;
  onNavigate: (fileName: string) => void;
  fileExists: boolean;
  className?: string;
}

export const LinkRenderer: React.FC<LinkRendererProps> = ({
  target,
  onNavigate,
  fileExists,
  className
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onNavigate(target)}
      className={cn(
        "inline-flex items-center gap-1 h-auto p-1 text-sm font-normal",
        fileExists 
          ? "text-blue-400 hover:text-blue-300 hover:bg-blue-400/10" 
          : "text-red-400 hover:text-red-300 hover:bg-red-400/10",
        className
      )}
    >
      {fileExists ? (
        <Link2 className="h-3 w-3" />
      ) : (
        <ExternalLink className="h-3 w-3" />
      )}
      {target}
    </Button>
  );
};
