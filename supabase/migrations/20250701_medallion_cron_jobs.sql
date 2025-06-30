-- Medallion Architecture Cron Jobs Setup
-- This file sets up automated ETL and refresh jobs

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================
-- BRONZE → SILVER ETL JOBS
-- ============================================

-- Process Bronze transcriptions every 15 minutes
SELECT cron.schedule(
  'etl-bronze-transcriptions',
  '*/15 * * * *',
  $$
  BEGIN;
  
  -- Mark valid transcriptions as processed
  UPDATE bronze_transcriptions 
  SET processed = TRUE 
  WHERE processed = FALSE 
    AND confidence_score >= 0.7
    AND transcription_text IS NOT NULL
    AND ingested_at < NOW() - INTERVAL '5 minutes';
  
  -- Log processing stats
  INSERT INTO medallion_monitoring (layer, metric_name, metric_value)
  SELECT 
    'Bronze',
    'transcriptions_processed',
    COUNT(*)
  FROM bronze_transcriptions
  WHERE processed = TRUE
    AND ingested_at >= NOW() - INTERVAL '15 minutes';
  
  COMMIT;
  $$
);

-- Process Bronze vision detections every 15 minutes
SELECT cron.schedule(
  'etl-bronze-vision',
  '*/15 * * * *',
  $$
  BEGIN;
  
  UPDATE bronze_vision_detections
  SET processed = TRUE
  WHERE processed = FALSE
    AND confidence >= 0.8
    AND object_class IN ('product', 'person', 'gesture')
    AND ingested_at < NOW() - INTERVAL '5 minutes';
  
  COMMIT;
  $$
);

-- Process Bronze POS transactions every 5 minutes (critical path)
SELECT cron.schedule(
  'etl-bronze-pos',
  '*/5 * * * *',
  $$
  BEGIN;
  
  -- Validate and insert transactions
  WITH validated_transactions AS (
    SELECT 
      (raw_transaction->>'id')::uuid as transaction_id,
      store_id,
      (raw_transaction->>'timestamp')::timestamptz as transaction_time,
      (raw_transaction->>'total')::decimal as total_amount,
      (raw_transaction->>'items')::jsonb as items,
      id as bronze_id
    FROM bronze_pos_transactions
    WHERE processed = FALSE
      AND raw_transaction ? 'id'
      AND raw_transaction ? 'timestamp'
      AND raw_transaction ? 'total'
      AND raw_transaction ? 'items'
  ),
  inserted_transactions AS (
    INSERT INTO transactions (transaction_id, store_id, transaction_time, total_amount)
    SELECT 
      transaction_id,
      store_id,
      transaction_time,
      total_amount
    FROM validated_transactions
    ON CONFLICT (transaction_id) DO NOTHING
    RETURNING transaction_id
  ),
  inserted_items AS (
    INSERT INTO transaction_items (transaction_id, product_id, quantity, price, subtotal)
    SELECT 
      vt.transaction_id,
      (item->>'product_id')::integer,
      (item->>'quantity')::integer,
      (item->>'price')::decimal,
      (item->>'subtotal')::decimal
    FROM validated_transactions vt
    CROSS JOIN LATERAL jsonb_array_elements(vt.items) as item
    WHERE EXISTS (
      SELECT 1 FROM inserted_transactions it 
      WHERE it.transaction_id = vt.transaction_id
    )
    ON CONFLICT DO NOTHING
  )
  -- Mark as processed
  UPDATE bronze_pos_transactions bp
  SET processed = TRUE
  FROM validated_transactions vt
  WHERE bp.id = vt.bronze_id;
  
  -- Mark failed validations
  UPDATE bronze_pos_transactions
  SET 
    processed = TRUE,
    validation_errors = jsonb_build_object(
      'error', 'Missing required fields',
      'missing', 
      CASE 
        WHEN NOT (raw_transaction ? 'id') THEN 'id'
        WHEN NOT (raw_transaction ? 'timestamp') THEN 'timestamp'
        WHEN NOT (raw_transaction ? 'total') THEN 'total'
        WHEN NOT (raw_transaction ? 'items') THEN 'items'
      END
    )
  WHERE processed = FALSE
    AND (
      NOT (raw_transaction ? 'id') OR
      NOT (raw_transaction ? 'timestamp') OR
      NOT (raw_transaction ? 'total') OR
      NOT (raw_transaction ? 'items')
    );
  
  COMMIT;
  $$
);

-- ============================================
-- SILVER VIEW REFRESH JOBS
-- ============================================

-- Refresh product performance every hour
SELECT cron.schedule(
  'refresh-silver-product-performance',
  '5 * * * *', -- 5 minutes past every hour
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY silver_product_performance;
  
  INSERT INTO medallion_monitoring (layer, metric_name, metric_value)
  VALUES ('Silver', 'product_performance_refreshed', 1);
  $$
);

-- Refresh store patterns every 2 hours
SELECT cron.schedule(
  'refresh-silver-store-patterns',
  '10 */2 * * *', -- 10 minutes past every 2 hours
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY silver_store_hourly_patterns;
  
  INSERT INTO medallion_monitoring (layer, metric_name, metric_value)
  VALUES ('Silver', 'store_patterns_refreshed', 1);
  $$
);

-- Refresh customer patterns daily at 2 AM
SELECT cron.schedule(
  'refresh-silver-customer-patterns',
  '0 2 * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY silver_customer_patterns;
  
  INSERT INTO medallion_monitoring (layer, metric_name, metric_value)
  VALUES ('Silver', 'customer_patterns_refreshed', 1);
  $$
);

-- ============================================
-- GOLD VIEW REFRESH JOBS
-- ============================================

-- Refresh executive KPIs every 30 minutes
SELECT cron.schedule(
  'refresh-gold-executive-kpis',
  '*/30 * * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY gold_executive_kpis;
  
  INSERT INTO medallion_monitoring (layer, metric_name, metric_value)
  SELECT 
    'Gold',
    'executive_kpis_refreshed',
    EXTRACT(epoch FROM (NOW() - MAX(report_date))) / 60
  FROM gold_executive_kpis;
  $$
);

-- Refresh brand performance every 4 hours
SELECT cron.schedule(
  'refresh-gold-brand-performance',
  '15 */4 * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY gold_brand_performance;
  
  INSERT INTO medallion_monitoring (layer, metric_name, metric_value)
  VALUES ('Gold', 'brand_performance_refreshed', 1);
  $$
);

-- Refresh AI features daily at 3 AM
SELECT cron.schedule(
  'refresh-gold-ai-features',
  '0 3 * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY gold_ai_features;
  
  INSERT INTO medallion_monitoring (layer, metric_name, metric_value)
  VALUES ('Gold', 'ai_features_refreshed', 1);
  $$
);

-- Refresh substitution matrix daily at 4 AM
SELECT cron.schedule(
  'refresh-gold-substitution-matrix',
  '0 4 * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY gold_substitution_matrix;
  
  INSERT INTO medallion_monitoring (layer, metric_name, metric_value)
  VALUES ('Gold', 'substitution_matrix_refreshed', 1);
  $$
);

-- ============================================
-- MONITORING & CLEANUP JOBS
-- ============================================

-- Health check every 30 minutes
SELECT cron.schedule(
  'medallion-health-monitor',
  '*/30 * * * *',
  $$
  DECLARE
    bronze_backlog integer;
    silver_stale_hours numeric;
    gold_stale_hours numeric;
    alert_msg text;
  BEGIN
    -- Check Bronze backlog
    SELECT COUNT(*) INTO bronze_backlog
    FROM bronze_transcriptions
    WHERE processed = FALSE
      AND ingested_at < NOW() - INTERVAL '2 hours';
    
    IF bronze_backlog > 1000 THEN
      INSERT INTO medallion_monitoring (
        layer, metric_name, metric_value, threshold_value, 
        alert_triggered, alert_message
      ) VALUES (
        'Bronze', 'processing_backlog', bronze_backlog, 1000, 
        TRUE, format('Critical: %s unprocessed Bronze records', bronze_backlog)
      );
    END IF;
    
    -- Check Silver staleness
    SELECT MAX(EXTRACT(epoch FROM (NOW() - last_refresh)) / 3600) 
    INTO silver_stale_hours
    FROM pg_matviews
    WHERE schemaname = 'public'
      AND matviewname LIKE 'silver_%';
    
    IF silver_stale_hours > 4 THEN
      INSERT INTO medallion_monitoring (
        layer, metric_name, metric_value, threshold_value, 
        alert_triggered, alert_message
      ) VALUES (
        'Silver', 'view_staleness_hours', silver_stale_hours, 4, 
        TRUE, 'Warning: Silver views are stale'
      );
    END IF;
    
    -- Check Gold staleness
    SELECT EXTRACT(epoch FROM (NOW() - MIN(report_date))) / 3600
    INTO gold_stale_hours
    FROM gold_executive_kpis;
    
    IF gold_stale_hours > 6 THEN
      INSERT INTO medallion_monitoring (
        layer, metric_name, metric_value, threshold_value, 
        alert_triggered, alert_message
      ) VALUES (
        'Gold', 'kpi_staleness_hours', gold_stale_hours, 6, 
        TRUE, 'Error: Executive KPIs are critically stale'
      );
    END IF;
  END;
  $$
);

-- Cleanup old Bronze records daily at 5 AM
SELECT cron.schedule(
  'cleanup-bronze-processed',
  '0 5 * * *',
  $$
  BEGIN;
  
  -- Archive processed Bronze records older than 30 days
  DELETE FROM bronze_transcriptions
  WHERE processed = TRUE
    AND ingested_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM bronze_vision_detections
  WHERE processed = TRUE
    AND ingested_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM bronze_pos_transactions
  WHERE processed = TRUE
    AND ingested_at < NOW() - INTERVAL '7 days'; -- Shorter retention for POS
  
  -- Cleanup old monitoring records
  DELETE FROM medallion_monitoring
  WHERE check_time < NOW() - INTERVAL '7 days'
    AND alert_triggered = FALSE;
  
  COMMIT;
  $$
);

-- ============================================
-- HELPER FUNCTIONS FOR MANUAL OPERATIONS
-- ============================================

-- Force refresh all Silver views
CREATE OR REPLACE FUNCTION refresh_all_silver_views()
RETURNS void AS $$
BEGIN
  RAISE NOTICE 'Refreshing all Silver views...';
  REFRESH MATERIALIZED VIEW CONCURRENTLY silver_product_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY silver_store_hourly_patterns;
  REFRESH MATERIALIZED VIEW CONCURRENTLY silver_customer_patterns;
  RAISE NOTICE 'Silver refresh complete';
END;
$$ LANGUAGE plpgsql;

-- Force refresh all Gold views
CREATE OR REPLACE FUNCTION refresh_all_gold_views()
RETURNS void AS $$
BEGIN
  RAISE NOTICE 'Refreshing all Gold views...';
  REFRESH MATERIALIZED VIEW CONCURRENTLY gold_executive_kpis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY gold_brand_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY gold_ai_features;
  REFRESH MATERIALIZED VIEW CONCURRENTLY gold_substitution_matrix;
  RAISE NOTICE 'Gold refresh complete';
END;
$$ LANGUAGE plpgsql;

-- Get job status
CREATE OR REPLACE FUNCTION get_cron_job_status()
RETURNS TABLE (
  jobname text,
  schedule text,
  active boolean,
  last_run timestamptz,
  next_run timestamptz,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobname::text,
    j.schedule::text,
    j.active,
    s.start_time as last_run,
    cron.job_run_time(j.schedule) as next_run,
    CASE 
      WHEN s.status IS NULL THEN 'Never run'
      WHEN s.status = 'succeeded' THEN 'OK'
      ELSE s.status
    END as status
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT start_time, status
    FROM cron.job_run_details
    WHERE jobid = j.jobid
    ORDER BY start_time DESC
    LIMIT 1
  ) s ON true
  WHERE j.jobname LIKE '%medallion%' 
     OR j.jobname LIKE '%etl%'
     OR j.jobname LIKE '%refresh%'
  ORDER BY j.jobname;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL RUN
-- ============================================

-- Run initial health check
SELECT check_medallion_alerts();

-- Log setup completion
INSERT INTO medallion_monitoring (
  layer, metric_name, metric_value, alert_message
) VALUES (
  'System', 'cron_jobs_created', 
  (SELECT COUNT(*) FROM cron.job WHERE jobname LIKE '%medallion%'),
  'Medallion cron jobs successfully created'
);

-- Show job status
SELECT * FROM get_cron_job_status();