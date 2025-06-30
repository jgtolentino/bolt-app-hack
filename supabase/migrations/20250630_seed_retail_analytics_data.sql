-- Seed Data for Retail Analytics Tables
-- Populates consumer profiles, product requests, substitutions, and payment methods

-- Insert payment methods including local options
INSERT INTO public.payment_methods (method_name, method_type, provider, is_active, transaction_fee_percent, min_transaction_amount, max_transaction_amount)
VALUES 
  ('Cash', 'cash', NULL, true, 0.00, NULL, NULL),
  ('GCash', 'digital_wallet', 'Globe Fintech', true, 2.00, 20.00, 100000.00),
  ('Maya', 'digital_wallet', 'PayMaya Philippines', true, 2.00, 20.00, 100000.00),
  ('Utang/Lista', 'utang_lista', 'Store Credit', true, 0.00, 50.00, 5000.00),
  ('BPI Debit', 'debit_card', 'Bank of the Philippine Islands', true, 1.50, 100.00, 50000.00),
  ('BDO Credit', 'credit_card', 'Banco de Oro', true, 3.00, 500.00, 100000.00),
  ('Paymongo', 'digital_wallet', 'Paymongo', true, 2.50, 50.00, 50000.00),
  ('Bank Transfer', 'bank_transfer', 'Various Banks', true, 0.50, 1000.00, NULL)
ON CONFLICT (method_name) DO NOTHING;

-- Create consumer profiles based on transaction patterns
WITH consumer_profile_creation AS (
  SELECT DISTINCT
    gen_random_uuid() as profile_id,
    CASE 
      WHEN random() < 0.45 THEN 'male'
      WHEN random() < 0.90 THEN 'female'
      ELSE 'unspecified'
    END as gender,
    CASE 
      WHEN random() < 0.10 THEN 'child'
      WHEN random() < 0.25 THEN 'teen'
      WHEN random() < 0.50 THEN 'young_adult'
      WHEN random() < 0.80 THEN 'adult'
      ELSE 'senior'
    END as age_bracket,
    store_id
  FROM public.transactions
  WHERE customer_id IS NOT NULL
  LIMIT 8000
)
INSERT INTO public.consumer_profiles (
  id, gender, age_bracket, estimated_age_min, estimated_age_max,
  location_store_id, first_seen_date, last_seen_date,
  total_transactions, total_spent, avg_basket_size
)
SELECT 
  profile_id,
  gender,
  age_bracket,
  CASE age_bracket
    WHEN 'child' THEN 5
    WHEN 'teen' THEN 13
    WHEN 'young_adult' THEN 18
    WHEN 'adult' THEN 30
    WHEN 'senior' THEN 60
  END as estimated_age_min,
  CASE age_bracket
    WHEN 'child' THEN 12
    WHEN 'teen' THEN 17
    WHEN 'young_adult' THEN 29
    WHEN 'adult' THEN 59
    WHEN 'senior' THEN 85
  END as estimated_age_max,
  store_id,
  CURRENT_DATE - INTERVAL '90 days' + (random() * INTERVAL '60 days'),
  CURRENT_DATE - (random() * INTERVAL '7 days'),
  FLOOR(random() * 50 + 1)::INTEGER,
  FLOOR(random() * 50000 + 100)::DECIMAL(12,2),
  FLOOR(random() * 500 + 50)::DECIMAL(10,2)
FROM consumer_profile_creation;

-- Update transactions with consumer profiles and payment methods
UPDATE public.transactions t
SET 
  consumer_profile_id = cp.id,
  payment_method_id = pm.id,
  duration_seconds = FLOOR(random() * 600 + 30)::INTEGER,
  basket_size_category = CASE 
    WHEN t.items_count = 1 THEN '1 item'
    WHEN t.items_count = 2 THEN '2 items'
    ELSE '3+ items'
  END,
  day_type = CASE 
    WHEN EXTRACT(DOW FROM t.transaction_datetime) IN (0, 6) THEN 'weekend'
    ELSE 'weekday'
  END,
  store_suggestion_accepted = random() < 0.15,
  total_unique_items = t.items_count,
  total_categories = FLOOR(random() * 5 + 1)::INTEGER
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY random()) as rn
  FROM public.consumer_profiles
) cp
JOIN (
  SELECT id, method_name, ROW_NUMBER() OVER (ORDER BY random()) as rn
  FROM public.payment_methods
) pm ON true
WHERE 
  t.id IN (
    SELECT id FROM public.transactions 
    ORDER BY random() 
    LIMIT (SELECT COUNT(*) FROM public.consumer_profiles)
  )
  AND cp.rn = (ROW_NUMBER() OVER (ORDER BY t.id) % (SELECT COUNT(*) FROM public.consumer_profiles) + 1)
  AND pm.method_name = CASE 
    WHEN t.payment_method = 'Cash' THEN 'Cash'
    WHEN t.payment_method = 'GCash' THEN 'GCash'
    WHEN t.payment_method = 'Credit Card' AND random() < 0.5 THEN 'BDO Credit'
    WHEN t.payment_method = 'Credit Card' THEN 'BPI Debit'
    WHEN random() < 0.05 THEN 'Utang/Lista'
    ELSE 'Cash'
  END;

-- Create product requests for transactions
INSERT INTO public.product_requests (
  transaction_id, product_id, request_type, original_request,
  request_method, brand_mentioned, category_mentioned,
  was_available, substitution_accepted
)
SELECT 
  ti.transaction_id,
  ti.product_id,
  CASE 
    WHEN random() < 0.40 THEN 'branded'
    WHEN random() < 0.70 THEN 'unbranded'
    WHEN random() < 0.85 THEN 'pointing'
    WHEN random() < 0.95 THEN 'unsure'
    ELSE 'indirect'
  END as request_type,
  CASE 
    WHEN random() < 0.40 THEN p.product_name
    WHEN random() < 0.70 THEN p.category_name || ' ' || p.pack_size
    WHEN random() < 0.85 THEN 'yung ' || p.brand_name || ' na ' || p.category_name
    WHEN random() < 0.95 THEN 'pointing to shelf'
    ELSE 'yung katulad nito'
  END as original_request,
  CASE 
    WHEN random() < 0.70 THEN 'verbal'
    WHEN random() < 0.90 THEN 'pointing'
    WHEN random() < 0.95 THEN 'showing_image'
    ELSE 'written'
  END as request_method,
  CASE WHEN random() < 0.40 THEN p.brand_name ELSE NULL END,
  p.category_name,
  random() < 0.95,
  random() < 0.80
FROM public.transaction_items ti
JOIN public.products p ON ti.product_id = p.id
WHERE ti.transaction_id IN (
  SELECT id FROM public.transactions 
  WHERE consumer_profile_id IS NOT NULL
  ORDER BY random() 
  LIMIT 20000
)
AND random() < 0.3; -- Only create requests for 30% of items

-- Create product substitutions
WITH substitution_pairs AS (
  SELECT 
    p1.id as original_id,
    p2.id as substitute_id,
    p1.brand_name as original_brand,
    p2.brand_name as substitute_brand,
    p1.category_name as original_category,
    p2.category_name as substitute_category
  FROM public.products p1
  JOIN public.products p2 ON p1.category_name = p2.category_name 
    AND p1.id != p2.id
    AND p1.pack_size = p2.pack_size
  WHERE p1.brand_name != p2.brand_name
)
INSERT INTO public.product_substitutions (
  transaction_id, original_product_id, substitute_product_id,
  original_brand, substitute_brand, original_category, substitute_category,
  reason, accepted
)
SELECT 
  t.id,
  sp.original_id,
  sp.substitute_id,
  sp.original_brand,
  sp.substitute_brand,
  sp.original_category,
  sp.substitute_category,
  CASE 
    WHEN random() < 0.40 THEN 'out_of_stock'
    WHEN random() < 0.60 THEN 'price_preference'
    WHEN random() < 0.75 THEN 'brand_preference'
    WHEN random() < 0.90 THEN 'store_suggestion'
    ELSE 'size_preference'
  END as reason,
  random() < 0.75 as accepted
FROM public.transactions t
CROSS JOIN LATERAL (
  SELECT * FROM substitution_pairs
  ORDER BY random()
  LIMIT 1
) sp
WHERE t.consumer_profile_id IS NOT NULL
  AND random() < 0.10 -- 10% of transactions have substitutions
LIMIT 5000;

-- Create store suggestions
INSERT INTO public.store_suggestions (
  transaction_id, suggested_product_id, original_request,
  suggestion_reason, accepted, cashier_id
)
SELECT 
  t.id,
  p.id,
  CASE 
    WHEN random() < 0.5 THEN 'May ' || p.product_name || ' po kami'
    ELSE 'Try niyo po yung ' || p.brand_name
  END as original_request,
  CASE 
    WHEN random() < 0.30 THEN 'better_value'
    WHEN random() < 0.50 THEN 'promotion'
    WHEN random() < 0.70 THEN 'higher_margin'
    WHEN random() < 0.85 THEN 'customer_preference'
    ELSE 'out_of_stock'
  END as suggestion_reason,
  random() < 0.60 as accepted,
  t.cashier_id
FROM public.transactions t
CROSS JOIN LATERAL (
  SELECT * FROM public.products
  WHERE status = 'active'
  ORDER BY random()
  LIMIT 1
) p
WHERE t.consumer_profile_id IS NOT NULL
  AND t.store_suggestion_accepted = true
  AND random() < 0.15 -- 15% of transactions have suggestions
LIMIT 7500;

-- Create transaction baskets
INSERT INTO public.transaction_baskets (
  transaction_id, basket_hash, total_items, unique_items,
  total_categories, unique_categories, categories_list, brands_list,
  frequently_bought_together
)
SELECT 
  t.id,
  MD5(STRING_AGG(ti.product_id::text, ',' ORDER BY ti.product_id)),
  SUM(ti.quantity)::INTEGER,
  COUNT(DISTINCT ti.product_id)::INTEGER,
  COUNT(DISTINCT p.category_name)::INTEGER,
  COUNT(DISTINCT p.category_name)::INTEGER,
  ARRAY_AGG(DISTINCT p.category_name),
  ARRAY_AGG(DISTINCT p.brand_name),
  random() < 0.30
FROM public.transactions t
JOIN public.transaction_items ti ON t.id = ti.transaction_id
JOIN public.products p ON ti.product_id = p.id
WHERE t.status = 'completed'
  AND ti.is_voided = false
GROUP BY t.id
LIMIT 30000;

-- Create consumer interactions
INSERT INTO public.consumer_interactions (
  transaction_id, consumer_profile_id, interaction_start_time,
  interaction_end_time, duration_seconds, number_of_requests,
  number_of_substitutions, number_of_suggestions_accepted,
  interaction_type, language_used
)
SELECT 
  t.id,
  t.consumer_profile_id,
  t.transaction_datetime - (t.duration_seconds || ' seconds')::INTERVAL,
  t.transaction_datetime,
  t.duration_seconds,
  FLOOR(random() * 5 + 1)::INTEGER,
  COALESCE(sub_count.count, 0)::INTEGER,
  COALESCE(sug_count.count, 0)::INTEGER,
  CASE 
    WHEN t.duration_seconds < 120 THEN 'quick'
    WHEN t.duration_seconds < 300 THEN 'browsing'
    WHEN t.duration_seconds < 600 THEN 'assisted'
    ELSE 'complex'
  END,
  CASE 
    WHEN random() < 0.70 THEN 'tagalog'
    WHEN random() < 0.85 THEN 'english'
    WHEN random() < 0.95 THEN 'bisaya'
    ELSE 'mixed'
  END
FROM public.transactions t
LEFT JOIN (
  SELECT transaction_id, COUNT(*) as count
  FROM public.product_substitutions
  GROUP BY transaction_id
) sub_count ON t.id = sub_count.transaction_id
LEFT JOIN (
  SELECT transaction_id, COUNT(*) as count
  FROM public.store_suggestions
  WHERE accepted = true
  GROUP BY transaction_id
) sug_count ON t.id = sug_count.transaction_id
WHERE t.consumer_profile_id IS NOT NULL
  AND t.duration_seconds IS NOT NULL
LIMIT 25000;

-- Update consumer profiles with aggregated data
UPDATE public.consumer_profiles cp
SET 
  preferred_categories = cat_prefs.categories,
  preferred_brands = brand_prefs.brands,
  total_transactions = stats.transaction_count,
  total_spent = stats.total_spent,
  avg_basket_size = stats.avg_basket
FROM (
  SELECT 
    consumer_profile_id,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_spent,
    AVG(total_amount) as avg_basket
  FROM public.transactions
  WHERE consumer_profile_id IS NOT NULL
  GROUP BY consumer_profile_id
) stats
LEFT JOIN (
  SELECT 
    t.consumer_profile_id,
    ARRAY_AGG(DISTINCT p.category_name ORDER BY COUNT(*) DESC) as categories
  FROM public.transactions t
  JOIN public.transaction_items ti ON t.id = ti.transaction_id
  JOIN public.products p ON ti.product_id = p.id
  WHERE t.consumer_profile_id IS NOT NULL
  GROUP BY t.consumer_profile_id
) cat_prefs ON cp.id = cat_prefs.consumer_profile_id
LEFT JOIN (
  SELECT 
    t.consumer_profile_id,
    ARRAY_AGG(DISTINCT p.brand_name ORDER BY COUNT(*) DESC) as brands
  FROM public.transactions t
  JOIN public.transaction_items ti ON t.id = ti.transaction_id
  JOIN public.products p ON ti.product_id = p.id
  WHERE t.consumer_profile_id IS NOT NULL
    AND p.brand_name IS NOT NULL
  GROUP BY t.consumer_profile_id
) brand_prefs ON cp.id = brand_prefs.consumer_profile_id
WHERE cp.id = stats.consumer_profile_id;

-- Refresh all materialized views including the new ones
SELECT public.refresh_retail_analytics_views();

-- Display summary
SELECT 'Data seeding completed!' as status;
SELECT 'Consumer Profiles' as table_name, COUNT(*) as count FROM public.consumer_profiles
UNION ALL
SELECT 'Product Requests', COUNT(*) FROM public.product_requests
UNION ALL
SELECT 'Product Substitutions', COUNT(*) FROM public.product_substitutions
UNION ALL
SELECT 'Store Suggestions', COUNT(*) FROM public.store_suggestions
UNION ALL
SELECT 'Transaction Baskets', COUNT(*) FROM public.transaction_baskets
UNION ALL
SELECT 'Consumer Interactions', COUNT(*) FROM public.consumer_interactions
UNION ALL
SELECT 'Payment Methods', COUNT(*) FROM public.payment_methods;