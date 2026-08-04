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
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          chat_type: Database["public"]["Enums"]["chat_type_enum"]
          created_at: string
          ended_at: string | null
          ended_by: string | null
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          chat_type?: Database["public"]["Enums"]["chat_type_enum"]
          created_at?: string
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          chat_type?: Database["public"]["Enums"]["chat_type_enum"]
          created_at?: string
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          addressee_last_read_at: string
          chat_id: string | null
          created_at: string
          id: string
          requester_id: string
          requester_last_read_at: string
          status: Database["public"]["Enums"]["friendship_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          addressee_last_read_at?: string
          chat_id?: string | null
          created_at?: string
          id?: string
          requester_id: string
          requester_last_read_at?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          addressee_last_read_at?: string
          chat_id?: string | null
          created_at?: string
          id?: string
          requester_id?: string
          requester_last_read_at?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          sender_id: string
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number
          avatar_url: string | null
          bio: string | null
          created_at: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          interests: string[]
          name: string
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          age: number
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          interests?: string[]
          name: string
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          age?: number
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          interests?: string[]
          name?: string
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          chat_id: string | null
          created_at: string
          id: string
          reason: string | null
          reported_id: string
          reporter_id: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          reported_id: string
          reporter_id: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          reported_id?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      waiting_pool: {
        Row: {
          blocked_ids: string[]
          created_at: string
          gender: Database["public"]["Enums"]["gender_type"]
          looking_for: Database["public"]["Enums"]["gender_type"]
          user_id: string
        }
        Insert: {
          blocked_ids?: string[]
          created_at?: string
          gender: Database["public"]["Enums"]["gender_type"]
          looking_for: Database["public"]["Enums"]["gender_type"]
          user_id: string
        }
        Update: {
          blocked_ids?: string[]
          created_at?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          looking_for?: Database["public"]["Enums"]["gender_type"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_friend_request: { Args: { p_request_id: string }; Returns: string }
      end_chat: { Args: { _chat_id: string }; Returns: undefined }
      find_or_wait_match: {
        Args: { _looking_for: Database["public"]["Enums"]["gender_type"] }
        Returns: {
          chat_id: string
          matched_with: string
        }[]
      }
      get_chat_partner: {
        Args: { _chat_id: string }
        Returns: {
          avatar_url: string
          id: string
          name: string
        }[]
      }
      get_my_friends: {
        Args: never
        Returns: {
          chat_id: string
          created_at: string
          friend_avatar_url: string
          friend_id: string
          friend_name: string
          friendship_id: string
          last_message_at: string
          last_message_kind: string
          last_message_sender_id: string
          last_message_text: string
          unread_count: number
        }[]
      }
      mark_chat_read: { Args: { _chat_id: string }; Returns: undefined }
      unfriend: { Args: { p_friendship_id: string }; Returns: undefined }
    }
    Enums: {
      chat_type_enum: "random" | "friend"
      friendship_status: "pending" | "accepted" | "declined"
      gender_type: "male" | "female" | "other"
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
      chat_type_enum: ["random", "friend"],
      friendship_status: ["pending", "accepted", "declined"],
      gender_type: ["male", "female", "other"],
    },
  },
} as const
