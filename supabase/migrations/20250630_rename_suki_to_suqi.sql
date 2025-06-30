-- Rename Suki references to Suqi throughout the database
-- This migration updates all naming conventions from "suki" to "Suqi"

-- Update comments on tables and columns
COMMENT ON TABLE IF EXISTS customers IS 'Customer information including Suqi (loyal customer) status';
COMMENT ON TABLE IF EXISTS customer_loyalty IS 'Tracks Suqi (regular customer) loyalty program data';

-- Update function comments
DO $$
BEGIN
  -- Update function comments safely
  EXECUTE 'COMMENT ON FUNCTION IF EXISTS calculate_customer_lifetime_value(UUID) IS ''Calculates lifetime value for Suqi customers''';
  EXECUTE 'COMMENT ON FUNCTION IF EXISTS get_customer_loyalty_status(UUID) IS ''Returns Suqi loyalty tier and benefits''';
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if object doesn't exist
END $$;

-- Update materialized view comments
DO $$
BEGIN
  -- Rename materialized view if it exists
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_suki_analytics_enhancements') THEN
    ALTER MATERIALIZED VIEW mv_suki_analytics_enhancements RENAME TO mv_suqi_analytics_enhancements;
  END IF;
  
  -- Update view comment
  EXECUTE 'COMMENT ON MATERIALIZED VIEW IF EXISTS mv_suqi_analytics_enhancements IS ''Enhanced analytics for Suqi loyalty program''';
  EXECUTE 'COMMENT ON MATERIALIZED VIEW IF EXISTS mv_customer_analytics IS ''Customer analytics including Suqi program metrics''';
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if object doesn't exist
END $$;

-- Update function names
DO $$
BEGIN
  -- Rename functions if they exist
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'refresh_suki_analytics_views') THEN
    ALTER FUNCTION refresh_suki_analytics_views() RENAME TO refresh_suqi_analytics_views;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_suki_discount') THEN
    ALTER FUNCTION calculate_suki_discount(UUID, NUMERIC) RENAME TO calculate_suqi_discount;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if object doesn't exist
END $$;

-- Update any enum values
DO $$
BEGIN
  -- Update customer type enum if it contains 'suki'
  IF EXISTS (
    SELECT 1 
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'customer_type' AND e.enumlabel = 'suki'
  ) THEN
    ALTER TYPE customer_type RENAME VALUE 'suki' TO 'suqi';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if object doesn't exist
END $$;

-- Update any check constraints
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Find and update check constraints containing 'suki'
  FOR r IN 
    SELECT 
      conname, 
      conrelid::regclass AS table_name,
      pg_get_constraintdef(oid) AS constraint_def
    FROM pg_constraint
    WHERE contype = 'c' 
    AND pg_get_constraintdef(oid) ILIKE '%suki%'
  LOOP
    -- Generate new constraint definition
    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT %I',
      r.table_name, r.conname
    );
    
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I %s',
      r.table_name, 
      replace(r.conname, 'suki', 'suqi'),
      replace(r.constraint_def, 'suki', 'suqi')
    );
  END LOOP;
END $$;

-- Update data in tables (for any stored values)
-- Update customer types
UPDATE customers 
SET customer_type = 'Suqi' 
WHERE customer_type = 'Suki' OR customer_type = 'suki';

-- Update payment methods
UPDATE payment_methods 
SET method_name = 'Suqi Credit' 
WHERE method_name = 'Suki Credit' OR method_name = 'suki credit';

-- Update promotion types
UPDATE promotions 
SET promotion_type = 'Suqi Exclusive' 
WHERE promotion_type = 'Suki Exclusive' OR promotion_type = 'suki exclusive';

-- Update store programs
UPDATE stores 
SET programs = array_replace(programs, 'Suki Rewards', 'Suqi Rewards')
WHERE 'Suki Rewards' = ANY(programs);

-- Add a note about the renaming
DO $$
BEGIN
  INSERT INTO system_logs (
    log_type,
    log_message,
    created_at
  ) VALUES (
    'migration',
    'Renamed all "suki" references to "Suqi" throughout the database',
    NOW()
  );
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- Ignore if system_logs doesn't exist
END $$;

-- Create or update a system configuration
DO $$
BEGIN
  -- Insert or update system config
  INSERT INTO system_config (key, value, description)
  VALUES (
    'customer_loyalty_program_name',
    'Suqi',
    'Name of the customer loyalty program (formerly suki)'
  )
  ON CONFLICT (key) DO UPDATE
  SET value = 'Suqi',
      description = 'Name of the customer loyalty program (formerly suki)',
      updated_at = NOW();
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- Ignore if system_config doesn't exist
END $$;

-- Output summary
DO $$
BEGIN
  RAISE NOTICE 'Successfully updated all "suki" references to "Suqi" in the database';
  RAISE NOTICE 'Please update any application code that references the old naming';
END $$;