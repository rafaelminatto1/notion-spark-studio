
import { useState, useCallback, useMemo } from 'react';
import { FileItem } from '@/types';

export interface LinkSuggestion {
  id: string;
  name: string;
  exists: boolean;
  content?: string;
}

export const useLinkAutocomplete = (files: FileItem[]) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const suggestions = useMemo(() => {
    if (!query) return [];

    const fileList = files.filter(f => f.type === 'file');
    const matchingFiles = fileList.filter(file =>
      file.name.toLowerCase().includes(query.toLowerCase())
    );

    const suggestions: LinkSuggestion[] = matchingFiles.map(file => ({
      id: file.id,
      name: file.name,
      exists: true,
      content: file.content?.slice(0, 100)
    }));

    // Se não encontrar arquivo exato, sugerir criar novo
    if (!matchingFiles.some(f => f.name.toLowerCase() === query.toLowerCase())) {
      suggestions.unshift({
        id: 'create-new',
        name: query,
        exists: false
      });
    }

    return suggestions.slice(0, 8);
  }, [files, query]);

  const openAutocomplete = useCallback((query: string, x: number, y: number) => {
    setQuery(query);
    setPosition({ x, y });
    setIsOpen(true);
  }, []);

  const closeAutocomplete = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  return {
    isOpen,
    query,
    suggestions,
    position,
    openAutocomplete,
    closeAutocomplete,
    setQuery
  };
};
