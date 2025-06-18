
import React from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FavoritesManagerProps {
  fileId: string;
  favorites: string[];
  onToggleFavorite: (fileId: string) => void;
  className?: string;
}

export const FavoritesManager: React.FC<FavoritesManagerProps> = ({
  fileId,
  favorites,
  onToggleFavorite,
  className
}) => {
  const isFavorite = favorites.includes(fileId);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => { onToggleFavorite(fileId); }}
      className={cn(
        "gap-2",
        isFavorite 
          ? "text-yellow-400 hover:text-yellow-300" 
          : "text-gray-400 hover:text-yellow-400",
        className
      )}
    >
      <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
      {isFavorite ? 'Favorito' : 'Favoritar'}
    </Button>
  );
};
