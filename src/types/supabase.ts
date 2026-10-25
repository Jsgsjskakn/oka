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

      asset_requests: {

        Row: {

          created_at: string

          description: string | null

          dish_id: string | null

          id: string

          notes: string | null

          request_type: string

          requested_by: string | null

          restaurant_id: string

          status: string

          title: string

          updated_at: string

        }

        Insert: {

          created_at?: string

          description?: string | null

          dish_id?: string | null

          id?: string

          notes?: string | null

          request_type: string

          requested_by?: string | null

          restaurant_id: string

          status?: string

          title: string

          updated_at?: string

        }

        Update: {

          created_at?: string

          description?: string | null

          dish_id?: string | null

          id?: string

          notes?: string | null

          request_type?: string

          requested_by?: string | null

          restaurant_id?: string

          status?: string

          title?: string

          updated_at?: string

        }

        Relationships: [

          {

            foreignKeyName: "asset_requests_dish_id_fkey"

            columns: ["dish_id"]

            isOneToOne: false

            referencedRelation: "dishes"

            referencedColumns: ["id"]

          },

          {

            foreignKeyName: "asset_requests_requested_by_fkey"

            columns: ["requested_by"]

            isOneToOne: false

            referencedRelation: "profiles"

            referencedColumns: ["id"]

          },

          {

            foreignKeyName: "asset_requests_restaurant_id_fkey"

            columns: ["restaurant_id"]

            isOneToOne: false

            referencedRelation: "restaurants"

            referencedColumns: ["id"]

          },

        ]

      }

      audit_logs: {

        Row: {

          action: string

          actor_id: string | null

          actor_name: string | null

          actor_role: string | null

          created_at: string

          entity_id: string | null

          entity_type: string

          id: string

          ip_address: string | null

          new_value: Json | null

          old_value: Json | null

          restaurant_id: string | null

        }

        Insert: {

          action: string

          actor_id?: string | null

          actor_name?: string | null

          actor_role?: string | null

          created_at?: string

          entity_id?: string | null

          entity_type: string

          id?: string

          ip_address?: string | null

          new_value?: Json | null

          old_value?: Json | null

          restaurant_id?: string | null

        }

        Update: {

          action?: string

          actor_id?: string | null

          actor_name?: string | null

          actor_role?: string | null

          created_at?: string

          entity_id?: string | null

          entity_type?: string

          id?: string

          ip_address?: string | null

          new_value?: Json | null

          old_value?: Json | null

          restaurant_id?: string | null

        }

        Relationships: [

          {

            foreignKeyName: "audit_logs_restaurant_id_fkey"

            columns: ["restaurant_id"]

            isOneToOne: false

            referencedRelation: "restaurants"

            referencedColumns: ["id"]

          },

        ]

      }

      bookings: {

        Row: {

          advance_amount_paise: number

          booking_date: string

          booking_time: string

          cancellation_reason: string | null

          cancelled_at: string | null

          cancelled_by: string | null

          created_at: string

          customer_email: string | null

          customer_name: string

          customer_phone: string

          guests: number

          hold_expires_at: string | null

          id: string

          occasion: string | null

          payment_status: string

          restaurant_id: string

          special_requests: string | null

          status: string

          table_id: string | null

          table_preference: string | null

          updated_at: string

          user_id: string | null

        }

        Insert: {

          advance_amount_paise?: number

          booking_date: string

          booking_time: string

          cancellation_reason?: string | null

          cancelled_at?: string | null

          cancelled_by?: string | null

          created_at?: string

          customer_email?: string | null

          customer_name: string

          customer_phone: string

          guests: number

          hold_expires_at?: string | null

          id?: string

          occasion?: string | null

          payment_status?: string

          restaurant_id: string

          special_requests?: string | null

          status?: string

          table_id?: string | null

          table_preference?: string | null

          updated_at?: string

          user_id?: string | null

        }

        Update: {

          advance_amount_paise?: number

          booking_date?: string

          booking_time?: string

          cancellation_reason?: string | null

          cancelled_at?: string | null

          cancelled_by?: string | null

          created_at?: string

          customer_email?: string | null

          customer_name?: string

          customer_phone?: string

          guests?: number

          hold_expires_at?: string | null

          id?: string

          occasion?: string | null

          payment_status?: string

          restaurant_id?: string

          special_requests?: string | null

          status?: string

          table_id?: string | null

          table_preference?: string | null

          updated_at?: string

          user_id?: string | null

        }

        Relationships: [

          {

            foreignKeyName: "bookings_restaurant_id_fkey"

            columns: ["restaurant_id"]

            isOneToOne: false

            referencedRelation: "restaurants"

            referencedColumns: ["id"]

          },

          {

            foreignKeyName: "bookings_table_id_fkey"

            columns: ["table_id"]

            isOneToOne: false

            referencedRelation: "tables"

            referencedColumns: ["id"]

          },

        ]

      }

      categories: {

        Row: {

          created_at: string

          icon: string | null

          id: string

          is_active: boolean

          name: string

          restaurant_id: string

          slug: string

          sort_order: number

          updated_at: string

        }

        Insert: {

          created_at?: string

          icon?: string | null

          id?: string

          is_active?: boolean

          name: string

          restaurant_id: string

          slug: string

          sort_order?: number

          updated_at?: string

        }

        Update: {

          created_at?: string

          icon?: string | null

          id?: string

          is_active?: boolean

          name?: string

          restaurant_id?: string

          slug?: string

          sort_order?: number

          updated_at?: string

        }

        Relationships: [

          {

            foreignKeyName: "categories_restaurant_id_fkey"

            columns: ["restaurant_id"]

            isOneToOne: false

            referencedRelation: "restaurants"

            referencedColumns: ["id"]

          },

        ]

      }

      dish_addons: {

        Row: {

          dish_id: string

          id: string

          is_available: boolean

          name: string

          price_paise: number

        }

        Insert: {

          dish_id: string

          id?: string

          is_available?: boolean

          name: string

          price_paise?: number

        }

        Update: {

          dish_id?: string

          id?: string

          is_available?: boolean

          name?: string

          price_paise?: number

        }

        Relationships: [

          {

            foreignKeyName: "dish_addons_dish_id_fkey"

            columns: ["dish_id"]

            isOneToOne: false

            referencedRelation: "dishes"

            referencedColumns: ["id"]

          },

        ]

      }

      dish_hotspots: {

        Row: {

          created_at: string

          description: string | null

          dish_id: string

          id: string

          ingredient_id: string | null

          is_active: boolean

          label: string

          pos_x: number

          pos_y: number

          pos_z: number

          sort_order: number

        }

        Insert: {

          created_at?: string

          description?: string | null

          dish_id: string

          id?: string

          ingredient_id?: string | null

          is_active?: boolean

          label: string

          pos_x?: number

          pos_y?: number

          pos_z?: number

          sort_order?: number

        }

        Update: {

          created_at?: string

          description?: string | null

          dish_id?: string

          id?: string

          ingredient_id?: string | null

          is_active?: boolean

          label?: string

          pos_x?: number

          pos_y?: number

          pos_z?: number

          sort_order?: number

        }

        Relationships: [

          {

            foreignKeyName: "dish_hotspots_dish_id_fkey"

            columns: ["dish_id"]

            isOneToOne: false

            referencedRelation: "dishes"

            referencedColumns: ["id"]

          },

          {

            foreignKeyName: "dish_hotspots_ingredient_id_fkey"

            columns: ["ingredient_id"]

            isOneToOne: false

            referencedRelation: "ingredients"

            referencedColumns: ["id"]

          },

        ]

      }

      dish_ingredients: {

        Row: {

          dish_id: string

          id: string

          ingredient_id: string

          is_removable: boolean

          sort_order: number

        }

        Insert: {

          dish_id: string

          id?: string

          ingredient_id: string

          is_removable?: boolean

          sort_order?: number

        }

        Update: {

          dish_id?: string

          id?: string

          ingredient_id?: string

          is_removable?: boolean

          sort_order?: number

        }

        Relationships: [

          {

            foreignKeyName: "dish_ingredients_dish_id_fkey"

            columns: ["dish_id"]

            isOneToOne: false

            referencedRelation: "dishes"

            referencedColumns: ["id"]

          },

          {

            foreignKeyName: "dish_ingredients_ingredient_id_fkey"

            columns: ["ingredient_id"]

            isOneToOne: false

            referencedRelation: "ingredients"

            referencedColumns: ["id"]

          },

        ]

      }

      dish_models: {

        Row: {

          camera_distance: number

          created_at: string

          dish_id: string

          id: string

          initial_rotation_x: number

          initial_rotation_y: number

          initial_rotation_z: number

          initial_scale: number

          is_active: boolean

          model_path: string

          updated_at: string

          version: number

        }

        Insert: {

          camera_distance?: number

          created_at?: string

          dish_id: string

          id?: string

          initial_rotation_x?: number

          initial_rotation_y?: number

          initial_rotation_z?: number

          initial_scale?: number

          is_active?: boolean

          model_path: string

          updated_at?: string

          version?: number

        }

        Update: {

          camera_distance?: number

          created_at?: string

          dish_id?: string

          id?: string

          initial_rotation_x?: number

          initial_rotation_y?: number

          initial_rotation_z?: number

          initial_scale?: number

          is_active?: boolean

          model_path?: string

          updated_at?: string

          version?: number

        }

        Relationships: [

          {

            foreignKeyName: "dish_models_dish_id_fkey"

            columns: ["dish_id"]

            isOneToOne: false

            referencedRelation: "dishes"

            referencedColumns: ["id"]

          },

        ]

      }

      dish_sizes: {

        Row: {

          dish_id: string

          id: string

          name: string

          price_modifier_paise: number

          sort_order: number

        }

        Insert: {

          dish_id: string

          id?: string

          name: string

          price_modifier_paise?: number

          sort_order?: number

        }

        Update: {

          dish_id?: string

          id?: string

          name?: string

          price_modifier_paise?: number

          sort_order?: number

        }

        Relationships: [

          {

            foreignKeyName: "dish_sizes_dish_id_fkey"

            columns: ["dish_id"]

            isOneToOne: false

            referencedRelation: "dishes"

            referencedColumns: ["id"]

          },

        ]

      }

      dishes: {

        Row: {

          allergens: string[] | null

          calories: number | null

          category_id: string

          created_at: string

          description: string | null

          has_3d_model: boolean

          id: string

          image_url: string | null

          is_available: boolean

          is_best_seller: boolean

          is_featured: boolean

          is_veg: boolean

          name: string

          original_price_paise: number | null

          preparation_time: string | null

          price_paise: number

          restaurant_id: string

          slug: string

          sort_order: number

          spice_level: string | null

          thumbnail_url: string | null

          updated_at: string

        }

        Insert: {

          allergens?: string[] | null

          calories?: number | null

          category_id: string

          created_at?: string

          description?: string | null

          has_3d_model?: boolean

          id?: string

          image_url?: string | null

          is_available?: boolean

          is_best_seller?: boolean

          is_featured?: boolean

          is_veg?: boolean

          name: string

          original_price_paise?: number | null

          preparation_time?: string | null

          price_paise: number

          restaurant_id: string

          slug: string

          sort_order?: number

          spice_level?: string | null

          thumbnail_url?: string | null

          updated_at?: string

        }

        Update: {

          allergens?: string[] | null

          calories?: number | null

          category_id?: string

          created_at?: string

          description?: string | null

          has_3d_model?: boolean

          id?: string

          image_url?: string | null

          is_available?: boolean

          is_best_seller?: boolean

          is_featured?: boolean

          is_veg?: boolean

          name?: string

          original_price_paise?: number | null

          preparation_time?: string | null

          price_paise?: number

          restaurant_id?: string

          slug?: string

          sort_order?: number

          spice_level?: string | null

          thumbnail_url?: string | null

          updated_at?: string

        }

        Relationships: [

          {

            foreignKeyName: "dishes_category_id_fkey"

            columns: ["category_id"]

            isOneToOne: false

            referencedRelation: "categories"

            referencedColumns: ["id"]

          },

          {

            foreignKeyName: "dishes_restaurant_id_fkey"

            columns: ["restaurant_id"]

            isOneToOne: false

            referencedRelation: "restaurants"

            referencedColumns: ["id"]

          },

        ]

      }

      employees: {

        Row: {

          created_at: string | null

          email: string | null

          hired_at: string | null

          id: string

          is_active: boolean | null

          name: string

          phone: string | null

          role: string

        }

        Insert: {

          created_at?: string | null

          email?: string | null

          hired_at?: string | null

          id?: string

          is_active?: boolean | null

          name: string

          phone?: string | null

          role?: string

        }

        Update: {

          created_at?: string | null

          email?: string | null

          hired_at?: string | null

          id?: string

          is_active?: boolean | null

          name?: string

          phone?: string | null

          role?: string

        }

        Relationships: []

      }

      ingredients: {

        Row: {

          created_at: string

          id: string

          is_allergen: boolean

          name: string

          restaurant_id: string

        }

        Insert: {

          created_at?: string

          id?: string

          is_allergen?: boolean

          name: string

          restaurant_id: string

        }

        Update: {

          created_at?: string

          id?: string

          is_allergen?: boolean

          name?: string

          restaurant_id?: string

        }

        Relationships: [

          {

            foreignKeyName: "ingredients_restaurant_id_fkey"

            columns: ["restaurant_id"]

            isOneToOne: false

            referencedRelation: "restaurants"

            referencedColumns: ["id"]

          },

        ]

      }

      order_item_customizations: {

        Row: {

          id: string

          name: string

          order_item_id: string

          price_paise: number

          type: string

        }

        Insert: {

          id?: string

          name: string

          order_item_id: string

          price_paise?: number

          type: string

        }

        Update: {

          id?: string

          name?: string

          order_item_id?: string

          price_paise?: number

          type?: string

        }

        Relationships: [

          {

            foreignKeyName: "order_item_customizations_order_item_id_fkey"

            columns: ["order_item_id"]

            isOneToOne: false

            referencedRelation: "order_items"

            referencedColumns: ["id"]

          },

        ]

      }

      order_items: {

        Row: {

          created_at: string

          dish_id: string | null

          dish_name: string

          dish_price_paise: number

          id: string

          line_total_paise: number

          order_id: string

          quantity: number

          size_name: string | null

          size_price_modifier_paise: number

          special_instructions: string | null

        }

        Insert: {

          created_at?: string

          dish_id?: string | null

          dish_name: string

          dish_price_paise: number

          id?: string

          line_total_paise: number

          order_id: string

          quantity: number

          size_name?: string | null

          size_price_modifier_paise?: number

          special_instructions?: string | null

        }

        Update: {

          created_at?: string

          dish_id?: string | null

          dish_name?: string

          dish_price_paise?: number

          id?: string

          line_total_paise?: number

          order_id?: string

          quantity?: number

          size_name?: string | null

          size_price_modifier_paise?: number

          special_instructions?: string | null

        }

        Relationships: [

          {

            foreignKeyName: "order_items_dish_id_fkey"

            columns: ["dish_id"]

            isOneToOne: false

            referencedRelation: "dishes"

            referencedColumns: ["id"]

          },

          {

            foreignKeyName: "order_items_order_id_fkey"

            columns: ["order_id"]

            isOneToOne: false

            referencedRelation: "orders"

            referencedColumns: ["id"]

          },

        ]

      }

      orders: {

        Row: {

          cancellation_reason: string | null

          cancelled_at: string | null

          cancelled_by: string | null

          created_at: string

          customer_email: string | null

          customer_name: string

          customer_phone: string

          id: string

          idempotency_key: string | null

          notes: string | null

          order_type: string

          payment_method: string

          payment_status: string

          pickup_time: string | null

          processed_by: string | null

          restaurant_id: string

          status: string

          subtotal_paise: number

          table_id: string | null

          tax_paise: number

          tip_paise: number

          total_paise: number

          updated_at: string

          user_id: string | null

        }

        Insert: {

          cancellation_reason?: string | null

          cancelled_at?: string | null

          cancelled_by?: string | null

          created_at?: string

          customer_email?: string | null

          customer_name: string

          customer_phone: string

          id?: string

          idempotency_key?: string | null

          notes?: string | null

          order_type: string

          payment_method: string

          payment_status?: string

          pickup_time?: string | null

          processed_by?: string | null

          restaurant_id: string

          status?: string

          subtotal_paise?: number

          table_id?: string | null

          tax_paise?: number

          tip_paise?: number

          total_paise?: number

          updated_at?: string

          user_id?: string | null

        }

        Update: {

          cancellation_reason?: string | null

          cancelled_at?: string | null

          cancelled_by?: string | null

          created_at?: string

          customer_email?: string | null

          customer_name?: string

          customer_phone?: string

          id?: string

          idempotency_key?: string | null

          notes?: string | null

          order_type?: string

          payment_method?: string

          payment_status?: string

          pickup_time?: string | null

          processed_by?: string | null

          restaurant_id?: string

          status?: string

          subtotal_paise?: number

          table_id?: string | null

          tax_paise?: number

          tip_paise?: number

          total_paise?: number

          updated_at?: string

          user_id?: string | null

        }

        Relationships: [

          {

            foreignKeyName: "orders_processed_by_fkey"

            columns: ["processed_by"]

            isOneToOne: false

            referencedRelation: "profiles"

            referencedColumns: ["id"]

          },

          {

            foreignKeyName: "orders_restaurant_id_fkey"

            columns: ["restaurant_id"]

            isOneToOne: false

            referencedRelation: "restaurants"

            referencedColumns: ["id"]

          },

          {

            foreignKeyName: "orders_table_id_fkey"

            columns: ["table_id"]

            isOneToOne: false

            referencedRelation: "tables"

            referencedColumns: ["id"]

          },

        ]

      }

      payments: {

        Row: {

          amount_paise: number

          booking_id: string | null

          created_at: string

          id: string

          notes: string | null

          order_id: string | null

          payment_method: string

          reference: string | null

          status: string

          tip_paise: number

          updated_at: string

        }

        Insert: {

          amount_paise: number

          booking_id?: string | null

          created_at?: string

          id?: string

          notes?: string | null

          order_id?: string | null

          payment_method: string

          reference?: string | null

          status?: string

          tip_paise?: number

          updated_at?: string

        }

        Update: {

          amount_paise?: number

          booking_id?: string | null

          created_at?: string

          id?: string

          notes?: string | null

          order_id?: string | null

          payment_method?: string

          reference?: string | null

          status?: string

          tip_paise?: number

          updated_at?: string

        }

        Relationships: [

          {

            foreignKeyName: "payments_booking_id_fkey"

            columns: ["booking_id"]

            isOneToOne: false

            referencedRelation: "bookings"

            referencedColumns: ["id"]

          },

          {

            foreignKeyName: "payments_order_id_fkey"

            columns: ["order_id"]

            isOneToOne: false

            referencedRelation: "orders"

            referencedColumns: ["id"]

          },

        ]

      }

      profiles: {

        Row: {

          created_at: string

          email: string | null

          id: string

          is_active: boolean

          name: string | null

          phone: string | null

          restaurant_id: string | null

          role: string

          updated_at: string

        }

        Insert: {

          created_at?: string

          email?: string | null

          id: string

          is_active?: boolean

          name?: string | null

          phone?: string | null

          restaurant_id?: string | null

          role?: string

          updated_at?: string

        }

        Update: {

          created_at?: string

          email?: string | null

          id?: string

          is_active?: boolean

          name?: string | null

          phone?: string | null

          restaurant_id?: string | null

          role?: string

          updated_at?: string

        }

        Relationships: [

          {

            foreignKeyName: "profiles_restaurant_id_fkey"

            columns: ["restaurant_id"]

            isOneToOne: false

            referencedRelation: "restaurants"

            referencedColumns: ["id"]

          },

        ]

      }

      restaurant_settings: {

        Row: {

          created_at: string

          id: string

          key: string

          restaurant_id: string

          updated_at: string

          value: Json

        }

        Insert: {

          created_at?: string

          id?: string

          key: string

          restaurant_id: string

          updated_at?: string

          value: Json

        }

        Update: {

          created_at?: string

          id?: string

          key?: string

          restaurant_id?: string

          updated_at?: string

          value?: Json

        }

        Relationships: [

          {

            foreignKeyName: "restaurant_settings_restaurant_id_fkey"

            columns: ["restaurant_id"]

            isOneToOne: false

            referencedRelation: "restaurants"

            referencedColumns: ["id"]

          },

        ]

      }

      restaurants: {

        Row: {

          address: string | null

          created_at: string

          currency: string

          description: string | null

          email: string | null

          id: string

          name: string

          opening_hours: string | null

          phone: string | null

          rating: number | null

          review_count: number

          tagline: string | null

          timezone: string

          updated_at: string

        }

        Insert: {

          address?: string | null

          created_at?: string

          currency?: string

          description?: string | null

          email?: string | null

          id?: string

          name: string

          opening_hours?: string | null

          phone?: string | null

          rating?: number | null

          review_count?: number

          tagline?: string | null

          timezone?: string

          updated_at?: string

        }

        Update: {

          address?: string | null

          created_at?: string

          currency?: string

          description?: string | null

          email?: string | null

          id?: string

          name?: string

          opening_hours?: string | null

          phone?: string | null

          rating?: number | null

          review_count?: number

          tagline?: string | null

          timezone?: string

          updated_at?: string

        }

        Relationships: []

      }

      tables: {

        Row: {

          capacity: number

          created_at: string

          id: string

          notes: string | null

          restaurant_id: string

          status: string

          table_number: number

          updated_at: string

        }

        Insert: {

          capacity?: number

          created_at?: string

          id?: string

          notes?: string | null

          restaurant_id: string

          status?: string

          table_number: number

          updated_at?: string

        }

        Update: {

          capacity?: number

          created_at?: string

          id?: string

          notes?: string | null

          restaurant_id?: string

          status?: string

          table_number?: number

          updated_at?: string

        }

        Relationships: [

          {

            foreignKeyName: "tables_restaurant_id_fkey"

            columns: ["restaurant_id"]

            isOneToOne: false

            referencedRelation: "restaurants"

            referencedColumns: ["id"]

          },

        ]

      }

    }

    Views: {

      [_ in never]: never

    }

    Functions: {

      cancel_booking: {

        Args: {

          p_booking_id: string

          p_cancelled_by: string

          p_reason?: string

        }

        Returns: Json

      }

      confirm_booking: {

        Args: {

          p_booking_id: string

          p_payment_method: string

          p_reference?: string

        }

        Returns: Json

      }

      get_my_role: { Args: never; Returns: string }

      is_active_staff: { Args: never; Returns: boolean }

      is_admin: { Args: never; Returns: boolean }

      is_employee: { Args: never; Returns: boolean }

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

