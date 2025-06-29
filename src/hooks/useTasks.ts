
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskService } from '@/services/TaskService';
import type { Task, TaskFilters } from '@/types/task';

interface TasksHookReturn {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  filters: TaskFilters;
  updateFilters: (newFilters: Partial<TaskFilters>) => void;
  createTask: {
    mutate: (title: string, options?: { onSuccess?: () => void }) => void;
    isPending: boolean;
  };
  toggleTask: {
    mutate: (id: string) => void;
    isPending: boolean;
  };
  removeTask: {
    mutate: (id: string) => void;
    isPending: boolean;
  };
  updateTask: any;
  deleteTask: any;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useTasks(): TasksHookReturn {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TaskFilters>({});

  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskService.getTasks(filters),
  });

  const createTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      return taskService.createTask({
        title,
        description: '',
        status: 'todo',
        priority: 'medium',
        tags: [],
        userId: 'current-user'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return taskService.updateTask(id, { 
        status: 'done' as const,
        updatedAt: new Date()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const removeTaskMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateFilters = (newFilters: Partial<TaskFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Mock tasks for development
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the project',
      status: 'todo',
      priority: 'high',
      tags: ['documentation', 'project'],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'current-user',
      done: false
    }
  ];

  return {
    tasks: tasksData?.data || mockTasks,
    isLoading,
    error,
    filters,
    updateFilters,
    createTask: {
      mutate: (title: string, options?: { onSuccess?: () => void }) => {
        createTaskMutation.mutate(title, {
          onSuccess: options?.onSuccess
        });
      },
      isPending: createTaskMutation.isPending,
    },
    toggleTask: {
      mutate: toggleTaskMutation.mutate,
      isPending: toggleTaskMutation.isPending,
    },
    removeTask: {
      mutate: removeTaskMutation.mutate,
      isPending: removeTaskMutation.isPending,
    },
    updateTask: toggleTaskMutation,
    deleteTask: removeTaskMutation,
    isCreating: createTaskMutation.isPending,
    isUpdating: toggleTaskMutation.isPending,
    isDeleting: removeTaskMutation.isPending,
  };
}
