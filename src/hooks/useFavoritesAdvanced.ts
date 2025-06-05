
import { useState, useCallback, useEffect } from 'react';
import { useDataService } from './useDataService';
import { useToast } from '@/hooks/use-toast';
import { FileItem } from '@/types';

export interface FavoriteItem {
  id: string;
  fileId: string;
  fileName: string;
  fileType: 'file' | 'folder';
  category: string;
  tags: string[];
  addedAt: Date;
  lastAccessed: Date;
  accessCount: number;
  notes?: string;
  emoji?: string;
}

export interface FavoriteCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
}

export const useFavoritesAdvanced = () => {
  const dataService = useDataService();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [categories, setCategories] = useState<FavoriteCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar favoritos e categorias
  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedFavorites, savedCategories] = await Promise.all([
          dataService.query<FavoriteItem>('favorites'),
          dataService.query<FavoriteCategory>('favorite_categories')
        ]);

        if (savedCategories.length === 0) {
          // Criar categorias padrão
          const defaultCategories: FavoriteCategory[] = [
            { id: 'estudos', name: 'Estudos', color: '#3B82F6', icon: '📚', order: 1 },
            { id: 'trabalho', name: 'Trabalho', color: '#10B981', icon: '💼', order: 2 },
            { id: 'pessoal', name: 'Pessoal', color: '#F59E0B', icon: '👤', order: 3 },
            { id: 'projetos', name: 'Projetos', color: '#8B5CF6', icon: '🚀', order: 4 },
            { id: 'referencias', name: 'Referências', color: '#EF4444', icon: '🔗', order: 5 }
          ];

          for (const category of defaultCategories) {
            await dataService.createFile(category);
          }
          setCategories(defaultCategories);
        } else {
          setCategories(savedCategories.sort((a, b) => a.order - b.order));
        }

        setFavorites(savedFavorites.sort((a, b) => 
          new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
        ));
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dataService]);

  const addToFavorites = useCallback(async (
    file: FileItem, 
    category: string = 'pessoal', 
    notes?: string
  ) => {
    // Verificar se já está nos favoritos
    const existing = favorites.find(f => f.fileId === file.id);
    if (existing) {
      toast({
        title: "Já nos favoritos",
        description: `"${file.name}" já está na lista de favoritos`
      });
      return;
    }

    const newFavorite: FavoriteItem = {
      id: `fav_${Date.now()}`,
      fileId: file.id,
      fileName: file.name,
      fileType: file.type,
      category,
      tags: file.tags || [],
      addedAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      notes,
      emoji: file.emoji
    };

    try {
      await dataService.createFile(newFavorite);
      setFavorites(prev => [newFavorite, ...prev]);
      
      toast({
        title: "Adicionado aos favoritos",
        description: `"${file.name}" foi adicionado aos favoritos`
      });
    } catch (error) {
      toast({
        title: "Erro ao adicionar",
        description: "Falha ao adicionar aos favoritos",
        variant: "destructive"
      });
    }
  }, [favorites, dataService, toast]);

  const removeFromFavorites = useCallback(async (favoriteId: string) => {
    try {
      await dataService.deleteFile(favoriteId);
      const removed = favorites.find(f => f.id === favoriteId);
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      
      toast({
        title: "Removido dos favoritos",
        description: `"${removed?.fileName}" foi removido dos favoritos`
      });
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Falha ao remover dos favoritos",
        variant: "destructive"
      });
    }
  }, [favorites, dataService, toast]);

  const updateFavorite = useCallback(async (favoriteId: string, updates: Partial<FavoriteItem>) => {
    try {
      await dataService.updateFile(favoriteId, updates);
      setFavorites(prev => prev.map(f => 
        f.id === favoriteId ? { ...f, ...updates } : f
      ));
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
    }
  }, [dataService]);

  const accessFavorite = useCallback(async (favoriteId: string) => {
    const favorite = favorites.find(f => f.id === favoriteId);
    if (!favorite) return;

    const updates = {
      lastAccessed: new Date(),
      accessCount: favorite.accessCount + 1
    };

    await updateFavorite(favoriteId, updates);
  }, [favorites, updateFavorite]);

  const getFavoritesByCategory = useCallback((category: string) => {
    return favorites.filter(f => f.category === category);
  }, [favorites]);

  const getMostAccessed = useCallback((limit = 5) => {
    return [...favorites]
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }, [favorites]);

  const getRecentlyAdded = useCallback((limit = 5) => {
    return [...favorites]
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, limit);
  }, [favorites]);

  const searchFavorites = useCallback((query: string) => {
    return favorites.filter(f => 
      f.fileName.toLowerCase().includes(query.toLowerCase()) ||
      f.notes?.toLowerCase().includes(query.toLowerCase()) ||
      f.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }, [favorites]);

  const createCategory = useCallback(async (name: string, color: string, icon: string) => {
    const newCategory: FavoriteCategory = {
      id: `cat_${Date.now()}`,
      name,
      color,
      icon,
      order: categories.length + 1
    };

    try {
      await dataService.createFile(newCategory);
      setCategories(prev => [...prev, newCategory].sort((a, b) => a.order - b.order));
      
      toast({
        title: "Categoria criada",
        description: `Categoria "${name}" foi criada`
      });
    } catch (error) {
      toast({
        title: "Erro ao criar categoria",
        description: "Falha ao criar a categoria",
        variant: "destructive"
      });
    }
  }, [categories, dataService, toast]);

  const isFavorite = useCallback((fileId: string) => {
    return favorites.some(f => f.fileId === fileId);
  }, [favorites]);

  return {
    favorites,
    categories,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    updateFavorite,
    accessFavorite,
    getFavoritesByCategory,
    getMostAccessed,
    getRecentlyAdded,
    searchFavorites,
    createCategory,
    isFavorite
  };
};
