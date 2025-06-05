
import React from 'react';
import { Hash, FileText, Folder } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TagWithCount } from '@/hooks/useTags';

interface TagStatsProps {
  tags: TagWithCount[];
  selectedTags: string[];
  className?: string;
}

export const TagStats: React.FC<TagStatsProps> = ({
  tags,
  selectedTags,
  className
}) => {
  const totalTags = tags.reduce((acc, tag) => {
    const countChildren = (t: TagWithCount): number => {
      let count = 1;
      if (t.children) {
        count += t.children.reduce((childAcc, child) => childAcc + countChildren(child), 0);
      }
      return count;
    };
    return acc + countChildren(tag);
  }, 0);

  const totalFiles = tags.reduce((acc, tag) => {
    const getUniqueFiles = (t: TagWithCount, fileIds: Set<string> = new Set()): Set<string> => {
      t.files.forEach(file => fileIds.add(file.id));
      if (t.children) {
        t.children.forEach(child => getUniqueFiles(child, fileIds));
      }
      return fileIds;
    };
    return getUniqueFiles(tag, acc);
  }, new Set()).size;

  const parentTags = tags.filter(tag => tag.children && tag.children.length > 0).length;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Badge variant="outline" className="text-xs">
        <Hash className="h-3 w-3 mr-1" />
        {totalTags} tags
      </Badge>
      
      <Badge variant="outline" className="text-xs">
        <Folder className="h-3 w-3 mr-1" />
        {parentTags} categorias
      </Badge>
      
      <Badge variant="outline" className="text-xs">
        <FileText className="h-3 w-3 mr-1" />
        {totalFiles} arquivos
      </Badge>
      
      {selectedTags.length > 0 && (
        <Badge className="text-xs bg-notion-purple">
          {selectedTags.length} filtros ativos
        </Badge>
      )}
    </div>
  );
};
