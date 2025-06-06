
import React from 'react';
import { Database, DatabaseView } from '@/types/database';

interface DatabaseCalendarProps {
  database: Database;
  view: DatabaseView;
  onUpdateDatabase: (updates: Partial<Database>) => void;
}

export const DatabaseCalendar: React.FC<DatabaseCalendarProps> = ({
  database,
  view,
  onUpdateDatabase
}) => {
  return (
    <div className="p-8 text-center text-gray-400">
      <p>Vista de Calendário - Em desenvolvimento</p>
      <p className="text-sm mt-2">Configure um campo de data para visualizar no calendário</p>
    </div>
  );
};
