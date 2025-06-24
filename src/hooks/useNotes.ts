import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NoteService, Note } from '@/services/NoteService';

export function useNotes() {
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ['notes'],
    queryFn: NoteService.list,
  });

  const createNote = useMutation({
    mutationFn: (data: { title: string; content: string }) => NoteService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const removeNote = useMutation({
    mutationFn: (id: string) => NoteService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  return {
    notes,
    isLoading,
    error,
    createNote,
    removeNote,
  };
} 