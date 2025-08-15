export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          check_in_date: string
          check_out_date: string
          created_at: string
          guest_count: number
          id: string
          property_id: string
          status: string
          total_nights: number
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_date: string
          check_out_date: string
          created_at?: string
          guest_count: number
          id?: string
          property_id: string
          status?: string
          total_nights: number
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_date?: string
          check_out_date?: string
          created_at?: string
          guest_count?: number
          id?: string
          property_id?: string
          status?: string
          total_nights?: number
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_secure_view"
            referencedColumns: ["id"]
          },
        ]
      }
      image_optimizations: {
        Row: {
          compression_ratio: number
          created_at: string
          id: string
          mime_type: string
          optimized_size: number
          optimized_url: string
          original_size: number
          original_url: string
          thumbnail_size: number | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          compression_ratio: number
          created_at?: string
          id?: string
          mime_type: string
          optimized_size: number
          optimized_url: string
          original_size: number
          original_url: string
          thumbnail_size?: number | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          compression_ratio?: number
          created_at?: string
          id?: string
          mime_type?: string
          optimized_size?: number
          optimized_url?: string
          original_size?: number
          original_url?: string
          thumbnail_size?: number | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
          whatsapp_number: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
          whatsapp_number: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          bathrooms: number
          bedrooms: number
          cep: string | null
          city: string
          country: string
          created_at: string
          description: string
          id: string
          images: string[] | null
          is_available: boolean
          max_guests: number
          owner_id: string
          price_per_night: number
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          bathrooms?: number
          bedrooms?: number
          cep?: string | null
          city: string
          country: string
          created_at?: string
          description: string
          id?: string
          images?: string[] | null
          is_available?: boolean
          max_guests?: number
          owner_id: string
          price_per_night: number
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          bathrooms?: number
          bedrooms?: number
          cep?: string | null
          city?: string
          country?: string
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          is_available?: boolean
          max_guests?: number
          owner_id?: string
          price_per_night?: number
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      property_blocks: {
        Row: {
          blocked_date: string
          created_at: string
          created_by: string
          id: string
          property_id: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          blocked_date: string
          created_at?: string
          created_by: string
          id?: string
          property_id: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          blocked_date?: string
          created_at?: string
          created_by?: string
          id?: string
          property_id?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          property_id: string
          rating: number
          review_type: string
          reviewed_id: string
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          property_id: string
          rating: number
          review_type: string
          reviewed_id: string
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          property_id?: string
          rating?: number
          review_type?: string
          reviewed_id?: string
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          created_at: string | null
          event_details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
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
    }
    Views: {
      properties_public: {
        Row: {
          address: string | null
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          cep: string | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string | null
          images: string[] | null
          is_available: boolean | null
          max_guests: number | null
          price_per_night: number | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          cep?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_available?: boolean | null
          max_guests?: number | null
          price_per_night?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          cep?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_available?: boolean | null
          max_guests?: number | null
          price_per_night?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      properties_secure_view: {
        Row: {
          address: string | null
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          cep: string | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string | null
          images: string[] | null
          is_available: boolean | null
          max_guests: number | null
          price_per_night: number | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          cep?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_available?: boolean | null
          max_guests?: number | null
          price_per_night?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          cep?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_available?: boolean | null
          max_guests?: number | null
          price_per_night?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_optimization_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_images: number
          total_original_size: number
          total_optimized_size: number
          average_compression_ratio: number
          total_savings_mb: number
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_event_type: string
          p_event_details?: Json
          p_user_id?: string
        }
        Returns: undefined
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user" | "proprietario"
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
      app_role: ["admin", "user", "proprietario"],
    },
  },
} as const
