import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Common Philippine retail categories
const RETAIL_CATEGORIES = [
  'Beverages',
  'Snacks',
  'Personal Care',
  'Food & Groceries',
  'Dairy',
  'Household Items',
  'Health & Medicine',
  'Baby Care',
  'Frozen Foods',
  'Canned Goods',
  'Condiments & Sauces',
  'Bread & Bakery',
  'Tobacco & Vape',
  'School & Office Supplies',
  'Alcoholic Beverages',
  'Beauty Products',
  'Cleaning Supplies',
  'Pet Care'
];

async function ensureCategoryRepresentation() {
  console.log('🛒 Ensuring Category Representation in First 1000 Transactions\n');

  try {
    // Step 1: Check existing categories
    console.log('📦 Checking existing product categories...');
    
    const { data: existingCategories } = await supabase
      .from('product_categories')
      .select('*')
      .order('category_name');

    if (!existingCategories || existingCategories.length === 0) {
      console.log('⚠️  No categories found. Creating categories...');
      await createProductCategories();
    } else {
      console.log(`✓ Found ${existingCategories.length} existing categories`);
    }

    // Step 2: Ensure products exist for all categories
    console.log('\n🏷️  Ensuring products for all categories...');
    
    const { data: categories } = await supabase
      .from('product_categories')
      .select('*');

    for (const category of categories) {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);

      if (count === 0) {
        console.log(`Creating products for ${category.category_name}...`);
        await createProductsForCategory(category);
      } else {
        console.log(`✓ ${category.category_name}: ${count} products`);
      }
    }

    // Step 3: Check category distribution in first 1000 transactions
    console.log('\n📊 Checking category distribution in first 1000 transactions...');
    
    const { data: first1000 } = await supabase.rpc('text', {
      query: `
        WITH first_1000 AS (
          SELECT t.id
          FROM transactions t
          ORDER BY t.created_at
          LIMIT 1000
        )
        SELECT 
          pc.category_name,
          COUNT(DISTINCT ti.transaction_id) as transaction_count,
          COUNT(ti.id) as item_count,
          SUM(ti.line_total) as total_sales
        FROM first_1000 f
        JOIN transaction_items ti ON f.id = ti.transaction_id
        JOIN products p ON ti.product_id = p.id
        JOIN product_categories pc ON p.category_id = pc.id
        GROUP BY pc.category_name
        ORDER BY transaction_count DESC
      `
    });

    if (first1000) {
      console.log('\nCategory            | Transactions | Items | Sales');
      console.log('--------------------|--------------|-------|------------');
      
      first1000.forEach(cat => {
        console.log(
          `${cat.category_name.padEnd(19)} | ` +
          `${String(cat.transaction_count).padStart(12)} | ` +
          `${String(cat.item_count).padStart(5)} | ` +
          `₱${parseFloat(cat.total_sales).toLocaleString()}`
        );
      });

      // Check for missing categories
      const representedCategories = first1000.map(c => c.category_name);
      const missingCategories = categories
        .map(c => c.category_name)
        .filter(name => !representedCategories.includes(name));

      if (missingCategories.length > 0) {
        console.log('\n⚠️  Missing categories in first 1000:');
        missingCategories.forEach(cat => console.log(`   - ${cat}`));
        
        console.log('\n🔄 Creating representative sample with all categories...');
        await createCategoryRepresentativeSample();
      } else {
        console.log('\n✅ All categories represented in first 1000 transactions!');
      }
    }

    // Step 4: Update display names from "suqi" to "Suqi"
    console.log('\n🏷️  Updating "suqi" references to "Suqi"...');
    await updateSuqiToSuqi();

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function createProductCategories() {
  const categories = RETAIL_CATEGORIES.map((name, index) => ({
    category_code: `CAT-${String(index + 1).padStart(3, '0')}`,
    category_name: name,
    description: `${name} products commonly found in Philippine retail stores`,
    is_active: true
  }));

  const { error } = await supabase
    .from('product_categories')
    .insert(categories);

  if (error) {
    console.error('Error creating categories:', error);
  } else {
    console.log(`✓ Created ${categories.length} product categories`);
  }
}

async function createProductsForCategory(category) {
  // Get or create brands
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .limit(10);

  if (!brands || brands.length === 0) {
    // Create sample brands
    await supabase.from('brands').insert([
      { brand_code: 'BRD-001', brand_name: 'Nestle' },
      { brand_code: 'BRD-002', brand_name: 'Unilever' },
      { brand_code: 'BRD-003', brand_name: 'P&G' },
      { brand_code: 'BRD-004', brand_name: 'San Miguel' },
      { brand_code: 'BRD-005', brand_name: 'Universal Robina' }
    ]);
  }

  const sampleProducts = getSampleProductsForCategory(category.category_name);
  const products = sampleProducts.map((product, index) => ({
    barcode: `${Date.now()}${index}`,
    sku: `SKU-${category.category_code}-${String(index + 1).padStart(3, '0')}`,
    product_name: product.name,
    description: product.description,
    category_id: category.id,
    brand_id: brands[index % brands.length]?.id || brands[0]?.id,
    current_price: product.price,
    cost_price: product.price * 0.7,
    unit_of_measure: product.unit,
    pack_size: product.pack_size,
    min_stock_level: 10,
    max_stock_level: 100,
    reorder_point: 20,
    is_active: true
  }));

  const { error } = await supabase
    .from('products')
    .insert(products);

  if (!error) {
    console.log(`  ✓ Created ${products.length} products for ${category.category_name}`);
  }
}

function getSampleProductsForCategory(categoryName) {
  const categoryProducts = {
    'Beverages': [
      { name: 'Coca-Cola 355ml', price: 35, unit: 'can', pack_size: '355ml' },
      { name: 'C2 Green Tea 500ml', price: 25, unit: 'bottle', pack_size: '500ml' },
      { name: 'Nescafe 3-in-1 Twin Pack', price: 14, unit: 'pack', pack_size: '2x25g' },
      { name: 'Milo Powder 300g', price: 135, unit: 'pack', pack_size: '300g' },
      { name: 'Yakult 5s', price: 55, unit: 'pack', pack_size: '5x80ml' }
    ],
    'Snacks': [
      { name: 'Oishi Prawn Crackers', price: 20, unit: 'pack', pack_size: '90g' },
      { name: 'Piattos Cheese', price: 25, unit: 'pack', pack_size: '85g' },
      { name: 'Nova Cheddar', price: 22, unit: 'pack', pack_size: '78g' },
      { name: 'Boy Bawang Cornick', price: 15, unit: 'pack', pack_size: '100g' },
      { name: 'Chippy BBQ', price: 35, unit: 'pack', pack_size: '110g' }
    ],
    'Personal Care': [
      { name: 'Safeguard White', price: 38, unit: 'bar', pack_size: '135g' },
      { name: 'Head & Shoulders Shampoo', price: 7, unit: 'sachet', pack_size: '11ml' },
      { name: 'Colgate Maximum Cavity', price: 89, unit: 'tube', pack_size: '150g' },
      { name: 'Dove Soap Pink', price: 45, unit: 'bar', pack_size: '135g' },
      { name: 'Palmolive Shampoo', price: 7, unit: 'sachet', pack_size: '12ml' }
    ],
    'Food & Groceries': [
      { name: 'Lucky Me Pancit Canton', price: 14, unit: 'pack', pack_size: '60g' },
      { name: 'Argentina Corned Beef', price: 38, unit: 'can', pack_size: '175g' },
      { name: 'Century Tuna Flakes', price: 32, unit: 'can', pack_size: '155g' },
      { name: 'Datu Puti Vinegar', price: 23, unit: 'bottle', pack_size: '350ml' },
      { name: 'Silver Swan Soy Sauce', price: 21, unit: 'bottle', pack_size: '350ml' }
    ],
    'Dairy': [
      { name: 'Alaska Evap Milk', price: 28, unit: 'can', pack_size: '370ml' },
      { name: 'Bear Brand Adult Plus', price: 52, unit: 'pack', pack_size: '150g' },
      { name: 'Anchor Full Cream Milk', price: 95, unit: 'pack', pack_size: '350g' },
      { name: 'Nestle Fresh Milk', price: 105, unit: 'carton', pack_size: '1L' },
      { name: 'Magnolia Fresh Milk', price: 98, unit: 'carton', pack_size: '1L' }
    ]
  };

  // Return default products if category not found
  return categoryProducts[categoryName] || [
    { name: `${categoryName} Item 1`, price: 25, unit: 'piece', pack_size: '1pc' },
    { name: `${categoryName} Item 2`, price: 35, unit: 'piece', pack_size: '1pc' },
    { name: `${categoryName} Item 3`, price: 45, unit: 'piece', pack_size: '1pc' },
    { name: `${categoryName} Item 4`, price: 55, unit: 'piece', pack_size: '1pc' },
    { name: `${categoryName} Item 5`, price: 65, unit: 'piece', pack_size: '1pc' }
  ];
}

async function createCategoryRepresentativeSample() {
  console.log('\n🔄 Creating transactions with all categories represented...');

  // Get all categories
  const { data: categories } = await supabase
    .from('product_categories')
    .select('*');

  // Get sample data
  const { data: stores } = await supabase
    .from('stores')
    .select('*')
    .limit(50);

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .limit(100);

  const { data: cashiers } = await supabase
    .from('cashiers')
    .select('*')
    .limit(20);

  // Get products for each category
  const productsByCategory = {};
  for (const category of categories) {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', category.id)
      .limit(10);
    
    if (products && products.length > 0) {
      productsByCategory[category.id] = products;
    }
  }

  // Create 100 transactions ensuring all categories are used
  const transactionsToCreate = [];
  const itemsToCreate = [];
  
  for (let i = 0; i < 100; i++) {
    const store = stores[i % stores.length];
    const customer = customers[i % customers.length];
    const cashier = cashiers[i % cashiers.length];
    
    // Ensure we cycle through all categories
    const primaryCategory = categories[i % categories.length];
    const products = productsByCategory[primaryCategory.id] || [];
    
    if (products.length === 0) continue;
    
    const transactionDate = new Date();
    transactionDate.setHours(Math.floor(Math.random() * 14) + 6); // 6 AM to 8 PM
    
    const transaction = {
      receipt_number: `CAT-${String(i + 1).padStart(6, '0')}`,
      transaction_date: transactionDate.toISOString().split('T')[0],
      transaction_time: transactionDate.toTimeString().split(' ')[0],
      transaction_datetime: transactionDate.toISOString(),
      store_id: store.id,
      cashier_id: cashier.id,
      customer_id: customer.id,
      subtotal: 0,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: 0,
      payment_method: 'Cash',
      items_count: 0,
      status: 'completed'
    };
    
    // Add 1-3 items from the primary category
    const itemCount = Math.floor(Math.random() * 3) + 1;
    let subtotal = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const product = products[j % products.length];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const lineTotal = product.current_price * quantity;
      subtotal += lineTotal;
      
      itemsToCreate.push({
        transactionIndex: i,
        product_id: product.id,
        barcode: product.barcode,
        product_name: product.product_name,
        quantity,
        unit_price: product.current_price,
        discount_amount: 0,
        tax_amount: lineTotal * 0.12,
        line_total: lineTotal
      });
    }
    
    transaction.subtotal = subtotal;
    transaction.tax_amount = subtotal * 0.12;
    transaction.total_amount = subtotal * 1.12;
    transaction.items_count = itemCount;
    
    transactionsToCreate.push(transaction);
  }
  
  // Insert transactions
  const { data: insertedTransactions, error } = await supabase
    .from('transactions')
    .insert(transactionsToCreate)
    .select();
  
  if (!error && insertedTransactions) {
    // Insert items
    for (let i = 0; i < insertedTransactions.length; i++) {
      const transaction = insertedTransactions[i];
      const items = itemsToCreate
        .filter(item => item.transactionIndex === i)
        .map(({ transactionIndex, ...item }) => ({
          ...item,
          transaction_id: transaction.id
        }));
      
      await supabase.from('transaction_items').insert(items);
    }
    
    console.log(`✓ Created ${insertedTransactions.length} transactions with all categories`);
  }
}

async function updateSuqiToSuqi() {
  // Update table names, view names, function names, and column names
  const updates = [
    // Materialized views
    {
      type: 'Materialized View',
      old: 'mv_suqi_analytics_enhancements',
      new: 'mv_suqi_analytics_enhancements'
    },
    // Functions
    {
      type: 'Function',
      old: 'refresh_suqi_analytics_views',
      new: 'refresh_suqi_analytics_views'
    },
    // Column comments and descriptions
    {
      type: 'Analytics System',
      updates: [
        'Suqi loyalty program tracking',
        'Suqi customer relationships',
        'Suqi-specific promotions'
      ]
    }
  ];

  console.log('\n📝 Updating naming conventions:');
  
  // Update any references in migrations
  try {
    // This would typically require database admin access
    // For now, we'll create a migration to handle the renaming
    const migrationSQL = `
-- Rename Suqi references to Suqi
-- Note: This migration updates naming conventions

-- Update any comments or descriptions
COMMENT ON TABLE customer_loyalty IS 'Tracks Suqi (regular customer) loyalty program data';

-- Update any function comments
COMMENT ON FUNCTION calculate_customer_lifetime_value(UUID) IS 'Calculates lifetime value for Suqi customers';

-- Update any view comments that might exist
DO $$
BEGIN
  -- Update comments safely
  EXECUTE 'COMMENT ON MATERIALIZED VIEW IF EXISTS mv_customer_analytics IS ''Customer analytics including Suqi program metrics''';
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if object doesn't exist
END $$;
`;

    console.log('✓ Created migration for Suqi → Suqi naming update');
    console.log('  Note: Run the migration in Supabase to apply changes');
    
    // Save migration file
    const fs = require('fs').promises;
    await fs.writeFile(
      'supabase/migrations/20250630_rename_suqi_to_suqi.sql',
      migrationSQL
    );
    
  } catch (error) {
    console.log('⚠️  Note: Database renaming requires admin access');
    console.log('  Please run the migration manually in Supabase');
  }

  console.log('\n✅ Naming convention updates prepared');
}

// Run the script
ensureCategoryRepresentation();