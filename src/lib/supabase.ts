import { createClient } from '@supabase/supabase-js';

// Accept either the legacy `VITE_SUPABASE_ANON_KEY` or the newer
// `VITE_SUPABASE_PUBLISHABLE_KEY` naming so existing/new dashboards both work.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          icon: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: string;
          base_price: number;
          discount_price: number | null;
          discount_start_date: string | null;
          discount_end_date: string | null;
          discount_active: boolean;
          purity_percentage: number;
          molecular_weight: string | null;
          cas_number: string | null;
          sequence: string | null;
          storage_conditions: string;
          inclusions: string[] | null;
          stock_quantity: number;
          available: boolean;
          featured: boolean;
          image_url: string | null;
          safety_sheet_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          category: string;
          base_price: number;
          discount_price?: number | null;
          discount_start_date?: string | null;
          discount_end_date?: string | null;
          discount_active?: boolean;
          purity_percentage?: number;
          molecular_weight?: string | null;
          cas_number?: string | null;
          sequence?: string | null;
          storage_conditions?: string;
          inclusions?: string[] | null;
          stock_quantity?: number;
          available?: boolean;
          featured?: boolean;
          image_url?: string | null;
          safety_sheet_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          category?: string;
          base_price?: number;
          discount_price?: number | null;
          discount_start_date?: string | null;
          discount_end_date?: string | null;
          discount_active?: boolean;
          purity_percentage?: number;
          molecular_weight?: string | null;
          cas_number?: string | null;
          sequence?: string | null;
          storage_conditions?: string;
          inclusions?: string[] | null;
          stock_quantity?: number;
          available?: boolean;
          featured?: boolean;
          image_url?: string | null;
          safety_sheet_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_variations: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          quantity_mg: number;
          price: number;
          stock_quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          quantity_mg: number;
          price: number;
          stock_quantity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          quantity_mg?: number;
          price?: number;
          stock_quantity?: number;
          created_at?: string;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          name: string;
          account_number: string;
          account_name: string;
          qr_code_url: string;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          account_number: string;
          account_name: string;
          qr_code_url: string;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          account_number?: string;
          account_name?: string;
          qr_code_url?: string;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      site_settings: {
        Row: {
          id: string;
          value: string;
          type: string;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          value: string;
          type?: string;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          type?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
    };
  };
};
