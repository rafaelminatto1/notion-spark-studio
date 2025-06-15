export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
  search?: string;
  dueDate?: Date;
} 