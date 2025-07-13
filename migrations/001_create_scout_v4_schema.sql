-- Scout Dashboard v4.0 Complete Database Schema
-- PostgreSQL migration for Philippine retail analytics
-- Supports FMCG & Tobacco categories with full transcription and AI signals

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS audio_transcripts CASCADE;
DROP TABLE IF EXISTS video_signals CASCADE;

-- =====================================================
-- REFERENCE TABLES
-- =====================================================

-- Brands table
CREATE TABLE brands (
    brand_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name VARCHAR(255) NOT NULL UNIQUE,
    manufacturer VARCHAR(255),
    is_tbwa_client BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_brands_name ON brands(brand_name);
CREATE INDEX idx_brands_tbwa ON brands(is_tbwa_client);

-- Products/SKUs table
CREATE TABLE products (
    sku_id VARCHAR(50) PRIMARY KEY,
    brand_id UUID REFERENCES brands(brand_id),
    product_name VARCHAR(255) NOT NULL,
    product_category VARCHAR(50) NOT NULL CHECK (
        product_category IN ('Dairy', 'Snack', 'Beverage', 'Home Care', 'Personal Care', 'Tobacco')
    ),
    product_subcat VARCHAR(100),
    barcode VARCHAR(50),
    unit_size VARCHAR(50),
    unit_measure VARCHAR(20),
    msrp DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_category ON products(product_category);
CREATE INDEX idx_products_name ON products(product_name);
CREATE INDEX idx_products_barcode ON products(barcode);

-- Stores table with PostGIS
CREATE TABLE stores (
    store_id VARCHAR(20) PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL,
    store_type VARCHAR(50) NOT NULL CHECK (
        store_type IN ('sari-sari', 'convenience', 'mini-mart', 'wholesale')
    ),
    owner_name VARCHAR(255),
    contact_number VARCHAR(50),
    
    -- Location hierarchy
    region VARCHAR(50) NOT NULL,
    province VARCHAR(100) NOT NULL,
    city_municipality VARCHAR(100) NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    street_address TEXT,
    
    -- Geographic coordinates
    location GEOGRAPHY(Point, 4326),
    latitude DECIMAL(10,6) NOT NULL,
    longitude DECIMAL(10,6) NOT NULL,
    
    -- Store attributes
    economic_class CHAR(1) CHECK (economic_class IN ('A', 'B', 'C', 'D', 'E')),
    store_size_sqm DECIMAL(8,2),
    employee_count INTEGER,
    operating_hours VARCHAR(100),
    
    -- Retail metrics
    has_pos BOOLEAN DEFAULT FALSE,
    accepts_gcash BOOLEAN DEFAULT FALSE,
    has_wifi BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Spatial and regular indexes
CREATE INDEX idx_stores_location ON stores USING GIST(location);
CREATE INDEX idx_stores_region ON stores(region);
CREATE INDEX idx_stores_province ON stores(province);
CREATE INDEX idx_stores_city ON stores(city_municipality);
CREATE INDEX idx_stores_barangay ON stores(barangay);
CREATE INDEX idx_stores_type ON stores(store_type);
CREATE INDEX idx_stores_class ON stores(economic_class);

-- Customers table
CREATE TABLE customers (
    customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(50),
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'unknown')),
    age_bracket VARCHAR(20) CHECK (
        age_bracket IN ('18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'unknown')
    ),
    customer_type VARCHAR(50) CHECK (
        customer_type IN ('regular', 'occasional', 'new', 'tourist')
    ),
    loyalty_status VARCHAR(50) CHECK (
        loyalty_status IN ('member', 'non-member', 'vip')
    ),
    
    -- Behavioral attributes
    price_sensitivity VARCHAR(20) CHECK (
        price_sensitivity IN ('high', 'medium', 'low')
    ),
    brand_loyalty VARCHAR(20) CHECK (
        brand_loyalty IN ('high', 'medium', 'low')
    ),
    purchase_frequency VARCHAR(20) CHECK (
        purchase_frequency IN ('daily', 'weekly', 'monthly', 'occasional')
    ),
    
    -- Inferred data
    inferred_from VARCHAR(50) CHECK (
        inferred_from IN ('video', 'audio', 'transaction_pattern', 'direct_input')
    ),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customers_gender ON customers(gender);
CREATE INDEX idx_customers_age ON customers(age_bracket);
CREATE INDEX idx_customers_type ON customers(customer_type);

-- Campaigns table
CREATE TABLE campaigns (
    campaign_id VARCHAR(50) PRIMARY KEY,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) CHECK (
        campaign_type IN ('above_the_line', 'below_the_line', 'through_the_line', 'experiential', 'digital')
    ),
    brand_id UUID REFERENCES brands(brand_id),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2),
    target_regions TEXT[],
    target_demographics JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaigns_brand ON campaigns(brand_id);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_active ON campaigns(is_active);

-- =====================================================
-- TRANSACTION TABLES
-- =====================================================

-- Main transactions table
CREATE TABLE transactions (
    transaction_id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    store_id VARCHAR(20) REFERENCES stores(store_id),
    customer_id UUID REFERENCES customers(customer_id),
    
    -- Transaction metrics
    transaction_value DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) CHECK (
        payment_method IN ('cash', 'gcash', 'maya', 'credit', 'debit', 'utang')
    ),
    
    -- Duration and volume
    duration_seconds INTEGER,
    units_total INTEGER NOT NULL,
    unique_items INTEGER NOT NULL,
    
    -- Environmental context
    weather VARCHAR(50) CHECK (
        weather IN ('sunny', 'rainy', 'cloudy', 'overcast', 'stormy')
    ),
    day_of_week VARCHAR(10) NOT NULL,
    hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
    is_holiday BOOLEAN DEFAULT FALSE,
    is_payday BOOLEAN DEFAULT FALSE,
    
    -- Campaign attribution
    campaign_id VARCHAR(50) REFERENCES campaigns(campaign_id),
    influenced_by_campaign BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX idx_transactions_store ON transactions(store_id);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_date ON transactions(DATE(timestamp));
CREATE INDEX idx_transactions_hour ON transactions(hour_of_day);
CREATE INDEX idx_transactions_dow ON transactions(day_of_week);
CREATE INDEX idx_transactions_campaign ON transactions(campaign_id);

-- Transaction items (line items)
CREATE TABLE transaction_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    sku_id VARCHAR(50) REFERENCES products(sku_id),
    
    -- Item details
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    discount_applied DECIMAL(10,2) DEFAULT 0,
    
    -- Substitution tracking
    was_substituted BOOLEAN DEFAULT FALSE,
    original_sku_id VARCHAR(50) REFERENCES products(sku_id),
    substitution_reason VARCHAR(50) CHECK (
        substitution_reason IN ('out_of_stock', 'price', 'recommendation', 'preference')
    ),
    
    -- Promotion tracking
    is_promo BOOLEAN DEFAULT FALSE,
    promo_type VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_items_sku ON transaction_items(sku_id);
CREATE INDEX idx_items_substituted ON transaction_items(was_substituted);

-- =====================================================
-- AI/ML SIGNAL TABLES
-- =====================================================

-- Audio transcripts and analysis
CREATE TABLE audio_transcripts (
    transcript_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    
    -- Audio metadata
    audio_language VARCHAR(50) CHECK (
        audio_language IN ('tagalog', 'english', 'mixed', 'bisaya', 'other')
    ),
    audio_duration_seconds INTEGER,
    audio_quality VARCHAR(20) CHECK (
        audio_quality IN ('clear', 'moderate', 'poor')
    ),
    background_noise_level VARCHAR(20) CHECK (
        background_noise_level IN ('low', 'medium', 'high')
    ),
    
    -- Transcription
    full_transcript TEXT,
    transcription_confidence DECIMAL(3,2),
    key_phrases TEXT[],
    
    -- Conversation analysis
    request_type VARCHAR(50) CHECK (
        request_type IN ('branded', 'unbranded', 'generic', 'specific')
    ),
    storeowner_influence VARCHAR(20) CHECK (
        storeowner_influence IN ('high', 'medium', 'low', 'none')
    ),
    recommendation_given BOOLEAN DEFAULT FALSE,
    suggestion_accepted BOOLEAN DEFAULT FALSE,
    
    -- Sentiment and intent
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    primary_intent VARCHAR(50) CHECK (
        primary_intent IN ('purchase', 'inquiry', 'complaint', 'browsing', 'return')
    ),
    
    -- Extracted entities
    brand_mentions TEXT[],
    product_mentions TEXT[],
    price_mentioned BOOLEAN DEFAULT FALSE,
    promo_inquiry BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audio_transaction ON audio_transcripts(transaction_id);
CREATE INDEX idx_audio_language ON audio_transcripts(audio_language);
CREATE INDEX idx_audio_sentiment ON audio_transcripts(sentiment_score);
-- Full text search on transcript
CREATE INDEX idx_audio_transcript_search ON audio_transcripts USING GIN(to_tsvector('english', full_transcript));

-- Video analysis signals
CREATE TABLE video_signals (
    signal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    
    -- Object detection
    objects_detected TEXT[],
    people_count INTEGER,
    products_visible TEXT[],
    shelf_visibility VARCHAR(20) CHECK (
        shelf_visibility IN ('full', 'partial', 'empty')
    ),
    
    -- Customer behavior
    browsing_duration_seconds INTEGER,
    products_touched INTEGER,
    decision_time_seconds INTEGER,
    path_taken TEXT,
    
    -- Store conditions
    lighting_quality VARCHAR(20) CHECK (
        lighting_quality IN ('good', 'moderate', 'poor')
    ),
    store_organization VARCHAR(20) CHECK (
        store_organization IN ('organized', 'moderate', 'cluttered')
    ),
    queue_length INTEGER,
    
    -- Engagement metrics
    looked_at_promo BOOLEAN DEFAULT FALSE,
    promo_materials_visible TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_video_transaction ON video_signals(transaction_id);
CREATE INDEX idx_video_objects ON video_signals USING GIN(objects_detected);

-- =====================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- =====================================================

-- Hourly transaction patterns
CREATE MATERIALIZED VIEW mv_hourly_patterns AS
SELECT 
    DATE(timestamp) as date,
    hour_of_day,
    store_id,
    COUNT(*) as transaction_count,
    SUM(transaction_value) as total_value,
    AVG(transaction_value) as avg_value,
    SUM(units_total) as total_units,
    AVG(duration_seconds) as avg_duration
FROM transactions
GROUP BY DATE(timestamp), hour_of_day, store_id;

CREATE INDEX idx_mv_hourly_date ON mv_hourly_patterns(date);
CREATE INDEX idx_mv_hourly_store ON mv_hourly_patterns(store_id);

-- Daily sales summary
CREATE MATERIALIZED VIEW mv_daily_sales AS
SELECT 
    DATE(timestamp) as date,
    store_id,
    COUNT(DISTINCT transaction_id) as transactions,
    COUNT(DISTINCT customer_id) as unique_customers,
    SUM(transaction_value) as gross_sales,
    SUM(discount_amount) as total_discounts,
    SUM(final_amount) as net_sales,
    AVG(transaction_value) as avg_basket_value,
    SUM(units_total) as units_sold
FROM transactions
GROUP BY DATE(timestamp), store_id;

CREATE INDEX idx_mv_daily_date ON mv_daily_sales(date);
CREATE INDEX idx_mv_daily_store ON mv_daily_sales(store_id);

-- Product performance
CREATE MATERIALIZED VIEW mv_product_performance AS
SELECT 
    p.sku_id,
    p.product_name,
    p.product_category,
    b.brand_name,
    b.is_tbwa_client,
    COUNT(DISTINCT ti.transaction_id) as transaction_count,
    SUM(ti.quantity) as units_sold,
    SUM(ti.total_price) as revenue,
    AVG(ti.unit_price) as avg_price,
    SUM(CASE WHEN ti.was_substituted THEN 1 ELSE 0 END) as substitution_count
FROM products p
JOIN brands b ON p.brand_id = b.brand_id
JOIN transaction_items ti ON p.sku_id = ti.sku_id
GROUP BY p.sku_id, p.product_name, p.product_category, b.brand_name, b.is_tbwa_client;

CREATE INDEX idx_mv_product_sku ON mv_product_performance(sku_id);
CREATE INDEX idx_mv_product_category ON mv_product_performance(product_category);

-- Regional performance
CREATE MATERIALIZED VIEW mv_regional_performance AS
SELECT 
    s.region,
    s.province,
    s.city_municipality,
    COUNT(DISTINCT s.store_id) as store_count,
    COUNT(DISTINCT t.transaction_id) as transaction_count,
    SUM(t.transaction_value) as total_revenue,
    AVG(t.transaction_value) as avg_transaction_value,
    COUNT(DISTINCT t.customer_id) as unique_customers
FROM stores s
JOIN transactions t ON s.store_id = t.store_id
GROUP BY s.region, s.province, s.city_municipality;

CREATE INDEX idx_mv_regional_region ON mv_regional_performance(region);
CREATE INDEX idx_mv_regional_province ON mv_regional_performance(province);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get store coordinates
CREATE OR REPLACE FUNCTION get_store_coordinates(p_store_id VARCHAR)
RETURNS TABLE(latitude DECIMAL, longitude DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT s.latitude, s.longitude
    FROM stores s
    WHERE s.store_id = p_store_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate distance between stores
CREATE OR REPLACE FUNCTION calculate_store_distance(store1_id VARCHAR, store2_id VARCHAR)
RETURNS DECIMAL AS $$
DECLARE
    loc1 GEOGRAPHY;
    loc2 GEOGRAPHY;
BEGIN
    SELECT location INTO loc1 FROM stores WHERE store_id = store1_id;
    SELECT location INTO loc2 FROM stores WHERE store_id = store2_id;
    
    RETURN ST_Distance(loc1, loc2) / 1000; -- Return in kilometers
END;
$$ LANGUAGE plpgsql;

-- Function to get nearby stores
CREATE OR REPLACE FUNCTION get_nearby_stores(
    p_latitude DECIMAL, 
    p_longitude DECIMAL, 
    p_radius_km DECIMAL DEFAULT 5.0
)
RETURNS TABLE(
    store_id VARCHAR,
    store_name VARCHAR,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.store_id,
        s.store_name,
        ROUND((ST_Distance(
            s.location, 
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        ) / 1000)::numeric, 2) AS distance_km
    FROM stores s
    WHERE ST_DWithin(
        s.location,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
        p_radius_km * 1000
    )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR DATA INTEGRITY
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to tables with updated_at
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-set store location from lat/lng
CREATE OR REPLACE FUNCTION set_store_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_store_location_trigger
    BEFORE INSERT OR UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION set_store_location();

-- =====================================================
-- PERMISSIONS (adjust based on your users)
-- =====================================================

-- Create read-only role for dashboards
CREATE ROLE dashboard_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO dashboard_reader;
GRANT SELECT ON ALL MATERIALIZED VIEWS IN SCHEMA public TO dashboard_reader;

-- Create write role for data ingestion
CREATE ROLE data_writer;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO data_writer;

-- =====================================================
-- SAMPLE DATA INSERTION (for testing)
-- =====================================================

-- Insert sample brands
INSERT INTO brands (brand_name, manufacturer, is_tbwa_client) VALUES
('Alaska', 'Alaska Milk Corporation', TRUE),
('Marlboro', 'Philip Morris', TRUE),
('Tide', 'Procter & Gamble', TRUE),
('Lucky Me', 'Monde Nissin', FALSE),
('Coca-Cola', 'Coca-Cola Company', TRUE),
('Kopiko', 'Mayora', FALSE);

-- Insert sample products
INSERT INTO products (sku_id, brand_id, product_name, product_category, product_subcat, msrp) VALUES
('ALS001', (SELECT brand_id FROM brands WHERE brand_name = 'Alaska'), 'Alaska Evap 370ml', 'Dairy', 'Evaporated Milk', 42.00),
('MAR001', (SELECT brand_id FROM brands WHERE brand_name = 'Marlboro'), 'Marlboro Red', 'Tobacco', 'Cigarette', 180.00),
('TID001', (SELECT brand_id FROM brands WHERE brand_name = 'Tide'), 'Tide Bar 130g', 'Home Care', 'Detergent', 25.00);

-- =====================================================
-- MAINTENANCE COMMANDS
-- =====================================================

-- Refresh materialized views (run periodically)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hourly_patterns;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_performance;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_regional_performance;

-- Analyze tables for query optimization
-- ANALYZE transactions;
-- ANALYZE transaction_items;
-- ANALYZE stores;
-- ANALYZE products;