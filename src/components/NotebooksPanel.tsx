import React, { useState } from 'react';
import { Plus, Notebook, ChevronRight, ChevronDown, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';

interface NotebooksPanelProps {
  notebooks: FileItem[];
  selectedNotebook: string | null;
  onNotebookSelect: (notebookId: string) => void;
  onCreateNotebook: () => void;
  onCreateNote: (notebookId?: string) => void;
  isMobile?: boolean;
}

export const NotebooksPanel: React.FC<NotebooksPanelProps> = ({
  notebooks,
  selectedNotebook,
  onNotebookSelect,
  onCreateNotebook,
  onCreateNote,
  isMobile = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set());

  const filteredNotebooks = notebooks.filter(notebook =>
    notebook.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleNotebookExpansion = (notebookId: string) => {
    const newExpanded = new Set(expandedNotebooks);
    if (newExpanded.has(notebookId)) {
      newExpanded.delete(notebookId);
    } else {
      newExpanded.add(notebookId);
    }
    setExpandedNotebooks(newExpanded);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Notebooks</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <Settings className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar notebooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-200 text-sm"
          />
        </div>

        {/* New Notebook Button */}
        <Button
          onClick={onCreateNotebook}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Notebook
        </Button>
      </div>

      {/* Notebooks List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {/* All Notes */}
          <div
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors",
              !selectedNotebook && "bg-blue-50 border border-blue-200"
            )}
            onClick={() => onNotebookSelect('')}
          >
            <Notebook className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Todas as Notas</span>
          </div>

          {/* Notebooks */}
          {filteredNotebooks.map((notebook) => {
            const isSelected = selectedNotebook === notebook.id;
            const isExpanded = expandedNotebooks.has(notebook.id);
            
            return (
              <div key={notebook.id} className="mt-1">
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group",
                    isSelected && "bg-blue-50 border border-blue-200"
                  )}
                  onClick={() => onNotebookSelect(notebook.id)}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNotebookExpansion(notebook.id);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-gray-500" />
                    )}
                  </Button>
                  
                  <Notebook className="h-5 w-5 text-gray-600" />
                  
                  <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                    {notebook.name}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateNote(notebook.id);
                    }}
                  >
                    <Plus className="h-3 w-3 text-gray-600" />
                  </Button>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs text-gray-600 hover:bg-gray-100 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateNote(notebook.id);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Nova Nota
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500 text-center">
          {notebooks.length} notebook{notebooks.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}; 