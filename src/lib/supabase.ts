import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for Scout Dashboard v4.0
export interface Transaction {
  transaction_id: string;
  timestamp: string;
  store_id: string;
  customer_id: string;
  transaction_value: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  duration_seconds: number;
  units_total: number;
  unique_items: number;
  weather: string;
  day_of_week: string;
  hour_of_day: number;
  is_holiday: boolean;
  is_payday: boolean;
  campaign_id?: string;
  influenced_by_campaign: boolean;
}

export interface TransactionItem {
  item_id: string;
  transaction_id: string;
  sku_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_applied: number;
  was_substituted: boolean;
  original_sku_id?: string;
  substitution_reason?: string;
  is_promo: boolean;
  promo_type?: string;
}

export interface Store {
  store_id: string;
  store_name: string;
  store_type: string;
  region: string;
  province: string;
  city_municipality: string;
  barangay: string;
  latitude: number;
  longitude: number;
  economic_class: string;
}

export interface Product {
  sku_id: string;
  brand_id: string;
  product_name: string;
  product_category: string;
  product_subcat: string;
  msrp: number;
}

export interface Customer {
  customer_id: string;
  external_id?: string;
  gender: string;
  age_bracket: string;
  customer_type: string;
  loyalty_status: string;
}

export interface AudioTranscript {
  transcript_id: string;
  transaction_id: string;
  audio_language: string;
  full_transcript: string;
  request_type: string;
  storeowner_influence: string;
  suggestion_accepted: boolean;
  sentiment_score: number;
}

export interface VideoSignal {
  signal_id: string;
  transaction_id: string;
  objects_detected: string[];
  people_count: number;
  browsing_duration_seconds: number;
}