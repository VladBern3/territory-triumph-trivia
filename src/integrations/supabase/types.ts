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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      choice_questions: {
        Row: {
          category: string | null
          correct_answer: string
          created_at: string | null
          difficulty: number | null
          id: string
          options: Json
          text: string
        }
        Insert: {
          category?: string | null
          correct_answer: string
          created_at?: string | null
          difficulty?: number | null
          id?: string
          options: Json
          text: string
        }
        Update: {
          category?: string | null
          correct_answer?: string
          created_at?: string | null
          difficulty?: number | null
          id?: string
          options?: Json
          text?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          answers: Json | null
          attacking_player: string | null
          capital_battle_round: number | null
          code: string
          created_at: string
          current_animation: Json | null
          current_question: Json | null
          current_turn: string | null
          defending_player: string | null
          host_player_id: string
          id: string
          map_state: Json | null
          phase: string
          players: Json | null
          round_number: number | null
          target_territory: string | null
          updated_at: string
          winner: Json | null
        }
        Insert: {
          answers?: Json | null
          attacking_player?: string | null
          capital_battle_round?: number | null
          code: string
          created_at?: string
          current_animation?: Json | null
          current_question?: Json | null
          current_turn?: string | null
          defending_player?: string | null
          host_player_id: string
          id?: string
          map_state?: Json | null
          phase?: string
          players?: Json | null
          round_number?: number | null
          target_territory?: string | null
          updated_at?: string
          winner?: Json | null
        }
        Update: {
          answers?: Json | null
          attacking_player?: string | null
          capital_battle_round?: number | null
          code?: string
          created_at?: string
          current_animation?: Json | null
          current_question?: Json | null
          current_turn?: string | null
          defending_player?: string | null
          host_player_id?: string
          id?: string
          map_state?: Json | null
          phase?: string
          players?: Json | null
          round_number?: number | null
          target_territory?: string | null
          updated_at?: string
          winner?: Json | null
        }
        Relationships: []
      }
      numeric_questions: {
        Row: {
          category: string | null
          correct_answer: number
          created_at: string | null
          difficulty: number | null
          id: string
          text: string
        }
        Insert: {
          category?: string | null
          correct_answer: number
          created_at?: string | null
          difficulty?: number | null
          id?: string
          text: string
        }
        Update: {
          category?: string | null
          correct_answer?: number
          created_at?: string | null
          difficulty?: number | null
          id?: string
          text?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          games_played: number | null
          games_won: number | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          games_played?: number | null
          games_won?: number | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          games_played?: number | null
          games_won?: number | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_choice_answer: {
        Args: { question_id: string; user_answer: string }
        Returns: boolean
      }
      check_numeric_answer: {
        Args: { question_id: string; user_answer: number }
        Returns: {
          correct_answer: number
          difference: number
          is_correct: boolean
        }[]
      }
      get_random_choice_question: {
        Args: { excluded_ids?: string[] }
        Returns: {
          category: string
          difficulty: number
          id: string
          options: Json
          text: string
        }[]
      }
      get_random_numeric_question: {
        Args: { excluded_ids?: string[] }
        Returns: {
          category: string
          difficulty: number
          id: string
          text: string
        }[]
      }
      is_game_host: { Args: { session_id: string }; Returns: boolean }
      is_game_participant: { Args: { session_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
