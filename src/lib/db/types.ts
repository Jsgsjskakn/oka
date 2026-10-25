export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'employee' | 'customer';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'upi' | 'cash';
export type OrderType = 'dine-in' | 'takeaway';
export type BookingStatus = 'pending' | 'confirmed' | 'seated' | 'cancelled' | 'completed';
export type TableStatus = 'available' | 'booked' | 'unavailable';
export type AssetRequestType = 'dish_image' | '3d_model' | 'ar_config' | 'hotspots' | 'asset_replacement' | 'broken_asset';
export type AssetRequestStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          name: string;
          tagline: string | null;
          description: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          currency: string;
          timezone: string;
          opening_hours: string | null;
          rating: number | null;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['restaurants']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['restaurants']['Insert']>;
      };
      restaurant_settings: {
        Row: {
          id: string;
          restaurant_id: string;
          key: string;
          value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['restaurant_settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['restaurant_settings']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          restaurant_id: string | null;
          role: UserRole;
          name: string | null;
          phone: string | null;
          email: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      employees: {
        Row: {
          id: string;
          name: string;
          role: string;
          email: string | null;
          phone: string | null;
          is_active: boolean;
          hired_at: string;
          created_at: string;
          auth_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at' | 'hired_at' | 'auth_id'> & { auth_id?: string | null };
        Update: Partial<Database['public']['Tables']['employees']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          slug: string;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      dishes: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string | null;
          price_paise: number;
          original_price_paise: number | null;
          image_url: string | null;
          thumbnail_url: string | null;
          is_veg: boolean;
          is_available: boolean;
          is_featured: boolean;
          is_best_seller: boolean;
          spice_level: string | null;
          calories: number | null;
          preparation_time: string | null;
          allergens: string[] | null;
          has_3d_model: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['dishes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['dishes']['Insert']>;
      };
      ingredients: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          is_allergen: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ingredients']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ingredients']['Insert']>;
      };
      dish_ingredients: {
        Row: {
          id: string;
          dish_id: string;
          ingredient_id: string;
          is_removable: boolean;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['dish_ingredients']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['dish_ingredients']['Insert']>;
      };
      dish_sizes: {
        Row: {
          id: string;
          dish_id: string;
          name: string;
          price_modifier_paise: number;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['dish_sizes']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['dish_sizes']['Insert']>;
      };
      dish_addons: {
        Row: {
          id: string;
          dish_id: string;
          name: string;
          price_paise: number;
          is_available: boolean;
        };
        Insert: Omit<Database['public']['Tables']['dish_addons']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['dish_addons']['Insert']>;
      };
      dish_models: {
        Row: {
          id: string;
          dish_id: string;
          model_path: string;
          initial_scale: number;
          initial_rotation_x: number;
          initial_rotation_y: number;
          initial_rotation_z: number;
          camera_distance: number;
          is_active: boolean;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['dish_models']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['dish_models']['Insert']>;
      };
      dish_hotspots: {
        Row: {
          id: string;
          dish_id: string;
          ingredient_id: string | null;
          label: string;
          description: string | null;
          pos_x: number;
          pos_y: number;
          pos_z: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['dish_hotspots']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['dish_hotspots']['Insert']>;
      };
      tables: {
        Row: {
          id: string;
          restaurant_id: string;
          table_number: number;
          capacity: number;
          status: TableStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tables']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tables']['Insert']>;
      };
      bookings: {
        Row: {
          id: string;
          restaurant_id: string;
          table_id: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          booking_date: string;
          booking_time: string;
          booking_end_time: string | null;
          guests: number;
          occasion: string | null;
          table_preference: string | null;
          special_requests: string | null;
          status: BookingStatus;
          payment_status: PaymentStatus;
          advance_amount_paise: number;
          cancelled_at: string | null;
          cancelled_by: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          restaurant_id: string;
          table_id: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          order_type: OrderType;
          status: OrderStatus;
          payment_status: PaymentStatus;
          payment_method: PaymentMethod;
          pickup_time: string | null;
          notes: string | null;
          subtotal_paise: number;
          tax_paise: number;
          tip_paise: number;
          total_paise: number;
          idempotency_key: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          cancellation_reason: string | null;
          processed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          dish_id: string;
          dish_name: string;
          dish_price_paise: number;
          quantity: number;
          size_name: string | null;
          size_price_modifier_paise: number;
          special_instructions: string | null;
          line_total_paise: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
      };
      order_item_customizations: {
        Row: {
          id: string;
          order_item_id: string;
          type: 'addon' | 'removed_ingredient';
          name: string;
          price_paise: number;
        };
        Insert: Omit<Database['public']['Tables']['order_item_customizations']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['order_item_customizations']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          order_id: string | null;
          booking_id: string | null;
          payment_method: PaymentMethod;
          amount_paise: number;
          tip_paise: number;
          status: PaymentStatus;
          reference: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          restaurant_id: string;
          actor_id: string | null;
          actor_role: UserRole | null;
          actor_name: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_value: Json | null;
          new_value: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      asset_requests: {
        Row: {
          id: string;
          restaurant_id: string;
          dish_id: string | null;
          request_type: AssetRequestType;
          status: AssetRequestStatus;
          title: string;
          description: string | null;
          requested_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['asset_requests']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['asset_requests']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience row types
export type Restaurant = Database['public']['Tables']['restaurants']['Row'];
export type RestaurantSetting = Database['public']['Tables']['restaurant_settings']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Dish = Database['public']['Tables']['dishes']['Row'];
export type Ingredient = Database['public']['Tables']['ingredients']['Row'];
export type DishIngredient = Database['public']['Tables']['dish_ingredients']['Row'];
export type DishSize = Database['public']['Tables']['dish_sizes']['Row'];
export type DishAddon = Database['public']['Tables']['dish_addons']['Row'];
export type DishModel = Database['public']['Tables']['dish_models']['Row'];
export type DishHotspot = Database['public']['Tables']['dish_hotspots']['Row'];
export type RestaurantTable = Database['public']['Tables']['tables']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type OrderItemCustomization = Database['public']['Tables']['order_item_customizations']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type AssetRequest = Database['public']['Tables']['asset_requests']['Row'];

// Rich joined types for UI
export type DishWithCategory = Dish & { categories: Category };
export type OrderWithItems = Order & { order_items: (OrderItem & { order_item_customizations: OrderItemCustomization[] })[] };
export type BookingWithTable = Booking & { tables: RestaurantTable | null };

// Money helpers — store as paise (1 ₹ = 100 paise), display as ₹
export const toPaise = (rupees: number): number => Math.round(rupees * 100);
export const toRupees = (paise: number): number => paise / 100;
export const formatMoney = (paise: number): string => `₹${(paise / 100).toFixed(0)}`;
