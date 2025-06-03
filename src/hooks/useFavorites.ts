
import { useState, useCallback } from 'react';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const stored = localStorage.getItem('favorites');
    return stored ? JSON.parse(stored) : [];
  });

  const toggleFavorite = useCallback((fileId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId];
      
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((fileId: string) => {
    return favorites.includes(fileId);
  }, [favorites]);

  return {
    favorites,
    toggleFavorite,
    isFavorite
  };
};
