-- TBWA Unified Platform - Initial Schema Migration
-- Generated from DBML schema
-- Date: July 15, 2025

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ======================
-- ENUM TYPES
-- ======================

CREATE TYPE campaign_status AS ENUM (
  'draft',
  'active', 
  'completed',
  'paused',
  'cancelled'
);

CREATE TYPE attendance_status AS ENUM (
  'pending',
  'verified',
  'rejected',
  'manual_override'
);

CREATE TYPE expense_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'reimbursed'
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'gcash',
  'credit_card',
  'debit_card',
  'utang/lista',
  'bank_transfer'
);

CREATE TYPE philippine_regions AS ENUM (
  'NCR',
  'CAR (Cordillera Administrative Region)',
  'Region I (Ilocos Region)',
  'Region II (Cagayan Valley)',
  'Region III (Central Luzon)',
  'Region IV-A (CALABARZON)',
  'Region IV-B (MIMAROPA)',
  'Region V (Bicol Region)',
  'Region VI (Western Visayas)',
  'Region VII (Central Visayas)',
  'Region VIII (Eastern Visayas)',
  'Region IX (Zamboanga Peninsula)',
  'Region X (Northern Mindanao)',
  'Region XI (Davao Region)',
  'Region XII (SOCCSKSARGEN)',
  'Region XIII (Caraga)',
  'BARMM (Bangsamoro Autonomous Region)'
);

-- ======================
-- CAMPAIGNS & LIONS PALETTE
-- ======================

CREATE TABLE campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  palette_colors TEXT[] NOT NULL,
  effectiveness DECIMAL(5,2) DEFAULT 0,
  region VARCHAR(100),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  status campaign_status DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE campaigns IS 'Lions Palette campaign data with color analysis';
COMMENT ON COLUMN campaigns.palette_colors IS 'Array of hex color codes';
COMMENT ON COLUMN campaigns.effectiveness IS 'Effectiveness score 0-100';
COMMENT ON COLUMN campaigns.region IS 'Target region (NCR, Luzon, Visayas, Mindanao)';
COMMENT ON COLUMN campaigns.metadata IS 'Additional campaign data';

-- ======================
-- SCOUT ANALYTICS
-- ======================

CREATE TABLE stores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_name VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL,
  barangay VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  store_type VARCHAR(50),
  monthly_revenue DECIMAL(12,2),
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE stores IS 'Philippine retail stores and venues';
COMMENT ON COLUMN stores.store_type IS 'sari-sari, mall, department, etc.';

CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  product_category VARCHAR(100) NOT NULL,
  brand_name VARCHAR(255),
  unit_price DECIMAL(10,2),
  sku VARCHAR(100) UNIQUE,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE products IS 'Product catalog for Scout Analytics';

CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  customer_id VARCHAR(255),
  transaction_value DECIMAL(10,2) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method,
  transaction_date TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER,
  units_total INTEGER,
  campaign_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE transactions IS 'Scout Analytics transaction records';
COMMENT ON COLUMN transactions.payment_method IS 'Cash, GCash, Credit, Utang/Lista';

CREATE TABLE transaction_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

COMMENT ON TABLE transaction_items IS 'Individual items within transactions';

CREATE TABLE handshake_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  location VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL,
  transaction_value DECIMAL(10,2),
  product_category VARCHAR(100),
  campaign_ids UUID[] DEFAULT '{}',
  customer_demographic JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE handshake_events IS 'Scout Analytics handshake events - consumer interactions';
COMMENT ON COLUMN handshake_events.timestamp IS 'When the handshake occurred';
COMMENT ON COLUMN handshake_events.location IS 'Store or venue name';
COMMENT ON COLUMN handshake_events.region IS 'Philippine region';
COMMENT ON COLUMN handshake_events.transaction_value IS 'Transaction amount in PHP';
COMMENT ON COLUMN handshake_events.campaign_ids IS 'Related campaign UUIDs';
COMMENT ON COLUMN handshake_events.customer_demographic IS 'Age, gender, preferences';

-- ======================
-- HRIS & EMPLOYEES
-- ======================

CREATE TABLE employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  role VARCHAR(100),
  photo_url TEXT,
  face_encoding TEXT,
  salary DECIMAL(10,2),
  hire_date DATE,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE employees IS 'TBWA employee records with biometric data';
COMMENT ON COLUMN employees.department IS 'Creative, Account Management, Strategy, etc.';
COMMENT ON COLUMN employees.role IS 'Job title or position';
COMMENT ON COLUMN employees.photo_url IS 'Profile photo for face recognition';
COMMENT ON COLUMN employees.face_encoding IS 'Encoded face data for attendance verification';

CREATE TABLE attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  location VARCHAR(255),
  verification_score DECIMAL(3,2),
  status attendance_status DEFAULT 'pending',
  work_hours DECIMAL(4,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE attendance IS 'Photo-verified attendance records';
COMMENT ON COLUMN attendance.location IS 'Office location or remote';
COMMENT ON COLUMN attendance.verification_score IS 'Face recognition confidence 0-1';
COMMENT ON COLUMN attendance.work_hours IS 'Calculated hours worked';

CREATE TABLE expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) NOT NULL,
  merchant VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(100),
  receipt_url TEXT,
  items JSONB DEFAULT '[]',
  status expense_status DEFAULT 'pending',
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE expenses IS 'OCR-processed expense claims';
COMMENT ON COLUMN expenses.category IS 'Travel, Meals, Office Supplies, etc.';
COMMENT ON COLUMN expenses.receipt_url IS 'OCR-processed receipt image';
COMMENT ON COLUMN expenses.items IS 'Extracted line items from receipt';

-- ======================
-- AI INSIGHTS & ANALYTICS
-- ======================

CREATE TABLE insight_correlations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  finding TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  affected_entities TEXT[] DEFAULT '{}',
  recommendation TEXT,
  data_points INTEGER,
  algorithm VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE insight_correlations IS 'Cross-platform AI-generated insights';
COMMENT ON COLUMN insight_correlations.type IS 'palette-performance, employee-effectiveness, etc.';
COMMENT ON COLUMN insight_correlations.finding IS 'AI-generated insight description';
COMMENT ON COLUMN insight_correlations.confidence IS 'AI confidence score 0-1';
COMMENT ON COLUMN insight_correlations.affected_entities IS 'Campaign IDs, employee IDs, etc.';
COMMENT ON COLUMN insight_correlations.data_points IS 'Number of data points used';
COMMENT ON COLUMN insight_correlations.algorithm IS 'AI algorithm used';

CREATE TABLE performance_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calculation_method VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE performance_metrics IS 'Performance metrics for all entities';
COMMENT ON COLUMN performance_metrics.entity_type IS 'campaign | employee | region | store';
COMMENT ON COLUMN performance_metrics.entity_id IS 'References ID from relevant table';
COMMENT ON COLUMN performance_metrics.metric_name IS 'revenue, satisfaction, effectiveness, etc.';
COMMENT ON COLUMN performance_metrics.calculation_method IS 'How the metric was calculated';

-- ======================
-- TRIGGERS FOR UPDATED_AT
-- ======================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at 
    BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================
-- ROW LEVEL SECURITY
-- ======================

-- Enable RLS on sensitive tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (customize based on your auth requirements)
CREATE POLICY "Employees can view their own data" ON employees
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Employees can view their own attendance" ON attendance
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM employees WHERE auth.uid()::text = id::text
        )
    );

CREATE POLICY "Employees can view their own expenses" ON expenses
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM employees WHERE auth.uid()::text = id::text
        )
    );

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert sample data for testing
INSERT INTO campaigns (name, palette_colors, effectiveness, region, start_date, status)
VALUES 
    ('Summer Sizzle 2024', ARRAY['#FF6B6B', '#4ECDC4', '#FFE66D'], 92.5, 'NCR', '2024-06-01', 'active'),
    ('Metro Fresh Launch', ARRAY['#2ECC71', '#3498DB', '#E74C3C'], 87.3, 'NCR', '2024-07-15', 'active'),
    ('Visayas Blue Wave', ARRAY['#0077BE', '#00CED1', '#1E90FF'], 89.7, 'Region VII (Central Visayas)', '2024-07-01', 'active');

INSERT INTO stores (store_name, region, barangay, store_type, monthly_revenue)
VALUES
    ('SM Mall of Asia', 'NCR', 'Pasay City', 'mall', 15000000.00),
    ('Ayala Center Cebu', 'Region VII (Central Visayas)', 'Lahug', 'mall', 8500000.00),
    ('Sari-Sari ni Aling Rosa', 'NCR', 'Quezon City', 'sari-sari', 25000.00);

COMMIT;