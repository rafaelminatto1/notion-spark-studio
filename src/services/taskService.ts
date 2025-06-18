import { supabase } from '@/integrations/supabase/client';
import type { Task, TaskFilters } from '@/types/task';

// Database row interface
interface TaskDBRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Database insert interface
interface TaskDBInsert {
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  user_id?: string;
}

// Supabase response types
interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

// Typed Supabase wrapper for tasks
const typedSupabase = {
  from: (table: 'tasks') => ({
    insert: (data: TaskDBInsert[]): Promise<SupabaseResponse<TaskDBRow>> => 
      supabase.from(table).insert(data).select().single() as Promise<SupabaseResponse<TaskDBRow>>,
    
    update: (data: Partial<TaskDBInsert>): {
      eq: (column: string, value: string) => {
        select: () => {
          single: () => Promise<SupabaseResponse<TaskDBRow>>;
        };
      };
    } => ({
      eq: (column: string, value: string) => ({
        select: () => ({
          single: (): Promise<SupabaseResponse<TaskDBRow>> => 
            supabase.from(table).update(data).eq(column, value).select().single() as Promise<SupabaseResponse<TaskDBRow>>
        })
      })
    }),

    delete: (): {
      eq: (column: string, value: string) => Promise<SupabaseResponse<null>>;
    } => ({
      eq: (column: string, value: string): Promise<SupabaseResponse<null>> => 
        supabase.from(table).delete().eq(column, value) as Promise<SupabaseResponse<null>>
    }),

    select: (columns: string) => ({
      order: (column: string, options?: { ascending: boolean }) => ({
        eq: (filterColumn: string, value: string) => Promise.resolve({ data: [] as TaskDBRow[], error: null }),
        contains: (column: string, value: string[]) => Promise.resolve({ data: [] as TaskDBRow[], error: null }),
        or: (condition: string) => Promise.resolve({ data: [] as TaskDBRow[], error: null }),
        gte: (column: string, value: string) => ({
          lte: (column2: string, value2: string) => Promise.resolve({ data: [] as TaskDBRow[], error: null })
        }),
        then: (callback: (result: SupabaseResponse<TaskDBRow[]>) => void) => {
          void supabase.from(table).select(columns).order(column, options).then(callback);
        }
      }),
      eq: (column: string, value: string) => ({
        single: (): Promise<SupabaseResponse<TaskDBRow>> => 
          supabase.from(table).select(columns).eq(column, value).single() as Promise<SupabaseResponse<TaskDBRow>>
      })
    })
  })
};

export const taskService = {
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const insertData: TaskDBInsert = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.dueDate?.toISOString(),
      tags: task.tags,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: task.userId
    };

    // Use original supabase but with proper error handling
    const result = await supabase
      .from('tasks')
      .insert([insertData])
      .select()
      .single();

    if (result.error) throw result.error;
    if (!result.data) throw new Error('No data returned from database');
    
    return this.mapTaskFromDB(result.data as TaskDBRow);
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const updateData: Partial<TaskDBInsert> = {
      updated_at: new Date().toISOString()
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate?.toISOString();
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.userId !== undefined) updateData.user_id = updates.userId;

    const result = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (result.error) throw result.error;
    if (!result.data) throw new Error('No data returned from database');
    
    return this.mapTaskFromDB(result.data as TaskDBRow);
  },

  async deleteTask(id: string): Promise<void> {
    const result = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (result.error) throw result.error;
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

    const result = await query;

    if (result.error) throw result.error;
    if (!result.data) return [];
    
    return result.data.map((row) => this.mapTaskFromDB(row as TaskDBRow));
  },

  async getTaskById(id: string): Promise<Task> {
    const result = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (result.error) throw result.error;
    if (!result.data) throw new Error('Task not found');
    
    return this.mapTaskFromDB(result.data as TaskDBRow);
  },

  mapTaskFromDB(data: TaskDBRow): Task {
    return {
      id: data.id,
      title: data.title,
      description: data.description ?? undefined,
      status: data.status,
      priority: data.priority,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      tags: data.tags ?? [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      userId: data.user_id
    };
  }
}; 