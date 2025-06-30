-- Client-Brand Relationship Tables
-- This migration creates the proper relationships between clients (like TBWA) and their brands/products

-- Create clients table (advertising/marketing clients)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_code VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_type VARCHAR(50) CHECK (client_type IN ('agency', 'direct', 'distributor')),
  industry VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create client_brands junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.client_brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) CHECK (relationship_type IN ('exclusive', 'shared', 'regional')),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(client_id, brand_id)
);

-- Create client_categories table (which categories a client focuses on)
CREATE TABLE IF NOT EXISTS public.client_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(client_id, category_id)
);

-- Create client_products table (specific SKUs managed by clients)
CREATE TABLE IF NOT EXISTS public.client_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  is_featured BOOLEAN DEFAULT false,
  campaign_name VARCHAR(255),
  campaign_start_date DATE,
  campaign_end_date DATE,
  target_sales_increase DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(client_id, product_id)
);

-- Add client tracking to transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id),
ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(100);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_brands_client ON public.client_brands(client_id);
CREATE INDEX IF NOT EXISTS idx_client_brands_brand ON public.client_brands(brand_id);
CREATE INDEX IF NOT EXISTS idx_client_brands_active ON public.client_brands(is_active);
CREATE INDEX IF NOT EXISTS idx_client_categories_client ON public.client_categories(client_id);
CREATE INDEX IF NOT EXISTS idx_client_products_client ON public.client_products(client_id);
CREATE INDEX IF NOT EXISTS idx_client_products_featured ON public.client_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_transactions_client ON public.transactions(client_id);

-- Create view for client performance metrics
CREATE OR REPLACE VIEW public.vw_client_performance AS
SELECT 
  c.id as client_id,
  c.client_name,
  c.client_type,
  COUNT(DISTINCT cb.brand_id) as total_brands,
  COUNT(DISTINCT cp.product_id) as total_products,
  COUNT(DISTINCT t.id) as total_transactions,
  SUM(t.total_amount) as total_revenue,
  AVG(t.total_amount) as avg_transaction_value,
  COUNT(DISTINCT t.store_id) as store_coverage,
  COUNT(DISTINCT DATE(t.transaction_datetime)) as active_days,
  STRING_AGG(DISTINCT b.brand_name, ', ' ORDER BY b.brand_name) as brand_list
FROM public.clients c
LEFT JOIN public.client_brands cb ON c.id = cb.client_id AND cb.is_active = true
LEFT JOIN public.brands b ON cb.brand_id = b.id
LEFT JOIN public.client_products cp ON c.id = cp.client_id
LEFT JOIN public.transactions t ON c.id = t.client_id
GROUP BY c.id, c.client_name, c.client_type;

-- Create view for brand ownership
CREATE OR REPLACE VIEW public.vw_brand_ownership AS
SELECT 
  b.id as brand_id,
  b.brand_name,
  b.brand_code,
  pc.category_name,
  COUNT(DISTINCT cb.client_id) as client_count,
  STRING_AGG(DISTINCT c.client_name, ', ' ORDER BY c.client_name) as managing_clients,
  CASE 
    WHEN COUNT(DISTINCT cb.client_id) = 1 THEN 'exclusive'
    WHEN COUNT(DISTINCT cb.client_id) > 1 THEN 'shared'
    ELSE 'unmanaged'
  END as management_type,
  MAX(CASE WHEN cb.relationship_type = 'exclusive' THEN c.client_name END) as exclusive_client
FROM public.brands b
LEFT JOIN public.products p ON b.id = p.brand_id
LEFT JOIN public.product_categories pc ON p.category_id = pc.id
LEFT JOIN public.client_brands cb ON b.id = cb.brand_id AND cb.is_active = true
LEFT JOIN public.clients c ON cb.client_id = c.id
GROUP BY b.id, b.brand_name, b.brand_code, pc.category_name;

-- Insert sample TBWA client data
INSERT INTO public.clients (client_code, client_name, client_type, industry, contact_email) VALUES
  ('TBWA-001', 'TBWA\\Philippines', 'agency', 'Advertising & Marketing', 'info@tbwa.ph'),
  ('PG-001', 'Procter & Gamble', 'direct', 'Consumer Goods', 'contact@pg.com'),
  ('CCEP-001', 'Coca-Cola Europacific Partners', 'direct', 'Beverages', 'info@ccep.com')
ON CONFLICT (client_code) DO NOTHING;

-- Link TBWA to their managed brands (example data)
WITH tbwa_client AS (
  SELECT id FROM public.clients WHERE client_code = 'TBWA-001'
),
brand_mappings AS (
  SELECT 
    b.id as brand_id,
    tc.id as client_id,
    CASE 
      WHEN b.brand_name IN ('Pantene', 'Head & Shoulders', 'Rejoice') THEN 'exclusive'
      WHEN b.brand_name IN ('Coca-Cola', 'Sprite', 'Royal') THEN 'shared'
      ELSE 'shared'
    END as relationship_type
  FROM public.brands b
  CROSS JOIN tbwa_client tc
  WHERE b.brand_name IN (
    'Coca-Cola', 'Sprite', 'Royal', -- Beverages
    'Pantene', 'Head & Shoulders', 'Rejoice', -- Hair Care
    'Safeguard', 'Olay' -- Personal Care
  )
)
INSERT INTO public.client_brands (client_id, brand_id, relationship_type)
SELECT client_id, brand_id, relationship_type
FROM brand_mappings
ON CONFLICT (client_id, brand_id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.client_brands FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.client_categories FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.client_products FOR SELECT USING (true);

CREATE POLICY "Enable write access for authenticated users" ON public.clients 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.client_brands 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.client_categories 
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON public.client_products 
  FOR ALL USING (auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE public.clients IS 'Master table for advertising/marketing clients like TBWA';
COMMENT ON TABLE public.client_brands IS 'Many-to-many relationship between clients and brands they manage';
COMMENT ON TABLE public.client_categories IS 'Product categories that clients focus on';
COMMENT ON TABLE public.client_products IS 'Specific SKUs managed by clients with campaign details';
COMMENT ON COLUMN public.client_brands.relationship_type IS 'exclusive: only this client manages the brand, shared: multiple clients, regional: client manages brand in specific regions';