// Mirrors `supabase gen types typescript --local` for the current migrations.
// Regenerate with `npm run db:types` after changing the schema.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      app_config: {
        Row: {
          description: string;
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          description: string;
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value: Json;
        };
        Update: {
          description?: string;
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          archived_at: string | null;
          created_at: string;
          hue: number;
          icon: string;
          id: string;
          key: string | null;
          monthly_limit: number | null;
          name: string;
          profile_id: string;
          sort_order: number;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          hue: number;
          icon: string;
          id?: string;
          key?: string | null;
          monthly_limit?: number | null;
          name: string;
          profile_id: string;
          sort_order?: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          hue?: number;
          icon?: string;
          id?: string;
          key?: string | null;
          monthly_limit?: number | null;
          name?: string;
          profile_id?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      entries: {
        Row: {
          amount: number;
          category_id: string | null;
          created_at: string;
          id: string;
          is_favorite: boolean;
          kind: Database['public']['Enums']['entry_kind'];
          occurred_at: string;
          profile_id: string;
          source: Database['public']['Enums']['entry_source'];
          title: string;
          total_amount: number | null;
          updated_at: string;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          is_favorite?: boolean;
          kind?: Database['public']['Enums']['entry_kind'];
          occurred_at?: string;
          profile_id: string;
          source?: Database['public']['Enums']['entry_source'];
          title: string;
          total_amount?: number | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          is_favorite?: boolean;
          kind?: Database['public']['Enums']['entry_kind'];
          occurred_at?: string;
          profile_id?: string;
          source?: Database['public']['Enums']['entry_source'];
          title?: string;
          total_amount?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      legal_acceptances: {
        Row: {
          accepted_at: string;
          app_version: string | null;
          document_id: string;
          id: string;
          platform: Database['public']['Enums']['platform'] | null;
          profile_id: string;
        };
        Insert: {
          accepted_at?: string;
          app_version?: string | null;
          document_id: string;
          id?: string;
          platform?: Database['public']['Enums']['platform'] | null;
          profile_id: string;
        };
        Update: {
          accepted_at?: string;
          app_version?: string | null;
          document_id?: string;
          id?: string;
          platform?: Database['public']['Enums']['platform'] | null;
          profile_id?: string;
        };
        Relationships: [];
      };
      legal_documents: {
        Row: {
          content_md: string;
          effective_at: string;
          id: string;
          kind: Database['public']['Enums']['legal_doc_kind'];
          locale: string;
          requires_reacceptance: boolean;
          version: string;
        };
        Insert: {
          content_md: string;
          effective_at: string;
          id?: string;
          kind: Database['public']['Enums']['legal_doc_kind'];
          locale?: string;
          requires_reacceptance?: boolean;
          version: string;
        };
        Update: {
          content_md?: string;
          effective_at?: string;
          id?: string;
          kind?: Database['public']['Enums']['legal_doc_kind'];
          locale?: string;
          requires_reacceptance?: boolean;
          version?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          birth_date: string | null;
          budget_mode: Database['public']['Enums']['budget_mode'];
          created_at: string;
          currency: string;
          first_name: string;
          id: string;
          locale: string;
          month_start_day: number;
          monthly_budget: number | null;
          onboarded_at: string | null;
          plus_expires_at: string | null;
          rating_prompted_at: string | null;
          reminder_enabled: boolean;
          reminder_repeat: Database['public']['Enums']['reminder_repeat'];
          reminder_time: string;
          time_zone: string;
          updated_at: string;
        };
        Insert: {
          birth_date?: string | null;
          budget_mode?: Database['public']['Enums']['budget_mode'];
          created_at?: string;
          currency?: string;
          first_name?: string;
          id: string;
          locale?: string;
          month_start_day?: number;
          monthly_budget?: number | null;
          onboarded_at?: string | null;
          plus_expires_at?: string | null;
          rating_prompted_at?: string | null;
          reminder_enabled?: boolean;
          reminder_repeat?: Database['public']['Enums']['reminder_repeat'];
          reminder_time?: string;
          time_zone?: string;
          updated_at?: string;
        };
        Update: {
          birth_date?: string | null;
          budget_mode?: Database['public']['Enums']['budget_mode'];
          created_at?: string;
          currency?: string;
          first_name?: string;
          id?: string;
          locale?: string;
          month_start_day?: number;
          monthly_budget?: number | null;
          onboarded_at?: string | null;
          plus_expires_at?: string | null;
          rating_prompted_at?: string | null;
          reminder_enabled?: boolean;
          reminder_repeat?: Database['public']['Enums']['reminder_repeat'];
          reminder_time?: string;
          time_zone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      check_ins: {
        Row: {
          actual: number | null;
          closeness: number | null;
          created_at: string;
          expense_count: number;
          guess: number | null;
          id: string;
          profile_id: string;
          skipped: boolean;
          week_start: string;
        };
        Insert: {
          actual?: number | null;
          created_at?: string;
          expense_count?: number;
          guess?: number | null;
          id?: string;
          profile_id: string;
          skipped?: boolean;
          week_start: string;
        };
        Update: {
          actual?: number | null;
          created_at?: string;
          expense_count?: number;
          guess?: number | null;
          id?: string;
          profile_id?: string;
          skipped?: boolean;
          week_start?: string;
        };
        Relationships: [];
      };
      entries_allowance: {
        Row: {
          cycle_start: string;
          profile_id: string;
          used: number;
        };
        Insert: {
          cycle_start: string;
          profile_id: string;
          used?: number;
        };
        Update: {
          cycle_start?: string;
          profile_id?: string;
          used?: number;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      delete_own_account: { Args: never; Returns: undefined };
    };
    Enums: {
      budget_mode: 'monthly' | 'per_category' | 'none';
      entry_kind: 'expense' | 'income';
      entry_source: 'text' | 'voice' | 'camera' | 'manual';
      legal_doc_kind: 'terms' | 'privacy';
      platform: 'ios' | 'android' | 'web';
      reminder_repeat: 'daily' | 'weekdays';
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
