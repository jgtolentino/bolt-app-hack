-- Create a secure function for executing dynamic queries
-- This function will only allow SELECT queries and validate them for safety

CREATE OR REPLACE FUNCTION public.execute_dynamic_query(query_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  query_lower text;
BEGIN
  -- Convert to lowercase for checking
  query_lower := lower(trim(query_text));
  
  -- Security checks
  -- 1. Only allow SELECT queries
  IF NOT (query_lower LIKE 'select%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- 2. Disallow dangerous keywords
  IF query_lower ~ '(insert|update|delete|drop|create|alter|truncate|grant|revoke|exec|execute|;)' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;
  
  -- 3. Must contain FROM clause
  IF NOT (query_lower LIKE '%from%') THEN
    RAISE EXCEPTION 'Query must contain a FROM clause';
  END IF;
  
  -- 4. Limit to specific tables (whitelist approach)
  IF NOT (
    query_lower ~ '(transactions|stores|products|brands|product_categories|transaction_items|clients|client_brands|consumer_profiles|payment_methods)'
  ) THEN
    RAISE EXCEPTION 'Query must reference allowed tables only';
  END IF;
  
  -- Execute the query and return results as JSON
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', query_text) INTO result;
  
  -- Return empty array if no results
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return a safe error message
    RAISE NOTICE 'Query execution error: %', SQLERRM;
    RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_dynamic_query(text) TO authenticated;

-- Create a simpler version for specific metric queries
CREATE OR REPLACE FUNCTION public.get_dynamic_metrics(
  p_metrics text[],
  p_dimensions text[],
  p_filters jsonb DEFAULT '[]'::jsonb,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL,
  p_limit integer DEFAULT 1000
)
RETURNS TABLE (
  dimension_values jsonb,
  metric_values jsonb
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  select_dims text;
  select_metrics text;
  from_clause text;
  where_clause text;
  group_by_clause text;
  query_text text;
BEGIN
  -- Build dimension columns
  select_dims := array_to_string(
    ARRAY(
      SELECT CASE
        WHEN dim = 'region' THEN 's.region'
        WHEN dim = 'city' THEN 's.city'
        WHEN dim = 'barangay' THEN 's.barangay'
        WHEN dim = 'store' THEN 's.store_name'
        WHEN dim = 'category' THEN 'pc.category_name'
        WHEN dim = 'brand' THEN 'b.brand_name'
        WHEN dim = 'sku' THEN 'p.product_name'
        WHEN dim = 'client' THEN 'cl.client_name'
        WHEN dim = 'year' THEN 'EXTRACT(YEAR FROM t.transaction_datetime)::text'
        WHEN dim = 'month' THEN 'TO_CHAR(t.transaction_datetime, ''YYYY-MM'')'
        WHEN dim = 'day' THEN 'DATE(t.transaction_datetime)::text'
        ELSE NULL
      END || ' as ' || dim
      FROM unnest(p_dimensions) AS dim
    ),
    ', '
  );
  
  -- Build metric columns
  select_metrics := array_to_string(
    ARRAY(
      SELECT CASE
        WHEN metric = 'revenue' THEN 'SUM(t.total_amount)'
        WHEN metric = 'transactions' THEN 'COUNT(DISTINCT t.id)'
        WHEN metric = 'units_sold' THEN 'SUM(ti.quantity)'
        WHEN metric = 'avg_basket_size' THEN 'AVG(t.items_count)'
        WHEN metric = 'unique_products' THEN 'COUNT(DISTINCT ti.product_id)'
        WHEN metric = 'unique_stores' THEN 'COUNT(DISTINCT t.store_id)'
        ELSE '0'
      END || ' as ' || metric
      FROM unnest(p_metrics) AS metric
    ),
    ', '
  );
  
  -- Build FROM clause with necessary joins
  from_clause := 'FROM transactions t';
  
  -- Add joins based on requested dimensions
  IF array_length(p_dimensions, 1) > 0 THEN
    IF array_to_string(p_dimensions, ',') ~ '(region|city|barangay|store)' THEN
      from_clause := from_clause || ' INNER JOIN stores s ON t.store_id = s.id';
    END IF;
    
    IF array_to_string(p_dimensions, ',') ~ '(category|brand|sku)' OR 
       array_to_string(p_metrics, ',') ~ '(units_sold|unique_products)' THEN
      from_clause := from_clause || ' INNER JOIN transaction_items ti ON t.id = ti.transaction_id';
      from_clause := from_clause || ' INNER JOIN products p ON ti.product_id = p.id';
      
      IF array_to_string(p_dimensions, ',') ~ 'category' THEN
        from_clause := from_clause || ' INNER JOIN product_categories pc ON p.category_id = pc.id';
      END IF;
      
      IF array_to_string(p_dimensions, ',') ~ 'brand' THEN
        from_clause := from_clause || ' INNER JOIN brands b ON p.brand_id = b.id';
      END IF;
    END IF;
    
    IF array_to_string(p_dimensions, ',') ~ 'client' THEN
      from_clause := from_clause || ' LEFT JOIN clients cl ON t.client_id = cl.id';
    END IF;
  END IF;
  
  -- Build WHERE clause
  where_clause := 'WHERE t.status = ''completed''';
  
  IF p_date_from IS NOT NULL THEN
    where_clause := where_clause || ' AND t.transaction_datetime >= ''' || p_date_from || '''';
  END IF;
  
  IF p_date_to IS NOT NULL THEN
    where_clause := where_clause || ' AND t.transaction_datetime <= ''' || p_date_to || '''';
  END IF;
  
  -- Add custom filters from JSON
  IF jsonb_array_length(p_filters) > 0 THEN
    FOR i IN 0..jsonb_array_length(p_filters) - 1 LOOP
      DECLARE
        filter jsonb;
        filter_sql text;
      BEGIN
        filter := p_filters->i;
        
        filter_sql := CASE (filter->>'dimension')
          WHEN 'region' THEN 's.region = ''' || (filter->>'value') || ''''
          WHEN 'city' THEN 's.city = ''' || (filter->>'value') || ''''
          WHEN 'brand' THEN 'b.brand_name = ''' || (filter->>'value') || ''''
          WHEN 'category' THEN 'pc.category_name = ''' || (filter->>'value') || ''''
          WHEN 'client' THEN 'cl.client_name = ''' || (filter->>'value') || ''''
          ELSE NULL
        END;
        
        IF filter_sql IS NOT NULL THEN
          where_clause := where_clause || ' AND ' || filter_sql;
        END IF;
      END;
    END LOOP;
  END IF;
  
  -- Build GROUP BY clause
  IF array_length(p_dimensions, 1) > 0 THEN
    group_by_clause := 'GROUP BY ' || array_to_string(
      ARRAY(
        SELECT CASE
          WHEN dim = 'region' THEN 's.region'
          WHEN dim = 'city' THEN 's.city'
          WHEN dim = 'barangay' THEN 's.barangay'
          WHEN dim = 'store' THEN 's.store_name'
          WHEN dim = 'category' THEN 'pc.category_name'
          WHEN dim = 'brand' THEN 'b.brand_name'
          WHEN dim = 'sku' THEN 'p.product_name'
          WHEN dim = 'client' THEN 'cl.client_name'
          WHEN dim = 'year' THEN 'EXTRACT(YEAR FROM t.transaction_datetime)'
          WHEN dim = 'month' THEN 'TO_CHAR(t.transaction_datetime, ''YYYY-MM'')'
          WHEN dim = 'day' THEN 'DATE(t.transaction_datetime)'
          ELSE NULL
        END
        FROM unnest(p_dimensions) AS dim
      ),
      ', '
    );
  ELSE
    group_by_clause := '';
  END IF;
  
  -- Build final query
  query_text := format(
    'SELECT 
      jsonb_build_object(%s) as dimension_values,
      jsonb_build_object(%s) as metric_values
    %s
    %s
    %s
    ORDER BY 1
    LIMIT %s',
    COALESCE(
      array_to_string(
        ARRAY(SELECT '''' || dim || ''', ' || dim FROM unnest(p_dimensions) AS dim),
        ', '
      ),
      ''
    ),
    array_to_string(
      ARRAY(SELECT '''' || metric || ''', ' || metric FROM unnest(p_metrics) AS metric),
      ', '
    ),
    from_clause,
    where_clause,
    group_by_clause,
    p_limit
  );
  
  -- Execute and return results
  RETURN QUERY EXECUTE query_text;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_dynamic_metrics(text[], text[], jsonb, date, date, integer) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.execute_dynamic_query(text) IS 'Securely execute dynamic SELECT queries with validation';
COMMENT ON FUNCTION public.get_dynamic_metrics(text[], text[], jsonb, date, date, integer) IS 'Get metrics grouped by dimensions with flexible filtering';