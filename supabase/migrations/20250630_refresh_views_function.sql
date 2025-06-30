-- Create function to refresh all materialized views
CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
RETURNS void AS $$
BEGIN
  -- Refresh daily sales view
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_daily_sales;
  
  -- Refresh product performance view
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_product_performance;
  
  -- Refresh hourly patterns view
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_hourly_patterns;
  
  RAISE NOTICE 'All materialized views refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.refresh_materialized_views() TO authenticated;

-- Create a scheduled job to refresh views automatically (requires pg_cron extension)
-- This will refresh views every hour
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('refresh-materialized-views', '0 * * * *', 'SELECT public.refresh_materialized_views();');