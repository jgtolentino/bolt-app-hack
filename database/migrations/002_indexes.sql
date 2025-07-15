-- TBWA Unified Platform - Performance Indexes
-- Date: July 15, 2025

-- ======================
-- CAMPAIGNS INDEXES
-- ======================

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_region ON campaigns(region);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_effectiveness ON campaigns(effectiveness DESC);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);

-- GIN index for palette colors array search
CREATE INDEX idx_campaigns_palette_colors ON campaigns USING GIN(palette_colors);

-- ======================
-- SCOUT ANALYTICS INDEXES
-- ======================

-- Stores
CREATE INDEX idx_stores_region ON stores(region);
CREATE INDEX idx_stores_type ON stores(store_type);
CREATE INDEX idx_stores_active ON stores(active) WHERE active = true;
CREATE INDEX idx_stores_revenue ON stores(monthly_revenue DESC) WHERE active = true;

-- Geographic index for location-based queries
CREATE INDEX idx_stores_location ON stores(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Products
CREATE INDEX idx_products_category ON products(product_category);
CREATE INDEX idx_products_brand ON products(brand_name);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_active ON products(active) WHERE active = true;
CREATE INDEX idx_products_price ON products(unit_price DESC);

-- Transactions
CREATE INDEX idx_transactions_store ON transactions(store_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_payment ON transactions(payment_method);
CREATE INDEX idx_transactions_value ON transactions(transaction_value DESC);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);

-- GIN index for campaign IDs array
CREATE INDEX idx_transactions_campaigns ON transactions USING GIN(campaign_ids);

-- Composite index for common queries
CREATE INDEX idx_transactions_store_date ON transactions(store_id, transaction_date DESC);
CREATE INDEX idx_transactions_region_date ON transactions(store_id, transaction_date DESC) 
    WHERE EXISTS (SELECT 1 FROM stores WHERE stores.id = transactions.store_id);

-- Transaction Items
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON transaction_items(product_id);
CREATE INDEX idx_transaction_items_total ON transaction_items(total_price DESC);

-- Composite for analytics
CREATE INDEX idx_transaction_items_product_total ON transaction_items(product_id, total_price DESC);

-- Handshake Events
CREATE INDEX idx_handshake_timestamp ON handshake_events(timestamp DESC);
CREATE INDEX idx_handshake_region ON handshake_events(region);
CREATE INDEX idx_handshake_location ON handshake_events(location);
CREATE INDEX idx_handshake_category ON handshake_events(product_category);
CREATE INDEX idx_handshake_value ON handshake_events(transaction_value DESC);

-- GIN indexes for JSON and array columns
CREATE INDEX idx_handshake_campaigns ON handshake_events USING GIN(campaign_ids);
CREATE INDEX idx_handshake_demographics ON handshake_events USING GIN(customer_demographic);

-- Composite for regional analysis
CREATE INDEX idx_handshake_region_time ON handshake_events(region, timestamp DESC);

-- ======================
-- HRIS INDEXES
-- ======================

-- Employees
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_active ON employees(active) WHERE active = true;
CREATE INDEX idx_employees_hire_date ON employees(hire_date DESC);

-- Full-text search on employee names
CREATE INDEX idx_employees_name_fulltext ON employees USING GIN(to_tsvector('english', name));

-- Attendance
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_clock_in ON attendance(clock_in DESC);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_verification ON attendance(verification_score DESC) WHERE status = 'verified';

-- Composite for attendance reports
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, clock_in DESC);
CREATE INDEX idx_attendance_date_status ON attendance(clock_in DESC, status) WHERE status = 'verified';

-- Expenses
CREATE INDEX idx_expenses_employee ON expenses(employee_id);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_amount ON expenses(amount DESC);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_approver ON expenses(approved_by);
CREATE INDEX idx_expenses_merchant ON expenses(merchant);

-- Composite for expense reports
CREATE INDEX idx_expenses_employee_date ON expenses(employee_id, date DESC);
CREATE INDEX idx_expenses_status_date ON expenses(status, date DESC);

-- GIN index for expense items JSON
CREATE INDEX idx_expenses_items ON expenses USING GIN(items);

-- ======================
-- AI INSIGHTS INDEXES
-- ======================

-- Insight Correlations
CREATE INDEX idx_insights_type ON insight_correlations(type);
CREATE INDEX idx_insights_confidence ON insight_correlations(confidence DESC);
CREATE INDEX idx_insights_created_at ON insight_correlations(created_at DESC);

-- GIN index for affected entities array
CREATE INDEX idx_insights_entities ON insight_correlations USING GIN(affected_entities);

-- Full-text search on findings and recommendations
CREATE INDEX idx_insights_finding_fulltext ON insight_correlations USING GIN(to_tsvector('english', finding));
CREATE INDEX idx_insights_recommendation_fulltext ON insight_correlations USING GIN(to_tsvector('english', recommendation));

-- Composite for high-confidence insights
CREATE INDEX idx_insights_type_confidence ON insight_correlations(type, confidence DESC) WHERE confidence > 0.8;

-- Performance Metrics
CREATE INDEX idx_metrics_entity ON performance_metrics(entity_type, entity_id);
CREATE INDEX idx_metrics_period ON performance_metrics(period_start DESC, period_end DESC);
CREATE INDEX idx_metrics_name ON performance_metrics(metric_name);
CREATE INDEX idx_metrics_value ON performance_metrics(metric_value DESC);
CREATE INDEX idx_metrics_created_at ON performance_metrics(created_at DESC);

-- Composite for entity performance tracking
CREATE INDEX idx_metrics_entity_period ON performance_metrics(entity_type, entity_id, period_start DESC);
CREATE INDEX idx_metrics_entity_name ON performance_metrics(entity_type, entity_id, metric_name);

-- ======================
-- PARTIAL INDEXES FOR OPTIMIZATION
-- ======================

-- Only index active campaigns
CREATE INDEX idx_campaigns_active_effectiveness ON campaigns(effectiveness DESC) WHERE status = 'active';

-- Only index recent handshakes (last 90 days)
CREATE INDEX idx_handshake_recent ON handshake_events(timestamp DESC, region) 
    WHERE timestamp >= CURRENT_DATE - INTERVAL '90 days';

-- Only index verified attendance
CREATE INDEX idx_attendance_verified_recent ON attendance(employee_id, clock_in DESC) 
    WHERE status = 'verified' AND clock_in >= CURRENT_DATE - INTERVAL '30 days';

-- Only index pending expenses
CREATE INDEX idx_expenses_pending ON expenses(employee_id, date DESC, amount DESC) 
    WHERE status = 'pending';

-- ======================
-- STATISTICS UPDATE
-- ======================

-- Update table statistics for better query planning
ANALYZE campaigns;
ANALYZE stores;
ANALYZE products;
ANALYZE transactions;
ANALYZE transaction_items;
ANALYZE handshake_events;
ANALYZE employees;
ANALYZE attendance;
ANALYZE expenses;
ANALYZE insight_correlations;
ANALYZE performance_metrics;

COMMIT;