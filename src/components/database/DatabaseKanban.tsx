
import React from 'react';
import type { Database, DatabaseView, DatabaseRow } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MoreHorizontal } from 'lucide-react';

interface DatabaseKanbanProps {
  database: Database;
  view: DatabaseView;
  onUpdateDatabase: (updates: Partial<Database>) => void;
}

export const DatabaseKanban: React.FC<DatabaseKanbanProps> = ({
  database,
  view,
  onUpdateDatabase
}) => {
  // Find the property to group by (usually a select property)
  const groupProperty = database.properties.find(p => 
    p.type === 'select' && view.groupBy === p.id
  );

  if (!groupProperty?.options?.selectOptions) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>Configure um campo Select para agrupar as colunas do Kanban</p>
      </div>
    );
  }

  const columns = groupProperty.options.selectOptions;

  const getRowsForColumn = (columnId: string) => {
    return database.rows.filter(row => row.properties[groupProperty.id] === columnId);
  };

  const moveCard = (rowId: string, newColumnId: string) => {
    const updatedRows = database.rows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          properties: {
            ...row.properties,
            [groupProperty.id]: newColumnId
          },
          updatedAt: new Date()
        };
      }
      return row;
    });

    onUpdateDatabase({ rows: updatedRows });
  };

  const addCardToColumn = (columnId: string) => {
    const newRow = {
      id: Date.now().toString(),
      properties: {
        [groupProperty.id]: columnId
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onUpdateDatabase({
      rows: [...database.rows, newRow]
    });
  };

  const renderCard = (row: DatabaseRow) => {
    // Get the title property (usually the first text property)
    const titleProperty = database.properties.find(p => p.type === 'text');
    const title = titleProperty ? row.properties[titleProperty.id] || 'Sem título' : 'Sem título';

    return (
      <Card key={row.id} className="bg-notion-dark-hover border-notion-dark-border mb-3 cursor-pointer hover:bg-notion-dark-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-200">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1">
            {database.properties.slice(1, 4).map(property => {
              const value = row.properties[property.id];
              if (!value) return null;
              
              return (
                <div key={property.id} className="text-xs text-gray-400">
                  <span className="font-medium">{property.name}:</span> {value}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4">
      <div className="flex gap-6 overflow-x-auto">
        {columns.map(column => {
          const columnRows = getRowsForColumn(column.id);
          
          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className="flex items-center justify-between mb-4">
                <h3 
                  className="font-medium text-gray-200 flex items-center gap-2"
                  style={{ color: column.color }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  {column.name} ({columnRows.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { addCardToColumn(column.id); }}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-3 min-h-[400px]">
                {columnRows.map(row => renderCard(row))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
