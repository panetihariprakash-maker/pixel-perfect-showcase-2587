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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string
          id: string
          summary: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string
          id?: string
          summary?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string
          id?: string
          summary?: string
        }
        Relationships: []
      }
      business_owners: {
        Row: {
          about: string
          address: string
          admin_note: string
          business_name: string
          can_add: boolean
          can_edit: boolean
          can_publish: boolean
          can_remove: boolean
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          notify_bookings: boolean
          notify_email: boolean
          status: string
          user_id: string
        }
        Insert: {
          about?: string
          address?: string
          admin_note?: string
          business_name: string
          can_add?: boolean
          can_edit?: boolean
          can_publish?: boolean
          can_remove?: boolean
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          notify_bookings?: boolean
          notify_email?: boolean
          status?: string
          user_id: string
        }
        Update: {
          about?: string
          address?: string
          admin_note?: string
          business_name?: string
          can_add?: boolean
          can_edit?: boolean
          can_publish?: boolean
          can_remove?: boolean
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          notify_bookings?: boolean
          notify_email?: boolean
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_owners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_bookings: {
        Row: {
          created_at: string
          details: Json
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details: Json
          id: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_state: {
        Row: {
          enquiries: Json
          plans: Json
          user_id: string
        }
        Insert: {
          enquiries?: Json
          plans?: Json
          user_id: string
        }
        Update: {
          enquiries?: Json
          plans?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          owner_id: string
          read: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          owner_id: string
          read?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          owner_id?: string
          read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "owner_notifications_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "business_owners"
            referencedColumns: ["user_id"]
          },
        ]
      }
      owner_properties: {
        Row: {
          admin_note: string
          amenities: string[]
          check_in: string
          check_out: string
          created_at: string
          description: string
          id: string
          kind: string
          location: string
          name: string
          owner_id: string
          photos: string[]
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string
          amenities?: string[]
          check_in?: string
          check_out?: string
          created_at?: string
          description?: string
          id?: string
          kind?: string
          location?: string
          name: string
          owner_id: string
          photos?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string
          amenities?: string[]
          check_in?: string
          check_out?: string
          created_at?: string
          description?: string
          id?: string
          kind?: string
          location?: string
          name?: string
          owner_id?: string
          photos?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "business_owners"
            referencedColumns: ["user_id"]
          },
        ]
      }
      owner_reservations: {
        Row: {
          amount: number
          check_in: string
          check_out: string
          created_at: string
          guest_email: string
          guest_name: string
          guest_phone: string
          guest_user_id: string | null
          guests: number
          id: string
          notes: string
          owner_id: string
          property_id: string
          room_id: string | null
          status: string
        }
        Insert: {
          amount?: number
          check_in: string
          check_out: string
          created_at?: string
          guest_email?: string
          guest_name: string
          guest_phone?: string
          guest_user_id?: string | null
          guests?: number
          id?: string
          notes?: string
          owner_id: string
          property_id: string
          room_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          check_in?: string
          check_out?: string
          created_at?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          guest_user_id?: string | null
          guests?: number
          id?: string
          notes?: string
          owner_id?: string
          property_id?: string
          room_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_reservations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "business_owners"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "owner_reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "owner_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_rooms: {
        Row: {
          available: boolean
          capacity: number
          created_at: string
          description: string
          discount_pct: number
          facilities: string[]
          id: string
          name: string
          owner_id: string
          photos: string[]
          price: number
          property_id: string
          room_type: string
          season_end: string | null
          season_start: string | null
          seasonal_price: number | null
          units: number
        }
        Insert: {
          available?: boolean
          capacity?: number
          created_at?: string
          description?: string
          discount_pct?: number
          facilities?: string[]
          id?: string
          name: string
          owner_id: string
          photos?: string[]
          price?: number
          property_id: string
          room_type?: string
          season_end?: string | null
          season_start?: string | null
          seasonal_price?: number | null
          units?: number
        }
        Update: {
          available?: boolean
          capacity?: number
          created_at?: string
          description?: string
          discount_pct?: number
          facilities?: string[]
          id?: string
          name?: string
          owner_id?: string
          photos?: string[]
          price?: number
          property_id?: string
          room_type?: string
          season_end?: string | null
          season_start?: string | null
          seasonal_price?: number | null
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "owner_rooms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "business_owners"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "owner_rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          allow_owner_applications: boolean
          announcement: string
          id: number
          notify_owners: boolean
          platform_name: string
          support_email: string
          support_phone: string
          updated_at: string
        }
        Insert: {
          allow_owner_applications?: boolean
          announcement?: string
          id?: number
          notify_owners?: boolean
          platform_name?: string
          support_email?: string
          support_phone?: string
          updated_at?: string
        }
        Update: {
          allow_owner_applications?: boolean
          announcement?: string
          id?: number
          notify_owners?: boolean
          platform_name?: string
          support_email?: string
          support_phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          full_name: string
          id: string
          language: string
          mobile: string
        }
        Insert: {
          full_name?: string
          id: string
          language?: string
          mobile?: string
        }
        Update: {
          full_name?: string
          id?: string
          language?: string
          mobile?: string
        }
        Relationships: []
      }
      user: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
          name?: string
          phone?: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_partner_stay: { Args: { _id: string }; Returns: undefined }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_approved_owner: { Args: { _user_id: string }; Returns: boolean }
      is_privileged: { Args: never; Returns: boolean }
      is_public_photo: { Args: { _path: string }; Returns: boolean }
      my_partner_stays: { Args: never; Returns: Json }
      owner_applications_open: { Args: never; Returns: boolean }
      owner_can: { Args: { _perm: string; _user_id: string }; Returns: boolean }
      partner_room_quote: {
        Args: { _check_in: string; _check_out: string; _room_id: string }
        Returns: Json
      }
      platform_announcement: { Args: never; Returns: string }
      public_listings: { Args: never; Returns: Json }
      request_partner_stay: {
        Args: {
          _check_in: string
          _check_out: string
          _email: string
          _guests: number
          _name: string
          _phone: string
          _requests?: string
          _room_id: string
        }
        Returns: string
      }
      user_role_label: { Args: { _uid: string }; Returns: string }
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
    Enums: {},
  },
} as const
