// Tipos seguros para operações Supabase
// Resolve problemas de no-unsafe-* e no-explicit-any

import type { SupabaseClient, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

// Tipos base do banco de dados
export interface DatabaseTables {
  tasks: {
    Row: {
      id: string;
      title: string;
      description: string | null;
      status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      due_date: string | null;
      tags: string[] | null;
      created_at: string;
      updated_at: string;
      user_id: string;
    };
    Insert: {
      id?: string;
      title: string;
      description?: string | null;
      status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      due_date?: string | null;
      tags?: string[] | null;
      created_at?: string;
      updated_at?: string;
      user_id?: string;
    };
    Update: {
      id?: string;
      title?: string;
      description?: string | null;
      status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      due_date?: string | null;
      tags?: string[] | null;
      created_at?: string;
      updated_at?: string;
      user_id?: string;
    };
  };
  workspaces: {
    Row: {
      id: string;
      name: string;
      description: string | null;
      created_at: string;
      updated_at: string;
      user_id: string;
    };
    Insert: {
      id?: string;
      name: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
      user_id?: string;
    };
    Update: {
      id?: string;
      name?: string;
      description?: string | null;
      created_at?: string;
      updated_at?: string;
      user_id?: string;
    };
  };
  documents: {
    Row: {
      id: string;
      title: string;
      content: string;
      created_at: string;
      updated_at: string;
      user_id: string;
      workspace_id: string | null;
    };
    Insert: {
      id?: string;
      title: string;
      content?: string;
      created_at?: string;
      updated_at?: string;
      user_id?: string;
      workspace_id?: string | null;
    };
    Update: {
      id?: string;
      title?: string;
      content?: string;
      created_at?: string;
      updated_at?: string;
      user_id?: string;
      workspace_id?: string | null;
    };
  };
}

// Tipos genéricos seguros para operações Supabase
export type SafeSupabaseClient = SupabaseClient<DatabaseTables>;

export type SafePostgrestResponse<T> = PostgrestResponse<T>;
export type SafePostgrestSingleResponse<T> = PostgrestSingleResponse<T>;

// Helper types para operações específicas
export type TaskRow = DatabaseTables['tasks']['Row'];
export type TaskInsert = DatabaseTables['tasks']['Insert'];
export type TaskUpdate = DatabaseTables['tasks']['Update'];

export type WorkspaceRow = DatabaseTables['workspaces']['Row'];
export type WorkspaceInsert = DatabaseTables['workspaces']['Insert'];
export type WorkspaceUpdate = DatabaseTables['workspaces']['Update'];

export type DocumentRow = DatabaseTables['documents']['Row'];
export type DocumentInsert = DatabaseTables['documents']['Insert'];
export type DocumentUpdate = DatabaseTables['documents']['Update'];

// Tipos para resultados de query seguros
export interface SafeQueryResult<T> {
  data: T[] | null;
  error: {
    message: string;
    details: string;
    hint: string;
    code: string;
  } | null;
  count: number | null;
  status: number;
  statusText: string;
}

export interface SafeSingleQueryResult<T> {
  data: T | null;
  error: {
    message: string;
    details: string;
    hint: string;
    code: string;
  } | null;
  count: number | null;
  status: number;
  statusText: string;
}

// Wrapper functions para operações seguras
export class SafeSupabaseOperations {
  constructor(private client: SafeSupabaseClient) {}

  // Operações de Task
  async getTasks(): Promise<SafeQueryResult<TaskRow>> {
    const result = await this.client
      .from('tasks')
      .select('*');
    
    return {
      data: result.data,
      error: result.error,
      count: result.count,
      status: result.status,
      statusText: result.statusText
    };
  }

  async getTaskById(id: string): Promise<SafeSingleQueryResult<TaskRow>> {
    const result = await this.client
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    return {
      data: result.data,
      error: result.error,
      count: result.count,
      status: result.status,
      statusText: result.statusText
    };
  }

  async createTask(task: TaskInsert): Promise<SafeSingleQueryResult<TaskRow>> {
    const result = await this.client
      .from('tasks')
      .insert(task)
      .select()
      .single();
    
    return {
      data: result.data,
      error: result.error,
      count: result.count,
      status: result.status,
      statusText: result.statusText
    };
  }

  async updateTask(id: string, updates: TaskUpdate): Promise<SafeSingleQueryResult<TaskRow>> {
    const result = await this.client
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return {
      data: result.data,
      error: result.error,
      count: result.count,
      status: result.status,
      statusText: result.statusText
    };
  }

  async deleteTask(id: string): Promise<SafeQueryResult<TaskRow>> {
    const result = await this.client
      .from('tasks')
      .delete()
      .eq('id', id);
    
    return {
      data: result.data,
      error: result.error,
      count: result.count,
      status: result.status,
      statusText: result.statusText
    };
  }

  // Operações de Workspace
  async getWorkspaces(): Promise<SafeQueryResult<WorkspaceRow>> {
    const result = await this.client
      .from('workspaces')
      .select('*');
    
    return {
      data: result.data,
      error: result.error,
      count: result.count,
      status: result.status,
      statusText: result.statusText
    };
  }

  async createWorkspace(workspace: WorkspaceInsert): Promise<SafeSingleQueryResult<WorkspaceRow>> {
    const result = await this.client
      .from('workspaces')
      .insert(workspace)
      .select()
      .single();
    
    return {
      data: result.data,
      error: result.error,
      count: result.count,
      status: result.status,
      statusText: result.statusText
    };
  }

  // Operações de Document
  async getDocuments(): Promise<SafeQueryResult<DocumentRow>> {
    const result = await this.client
      .from('documents')
      .select('*');
    
    return {
      data: result.data,
      error: result.error,
      count: result.count,
      status: result.status,
      statusText: result.statusText
    };
  }

  async createDocument(document: DocumentInsert): Promise<SafeSingleQueryResult<DocumentRow>> {
    const result = await this.client
      .from('documents')
      .insert(document)
      .select()
      .single();
    
    return {
      data: result.data,
      error: result.error,
      count: result.count,
      status: result.status,
      statusText: result.statusText
    };
  }
}

// Função helper para validar resultados de query
export function isQuerySuccess<T>(result: SafeQueryResult<T> | SafeSingleQueryResult<T>): result is SafeQueryResult<T> & { data: NonNullable<T> } {
  return result.error === null && result.data !== null;
}

// Função helper para extrair erro seguro
export function extractSafeError(result: SafeQueryResult<unknown> | SafeSingleQueryResult<unknown>): string {
  if (result.error) {
    return `${result.error.message} (${result.error.code})`;
  }
  return 'Unknown error occurred';
}

// Template para async/await seguro
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  errorMessage = 'Operation failed'
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: `${errorMessage}: ${errorMsg}` };
  }
} 