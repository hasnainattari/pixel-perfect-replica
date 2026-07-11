export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      asset_history: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          asset_id: string
          created_at: string
          id: string
          issue_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          asset_id: string
          created_at?: string
          id?: string
          issue_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          asset_id?: string
          created_at?: string
          id?: string
          issue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "public_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_code: string
          assigned_technician_id: string | null
          category: string | null
          condition: string | null
          created_at: string
          id: string
          last_service_date: string | null
          location: string | null
          name: string
          next_service_date: string | null
          status: Database["public"]["Enums"]["asset_status"]
          updated_at: string
        }
        Insert: {
          asset_code: string
          assigned_technician_id?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          last_service_date?: string | null
          location?: string | null
          name: string
          next_service_date?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
        }
        Update: {
          asset_code?: string
          assigned_technician_id?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          last_service_date?: string | null
          location?: string | null
          name?: string
          next_service_date?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          ai_initial_checks: Json | null
          ai_possible_causes: Json | null
          ai_suggested_category: string | null
          ai_suggested_priority: string | null
          ai_suggested_title: string | null
          ai_was_edited: boolean
          asset_id: string
          assigned_technician_id: string | null
          category: string | null
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          issue_number: string
          priority: Database["public"]["Enums"]["issue_priority"]
          reporter_contact: string | null
          reporter_name: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["issue_status"]
          title: string
        }
        Insert: {
          ai_initial_checks?: Json | null
          ai_possible_causes?: Json | null
          ai_suggested_category?: string | null
          ai_suggested_priority?: string | null
          ai_suggested_title?: string | null
          ai_was_edited?: boolean
          asset_id: string
          assigned_technician_id?: string | null
          category?: string | null
          created_at?: string
          description: string
          evidence_urls?: string[] | null
          id?: string
          issue_number?: string
          priority?: Database["public"]["Enums"]["issue_priority"]
          reporter_contact?: string | null
          reporter_name?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title: string
        }
        Update: {
          ai_initial_checks?: Json | null
          ai_possible_causes?: Json | null
          ai_suggested_category?: string | null
          ai_suggested_priority?: string | null
          ai_suggested_title?: string | null
          ai_was_edited?: boolean
          asset_id?: string
          assigned_technician_id?: string | null
          category?: string | null
          created_at?: string
          description?: string
          evidence_urls?: string[] | null
          id?: string
          issue_number?: string
          priority?: Database["public"]["Enums"]["issue_priority"]
          reporter_contact?: string | null
          reporter_name?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["issue_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "public_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          cost: number | null
          created_at: string
          evidence_urls: string[] | null
          final_condition: string | null
          id: string
          inspection_notes: string | null
          issue_id: string
          parts_used: string | null
          technician_id: string
          work_performed: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          evidence_urls?: string[] | null
          final_condition?: string | null
          id?: string
          inspection_notes?: string | null
          issue_id: string
          parts_used?: string | null
          technician_id: string
          work_performed?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          evidence_urls?: string[] | null
          final_condition?: string | null
          id?: string
          inspection_notes?: string | null
          issue_id?: string
          parts_used?: string | null
          technician_id?: string
          work_performed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      public_assets: {
        Row: {
          asset_code: string | null
          category: string | null
          condition: string | null
          id: string | null
          last_service_date: string | null
          location: string | null
          name: string | null
          next_service_date: string | null
          status: Database["public"]["Enums"]["asset_status"] | null
        }
        Insert: {
          asset_code?: string | null
          category?: string | null
          condition?: string | null
          id?: string | null
          last_service_date?: string | null
          location?: string | null
          name?: string | null
          next_service_date?: string | null
          status?: Database["public"]["Enums"]["asset_status"] | null
        }
        Update: {
          asset_code?: string | null
          category?: string | null
          condition?: string | null
          id?: string | null
          last_service_date?: string | null
          location?: string | null
          name?: string | null
          next_service_date?: string | null
          status?: Database["public"]["Enums"]["asset_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      generate_issue_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "technician"
      asset_status:
        | "operational"
        | "issue_reported"
        | "under_inspection"
        | "under_maintenance"
        | "out_of_service"
        | "retired"
      issue_priority: "low" | "medium" | "high" | "critical"
      issue_status:
        | "reported"
        | "assigned"
        | "inspection_started"
        | "maintenance_in_progress"
        | "waiting_for_parts"
        | "resolved"
        | "closed"
        | "reopened"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "technician"],
      asset_status: [
        "operational",
        "issue_reported",
        "under_inspection",
        "under_maintenance",
        "out_of_service",
        "retired",
      ],
      issue_priority: ["low", "medium", "high", "critical"],
      issue_status: [
        "reported",
        "assigned",
        "inspection_started",
        "maintenance_in_progress",
        "waiting_for_parts",
        "resolved",
        "closed",
        "reopened",
      ],
    },
  },
} as const
