
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateNoteData {
  title: string;
  content: string;
}

export function useNotes() {
  const queryClient = useQueryClient();

  // Mock notes data
  const mockNotes: Note[] = [
    {
      id: '1',
      title: 'Project Ideas',
      content: 'List of interesting project ideas to explore in the future.',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    }
  ];

  const { data: notes = mockNotes, isLoading, error } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => mockNotes,
  });

  const createNote = useMutation({
    mutationFn: async (noteData: CreateNoteData): Promise<Note> => {
      const newNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        ...noteData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return newNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const removeNote = useMutation({
    mutationFn: async (id: string) => {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 100));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  return {
    notes,
    isLoading,
    error,
    createNote,
    removeNote,
  };
}
