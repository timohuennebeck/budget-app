// Generated from the hosted project (Supabase generate_typescript_types).
// Regenerate with `npm run db:types` after changing the schema.
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
      app_config: {
        Row: {
          description: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      captures: {
        Row: {
          completed_at: string | null
          created_at: string
          error_code: string | null
          id: string
          input_text: string | null
          input_tokens: number | null
          duration_ms: number | null
          model: string | null
          output_tokens: number | null
          profile_id: string
          provider: string | null
          receipt_path: string | null
          result: Json | null
          source: Database["public"]["Enums"]["entry_source"]
          status: Database["public"]["Enums"]["capture_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          input_text?: string | null
          input_tokens?: number | null
          duration_ms?: number | null
          model?: string | null
          output_tokens?: number | null
          profile_id: string
          provider?: string | null
          receipt_path?: string | null
          result?: Json | null
          source: Database["public"]["Enums"]["entry_source"]
          status?: Database["public"]["Enums"]["capture_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          input_text?: string | null
          input_tokens?: number | null
          duration_ms?: number | null
          model?: string | null
          output_tokens?: number | null
          profile_id?: string
          provider?: string | null
          receipt_path?: string | null
          result?: Json | null
          source?: Database["public"]["Enums"]["entry_source"]
          status?: Database["public"]["Enums"]["capture_status"]
        }
        Relationships: [
          {
            foreignKeyName: "captures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          archived_at: string | null
          created_at: string
          hue: number
          icon: string
          id: string
          name: string
          profile_id: string
          sort_order: number
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          hue: number
          icon: string
          id?: string
          name: string
          profile_id: string
          sort_order?: number
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          hue?: number
          icon?: string
          id?: string
          name?: string
          profile_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories_limits: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          id: string
          preset_id: string | null
          profile_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          id?: string
          preset_id?: string | null
          profile_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          id?: string
          preset_id?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_limits_category_fkey"
            columns: ["category_id", "profile_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "profile_id"]
          },
          {
            foreignKeyName: "categories_limits_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "categories_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_limits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories_presets: {
        Row: {
          group_key: string
          hue: number
          icon: string
          id: string
          keywords: Json
          names: Json
          peer_average: number | null
          sort_order: number
          suggested: boolean
        }
        Insert: {
          group_key: string
          hue: number
          icon: string
          id: string
          keywords?: Json
          names: Json
          peer_average?: number | null
          sort_order?: number
          suggested?: boolean
        }
        Update: {
          group_key?: string
          hue?: number
          icon?: string
          id?: string
          keywords?: Json
          names?: Json
          peer_average?: number | null
          sort_order?: number
          suggested?: boolean
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          actual: number | null
          closeness: number | null
          created_at: string
          expense_count: number
          guess: number | null
          id: string
          profile_id: string
          skipped: boolean
          week_start: string
        }
        Insert: {
          actual?: number | null
          closeness?: number | null
          created_at?: string
          expense_count?: number
          guess?: number | null
          id?: string
          profile_id: string
          skipped?: boolean
          week_start: string
        }
        Update: {
          actual?: number | null
          closeness?: number | null
          created_at?: string
          expense_count?: number
          guess?: number | null
          id?: string
          profile_id?: string
          skipped?: boolean
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          amount: number
          capture_id: string | null
          category_id: string | null
          created_at: string
          id: string
          is_favorite: boolean
          kind: Database["public"]["Enums"]["entry_kind"]
          occurred_at: string
          preset_id: string | null
          profile_id: string
          source: Database["public"]["Enums"]["entry_source"]
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          capture_id?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          kind?: Database["public"]["Enums"]["entry_kind"]
          occurred_at?: string
          preset_id?: string | null
          profile_id: string
          source?: Database["public"]["Enums"]["entry_source"]
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          capture_id?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          kind?: Database["public"]["Enums"]["entry_kind"]
          occurred_at?: string
          preset_id?: string | null
          profile_id?: string
          source?: Database["public"]["Enums"]["entry_source"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_capture_id_fkey"
            columns: ["capture_id"]
            isOneToOne: false
            referencedRelation: "captures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_category_fkey"
            columns: ["category_id", "profile_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "profile_id"]
          },
          {
            foreignKeyName: "entries_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "categories_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entries_allowance: {
        Row: {
          period_start: string
          profile_id: string
          used: number
        }
        Insert: {
          period_start: string
          profile_id: string
          used?: number
        }
        Update: {
          period_start?: string
          profile_id?: string
          used?: number
        }
        Relationships: [
          {
            foreignKeyName: "entries_allowance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_acceptances: {
        Row: {
          accepted_at: string
          app_version: string | null
          document_id: string
          id: string
          platform: Database["public"]["Enums"]["platform"] | null
          profile_id: string
        }
        Insert: {
          accepted_at?: string
          app_version?: string | null
          document_id: string
          id?: string
          platform?: Database["public"]["Enums"]["platform"] | null
          profile_id: string
        }
        Update: {
          accepted_at?: string
          app_version?: string | null
          document_id?: string
          id?: string
          platform?: Database["public"]["Enums"]["platform"] | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_acceptances_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_acceptances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          content_md: string
          effective_at: string
          id: string
          kind: Database["public"]["Enums"]["legal_doc_kind"]
          locale: string
          requires_reacceptance: boolean
          version: string
        }
        Insert: {
          content_md: string
          effective_at: string
          id?: string
          kind: Database["public"]["Enums"]["legal_doc_kind"]
          locale?: string
          requires_reacceptance?: boolean
          version: string
        }
        Update: {
          content_md?: string
          effective_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["legal_doc_kind"]
          locale?: string
          requires_reacceptance?: boolean
          version?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          occurrence: string
          error: string | null
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          opened_at: string | null
          path: string | null
          profile_id: string
          scheduled_for: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          occurrence: string
          error?: string | null
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          opened_at?: string | null
          path?: string | null
          profile_id: string
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          occurrence?: string
          error?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          opened_at?: string | null
          path?: string | null
          profile_id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_settings: {
        Row: {
          enabled: boolean
          kind: Database["public"]["Enums"]["notification_kind"]
          profile_id: string
          repeat: Database["public"]["Enums"]["reminder_repeat"] | null
          time: string | null
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          kind: Database["public"]["Enums"]["notification_kind"]
          profile_id: string
          repeat?: Database["public"]["Enums"]["reminder_repeat"] | null
          time?: string | null
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          kind?: Database["public"]["Enums"]["notification_kind"]
          profile_id?: string
          repeat?: Database["public"]["Enums"]["reminder_repeat"] | null
          time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_settings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_templates: {
        Row: {
          active: boolean
          content: string
          kind: Database["public"]["Enums"]["notification_kind"]
          locale: string
          title: string
          updated_at: string
          path: string | null
        }
        Insert: {
          active?: boolean
          content: string
          kind: Database["public"]["Enums"]["notification_kind"]
          locale: string
          title: string
          updated_at?: string
          path?: string | null
        }
        Update: {
          active?: boolean
          content?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          locale?: string
          title?: string
          updated_at?: string
          path?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          budget_mode: Database["public"]["Enums"]["budget_mode"]
          created_at: string
          currency: string
          first_name: string
          id: string
          locale: string
          month_start_day: number
          monthly_budget: number | null
          onboarded_at: string | null
          plus_expires_at: string | null
          rating_prompted_at: string | null
          time_zone: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          budget_mode?: Database["public"]["Enums"]["budget_mode"]
          created_at?: string
          currency?: string
          first_name?: string
          id: string
          locale?: string
          month_start_day?: number
          monthly_budget?: number | null
          onboarded_at?: string | null
          plus_expires_at?: string | null
          rating_prompted_at?: string | null
          time_zone?: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          budget_mode?: Database["public"]["Enums"]["budget_mode"]
          created_at?: string
          currency?: string
          first_name?: string
          id?: string
          locale?: string
          month_start_day?: number
          monthly_budget?: number | null
          onboarded_at?: string | null
          plus_expires_at?: string | null
          rating_prompted_at?: string | null
          time_zone?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          platform: Database["public"]["Enums"]["platform"]
          profile_id: string
          token: string
          updated_at: string
        }
        Insert: {
          platform: Database["public"]["Enums"]["platform"]
          profile_id: string
          token: string
          updated_at?: string
        }
        Update: {
          platform?: Database["public"]["Enums"]["platform"]
          profile_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_ai_capture: {
        Args: {
          p_capture_id?: string
          p_input_text?: string
          p_model?: string
          p_profile_id: string
          p_provider?: string
          p_receipt_path?: string
          p_source: Database["public"]["Enums"]["entry_source"]
          p_status: Database["public"]["Enums"]["capture_status"]
        }
        Returns: string
      }
      delete_own_account: { Args: never; Returns: undefined }
      is_notifications_cron_secret: {
        Args: { p_secret: string }
        Returns: boolean
      }
      register_push_token: {
        Args: {
          p_platform: Database["public"]["Enums"]["platform"]
          p_token: string
        }
        Returns: undefined
      }
    }
    Enums: {
      budget_mode: "monthly" | "per_category" | "none"
      capture_status: "pending" | "processing" | "parsed" | "failed"
      entry_kind: "expense" | "income"
      entry_source: "text" | "voice" | "camera" | "manual" | "wallet"
      legal_doc_kind: "terms" | "privacy"
      notification_kind:
        | "daily_reminder"
        | "check_in_open"
        | "check_in_closing"
        | "budget_warning"
        | "budget_exceeded"
        | "limit_almost_reached"
      notification_status: "queued" | "sent" | "failed" | "skipped"
      platform: "ios" | "android" | "web"
      reminder_repeat: "daily" | "weekdays"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      budget_mode: ["monthly", "per_category", "none"],
      capture_status: ["pending", "processing", "parsed", "failed"],
      entry_kind: ["expense", "income"],
      entry_source: ["text", "voice", "camera", "manual", "wallet"],
      legal_doc_kind: ["terms", "privacy"],
      notification_kind: [
        "daily_reminder",
        "check_in_open",
        "check_in_closing",
        "budget_warning",
        "budget_exceeded",
        "limit_almost_reached",
      ],
      notification_status: ["queued", "sent", "failed", "skipped"],
      platform: ["ios", "android", "web"],
      reminder_repeat: ["daily", "weekdays"],
    },
  },
} as const
