-- Complete Data Model Migration for POS Analytics System
-- Based on actual POS transaction data structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if needed (for clean migration)
DROP TABLE IF EXISTS public.transaction_items CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.cashiers CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.price_history CASCADE;
DROP TABLE IF EXISTS public.inventory_movements CASCADE;
DROP TABLE IF EXISTS public.promotions CASCADE;
DROP TABLE IF EXISTS public.promotion_items CASCADE;

-- Create base tables

-- Stores table
CREATE TABLE public.stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_code VARCHAR(50) UNIQUE NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  province VARCHAR(100),
  city VARCHAR(100),
  barangay VARCHAR(100),
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  store_type VARCHAR(50),
  opening_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  contact_number VARCHAR(50),
  email VARCHAR(255),
  manager_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Cashiers table
CREATE TABLE public.cashiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  nickname VARCHAR(100),
  store_id UUID REFERENCES public.stores(id),
  hire_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  shift_schedule VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Customers table
CREATE TABLE public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_code VARCHAR(50) UNIQUE,
  customer_name VARCHAR(255),
  customer_type VARCHAR(50) DEFAULT 'Walk-in',
  contact_number VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  birth_date DATE,
  registration_date DATE DEFAULT CURRENT_DATE,
  loyalty_points INTEGER DEFAULT 0,
  total_purchases DECIMAL(15,2) DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  last_visit_date DATE,
  preferred_payment_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Product categories table
CREATE TABLE public.product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_code VARCHAR(50) UNIQUE NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  parent_category_id UUID REFERENCES public.product_categories(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Brands table
CREATE TABLE public.brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_code VARCHAR(50) UNIQUE NOT NULL,
  brand_name VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255),
  country_of_origin VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Suppliers table
CREATE TABLE public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_code VARCHAR(50) UNIQUE NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  contact_number VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  payment_terms VARCHAR(100),
  delivery_lead_time INTEGER, -- in days
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Products table (main product catalog)
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode VARCHAR(50) UNIQUE NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.product_categories(id),
  brand_id UUID REFERENCES public.brands(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  unit_of_measure VARCHAR(20),
  pack_size VARCHAR(50),
  current_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  suggested_retail_price DECIMAL(10,2),
  vat_exempt BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  min_stock_level INTEGER DEFAULT 10,
  max_stock_level INTEGER DEFAULT 1000,
  reorder_point INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Transactions table (POS transactions)
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_date DATE NOT NULL,
  transaction_time TIME NOT NULL,
  transaction_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  store_id UUID REFERENCES public.stores(id) NOT NULL,
  cashier_id UUID REFERENCES public.cashiers(id),
  customer_id UUID REFERENCES public.customers(id),
  subtotal DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(100),
  change_amount DECIMAL(10,2) DEFAULT 0,
  items_count INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  void_reason TEXT,
  voided_by UUID REFERENCES public.cashiers(id),
  voided_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Transaction items table (line items)
CREATE TABLE public.transaction_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  barcode VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(10,2),
  profit_amount DECIMAL(10,2),
  promotion_id UUID,
  is_voided BOOLEAN DEFAULT false,
  void_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Price history table
CREATE TABLE public.price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  change_reason VARCHAR(255),
  changed_by VARCHAR(255),
  effective_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inventory movements table
CREATE TABLE public.inventory_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES public.stores(id) NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  movement_type VARCHAR(50) NOT NULL, -- 'in', 'out', 'adjustment', 'transfer'
  quantity DECIMAL(10,3) NOT NULL,
  reference_type VARCHAR(50), -- 'purchase', 'sale', 'return', 'adjustment'
  reference_id UUID,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(12,2),
  stock_before DECIMAL(10,3),
  stock_after DECIMAL(10,3),
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Promotions table
CREATE TABLE public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_code VARCHAR(50) UNIQUE NOT NULL,
  promotion_name VARCHAR(255) NOT NULL,
  promotion_type VARCHAR(50) NOT NULL, -- 'discount', 'bundle', 'bogo', 'points'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  min_purchase_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Promotion items table
CREATE TABLE public.promotion_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  category_id UUID REFERENCES public.product_categories(id),
  discount_percent DECIMAL(5,2),
  discount_amount DECIMAL(10,2),
  special_price DECIMAL(10,2),
  buy_quantity INTEGER,
  get_quantity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_store ON public.transactions(store_id);
CREATE INDEX idx_transactions_datetime ON public.transactions(transaction_datetime);
CREATE INDEX idx_transaction_items_transaction ON public.transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON public.transaction_items(product_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_brand ON public.products(brand_id);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_inventory_movements_store_product ON public.inventory_movements(store_id, product_id);
CREATE INDEX idx_price_history_product ON public.price_history(product_id);

-- Create materialized views for analytics

-- Daily sales summary
CREATE MATERIALIZED VIEW public.mv_daily_sales AS
SELECT 
  t.transaction_date,
  t.store_id,
  s.store_name,
  s.region,
  s.city,
  COUNT(DISTINCT t.id) as transaction_count,
  COUNT(DISTINCT t.customer_id) as unique_customers,
  SUM(t.items_count) as total_items_sold,
  SUM(t.subtotal) as gross_sales,
  SUM(t.discount_amount) as total_discounts,
  SUM(t.tax_amount) as total_tax,
  SUM(t.total_amount) as net_sales,
  AVG(t.total_amount) as avg_transaction_value,
  COUNT(DISTINCT CASE WHEN t.payment_method = 'Cash' THEN t.id END) as cash_transactions,
  COUNT(DISTINCT CASE WHEN t.payment_method != 'Cash' THEN t.id END) as digital_transactions
FROM public.transactions t
JOIN public.stores s ON t.store_id = s.id
WHERE t.status = 'completed'
GROUP BY t.transaction_date, t.store_id, s.store_name, s.region, s.city;

-- Product performance
CREATE MATERIALIZED VIEW public.mv_product_performance AS
SELECT 
  p.id as product_id,
  p.barcode,
  p.sku,
  p.product_name,
  pc.category_name,
  b.brand_name,
  COUNT(DISTINCT ti.transaction_id) as transaction_count,
  SUM(ti.quantity) as total_quantity_sold,
  SUM(ti.line_total) as total_revenue,
  SUM(ti.profit_amount) as total_profit,
  AVG(ti.unit_price) as avg_selling_price,
  AVG(ti.discount_percent) as avg_discount_percent,
  DATE_TRUNC('month', CURRENT_DATE) as calculation_month
FROM public.products p
LEFT JOIN public.transaction_items ti ON p.id = ti.product_id
LEFT JOIN public.product_categories pc ON p.category_id = pc.id
LEFT JOIN public.brands b ON p.brand_id = b.id
WHERE ti.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND ti.is_voided = false
GROUP BY p.id, p.barcode, p.sku, p.product_name, pc.category_name, b.brand_name;

-- Hourly sales patterns
CREATE MATERIALIZED VIEW public.mv_hourly_patterns AS
SELECT 
  EXTRACT(HOUR FROM transaction_time) as hour_of_day,
  EXTRACT(DOW FROM transaction_date) as day_of_week,
  COUNT(*) as transaction_count,
  SUM(total_amount) as total_sales,
  AVG(total_amount) as avg_transaction_value,
  AVG(items_count) as avg_items_per_transaction
FROM public.transactions
WHERE status = 'completed'
  AND transaction_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY EXTRACT(HOUR FROM transaction_time), EXTRACT(DOW FROM transaction_date);

-- Create indexes on materialized views
CREATE INDEX idx_mv_daily_sales_date ON public.mv_daily_sales(transaction_date);
CREATE INDEX idx_mv_daily_sales_store ON public.mv_daily_sales(store_id);
CREATE INDEX idx_mv_product_performance_product ON public.mv_product_performance(product_id);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cashiers_updated_at BEFORE UPDATE ON public.cashiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Enable read access for all users" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.cashiers FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.transaction_items FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.price_history FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.inventory_movements FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.promotion_items FOR SELECT USING (true);

-- Create RLS policies for authenticated users write access
CREATE POLICY "Enable write access for authenticated users" ON public.stores 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.cashiers 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.customers 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.product_categories 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.brands 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.suppliers 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.products 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.transactions 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.transaction_items 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.price_history 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.inventory_movements 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.promotions 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.promotion_items 
  FOR ALL USING (auth.role() = 'authenticated');

-- Add comments to tables
COMMENT ON TABLE public.stores IS 'Physical store locations';
COMMENT ON TABLE public.cashiers IS 'Store cashiers/employees';
COMMENT ON TABLE public.customers IS 'Customer records';
COMMENT ON TABLE public.product_categories IS 'Product category hierarchy';
COMMENT ON TABLE public.brands IS 'Product brands';
COMMENT ON TABLE public.suppliers IS 'Product suppliers';
COMMENT ON TABLE public.products IS 'Product master catalog';
COMMENT ON TABLE public.transactions IS 'POS transaction headers';
COMMENT ON TABLE public.transaction_items IS 'POS transaction line items';
COMMENT ON TABLE public.price_history IS 'Product price change history';
COMMENT ON TABLE public.inventory_movements IS 'Stock movement records';
COMMENT ON TABLE public.promotions IS 'Promotional campaigns';
COMMENT ON TABLE public.promotion_items IS 'Products included in promotions';