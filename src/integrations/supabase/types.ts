export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          file_id: string | null
          id: string
          metadata: Json | null
          session_id: string | null
          target_id: string | null
          timestamp: string
          type: string
          user_id: string
          view: string | null
        }
        Insert: {
          file_id?: string | null
          id?: string
          metadata?: Json | null
          session_id?: string | null
          target_id?: string | null
          timestamp?: string
          type: string
          user_id: string
          view?: string | null
        }
        Update: {
          file_id?: string | null
          id?: string
          metadata?: Json | null
          session_id?: string | null
          target_id?: string | null
          timestamp?: string
          type?: string
          user_id?: string
          view?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "work_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      backups: {
        Row: {
          data: Json
          id: string
          name: string
          timestamp: string
          user_id: string
        }
        Insert: {
          data: Json
          id?: string
          name: string
          timestamp?: string
          user_id: string
        }
        Update: {
          data?: Json
          id?: string
          name?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          is_protected: boolean | null
          is_public: boolean | null
          name: string
          parent_id: string | null
          show_in_sidebar: boolean | null
          tags: string[] | null
          type: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_protected?: boolean | null
          is_public?: boolean | null
          name: string
          parent_id?: string | null
          show_in_sidebar?: boolean | null
          tags?: string[] | null
          type: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_protected?: boolean | null
          is_public?: boolean | null
          name?: string
          parent_id?: string | null
          show_in_sidebar?: boolean | null
          tags?: string[] | null
          type?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "shared_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      health_reports: {
        Row: {
          health: string
          id: string
          message: string | null
          metadata: Json | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          health: string
          id?: string
          message?: string | null
          metadata?: Json | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          health?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          created_at: string
          id: string
          name: string
          size_bytes: number | null
          type: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          size_bytes?: number | null
          type: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          size_bytes?: number | null
          type?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          token_hash: string
          used_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          token_hash: string
          used_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          token_hash?: string
          used_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auto_save: boolean | null
          backup_frequency: number | null
          compact_mode: boolean | null
          created_at: string
          default_view: Database["public"]["Enums"]["default_view_type"] | null
          enable_animations: boolean | null
          id: string
          language: Database["public"]["Enums"]["language_type"] | null
          show_line_numbers: boolean | null
          theme: Database["public"]["Enums"]["theme_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_save?: boolean | null
          backup_frequency?: number | null
          compact_mode?: boolean | null
          created_at?: string
          default_view?: Database["public"]["Enums"]["default_view_type"] | null
          enable_animations?: boolean | null
          id?: string
          language?: Database["public"]["Enums"]["language_type"] | null
          show_line_numbers?: boolean | null
          theme?: Database["public"]["Enums"]["theme_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_save?: boolean | null
          backup_frequency?: number | null
          compact_mode?: boolean | null
          created_at?: string
          default_view?: Database["public"]["Enums"]["default_view_type"] | null
          enable_animations?: boolean | null
          id?: string
          language?: Database["public"]["Enums"]["language_type"] | null
          show_line_numbers?: boolean | null
          theme?: Database["public"]["Enums"]["theme_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          id: string
          is_active: boolean | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          start_time?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "shared_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          created_at: string
          current_file_id: string | null
          expanded_folders: string[] | null
          id: string
          last_saved: string | null
          layout_config: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_file_id?: string | null
          expanded_folders?: string[] | null
          id?: string
          last_saved?: string | null
          layout_config?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_file_id?: string | null
          expanded_folders?: string[] | null
          id?: string
          last_saved?: string | null
          layout_config?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_current_file_id_fkey"
            columns: ["current_file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      log_password_reset_attempt: {
        Args: { _email: string; _ip_address?: string; _user_agent?: string }
        Returns: undefined
      }
      request_password_reset_with_otp: {
        Args: { _email: string; _ip_address?: string; _user_agent?: string }
        Returns: Json
      }
      use_password_reset_token: {
        Args: { _token: string }
        Returns: boolean
      }
      validate_otp_token: {
        Args: { _user_id: string; _token: string; _token_type?: string }
        Returns: boolean
      }
      validate_password_reset_token: {
        Args: { _token: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
      default_view_type: "editor" | "graph" | "dashboard"
      language_type: "pt" | "en"
      theme_type: "light" | "dark" | "system"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "viewer"],
      default_view_type: ["editor", "graph", "dashboard"],
      language_type: ["pt", "en"],
      theme_type: ["light", "dark", "system"],
    },
  },
} as const
