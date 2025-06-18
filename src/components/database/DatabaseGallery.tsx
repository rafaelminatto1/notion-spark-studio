
import React from 'react';
import type { Database, DatabaseView } from '@/types/database';

interface DatabaseGalleryProps {
  database: Database;
  view: DatabaseView;
  onUpdateDatabase: (updates: Partial<Database>) => void;
}

export const DatabaseGallery: React.FC<DatabaseGalleryProps> = ({
  database,
  view,
  onUpdateDatabase
}) => {
  return (
    <div className="p-8 text-center text-gray-400">
      <p>Vista de Galeria - Em desenvolvimento</p>
      <p className="text-sm mt-2">Configure um campo de imagem para visualizar na galeria</p>
    </div>
  );
};
