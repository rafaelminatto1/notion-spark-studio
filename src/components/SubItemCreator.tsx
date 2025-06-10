import React, { useState } from 'react';
import { Plus, FileText, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SubItemCreatorProps {
  parentId: string;
  onCreateSubItem: (name: string, parentId: string, type: 'file' | 'folder') => Promise<string>;
  className?: string;
}

export const SubItemCreator: React.FC<SubItemCreatorProps> = ({
  parentId,
  onCreateSubItem,
  className
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [itemType, setItemType] = useState<'file' | 'folder'>('file');

  const handleCreate = async () => {
    if (newItemName.trim()) {
      await onCreateSubItem(newItemName.trim(), parentId, itemType);
      setNewItemName('');
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewItemName('');
    }
  };

  if (!isCreating) {
    return (
      <div className={cn("flex gap-2", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setItemType('file');
            setIsCreating(true);
          }}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white hover:bg-purple-500/20 transition-all duration-300"
        >
          <Plus className="h-3 w-3" />
          <FileText className="h-3 w-3" />
          Subitem
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setItemType('folder');
            setIsCreating(true);
          }}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white hover:bg-blue-500/20 transition-all duration-300"
        >
          <Plus className="h-3 w-3" />
          <Folder className="h-3 w-3" />
          Subpasta
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 animate-fade-in relative z-50", className)}>
      {itemType === 'folder' ? (
        <Folder className="h-4 w-4 text-blue-400" />
      ) : (
        <FileText className="h-4 w-4 text-gray-400" />
      )}
      <Input
        value={newItemName}
        onChange={(e) => setNewItemName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleCreate}
        className="h-7 text-sm bg-background border-purple-500/30 focus:border-purple-500/60 transition-all duration-300 rounded-lg relative z-50"
        placeholder={itemType === 'folder' ? 'Nova subpasta' : 'Nova subitem'}
        autoFocus
      />
    </div>
  );
};
