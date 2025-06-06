
import React from 'react';
import { Block } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TableBlockProps {
  block: Block;
  isSelected: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onFocus: () => void;
}

export const TableBlock: React.FC<TableBlockProps> = ({
  block,
  isSelected,
  onUpdate,
  onFocus
}) => {
  const tableData = block.properties?.tableData || [
    [{ content: 'Header 1' }, { content: 'Header 2' }],
    [{ content: 'Cell 1' }, { content: 'Cell 2' }]
  ];

  const updateCell = (rowIndex: number, colIndex: number, content: string) => {
    const newTableData = [...tableData];
    newTableData[rowIndex][colIndex] = { content };
    onUpdate({ properties: { ...block.properties, tableData: newTableData } });
  };

  const addRow = () => {
    const colCount = tableData[0]?.length || 2;
    const newRow = Array(colCount).fill(null).map(() => ({ content: '' }));
    const newTableData = [...tableData, newRow];
    onUpdate({ properties: { ...block.properties, tableData: newTableData } });
  };

  const addColumn = () => {
    const newTableData = tableData.map(row => [...row, { content: '' }]);
    onUpdate({ properties: { ...block.properties, tableData: newTableData } });
  };

  const removeRow = (rowIndex: number) => {
    if (tableData.length <= 1) return;
    const newTableData = tableData.filter((_, index) => index !== rowIndex);
    onUpdate({ properties: { ...block.properties, tableData: newTableData } });
  };

  const removeColumn = (colIndex: number) => {
    if (tableData[0]?.length <= 1) return;
    const newTableData = tableData.map(row => row.filter((_, index) => index !== colIndex));
    onUpdate({ properties: { ...block.properties, tableData: newTableData } });
  };

  return (
    <div className={cn(
      "border border-gray-600 rounded-lg overflow-hidden",
      isSelected && "ring-1 ring-notion-purple"
    )} onFocus={onFocus}>
      <table className="w-full">
        <tbody>
          {tableData.map((row, rowIndex) => (
            <tr key={rowIndex} className="group">
              {row.map((cell, colIndex) => (
                <td key={colIndex} className="border border-gray-600 p-1 relative group">
                  <Input
                    value={cell.content}
                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-sm"
                    placeholder={rowIndex === 0 ? `Header ${colIndex + 1}` : `Cell`}
                  />
                  {colIndex === row.length - 1 && (
                    <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeColumn(colIndex)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </td>
              ))}
              <td className="p-1">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(rowIndex)}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="p-2 bg-gray-800/50 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={addRow}
          className="gap-1 text-gray-400 hover:text-white"
        >
          <Plus className="h-3 w-3" />
          Linha
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={addColumn}
          className="gap-1 text-gray-400 hover:text-white"
        >
          <Plus className="h-3 w-3" />
          Coluna
        </Button>
      </div>
    </div>
  );
};
