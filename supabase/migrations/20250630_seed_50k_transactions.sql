-- Seed 50,000 transactions with realistic POS data
-- Based on actual POS transaction patterns from the provided dataset

DO $$
DECLARE
  -- Variables for data generation
  v_store_count INTEGER := 20;
  v_cashier_count INTEGER := 100;
  v_product_count INTEGER := 500;
  v_customer_count INTEGER := 5000;
  v_transaction_count INTEGER := 50000;
  
  -- Arrays for realistic data
  v_payment_methods TEXT[] := ARRAY['Cash', 'GCash', 'Maya', 'Credit Card', 'Debit Card', 'Bank Transfer'];
  v_store_types TEXT[] := ARRAY['Supermarket', 'Convenience Store', 'Department Store', 'Grocery', 'Mini Mart'];
  v_shifts TEXT[] := ARRAY['Morning', 'Afternoon', 'Evening', 'Night'];
  
  -- Philippine regions and cities
  v_regions TEXT[] := ARRAY['NCR', 'Region I', 'Region II', 'Region III', 'Region IV-A', 'Region IV-B', 
                           'Region V', 'Region VI', 'Region VII', 'Region VIII', 'Region IX', 
                           'Region X', 'Region XI', 'Region XII', 'Region XIII', 'CAR', 'BARMM'];
  v_cities TEXT[] := ARRAY['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Cebu City', 
                          'Davao City', 'Iloilo City', 'Cagayan de Oro', 'Angeles City', 
                          'Baguio', 'Bacolod', 'General Santos', 'Zamboanga', 'Antipolo'];
  
  -- Product categories based on POS data
  v_categories TEXT[] := ARRAY['Beverages', 'Snacks', 'Personal Care', 'Home Care', 'Food', 
                              'Dairy', 'Frozen', 'Bakery', 'Meat & Seafood', 'Produce',
                              'Health & Beauty', 'Baby Care', 'Pet Care', 'Electronics', 'Stationery'];
  
  -- Popular brands in Philippines
  v_brands TEXT[] := ARRAY['Nestle', 'Unilever', 'P&G', 'Coca-Cola', 'Pepsi', 'San Miguel', 
                          'Century Pacific', 'Alaska', 'Magnolia', 'CDO', 'Purefoods', 
                          'Jack n Jill', 'Oishi', 'Lucky Me', 'Knorr', 'Maggi', 'Surf', 
                          'Tide', 'Ariel', 'Safeguard', 'Colgate', 'Palmolive'];
  
  -- Realistic product names based on POS data
  v_product_names TEXT[] := ARRAY[
    'Coca Cola 355ml', 'Pepsi 355ml', 'Sprite 355ml', 'Royal 355ml', 'Mountain Dew 355ml',
    'San Miguel Beer 330ml', 'Red Horse 500ml', 'Emperador Light 750ml', 'Tanduay 700ml',
    'Nestle Fresh Milk 1L', 'Alaska Evap 410ml', 'Bear Brand 300ml', 'Magnolia Cheese 165g',
    'Lucky Me Pancit Canton 60g', 'Nissin Cup Noodles 40g', 'Payless Pancit Canton 65g',
    'Century Tuna 180g', 'Argentina Corned Beef 175g', 'CDO Karne Norte 210g', 'Spam 340g',
    'Oishi Prawn Crackers 60g', 'Piattos 85g', 'Nova 78g', 'Chippy 110g', 'Clover Chips 85g',
    'Safeguard White 135g', 'Dove Bar 135g', 'Palmolive Shampoo 180ml', 'Head & Shoulders 180ml',
    'Colgate 150g', 'Close Up 145g', 'Oral-B Toothbrush', 'Listerine 250ml',
    'Tide Bar 130g', 'Surf Powder 1kg', 'Ariel Powder 900g', 'Joy Dishwashing 495ml',
    'Pampers Medium 4s', 'Huggies Large 3s', 'EQ Diaper Small 12s', 'Johnson Baby Powder 200g',
    'Whiskas 80g', 'Pedigree 130g', 'Alpo 375g', 'Dog Food 1kg',
    'Mongol Pencil #2', 'Pilot Pen Black', 'Sterling Notebook 80lvs', 'Cattleya Pad Paper'
  ];
  
  -- Variables for loop
  v_store_id UUID;
  v_cashier_id UUID;
  v_customer_id UUID;
  v_product_id UUID;
  v_transaction_id UUID;
  v_receipt_number VARCHAR(50);
  v_transaction_date DATE;
  v_transaction_time TIME;
  v_items_in_transaction INTEGER;
  v_subtotal DECIMAL(12,2);
  v_discount DECIMAL(10,2);
  v_tax DECIMAL(10,2);
  v_total DECIMAL(12,2);
  i INTEGER;
  j INTEGER;
  k INTEGER;

BEGIN
  -- Seed Stores
  RAISE NOTICE 'Creating % stores...', v_store_count;
  FOR i IN 1..v_store_count LOOP
    INSERT INTO public.stores (
      store_code, store_name, region, city, address, 
      latitude, longitude, store_type, opening_date, status
    ) VALUES (
      'STR' || LPAD(i::TEXT, 4, '0'),
      'Suki Store ' || v_cities[1 + (i % array_length(v_cities, 1))],
      v_regions[1 + (i % array_length(v_regions, 1))],
      v_cities[1 + (i % array_length(v_cities, 1))],
      'Block ' || (1 + random() * 50)::INTEGER || ', Street ' || (1 + random() * 100)::INTEGER,
      7.0 + random() * 14, -- Philippines latitude range
      118.0 + random() * 9, -- Philippines longitude range
      v_store_types[1 + (random() * (array_length(v_store_types, 1) - 1))::INTEGER],
      CURRENT_DATE - (random() * 1825)::INTEGER, -- Random date within 5 years
      'active'
    );
  END LOOP;

  -- Seed Cashiers
  RAISE NOTICE 'Creating % cashiers...', v_cashier_count;
  FOR i IN 1..v_cashier_count LOOP
    SELECT id INTO v_store_id FROM public.stores ORDER BY random() LIMIT 1;
    
    INSERT INTO public.cashiers (
      employee_id, full_name, nickname, store_id, hire_date, shift_schedule
    ) VALUES (
      'EMP' || LPAD(i::TEXT, 5, '0'),
      CASE (random() * 10)::INTEGER
        WHEN 0 THEN 'Maria Santos'
        WHEN 1 THEN 'Juan Dela Cruz'
        WHEN 2 THEN 'Ana Reyes'
        WHEN 3 THEN 'Jose Garcia'
        WHEN 4 THEN 'Rosa Flores'
        WHEN 5 THEN 'Pedro Martinez'
        WHEN 6 THEN 'Elena Rodriguez'
        WHEN 7 THEN 'Carlos Gonzales'
        WHEN 8 THEN 'Isabel Cruz'
        ELSE 'Roberto Aquino'
      END || ' ' || i::TEXT,
      CASE (random() * 10)::INTEGER
        WHEN 0 THEN 'Maria'
        WHEN 1 THEN 'Juan'
        WHEN 2 THEN 'Ana'
        WHEN 3 THEN 'Jose'
        WHEN 4 THEN 'Rosa'
        WHEN 5 THEN 'Pedro'
        WHEN 6 THEN 'Elena'
        WHEN 7 THEN 'Carlos'
        WHEN 8 THEN 'Isabel'
        ELSE 'Roberto'
      END,
      v_store_id,
      CURRENT_DATE - (random() * 730)::INTEGER, -- Random hire date within 2 years
      v_shifts[1 + (random() * (array_length(v_shifts, 1) - 1))::INTEGER]
    );
  END LOOP;

  -- Seed Customers
  RAISE NOTICE 'Creating % customers...', v_customer_count;
  FOR i IN 1..v_customer_count LOOP
    INSERT INTO public.customers (
      customer_code, customer_name, customer_type, contact_number,
      registration_date, loyalty_points, preferred_payment_method
    ) VALUES (
      'CUST' || LPAD(i::TEXT, 6, '0'),
      CASE (random() * 20)::INTEGER % 4
        WHEN 0 THEN 'Walk-in Customer'
        WHEN 1 THEN 'Regular Customer ' || i::TEXT
        WHEN 2 THEN 'VIP Customer ' || i::TEXT
        ELSE 'Member ' || i::TEXT
      END,
      CASE (random() * 10)::INTEGER % 5
        WHEN 0 THEN 'Regular'
        WHEN 1 THEN 'Student'
        WHEN 2 THEN 'Senior'
        WHEN 3 THEN 'PWD'
        ELSE 'Walk-in'
      END,
      CASE WHEN random() < 0.7 THEN 
        '+639' || LPAD((random() * 999999999)::BIGINT::TEXT, 9, '0')
      ELSE NULL END,
      CURRENT_DATE - (random() * 365)::INTEGER,
      (random() * 5000)::INTEGER,
      v_payment_methods[1 + (random() * (array_length(v_payment_methods, 1) - 1))::INTEGER]
    );
  END LOOP;

  -- Seed Categories
  RAISE NOTICE 'Creating product categories...';
  FOR i IN 1..array_length(v_categories, 1) LOOP
    INSERT INTO public.product_categories (
      category_code, category_name, display_order
    ) VALUES (
      'CAT' || LPAD(i::TEXT, 3, '0'),
      v_categories[i],
      i
    );
  END LOOP;

  -- Seed Brands
  RAISE NOTICE 'Creating brands...';
  FOR i IN 1..array_length(v_brands, 1) LOOP
    INSERT INTO public.brands (
      brand_code, brand_name, country_of_origin
    ) VALUES (
      'BRD' || LPAD(i::TEXT, 3, '0'),
      v_brands[i],
      CASE WHEN v_brands[i] IN ('San Miguel', 'Century Pacific', 'CDO', 'Purefoods', 'Jack n Jill', 'Oishi', 'Lucky Me') 
        THEN 'Philippines'
        ELSE 'International'
      END
    );
  END LOOP;

  -- Seed Suppliers
  RAISE NOTICE 'Creating suppliers...';
  FOR i IN 1..20 LOOP
    INSERT INTO public.suppliers (
      supplier_code, supplier_name, payment_terms, delivery_lead_time
    ) VALUES (
      'SUP' || LPAD(i::TEXT, 3, '0'),
      CASE (random() * 5)::INTEGER
        WHEN 0 THEN 'Metro Distribution Inc.'
        WHEN 1 THEN 'Provincial Traders Corp.'
        WHEN 2 THEN 'Direct Supplier Co.'
        WHEN 3 THEN 'Wholesale Partners Ltd.'
        ELSE 'General Merchandise Inc.'
      END || ' ' || i::TEXT,
      CASE (random() * 3)::INTEGER
        WHEN 0 THEN 'Net 30'
        WHEN 1 THEN 'Net 15'
        ELSE 'COD'
      END,
      1 + (random() * 7)::INTEGER
    );
  END LOOP;

  -- Seed Products
  RAISE NOTICE 'Creating % products...', v_product_count;
  FOR i IN 1..v_product_count LOOP
    INSERT INTO public.products (
      barcode, sku, product_name, description,
      category_id, brand_id, supplier_id,
      unit_of_measure, pack_size,
      current_price, cost_price, suggested_retail_price,
      vat_exempt, min_stock_level, max_stock_level, reorder_point
    )
    SELECT
      LPAD((4800000000000 + i)::BIGINT::TEXT, 13, '0'),
      'SKU' || LPAD(i::TEXT, 5, '0'),
      v_product_names[1 + (i % array_length(v_product_names, 1))] || 
        CASE WHEN i > array_length(v_product_names, 1) THEN ' Variant ' || (i / array_length(v_product_names, 1))::TEXT ELSE '' END,
      v_product_names[1 + (i % array_length(v_product_names, 1))] || ' - ' || 
        v_categories[1 + (random() * (array_length(v_categories, 1) - 1))::INTEGER],
      pc.id,
      b.id,
      s.id,
      CASE (random() * 5)::INTEGER
        WHEN 0 THEN 'PC'
        WHEN 1 THEN 'PACK'
        WHEN 2 THEN 'BOX'
        WHEN 3 THEN 'KG'
        ELSE 'PC'
      END,
      CASE (random() * 5)::INTEGER
        WHEN 0 THEN '1x1'
        WHEN 1 THEN '1x12'
        WHEN 2 THEN '1x24'
        WHEN 3 THEN '1x6'
        ELSE '1x1'
      END,
      ROUND((10 + random() * 490)::NUMERIC, 2), -- Price between 10-500
      ROUND((5 + random() * 245)::NUMERIC, 2), -- Cost 50% of price
      ROUND((12 + random() * 588)::NUMERIC, 2), -- SRP 120% of price
      random() < 0.1, -- 10% VAT exempt
      10 + (random() * 40)::INTEGER,
      500 + (random() * 500)::INTEGER,
      50 + (random() * 50)::INTEGER
    FROM 
      (SELECT id FROM public.product_categories ORDER BY random() LIMIT 1) pc,
      (SELECT id FROM public.brands ORDER BY random() LIMIT 1) b,
      (SELECT id FROM public.suppliers ORDER BY random() LIMIT 1) s;
  END LOOP;

  -- Seed Transactions and Transaction Items
  RAISE NOTICE 'Creating % transactions with items...', v_transaction_count;
  
  FOR i IN 1..v_transaction_count LOOP
    -- Progress indicator
    IF i % 5000 = 0 THEN
      RAISE NOTICE 'Progress: % transactions created...', i;
    END IF;
    
    -- Select random store, cashier, and optionally customer
    SELECT id INTO v_store_id FROM public.stores ORDER BY random() LIMIT 1;
    SELECT id INTO v_cashier_id FROM public.cashiers WHERE store_id = v_store_id ORDER BY random() LIMIT 1;
    
    -- 70% chance of having a registered customer
    IF random() < 0.7 THEN
      SELECT id INTO v_customer_id FROM public.customers ORDER BY random() LIMIT 1;
    ELSE
      v_customer_id := NULL;
    END IF;
    
    -- Generate transaction date/time (last 90 days with realistic patterns)
    v_transaction_date := CURRENT_DATE - (random() * 90)::INTEGER;
    
    -- Generate realistic time based on typical shopping patterns
    v_transaction_time := CASE 
      WHEN random() < 0.05 THEN TIME '06:00:00' + (random() * INTERVAL '2 hours')
      WHEN random() < 0.20 THEN TIME '08:00:00' + (random() * INTERVAL '3 hours')
      WHEN random() < 0.50 THEN TIME '11:00:00' + (random() * INTERVAL '3 hours')
      WHEN random() < 0.75 THEN TIME '14:00:00' + (random() * INTERVAL '3 hours')
      WHEN random() < 0.90 THEN TIME '17:00:00' + (random() * INTERVAL '3 hours')
      ELSE TIME '20:00:00' + (random() * INTERVAL '2 hours')
    END;
    
    -- Generate receipt number
    v_receipt_number := TO_CHAR(v_transaction_date, 'YYYYMMDD') || '-' || 
                       LPAD(i::TEXT, 6, '0');
    
    -- Initialize transaction totals
    v_subtotal := 0;
    v_discount := 0;
    v_items_in_transaction := 0;
    
    -- Create transaction
    INSERT INTO public.transactions (
      id, receipt_number, transaction_date, transaction_time, transaction_datetime,
      store_id, cashier_id, customer_id, subtotal, discount_amount, tax_amount,
      total_amount, payment_method, items_count, status
    ) VALUES (
      gen_random_uuid(),
      v_receipt_number,
      v_transaction_date,
      v_transaction_time,
      v_transaction_date + v_transaction_time,
      v_store_id,
      v_cashier_id,
      v_customer_id,
      0, 0, 0, 0, -- Will update after adding items
      v_payment_methods[1 + (random() * (array_length(v_payment_methods, 1) - 1))::INTEGER],
      0,
      'completed'
    ) RETURNING id INTO v_transaction_id;
    
    -- Add transaction items (1-20 items per transaction, weighted towards smaller baskets)
    FOR j IN 1..(1 + (random() * random() * 20)::INTEGER) LOOP
      SELECT 
        id, current_price, cost_price, vat_exempt, product_name, barcode
      INTO 
        v_product_id, v_subtotal, v_tax, v_customer_id, v_receipt_number, v_product_names[1]
      FROM public.products 
      ORDER BY random() 
      LIMIT 1;
      
      DECLARE
        v_quantity INTEGER;
        v_unit_price DECIMAL(10,2);
        v_line_discount DECIMAL(10,2);
        v_line_total DECIMAL(12,2);
        v_cost DECIMAL(10,2);
        v_is_vat_exempt BOOLEAN;
        v_product_name VARCHAR(255);
        v_barcode VARCHAR(50);
      BEGIN
        -- Get product details
        SELECT current_price, cost_price, vat_exempt, product_name, barcode
        INTO v_unit_price, v_cost, v_is_vat_exempt, v_product_name, v_barcode
        FROM public.products 
        WHERE id = v_product_id;
        
        -- Random quantity (weighted towards 1-3 items)
        v_quantity := CASE 
          WHEN random() < 0.7 THEN 1
          WHEN random() < 0.9 THEN 2
          WHEN random() < 0.95 THEN 3
          ELSE (4 + random() * 6)::INTEGER
        END;
        
        -- Apply discount occasionally (15% of items, 5-20% discount)
        v_line_discount := CASE 
          WHEN random() < 0.15 THEN ROUND((v_unit_price * v_quantity * (0.05 + random() * 0.15))::NUMERIC, 2)
          ELSE 0
        END;
        
        v_line_total := (v_unit_price * v_quantity) - v_line_discount;
        
        -- Insert transaction item
        INSERT INTO public.transaction_items (
          transaction_id, product_id, barcode, product_name,
          quantity, unit_price, discount_amount, tax_amount,
          line_total, cost_price, profit_amount
        ) VALUES (
          v_transaction_id,
          v_product_id,
          v_barcode,
          v_product_name,
          v_quantity,
          v_unit_price,
          v_line_discount,
          CASE WHEN v_is_vat_exempt THEN 0 ELSE ROUND((v_line_total * 0.12)::NUMERIC, 2) END,
          v_line_total,
          v_cost,
          v_line_total - (v_cost * v_quantity)
        );
        
        -- Update running totals
        v_subtotal := v_subtotal + (v_unit_price * v_quantity);
        v_discount := v_discount + v_line_discount;
        v_items_in_transaction := v_items_in_transaction + 1;
      END;
    END LOOP;
    
    -- Calculate tax (12% VAT on taxable items)
    v_tax := ROUND(((v_subtotal - v_discount) * 0.12)::NUMERIC, 2);
    v_total := v_subtotal - v_discount + v_tax;
    
    -- Update transaction totals
    UPDATE public.transactions SET
      subtotal = v_subtotal,
      discount_amount = v_discount,
      tax_amount = v_tax,
      total_amount = v_total,
      items_count = v_items_in_transaction
    WHERE id = v_transaction_id;
    
  END LOOP;
  
  RAISE NOTICE 'Transaction generation completed!';
  
  -- Create sample promotions
  RAISE NOTICE 'Creating promotions...';
  INSERT INTO public.promotions (
    promotion_code, promotion_name, promotion_type,
    start_date, end_date, min_purchase_amount
  ) VALUES
    ('PROMO001', 'Weekend Sale 20% Off', 'discount', CURRENT_DATE - 30, CURRENT_DATE + 30, 500),
    ('PROMO002', 'Buy 1 Get 1 Beverages', 'bogo', CURRENT_DATE - 15, CURRENT_DATE + 15, 0),
    ('PROMO003', 'Senior Citizen Extra 5%', 'discount', CURRENT_DATE - 90, CURRENT_DATE + 90, 0),
    ('PROMO004', 'Bulk Buy Discount', 'discount', CURRENT_DATE - 60, CURRENT_DATE + 60, 1000),
    ('PROMO005', 'Student Promo 10% Off', 'discount', CURRENT_DATE - 45, CURRENT_DATE + 45, 200);
  
  -- Add some inventory movements
  RAISE NOTICE 'Creating inventory movements...';
  FOR i IN 1..1000 LOOP
    INSERT INTO public.inventory_movements (
      store_id, product_id, movement_type, quantity,
      reference_type, unit_cost, total_cost,
      stock_before, stock_after
    )
    SELECT
      s.id,
      p.id,
      CASE (random() * 3)::INTEGER
        WHEN 0 THEN 'in'
        WHEN 1 THEN 'out'
        ELSE 'adjustment'
      END,
      (10 + random() * 90)::INTEGER,
      CASE (random() * 3)::INTEGER
        WHEN 0 THEN 'purchase'
        WHEN 1 THEN 'sale'
        ELSE 'adjustment'
      END,
      p.cost_price,
      p.cost_price * (10 + random() * 90)::INTEGER,
      (100 + random() * 400)::INTEGER,
      (100 + random() * 400)::INTEGER
    FROM
      (SELECT id FROM public.stores ORDER BY random() LIMIT 1) s,
      (SELECT id, cost_price FROM public.products ORDER BY random() LIMIT 1) p;
  END LOOP;
  
  -- Refresh materialized views
  RAISE NOTICE 'Refreshing materialized views...';
  REFRESH MATERIALIZED VIEW public.mv_daily_sales;
  REFRESH MATERIALIZED VIEW public.mv_product_performance;
  REFRESH MATERIALIZED VIEW public.mv_hourly_patterns;
  
  -- Display summary
  RAISE NOTICE '=== Data Seeding Complete ===';
  RAISE NOTICE 'Stores: %', (SELECT COUNT(*) FROM public.stores);
  RAISE NOTICE 'Cashiers: %', (SELECT COUNT(*) FROM public.cashiers);
  RAISE NOTICE 'Customers: %', (SELECT COUNT(*) FROM public.customers);
  RAISE NOTICE 'Products: %', (SELECT COUNT(*) FROM public.products);
  RAISE NOTICE 'Transactions: %', (SELECT COUNT(*) FROM public.transactions);
  RAISE NOTICE 'Transaction Items: %', (SELECT COUNT(*) FROM public.transaction_items);
  RAISE NOTICE 'Total Revenue: ₱%', (SELECT TO_CHAR(SUM(total_amount), 'FM999,999,999.00') FROM public.transactions);
  
END $$;