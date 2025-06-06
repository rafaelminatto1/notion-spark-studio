
import React from 'react';
import { Block } from '@/types';
import { Database } from '@/types/database';
import { DatabaseView } from '@/components/database/DatabaseView';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DatabaseBlockProps {
  block: Block;
  isSelected: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onFocus: () => void;
}

export const DatabaseBlock: React.FC<DatabaseBlockProps> = ({
  block,
  isSelected,
  onUpdate,
  onFocus
}) => {
  // Create default database if none exists
  const defaultDatabase: Database = {
    id: block.id,
    name: 'Nova Database',
    properties: [
      {
        id: 'title',
        name: 'Título',
        type: 'text'
      },
      {
        id: 'status',
        name: 'Status',
        type: 'select',
        options: {
          selectOptions: [
            { id: 'todo', name: 'A fazer', color: '#ef4444' },
            { id: 'doing', name: 'Fazendo', color: '#f59e0b' },
            { id: 'done', name: 'Feito', color: '#10b981' }
          ]
        }
      }
    ],
    rows: [],
    views: [
      {
        id: 'table-view',
        name: 'Tabela',
        type: 'table',
        filters: [],
        sorts: [],
        visibleProperties: ['title', 'status']
      },
      {
        id: 'kanban-view',
        name: 'Kanban',
        type: 'kanban',
        filters: [],
        sorts: [],
        groupBy: 'status',
        visibleProperties: ['title', 'status']
      }
    ],
    defaultView: 'table-view',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const database = block.properties?.database || defaultDatabase;

  const handleUpdateDatabase = (updates: Partial<Database>) => {
    const updatedDatabase = { ...database, ...updates, updatedAt: new Date() };
    onUpdate({
      properties: {
        ...block.properties,
        database: updatedDatabase
      }
    });
  };

  return (
    <div 
      className={cn(
        "border border-notion-dark-border rounded-lg overflow-hidden",
        isSelected && "ring-1 ring-notion-purple"
      )}
      onFocus={onFocus}
    >
      <DatabaseView
        database={database}
        onUpdateDatabase={handleUpdateDatabase}
        className="p-4"
      />
    </div>
  );
};
