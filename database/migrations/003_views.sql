-- TBWA Unified Platform - Materialized Views
-- Date: July 15, 2025

-- ======================
-- CAMPAIGN PERFORMANCE VIEW
-- ======================

CREATE MATERIALIZED VIEW campaign_performance_view AS
SELECT 
    c.id as campaign_id,
    c.name as campaign_name,
    c.palette_colors,
    c.region,
    c.effectiveness,
    COUNT(DISTINCT h.id) as handshake_count,
    AVG(h.transaction_value) as avg_transaction_value,
    SUM(h.transaction_value) as total_revenue,
    COUNT(DISTINCT t.id) as transaction_count,
    COUNT(DISTINCT a.employee_id) as engaged_employees,
    -- Calculate color effectiveness metrics
    AVG(CASE WHEN h.transaction_value > 1000 THEN 1 ELSE 0 END) as high_value_ratio,
    -- Regional performance
    COUNT(DISTINCT h.location) as unique_locations,
    -- Time-based metrics
    EXTRACT(EPOCH FROM (MAX(h.timestamp) - MIN(h.timestamp))) / 3600 as campaign_duration_hours
FROM campaigns c
LEFT JOIN handshake_events h ON c.id = ANY(h.campaign_ids)
LEFT JOIN transactions t ON c.id = ANY(t.campaign_ids)
LEFT JOIN attendance a ON DATE(a.clock_in) BETWEEN c.start_date AND COALESCE(c.end_date, CURRENT_DATE)
WHERE c.status IN ('active', 'completed')
GROUP BY c.id, c.name, c.palette_colors, c.region, c.effectiveness;

-- Index the materialized view
CREATE UNIQUE INDEX idx_campaign_performance_id ON campaign_performance_view(campaign_id);
CREATE INDEX idx_campaign_performance_region ON campaign_performance_view(region);
CREATE INDEX idx_campaign_performance_effectiveness ON campaign_performance_view(effectiveness DESC);
CREATE INDEX idx_campaign_performance_revenue ON campaign_performance_view(total_revenue DESC);

COMMENT ON MATERIALIZED VIEW campaign_performance_view IS 'Campaign effectiveness with cross-platform metrics';

-- ======================
-- EMPLOYEE ATTENDANCE SUMMARY VIEW
-- ======================

CREATE MATERIALIZED VIEW employee_attendance_summary_view AS
SELECT 
    e.id as employee_id,
    e.name as employee_name,
    e.department,
    e.role,
    -- Attendance metrics (last 30 days)
    COUNT(a.id) as total_days,
    COUNT(CASE WHEN a.status = 'verified' THEN 1 END) as verified_days,
    ROUND(
        (COUNT(CASE WHEN a.status = 'verified' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(a.id), 0)) * 100, 2
    ) as attendance_rate,
    AVG(a.verification_score) as avg_verification_score,
    SUM(a.work_hours) as total_hours,
    AVG(a.work_hours) as avg_daily_hours,
    -- Performance correlation
    COUNT(DISTINCT h.id) as influenced_handshakes,
    SUM(h.transaction_value) as influenced_revenue,
    -- Expense metrics
    COUNT(DISTINCT ex.id) as expense_claims,
    SUM(CASE WHEN ex.status = 'approved' THEN ex.amount ELSE 0 END) as approved_expenses
FROM employees e
LEFT JOIN attendance a ON e.id = a.employee_id 
    AND a.clock_in >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN handshake_events h ON DATE(h.timestamp) = DATE(a.clock_in)
LEFT JOIN expenses ex ON e.id = ex.employee_id 
    AND ex.date >= CURRENT_DATE - INTERVAL '30 days'
WHERE e.active = true
GROUP BY e.id, e.name, e.department, e.role;

-- Index the materialized view
CREATE UNIQUE INDEX idx_employee_attendance_id ON employee_attendance_summary_view(employee_id);
CREATE INDEX idx_employee_attendance_department ON employee_attendance_summary_view(department);
CREATE INDEX idx_employee_attendance_rate ON employee_attendance_summary_view(attendance_rate DESC);
CREATE INDEX idx_employee_attendance_hours ON employee_attendance_summary_view(total_hours DESC);

COMMENT ON MATERIALIZED VIEW employee_attendance_summary_view IS 'Employee attendance and performance metrics';

-- ======================
-- REGIONAL PERFORMANCE VIEW
-- ======================

CREATE MATERIALIZED VIEW regional_performance_view AS
SELECT 
    h.region,
    -- Store metrics
    COUNT(DISTINCT s.id) as total_stores,
    COUNT(DISTINCT CASE WHEN s.active = true THEN s.id END) as active_stores,
    AVG(s.monthly_revenue) as avg_store_revenue,
    -- Handshake metrics
    COUNT(DISTINCT h.id) as handshake_count,
    AVG(h.transaction_value) as avg_transaction_value,
    SUM(h.transaction_value) as total_revenue,
    COUNT(DISTINCT h.location) as unique_locations,
    -- Campaign metrics
    COUNT(DISTINCT c.id) as active_campaigns,
    AVG(c.effectiveness) as avg_campaign_effectiveness,
    -- Employee metrics
    COUNT(DISTINCT e.id) as employee_count,
    AVG(eas.attendance_rate) as avg_attendance_rate,
    -- Product category analysis
    mode() WITHIN GROUP (ORDER BY h.product_category) as top_product_category,
    -- Temporal analysis
    AVG(EXTRACT(HOUR FROM h.timestamp)) as avg_transaction_hour,
    -- Customer demographics
    COUNT(DISTINCT (h.customer_demographic->>'age_group')) as age_group_diversity
FROM handshake_events h
LEFT JOIN stores s ON h.region = s.region
LEFT JOIN campaigns c ON c.region = h.region AND c.status = 'active'
LEFT JOIN employees e ON e.department = 'Field Operations' -- Adjust based on your structure
LEFT JOIN employee_attendance_summary_view eas ON e.id = eas.employee_id
WHERE h.timestamp >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY h.region;

-- Index the materialized view
CREATE UNIQUE INDEX idx_regional_performance_region ON regional_performance_view(region);
CREATE INDEX idx_regional_performance_revenue ON regional_performance_view(total_revenue DESC);
CREATE INDEX idx_regional_performance_effectiveness ON regional_performance_view(avg_campaign_effectiveness DESC);
CREATE INDEX idx_regional_performance_stores ON regional_performance_view(active_stores DESC);

COMMENT ON MATERIALIZED VIEW regional_performance_view IS 'Regional business intelligence metrics';

-- ======================
-- PRODUCT PERFORMANCE VIEW
-- ======================

CREATE MATERIALIZED VIEW product_performance_view AS
SELECT 
    p.id as product_id,
    p.product_name,
    p.product_category,
    p.brand_name,
    p.unit_price,
    -- Sales metrics
    COUNT(DISTINCT ti.transaction_id) as transaction_count,
    SUM(ti.quantity) as total_quantity_sold,
    SUM(ti.total_price) as total_revenue,
    AVG(ti.total_price) as avg_transaction_value,
    -- Regional distribution
    COUNT(DISTINCT s.region) as regions_sold,
    mode() WITHIN GROUP (ORDER BY s.region) as top_selling_region,
    -- Performance metrics
    SUM(ti.total_price) / NULLIF(SUM(ti.quantity), 0) as avg_selling_price,
    (SUM(ti.total_price) / NULLIF(SUM(ti.quantity), 0)) - p.unit_price as price_variance,
    -- Time-based analysis
    COUNT(DISTINCT DATE(t.transaction_date)) as active_days,
    AVG(ti.quantity) as avg_quantity_per_transaction
FROM products p
LEFT JOIN transaction_items ti ON p.id = ti.product_id
LEFT JOIN transactions t ON ti.transaction_id = t.id
LEFT JOIN stores s ON t.store_id = s.id
WHERE p.active = true
    AND t.transaction_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY p.id, p.product_name, p.product_category, p.brand_name, p.unit_price;

-- Index the materialized view
CREATE UNIQUE INDEX idx_product_performance_id ON product_performance_view(product_id);
CREATE INDEX idx_product_performance_category ON product_performance_view(product_category);
CREATE INDEX idx_product_performance_revenue ON product_performance_view(total_revenue DESC);
CREATE INDEX idx_product_performance_quantity ON product_performance_view(total_quantity_sold DESC);

COMMENT ON MATERIALIZED VIEW product_performance_view IS 'Product sales and performance analytics';

-- ======================
-- DAILY KPI SUMMARY VIEW
-- ======================

CREATE MATERIALIZED VIEW daily_kpi_summary_view AS
SELECT 
    DATE(h.timestamp) as date,
    h.region,
    -- Revenue metrics
    COUNT(DISTINCT h.id) as handshake_count,
    SUM(h.transaction_value) as daily_revenue,
    AVG(h.transaction_value) as avg_transaction_value,
    -- Campaign metrics
    COUNT(DISTINCT unnest(h.campaign_ids)) as active_campaigns,
    -- Employee metrics
    COUNT(DISTINCT a.employee_id) as employees_present,
    AVG(a.verification_score) as avg_verification_score,
    SUM(a.work_hours) as total_work_hours,
    -- Store metrics
    COUNT(DISTINCT h.location) as active_locations,
    -- Product diversity
    COUNT(DISTINCT h.product_category) as product_categories,
    -- Hourly distribution
    mode() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM h.timestamp)) as peak_hour
FROM handshake_events h
LEFT JOIN attendance a ON DATE(a.clock_in) = DATE(h.timestamp)
WHERE h.timestamp >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(h.timestamp), h.region;

-- Index the materialized view
CREATE INDEX idx_daily_kpi_date_region ON daily_kpi_summary_view(date DESC, region);
CREATE INDEX idx_daily_kpi_revenue ON daily_kpi_summary_view(daily_revenue DESC);
CREATE INDEX idx_daily_kpi_handshakes ON daily_kpi_summary_view(handshake_count DESC);

COMMENT ON MATERIALIZED VIEW daily_kpi_summary_view IS 'Daily KPI metrics for dashboard';

-- ======================
-- REFRESH FUNCTIONS
-- ======================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_performance_view;
    REFRESH MATERIALIZED VIEW CONCURRENTLY employee_attendance_summary_view;
    REFRESH MATERIALIZED VIEW CONCURRENTLY regional_performance_view;
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_performance_view;
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_kpi_summary_view;
    
    -- Log the refresh
    INSERT INTO performance_metrics (entity_type, entity_id, metric_name, metric_value, period_start, period_end)
    VALUES ('system', gen_random_uuid(), 'materialized_views_refreshed', 1, CURRENT_DATE, CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to refresh views automatically (can be scheduled)
CREATE OR REPLACE FUNCTION auto_refresh_views_trigger()
RETURNS trigger AS $$
BEGIN
    -- Only refresh if significant data changes (every 100 records)
    IF (TG_OP = 'INSERT' AND NEW.id::text ~ '[0-9]*00$') THEN
        PERFORM refresh_all_materialized_views();
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply refresh triggers to high-volume tables
CREATE TRIGGER auto_refresh_handshakes 
    AFTER INSERT ON handshake_events
    FOR EACH ROW EXECUTE FUNCTION auto_refresh_views_trigger();

CREATE TRIGGER auto_refresh_transactions 
    AFTER INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION auto_refresh_views_trigger();

-- ======================
-- GRANTS
-- ======================

-- Grant access to materialized views
GRANT SELECT ON campaign_performance_view TO authenticated;
GRANT SELECT ON employee_attendance_summary_view TO authenticated;
GRANT SELECT ON regional_performance_view TO authenticated;
GRANT SELECT ON product_performance_view TO authenticated;
GRANT SELECT ON daily_kpi_summary_view TO authenticated;

-- Grant execute on refresh functions
GRANT EXECUTE ON FUNCTION refresh_all_materialized_views() TO authenticated;

COMMIT;