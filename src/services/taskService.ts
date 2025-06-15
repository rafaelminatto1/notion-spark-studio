import { supabase } from '@/integrations/supabase/client';
import { Task, TaskFilters } from '@/types/task';

export const taskService = {
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        ...task,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapTaskFromDB(data);
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapTaskFromDB(data);
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters?.tags?.length) {
      query = query.contains('tags', filters.tags);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.dueDate) {
      const startOfDay = new Date(filters.dueDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.dueDate);
      endOfDay.setHours(23, 59, 59, 999);

      query = query
        .gte('due_date', startOfDay.toISOString())
        .lte('due_date', endOfDay.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;
    return data.map(this.mapTaskFromDB);
  },

  async getTaskById(id: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return this.mapTaskFromDB(data);
  },

  private mapTaskFromDB(data: any): Task {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      userId: data.user_id
    };
  }
}; 