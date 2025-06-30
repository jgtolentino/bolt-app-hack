-- Create materialized views for product analytics

-- CATEGORY performance view
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_cat_perf AS
SELECT  
    category,
    SUM(quantity) AS units,
    SUM(quantity * price) AS sales,
    SUM(quantity * price * 0.25) AS profit, -- Assuming 25% margin for now
    AVG(0.25) AS avg_margin -- Will need actual margin data later
FROM transaction_items ti
JOIN organization o ON ti.sku = o.sku
GROUP BY category;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_cat_perf_category ON analytics_cat_perf(category);

-- BRAND performance view
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_brand_perf AS
SELECT  
    brand,
    SUM(quantity) AS units,
    SUM(quantity * price) AS sales
FROM transaction_items ti
JOIN organization o ON ti.sku = o.sku
GROUP BY brand;

-- Create index
CREATE INDEX IF NOT EXISTS idx_analytics_brand_perf_brand ON analytics_brand_perf(brand);

-- SKU performance view
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_sku_perf AS
SELECT  
    ti.sku,
    o.brand,
    o.category,
    SUM(ti.quantity) AS units,
    SUM(ti.quantity * ti.price) AS sales
FROM transaction_items ti
JOIN organization o ON ti.sku = o.sku
GROUP BY ti.sku, o.brand, o.category;

-- Create index
CREATE INDEX IF NOT EXISTS idx_analytics_sku_perf_sku ON analytics_sku_perf(sku);

-- PRODUCT MIX view (share of total sales per category)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_mix AS
WITH category_totals AS (
    SELECT 
        o.category,
        SUM(ti.quantity * ti.price) AS sales
    FROM transaction_items ti
    JOIN organization o ON ti.sku = o.sku
    GROUP BY o.category
)
SELECT  
    category,
    sales,
    CASE 
        WHEN SUM(sales) OVER () > 0 
        THEN sales / SUM(sales) OVER ()::NUMERIC(10,4)
        ELSE 0
    END AS share
FROM category_totals;

-- Create index
CREATE INDEX IF NOT EXISTS idx_analytics_mix_category ON analytics_mix(category);

-- RPC function to refresh all views
CREATE OR REPLACE FUNCTION refresh_all_views() 
RETURNS void 
LANGUAGE plpgsql 
AS $$
BEGIN
    -- Refresh all materialized views
    -- Using CONCURRENTLY if indexes exist to avoid locking
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_cat_perf;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_brand_perf;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_sku_perf;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_mix;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON analytics_cat_perf TO anon, authenticated;
GRANT SELECT ON analytics_brand_perf TO anon, authenticated;
GRANT SELECT ON analytics_sku_perf TO anon, authenticated;
GRANT SELECT ON analytics_mix TO anon, authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_views() TO anon, authenticated;