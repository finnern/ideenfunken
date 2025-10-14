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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      book_vote_logs: {
        Row: {
          action: string
          book_id: string
          created_at: string | null
          id: number
          new_count: number
          user_id: string
        }
        Insert: {
          action: string
          book_id: string
          created_at?: string | null
          id?: number
          new_count: number
          user_id: string
        }
        Update: {
          action?: string
          book_id?: string
          created_at?: string | null
          id?: number
          new_count?: number
          user_id?: string
        }
        Relationships: []
      }
      book_votes: {
        Row: {
          book_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_votes_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_votes_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books_public"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string | null
          available_in_mediathek: boolean | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          inspiration_quote: string | null
          is_anonymous: boolean | null
          isbn: string | null
          more_info_url: string | null
          original_cover_url: string | null
          suggested_by: string | null
          suggester_name: string | null
          title: string
          updated_at: string
          url_good_reads: string | null
          votes: number | null
        }
        Insert: {
          author?: string | null
          available_in_mediathek?: boolean | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          inspiration_quote?: string | null
          is_anonymous?: boolean | null
          isbn?: string | null
          more_info_url?: string | null
          original_cover_url?: string | null
          suggested_by?: string | null
          suggester_name?: string | null
          title: string
          updated_at?: string
          url_good_reads?: string | null
          votes?: number | null
        }
        Update: {
          author?: string | null
          available_in_mediathek?: boolean | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          inspiration_quote?: string | null
          is_anonymous?: boolean | null
          isbn?: string | null
          more_info_url?: string | null
          original_cover_url?: string | null
          suggested_by?: string | null
          suggester_name?: string | null
          title?: string
          updated_at?: string
          url_good_reads?: string | null
          votes?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          anonymous_suggestions: boolean | null
          created_at: string
          display_name: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          points_remaining: number
        }
        Insert: {
          anonymous_suggestions?: boolean | null
          created_at?: string
          display_name?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          points_remaining?: number
        }
        Update: {
          anonymous_suggestions?: boolean | null
          created_at?: string
          display_name?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          points_remaining?: number
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
      books_public: {
        Row: {
          author: string | null
          available_in_mediathek: boolean | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string | null
          inspiration_quote: string | null
          is_anonymous: boolean | null
          isbn: string | null
          more_info_url: string | null
          original_cover_url: string | null
          suggested_by: string | null
          suggester_name: string | null
          title: string | null
          updated_at: string | null
          url_good_reads: string | null
          votes: number | null
        }
        Insert: {
          author?: string | null
          available_in_mediathek?: boolean | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          inspiration_quote?: string | null
          is_anonymous?: boolean | null
          isbn?: string | null
          more_info_url?: string | null
          original_cover_url?: string | null
          suggested_by?: never
          suggester_name?: never
          title?: string | null
          updated_at?: string | null
          url_good_reads?: string | null
          votes?: number | null
        }
        Update: {
          author?: string | null
          available_in_mediathek?: boolean | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          inspiration_quote?: string | null
          is_anonymous?: boolean | null
          isbn?: string | null
          more_info_url?: string | null
          original_cover_url?: string | null
          suggested_by?: never
          suggester_name?: never
          title?: string | null
          updated_at?: string | null
          url_good_reads?: string | null
          votes?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_vote: {
        Args: { book_id: string; user_id: string } | { book_id_param: string }
        Returns: {
          error_message: string
          new_vote_count: number
          remaining_points: number
          success: boolean
        }[]
      }
      admin_reset_all_votes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      decrement_vote: {
        Args: { book_id: string }
        Returns: {
          new_votes: number
        }[]
      }
      get_book_vote_count: {
        Args: { book_id_param: string }
        Returns: number
      }
      get_voting_data: {
        Args: { book_id_param: string }
        Returns: {
          book_votes: number
          user_has_voted: boolean
          user_remaining_points: number
          user_suggested_book: boolean
        }[]
      }
      get_voting_info: {
        Args: { book_id_param: string }
        Returns: {
          book_votes: number
          user_is_suggester: boolean
          user_remaining_points: number
          user_vote_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_vote: {
        Args: { book_id: string }
        Returns: {
          new_votes: number
        }[]
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      recalculate_all_book_votes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_book_votes: {
        Args: { book_id_param: string }
        Returns: number
      }
      remove_vote: {
        Args: { book_id_param: string }
        Returns: {
          error_message: string
          new_vote_count: number
          remaining_points: number
          success: boolean
        }[]
      }
      reset_all_user_points: {
        Args: { default_points?: number }
        Returns: undefined
      }
      secure_add_vote: {
        Args: { book_id_param: string }
        Returns: boolean
      }
      secure_remove_vote: {
        Args: { book_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
