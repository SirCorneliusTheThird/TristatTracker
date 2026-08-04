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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          actor_avatar: string | null
          actor_name: string
          created_at: string
          detail: string | null
          friend_id: string | null
          game_name: string | null
          id: string
          kind: string
          platform: Database["public"]["Enums"]["platform"]
          title: string
          user_id: string
        }
        Insert: {
          actor_avatar?: string | null
          actor_name: string
          created_at?: string
          detail?: string | null
          friend_id?: string | null
          game_name?: string | null
          id?: string
          kind: string
          platform: Database["public"]["Enums"]["platform"]
          title: string
          user_id: string
        }
        Update: {
          actor_avatar?: string | null
          actor_name?: string
          created_at?: string
          detail?: string | null
          friend_id?: string | null
          game_name?: string | null
          id?: string
          kind?: string
          platform?: Database["public"]["Enums"]["platform"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "friends"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          achievements_count: number
          avatar_url: string | null
          current_game: string | null
          games_count: number
          id: string
          is_private: boolean
          last_played_at: string | null
          last_played_game: string | null
          name: string
          platform: Database["public"]["Enums"]["platform"]
          platform_friend_id: string
          status: Database["public"]["Enums"]["presence"]
          synced_at: string
          total_playtime_minutes: number
          user_id: string
        }
        Insert: {
          achievements_count?: number
          avatar_url?: string | null
          current_game?: string | null
          games_count?: number
          id?: string
          is_private?: boolean
          last_played_at?: string | null
          last_played_game?: string | null
          name: string
          platform: Database["public"]["Enums"]["platform"]
          platform_friend_id: string
          status?: Database["public"]["Enums"]["presence"]
          synced_at?: string
          total_playtime_minutes?: number
          user_id: string
        }
        Update: {
          achievements_count?: number
          avatar_url?: string | null
          current_game?: string | null
          games_count?: number
          id?: string
          is_private?: boolean
          last_played_at?: string | null
          last_played_game?: string | null
          name?: string
          platform?: Database["public"]["Enums"]["platform"]
          platform_friend_id?: string
          status?: Database["public"]["Enums"]["presence"]
          synced_at?: string
          total_playtime_minutes?: number
          user_id?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          achievements_total: number
          achievements_unlocked: number
          app_id: string
          cover_url: string | null
          id: string
          last_played_at: string | null
          name: string
          platform: Database["public"]["Enums"]["platform"]
          playtime_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements_total?: number
          achievements_unlocked?: number
          app_id: string
          cover_url?: string | null
          id?: string
          last_played_at?: string | null
          name: string
          platform: Database["public"]["Enums"]["platform"]
          playtime_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements_total?: number
          achievements_unlocked?: number
          app_id?: string
          cover_url?: string | null
          id?: string
          last_played_at?: string | null
          name?: string
          platform?: Database["public"]["Enums"]["platform"]
          playtime_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_events: {
        Row: {
          created_at: string
          goal_id: string | null
          id: string
          kind: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_id?: string | null
          id?: string
          kind: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string | null
          id?: string
          kind?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_events_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          completed_at: string | null
          created_at: string
          current_value: number
          game_name: string | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          id: string
          platform: Database["public"]["Enums"]["platform"] | null
          status: Database["public"]["Enums"]["goal_status"]
          target_value: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          game_name?: string | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          id?: string
          platform?: Database["public"]["Enums"]["platform"] | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_value: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          game_name?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          platform?: Database["public"]["Enums"]["platform"] | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_value?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      linked_accounts: {
        Row: {
          avatar_url: string | null
          id: string
          last_synced_at: string | null
          linked_at: string
          platform: Database["public"]["Enums"]["platform"]
          platform_user_id: string
          platform_username: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          id?: string
          last_synced_at?: string | null
          linked_at?: string
          platform: Database["public"]["Enums"]["platform"]
          platform_user_id: string
          platform_username: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          id?: string
          last_synced_at?: string | null
          linked_at?: string
          platform?: Database["public"]["Enums"]["platform"]
          platform_user_id?: string
          platform_username?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          hide_achievements: boolean
          hide_activity: boolean
          hide_friends_list: boolean
          hide_online_status: boolean
          hide_playtime: boolean
          id: string
          kids_mode: boolean
          parental_pin: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          hide_achievements?: boolean
          hide_activity?: boolean
          hide_friends_list?: boolean
          hide_online_status?: boolean
          hide_playtime?: boolean
          id: string
          kids_mode?: boolean
          parental_pin?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          hide_achievements?: boolean
          hide_activity?: boolean
          hide_friends_list?: boolean
          hide_online_status?: boolean
          hide_playtime?: boolean
          id?: string
          kids_mode?: boolean
          parental_pin?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      goal_status: "active" | "completed"
      goal_type: "playtime" | "achievement" | "game"
      platform: "steam" | "epic"
      presence: "online" | "offline" | "in-game" | "idle"
      visibility: "public" | "friends" | "private"
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
      goal_status: ["active", "completed"],
      goal_type: ["playtime", "achievement", "game"],
      platform: ["steam", "epic"],
      presence: ["online", "offline", "in-game", "idle"],
      visibility: ["public", "friends", "private"],
    },
  },
} as const
