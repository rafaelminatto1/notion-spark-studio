
import React, { useState } from 'react';
import { Database, DatabaseView, DatabaseProperty, DatabaseRow } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, MoreHorizontal, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DatabaseTableProps {
  database: Database;
  view: DatabaseView;
  onUpdateDatabase: (updates: Partial<Database>) => void;
}

export const DatabaseTable: React.FC<DatabaseTableProps> = ({
  database,
  view,
  onUpdateDatabase
}) => {
  const [editingCell, setEditingCell] = useState<{ rowId: string; propertyId: string } | null>(null);

  const visibleProperties = database.properties.filter(p => 
    view.visibleProperties.includes(p.id)
  );

  const updateRowProperty = (rowId: string, propertyId: string, value: any) => {
    const updatedRows = database.rows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          properties: {
            ...row.properties,
            [propertyId]: value
          },
          updatedAt: new Date()
        };
      }
      return row;
    });

    onUpdateDatabase({ rows: updatedRows });
    setEditingCell(null);
  };

  const deleteRow = (rowId: string) => {
    const updatedRows = database.rows.filter(row => row.id !== rowId);
    onUpdateDatabase({ rows: updatedRows });
  };

  const renderCell = (row: DatabaseRow, property: DatabaseProperty) => {
    const value = row.properties[property.id];
    const isEditing = editingCell?.rowId === row.id && editingCell?.propertyId === property.id;

    if (isEditing) {
      return renderEditableCell(row, property, value);
    }

    return (
      <div
        className="p-2 min-h-[40px] flex items-center cursor-pointer hover:bg-notion-dark-hover rounded"
        onClick={() => setEditingCell({ rowId: row.id, propertyId: property.id })}
      >
        {renderCellContent(property, value)}
      </div>
    );
  };

  const renderCellContent = (property: DatabaseProperty, value: any) => {
    switch (property.type) {
      case 'text':
      case 'url':
      case 'email':
      case 'phone':
        return <span className="text-gray-300">{value || ''}</span>;
      
      case 'number':
        return <span className="text-gray-300">{value ? Number(value).toLocaleString() : ''}</span>;
      
      case 'checkbox':
        return <Checkbox checked={Boolean(value)} readOnly />;
      
      case 'select':
        const selectOption = property.options?.selectOptions?.find(opt => opt.id === value);
        return selectOption ? (
          <span 
            className="px-2 py-1 rounded text-sm"
            style={{ backgroundColor: selectOption.color + '20', color: selectOption.color }}
          >
            {selectOption.name}
          </span>
        ) : null;
      
      case 'multi_select':
        return (
          <div className="flex gap-1 flex-wrap">
            {(value || []).map((optionId: string) => {
              const option = property.options?.selectOptions?.find(opt => opt.id === optionId);
              return option ? (
                <span
                  key={optionId}
                  className="px-2 py-1 rounded text-xs"
                  style={{ backgroundColor: option.color + '20', color: option.color }}
                >
                  {option.name}
                </span>
              ) : null;
            })}
          </div>
        );
      
      case 'date':
        return value ? (
          <span className="text-gray-300">{format(new Date(value), 'dd/MM/yyyy')}</span>
        ) : null;
      
      default:
        return <span className="text-gray-300">{value || ''}</span>;
    }
  };

  const renderEditableCell = (row: DatabaseRow, property: DatabaseProperty, value: any) => {
    switch (property.type) {
      case 'text':
      case 'url':
      case 'email':
      case 'phone':
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateRowProperty(row.id, property.id, e.target.value)}
            onBlur={() => setEditingCell(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                setEditingCell(null);
              }
            }}
            autoFocus
            className="h-8"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => updateRowProperty(row.id, property.id, e.target.value ? Number(e.target.value) : null)}
            onBlur={() => setEditingCell(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                setEditingCell(null);
              }
            }}
            autoFocus
            className="h-8"
          />
        );
      
      case 'checkbox':
        return (
          <Checkbox
            checked={Boolean(value)}
            onCheckedChange={(checked) => updateRowProperty(row.id, property.id, checked)}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(newValue) => updateRowProperty(row.id, property.id, newValue)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {property.options?.selectOptions?.map(option => (
                <SelectItem key={option.id} value={option.id}>
                  <span style={{ color: option.color }}>{option.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-8 justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), 'dd/MM/yyyy') : 'Selecionar data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => {
                  updateRowProperty(row.id, property.id, date?.toISOString());
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateRowProperty(row.id, property.id, e.target.value)}
            onBlur={() => setEditingCell(null)}
            autoFocus
            className="h-8"
          />
        );
    }
  };

  return (
    <div className="overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-notion-dark-border">
            {visibleProperties.map(property => (
              <th key={property.id} className="text-left p-3 text-gray-400 font-medium min-w-[150px]">
                {property.name}
              </th>
            ))}
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {database.rows.map(row => (
            <tr key={row.id} className="border-b border-notion-dark-border/50 hover:bg-notion-dark-hover/50">
              {visibleProperties.map(property => (
                <td key={property.id} className="min-w-[150px]">
                  {renderCell(row, property)}
                </td>
              ))}
              <td className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRow(row.id)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
