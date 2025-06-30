-- Complete Retail Analytics Data Model
-- Supports Transaction Trends, Product Mix, Consumer Behavior, and Profiling

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables for clean migration
DROP TABLE IF EXISTS public.consumer_interactions CASCADE;
DROP TABLE IF EXISTS public.transaction_baskets CASCADE;
DROP TABLE IF EXISTS public.product_substitutions CASCADE;
DROP TABLE IF EXISTS public.consumer_profiles CASCADE;
DROP TABLE IF EXISTS public.product_requests CASCADE;
DROP TABLE IF EXISTS public.store_suggestions CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;

-- Update transactions table to include new fields
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS consumer_profile_id UUID,
ADD COLUMN IF NOT EXISTS basket_size_category VARCHAR(20) CHECK (basket_size_category IN ('1 item', '2 items', '3+ items')),
ADD COLUMN IF NOT EXISTS day_type VARCHAR(20) CHECK (day_type IN ('weekday', 'weekend', 'holiday')),
ADD COLUMN IF NOT EXISTS payment_method_id UUID,
ADD COLUMN IF NOT EXISTS store_suggestion_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_unique_items INTEGER,
ADD COLUMN IF NOT EXISTS total_categories INTEGER;

-- Consumer profiles table
CREATE TABLE public.consumer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'unspecified')),
  age_bracket VARCHAR(20) CHECK (age_bracket IN ('child', 'teen', 'young_adult', 'adult', 'senior')),
  estimated_age_min INTEGER,
  estimated_age_max INTEGER,
  location_store_id UUID REFERENCES public.stores(id),
  first_seen_date DATE DEFAULT CURRENT_DATE,
  last_seen_date DATE DEFAULT CURRENT_DATE,
  total_transactions INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  avg_basket_size DECIMAL(10,2) DEFAULT 0,
  preferred_categories TEXT[], -- Array of preferred categories
  preferred_brands TEXT[], -- Array of preferred brands
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Product request types
CREATE TABLE public.product_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  request_type VARCHAR(50) CHECK (request_type IN ('branded', 'unbranded', 'unsure', 'pointing', 'indirect')),
  original_request TEXT, -- What the customer actually said/did
  request_method VARCHAR(50) CHECK (request_method IN ('verbal', 'pointing', 'showing_image', 'written')),
  brand_mentioned VARCHAR(255),
  category_mentioned VARCHAR(255),
  was_available BOOLEAN DEFAULT true,
  substitution_accepted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Product substitutions tracking
CREATE TABLE public.product_substitutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  original_product_id UUID REFERENCES public.products(id),
  substitute_product_id UUID REFERENCES public.products(id),
  original_brand VARCHAR(255),
  substitute_brand VARCHAR(255),
  original_category VARCHAR(255),
  substitute_category VARCHAR(255),
  reason VARCHAR(100) CHECK (reason IN ('out_of_stock', 'price_preference', 'size_preference', 'brand_preference', 'store_suggestion')),
  accepted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Store suggestions and interventions
CREATE TABLE public.store_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  suggested_product_id UUID REFERENCES public.products(id),
  original_request TEXT,
  suggestion_reason VARCHAR(100) CHECK (suggestion_reason IN ('out_of_stock', 'better_value', 'promotion', 'higher_margin', 'customer_preference')),
  accepted BOOLEAN DEFAULT false,
  cashier_id UUID REFERENCES public.cashiers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Transaction baskets for analyzing multi-item purchases
CREATE TABLE public.transaction_baskets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  basket_hash VARCHAR(64), -- Hash of all products for finding patterns
  total_items INTEGER NOT NULL,
  unique_items INTEGER NOT NULL,
  total_categories INTEGER NOT NULL,
  unique_categories INTEGER NOT NULL,
  categories_list TEXT[], -- Array of categories in basket
  brands_list TEXT[], -- Array of brands in basket
  frequently_bought_together BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Consumer interaction patterns
CREATE TABLE public.consumer_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  consumer_profile_id UUID REFERENCES public.consumer_profiles(id),
  interaction_start_time TIMESTAMP WITH TIME ZONE,
  interaction_end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  number_of_requests INTEGER DEFAULT 1,
  number_of_substitutions INTEGER DEFAULT 0,
  number_of_suggestions_accepted INTEGER DEFAULT 0,
  interaction_type VARCHAR(50) CHECK (interaction_type IN ('quick', 'browsing', 'assisted', 'complex')),
  language_used VARCHAR(50) DEFAULT 'tagalog',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Payment methods with local options
CREATE TABLE public.payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  method_name VARCHAR(50) UNIQUE NOT NULL,
  method_type VARCHAR(50) CHECK (method_type IN ('cash', 'digital_wallet', 'credit_card', 'debit_card', 'utang_lista', 'bank_transfer')),
  provider VARCHAR(100), -- GCash, Maya, BPI, etc.
  is_active BOOLEAN DEFAULT true,
  transaction_fee_percent DECIMAL(5,2) DEFAULT 0,
  min_transaction_amount DECIMAL(10,2),
  max_transaction_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_consumer_profiles_gender_age ON public.consumer_profiles(gender, age_bracket);
CREATE INDEX idx_consumer_profiles_location ON public.consumer_profiles(location_store_id);
CREATE INDEX idx_product_requests_type ON public.product_requests(request_type, request_method);
CREATE INDEX idx_product_requests_transaction ON public.product_requests(transaction_id);
CREATE INDEX idx_substitutions_brands ON public.product_substitutions(original_brand, substitute_brand);
CREATE INDEX idx_substitutions_transaction ON public.product_substitutions(transaction_id);
CREATE INDEX idx_store_suggestions_accepted ON public.store_suggestions(accepted);
CREATE INDEX idx_transaction_baskets_hash ON public.transaction_baskets(basket_hash);
CREATE INDEX idx_transaction_baskets_categories ON public.transaction_baskets USING GIN(categories_list);
CREATE INDEX idx_transaction_baskets_brands ON public.transaction_baskets USING GIN(brands_list);
CREATE INDEX idx_consumer_interactions_duration ON public.consumer_interactions(duration_seconds);
CREATE INDEX idx_transactions_duration ON public.transactions(duration_seconds);
CREATE INDEX idx_transactions_basket_size ON public.transactions(basket_size_category);
CREATE INDEX idx_transactions_day_type ON public.transactions(day_type);

-- Create materialized views for analytics

-- Transaction patterns by time and location
CREATE MATERIALIZED VIEW public.mv_transaction_patterns AS
SELECT 
  DATE_TRUNC('hour', t.transaction_datetime) as hour_bucket,
  EXTRACT(HOUR FROM t.transaction_datetime) as hour_of_day,
  EXTRACT(DOW FROM t.transaction_datetime) as day_of_week,
  t.day_type,
  s.region,
  s.city,
  s.barangay,
  s.store_id,
  COUNT(DISTINCT t.id) as transaction_count,
  AVG(t.duration_seconds) as avg_duration_seconds,
  AVG(t.total_amount) as avg_transaction_value,
  AVG(t.items_count) as avg_items_per_transaction,
  SUM(t.total_amount) as total_sales,
  COUNT(DISTINCT CASE WHEN t.basket_size_category = '1 item' THEN t.id END) as single_item_transactions,
  COUNT(DISTINCT CASE WHEN t.basket_size_category = '2 items' THEN t.id END) as two_item_transactions,
  COUNT(DISTINCT CASE WHEN t.basket_size_category = '3+ items' THEN t.id END) as multi_item_transactions,
  COUNT(DISTINCT t.consumer_profile_id) as unique_consumers
FROM public.transactions t
JOIN public.stores s ON t.store_id = s.id
WHERE t.status = 'completed'
GROUP BY 
  DATE_TRUNC('hour', t.transaction_datetime),
  EXTRACT(HOUR FROM t.transaction_datetime),
  EXTRACT(DOW FROM t.transaction_datetime),
  t.day_type,
  s.region,
  s.city,
  s.barangay,
  s.store_id;

-- Product mix and category analysis
CREATE MATERIALIZED VIEW public.mv_product_mix AS
SELECT 
  p.category_name,
  p.brand_name,
  p.sku,
  p.product_name,
  COUNT(DISTINCT ti.transaction_id) as transaction_count,
  SUM(ti.quantity) as total_units_sold,
  SUM(ti.line_total) as total_revenue,
  AVG(ti.unit_price) as avg_selling_price,
  COUNT(DISTINCT tb.basket_hash) as unique_baskets,
  AVG(tb.total_items) as avg_basket_size_when_included,
  ARRAY_AGG(DISTINCT s.region) as regions_sold,
  ARRAY_AGG(DISTINCT s.city) as cities_sold
FROM public.transaction_items ti
JOIN public.products p ON ti.product_id = p.id
JOIN public.transactions t ON ti.transaction_id = t.id
JOIN public.stores s ON t.store_id = s.id
LEFT JOIN public.transaction_baskets tb ON t.id = tb.transaction_id
WHERE ti.is_voided = false
GROUP BY p.category_name, p.brand_name, p.sku, p.product_name;

-- Consumer behavior patterns
CREATE MATERIALIZED VIEW public.mv_consumer_behavior AS
SELECT 
  cp.gender,
  cp.age_bracket,
  cp.location_store_id,
  s.region,
  s.city,
  COUNT(DISTINCT pr.id) as total_requests,
  COUNT(DISTINCT CASE WHEN pr.request_type = 'branded' THEN pr.id END) as branded_requests,
  COUNT(DISTINCT CASE WHEN pr.request_type = 'unbranded' THEN pr.id END) as unbranded_requests,
  COUNT(DISTINCT CASE WHEN pr.request_type = 'unsure' THEN pr.id END) as unsure_requests,
  COUNT(DISTINCT CASE WHEN pr.request_method = 'verbal' THEN pr.id END) as verbal_requests,
  COUNT(DISTINCT CASE WHEN pr.request_method = 'pointing' THEN pr.id END) as pointing_requests,
  COUNT(DISTINCT ps.id) as total_substitutions,
  COUNT(DISTINCT CASE WHEN ps.accepted = true THEN ps.id END) as accepted_substitutions,
  COUNT(DISTINCT ss.id) as total_suggestions,
  COUNT(DISTINCT CASE WHEN ss.accepted = true THEN ss.id END) as accepted_suggestions,
  AVG(ci.duration_seconds) as avg_interaction_duration,
  AVG(t.total_amount) as avg_transaction_value,
  ARRAY_AGG(DISTINCT p.category_name) as categories_purchased,
  ARRAY_AGG(DISTINCT p.brand_name) as brands_purchased
FROM public.consumer_profiles cp
LEFT JOIN public.consumer_interactions ci ON cp.id = ci.consumer_profile_id
LEFT JOIN public.transactions t ON ci.transaction_id = t.id
LEFT JOIN public.stores s ON cp.location_store_id = s.id
LEFT JOIN public.product_requests pr ON t.id = pr.transaction_id
LEFT JOIN public.product_substitutions ps ON t.id = ps.transaction_id
LEFT JOIN public.store_suggestions ss ON t.id = ss.transaction_id
LEFT JOIN public.transaction_items ti ON t.id = ti.transaction_id
LEFT JOIN public.products p ON ti.product_id = p.id
GROUP BY cp.gender, cp.age_bracket, cp.location_store_id, s.region, s.city;

-- Substitution patterns analysis
CREATE MATERIALIZED VIEW public.mv_substitution_patterns AS
SELECT 
  ps.original_brand,
  ps.substitute_brand,
  ps.original_category,
  ps.substitute_category,
  COUNT(*) as substitution_count,
  COUNT(DISTINCT ps.transaction_id) as unique_transactions,
  COUNT(CASE WHEN ps.accepted = true THEN 1 END) as accepted_count,
  CAST(COUNT(CASE WHEN ps.accepted = true THEN 1 END) AS FLOAT) / COUNT(*) * 100 as acceptance_rate,
  ps.reason as substitution_reason,
  ARRAY_AGG(DISTINCT s.region) as regions,
  STRING_AGG(DISTINCT cp.age_bracket, ', ') as age_brackets,
  STRING_AGG(DISTINCT cp.gender, ', ') as genders
FROM public.product_substitutions ps
JOIN public.transactions t ON ps.transaction_id = t.id
JOIN public.stores s ON t.store_id = s.id
LEFT JOIN public.consumer_profiles cp ON t.consumer_profile_id = cp.id
GROUP BY ps.original_brand, ps.substitute_brand, ps.original_category, ps.substitute_category, ps.reason
HAVING COUNT(*) >= 5; -- Only show patterns with at least 5 occurrences

-- Frequently bought together patterns
CREATE MATERIALIZED VIEW public.mv_product_combinations AS
WITH product_pairs AS (
  SELECT 
    ti1.product_id as product1_id,
    ti2.product_id as product2_id,
    p1.product_name as product1_name,
    p2.product_name as product2_name,
    p1.category_name as product1_category,
    p2.category_name as product2_category,
    p1.brand_name as product1_brand,
    p2.brand_name as product2_brand,
    COUNT(*) as co_occurrence_count
  FROM public.transaction_items ti1
  JOIN public.transaction_items ti2 ON ti1.transaction_id = ti2.transaction_id AND ti1.product_id < ti2.product_id
  JOIN public.products p1 ON ti1.product_id = p1.id
  JOIN public.products p2 ON ti2.product_id = p2.id
  WHERE ti1.is_voided = false AND ti2.is_voided = false
  GROUP BY ti1.product_id, ti2.product_id, p1.product_name, p2.product_name, 
           p1.category_name, p2.category_name, p1.brand_name, p2.brand_name
)
SELECT 
  product1_name,
  product2_name,
  product1_category,
  product2_category,
  product1_brand,
  product2_brand,
  co_occurrence_count,
  CAST(co_occurrence_count AS FLOAT) / (
    SELECT COUNT(DISTINCT transaction_id) 
    FROM public.transaction_items 
    WHERE product_id IN (
      SELECT id FROM public.products WHERE product_name = product1_name
    )
  ) * 100 as confidence_percent
FROM product_pairs
WHERE co_occurrence_count >= 10
ORDER BY co_occurrence_count DESC;

-- Create indexes on materialized views
CREATE INDEX idx_mv_transaction_patterns_time ON public.mv_transaction_patterns(hour_bucket, hour_of_day);
CREATE INDEX idx_mv_transaction_patterns_location ON public.mv_transaction_patterns(region, city, barangay);
CREATE INDEX idx_mv_product_mix_category ON public.mv_product_mix(category_name, brand_name);
CREATE INDEX idx_mv_consumer_behavior_demo ON public.mv_consumer_behavior(gender, age_bracket);
CREATE INDEX idx_mv_substitution_patterns_brands ON public.mv_substitution_patterns(original_brand, substitute_brand);

-- Create function to refresh all materialized views
CREATE OR REPLACE FUNCTION public.refresh_retail_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_transaction_patterns;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_product_mix;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_consumer_behavior;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_substitution_patterns;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_product_combinations;
  
  -- Also refresh the product performance views
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_daily_sales') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_daily_sales;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_product_performance') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_product_performance;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_hourly_patterns') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_hourly_patterns;
  END IF;
  
  RAISE NOTICE 'All retail analytics views refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.refresh_retail_analytics_views() TO authenticated;

-- Enable Row Level Security on new tables
ALTER TABLE public.consumer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_baskets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Enable read access for all users" ON public.consumer_profiles FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.product_requests FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.product_substitutions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.store_suggestions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.transaction_baskets FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.consumer_interactions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.payment_methods FOR SELECT USING (true);

-- Create RLS policies for authenticated write access
CREATE POLICY "Enable write access for authenticated users" ON public.consumer_profiles 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.product_requests 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.product_substitutions 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.store_suggestions 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.transaction_baskets 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.consumer_interactions 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.payment_methods 
  FOR ALL USING (auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE public.consumer_profiles IS 'Consumer demographic and behavioral profiles';
COMMENT ON TABLE public.product_requests IS 'How consumers request products (branded, unbranded, pointing, etc.)';
COMMENT ON TABLE public.product_substitutions IS 'Product substitution patterns when items are unavailable';
COMMENT ON TABLE public.store_suggestions IS 'Store owner/attendant product suggestions and interventions';
COMMENT ON TABLE public.transaction_baskets IS 'Analysis of multi-item purchases and basket composition';
COMMENT ON TABLE public.consumer_interactions IS 'Consumer interaction patterns and duration tracking';
COMMENT ON TABLE public.payment_methods IS 'Payment methods including cash, digital wallets, and utang/lista';