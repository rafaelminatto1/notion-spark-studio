
import React, { useState } from 'react';
import { Database, DatabaseView as DatabaseViewType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatabaseTable } from './DatabaseTable';
import { DatabaseKanban } from './DatabaseKanban';
import { DatabaseCalendar } from './DatabaseCalendar';
import { DatabaseGallery } from './DatabaseGallery';
import { DatabaseProperties } from './DatabaseProperties';
import { Table, Kanban, Calendar, Grid, Settings, Plus } from 'lucide-react';

interface DatabaseViewProps {
  database: Database;
  onUpdateDatabase: (updates: Partial<Database>) => void;
  className?: string;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  database,
  onUpdateDatabase,
  className
}) => {
  const [currentViewId, setCurrentViewId] = useState(database.defaultView);
  const [showProperties, setShowProperties] = useState(false);

  const currentView = database.views.find(v => v.id === currentViewId) || database.views[0];

  const addNewRow = () => {
    const newRow = {
      id: Date.now().toString(),
      properties: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onUpdateDatabase({
      rows: [...database.rows, newRow]
    });
  };

  const addNewView = (type: DatabaseViewType['type']) => {
    const newView: DatabaseViewType = {
      id: Date.now().toString(),
      name: `Nova ${type}`,
      type,
      filters: [],
      sorts: [],
      visibleProperties: database.properties.map(p => p.id)
    };

    onUpdateDatabase({
      views: [...database.views, newView]
    });
  };

  const getViewIcon = (type: string) => {
    switch (type) {
      case 'table': return <Table className="h-4 w-4" />;
      case 'kanban': return <Kanban className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      case 'gallery': return <Grid className="h-4 w-4" />;
      default: return <Table className="h-4 w-4" />;
    }
  };

  const renderView = () => {
    if (!currentView) return null;

    switch (currentView.type) {
      case 'table':
        return (
          <DatabaseTable
            database={database}
            view={currentView}
            onUpdateDatabase={onUpdateDatabase}
          />
        );
      case 'kanban':
        return (
          <DatabaseKanban
            database={database}
            view={currentView}
            onUpdateDatabase={onUpdateDatabase}
          />
        );
      case 'calendar':
        return (
          <DatabaseCalendar
            database={database}
            view={currentView}
            onUpdateDatabase={onUpdateDatabase}
          />
        );
      case 'gallery':
        return (
          <DatabaseGallery
            database={database}
            view={currentView}
            onUpdateDatabase={onUpdateDatabase}
          />
        );
      default:
        return <div>View type not supported</div>;
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-white">{database.name}</h1>
          <Select value={currentViewId} onValueChange={setCurrentViewId}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {database.views.map(view => (
                <SelectItem key={view.id} value={view.id}>
                  <div className="flex items-center gap-2">
                    {getViewIcon(view.type)}
                    {view.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProperties(!showProperties)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Propriedades
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={addNewRow}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova linha
          </Button>
        </div>
      </div>

      {/* Properties Panel */}
      {showProperties && (
        <DatabaseProperties
          database={database}
          onUpdateDatabase={onUpdateDatabase}
          onClose={() => setShowProperties(false)}
        />
      )}

      {/* View Content */}
      <div className="bg-notion-dark rounded-lg border border-notion-dark-border">
        {renderView()}
      </div>
    </div>
  );
};
