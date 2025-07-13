/**
 * SQLite API Bridge Server
 * Provides HTTP endpoints for the Scout Dashboard to access SQLite data
 * Acts as a bridge between browser and MCP SQLite server
 */

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Database path
const DB_PATH = '/Users/tbwa/Documents/GitHub/mcp-sqlite-server/data/scout_v4.sqlite';

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let db;

// Initialize database connection
function initDatabase() {
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('✅ Connected to SQLite database');
    }
  });
}

// Helper function to promisify database queries
function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get transaction trends
app.get('/api/transactions', async (req, res) => {
  try {
    const { region, barangay, category, weekVsWeekend, limit = 1000 } = req.query;
    
    let sql = `
      SELECT 
        t.*,
        s.store_name, s.region, s.barangay, s.province, s.latitude, s.longitude, s.economic_class,
        c.gender, c.age_bracket, c.customer_type,
        json_group_array(
          json_object(
            'sku_id', ti.sku_id,
            'quantity', ti.quantity,
            'unit_price', ti.unit_price,
            'was_substituted', ti.was_substituted,
            'original_brand', ti.original_brand,
            'product_name', p.product_name,
            'product_category', p.product_category,
            'brand_name', b.brand_name
          )
        ) as transaction_items
      FROM transactions t
      LEFT JOIN stores s ON t.store_id = s.store_id
      LEFT JOIN customers c ON t.customer_id = c.customer_id
      LEFT JOIN transaction_items ti ON t.transaction_id = ti.transaction_id
      LEFT JOIN products p ON ti.sku_id = p.sku_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (region) {
      sql += ' AND s.region = ?';
      params.push(region);
    }
    
    if (barangay) {
      sql += ' AND s.barangay = ?';
      params.push(barangay);
    }
    
    if (category) {
      sql += ' AND p.product_category = ?';
      params.push(category);
    }
    
    if (weekVsWeekend && weekVsWeekend !== 'all') {
      if (weekVsWeekend === 'weekends') {
        sql += " AND t.day_of_week IN ('Saturday', 'Sunday')";
      } else if (weekVsWeekend === 'weekdays') {
        sql += " AND t.day_of_week NOT IN ('Saturday', 'Sunday')";
      }
    }
    
    sql += ' GROUP BY t.transaction_id ORDER BY t.timestamp DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const rows = await dbQuery(sql, params);
    
    // Transform data to match expected format
    const transactions = rows.map(row => ({
      ...row,
      stores: {
        store_name: row.store_name,
        region: row.region,
        barangay: row.barangay,
        province: row.province,
        latitude: row.latitude,
        longitude: row.longitude,
        economic_class: row.economic_class
      },
      customers: {
        gender: row.gender,
        age_bracket: row.age_bracket,
        customer_type: row.customer_type
      },
      transaction_items: JSON.parse(row.transaction_items || '[]').filter(item => item.sku_id)
    }));
    
    res.json(transactions);
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get substitution data for Sankey diagram
app.get('/api/substitutions', async (req, res) => {
  try {
    const sql = `
      SELECT 
        ti.original_brand,
        p.product_name as substituted_product,
        op.product_name as original_product,
        b.brand_name as substituted_brand,
        SUM(ti.quantity) as count
      FROM transaction_items ti
      LEFT JOIN products p ON ti.sku_id = p.sku_id
      LEFT JOIN products op ON ti.original_sku_id = op.sku_id
      LEFT JOIN brands b ON p.brand_id = b.brand_id
      WHERE ti.was_substituted = 1 
        AND ti.original_brand IS NOT NULL
        AND ti.original_brand != ''
      GROUP BY ti.original_brand, p.product_name, op.product_name, b.brand_name
      ORDER BY count DESC
      LIMIT 50
    `;
    
    const rows = await dbQuery(sql);
    
    const substitutions = rows.map(row => ({
      originalProduct: row.original_product || `${row.original_brand} Product`,
      substitutedProduct: row.substituted_product,
      originalBrand: row.original_brand,
      substitutedBrand: row.substituted_brand,
      count: row.count
    }));
    
    res.json(substitutions);
    
  } catch (error) {
    console.error('Error fetching substitutions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get geographic data for heatmap
app.get('/api/geographic', async (req, res) => {
  try {
    const sql = `
      SELECT 
        s.region,
        COUNT(*) as transaction_count,
        COUNT(DISTINCT t.customer_id) as unique_customers,
        ROUND(SUM(t.final_amount), 2) as total_revenue,
        ROUND(AVG(t.final_amount), 2) as avg_transaction_value,
        ROUND(AVG(t.units_total), 2) as avg_basket_size,
        ROUND(AVG(s.latitude), 6) as latitude,
        ROUND(AVG(s.longitude), 6) as longitude
      FROM transactions t
      LEFT JOIN stores s ON t.store_id = s.store_id
      WHERE s.region IS NOT NULL
      GROUP BY s.region
      ORDER BY total_revenue DESC
    `;
    
    const rows = await dbQuery(sql);
    
    const geographic = rows.map(row => ({
      id: row.region,
      name: row.region,
      value: row.total_revenue || 0,
      transactions: row.transaction_count || 0,
      customers: row.unique_customers || 0,
      avgBasketSize: row.avg_transaction_value || 0,
      latitude: row.latitude,
      longitude: row.longitude
    }));
    
    res.json(geographic);
    
  } catch (error) {
    console.error('Error fetching geographic data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get hourly patterns
app.get('/api/hourly-patterns', async (req, res) => {
  try {
    const sql = `
      SELECT 
        DATE(timestamp) as date,
        hour_of_day,
        day_of_week,
        COUNT(*) as transaction_count,
        ROUND(SUM(final_amount), 2) as total_value,
        ROUND(AVG(final_amount), 2) as avg_value,
        SUM(units_total) as total_units,
        ROUND(AVG(duration_seconds), 0) as avg_duration
      FROM transactions
      WHERE timestamp IS NOT NULL
      GROUP BY DATE(timestamp), hour_of_day, day_of_week
      ORDER BY date DESC, hour_of_day
      LIMIT 500
    `;
    
    const rows = await dbQuery(sql);
    res.json(rows);
    
  } catch (error) {
    console.error('Error fetching hourly patterns:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get filter options
app.get('/api/filter-options', async (req, res) => {
  try {
    const [regions, barangays, categories, brands] = await Promise.all([
      dbQuery('SELECT DISTINCT region FROM stores WHERE region IS NOT NULL ORDER BY region'),
      dbQuery('SELECT DISTINCT barangay FROM stores WHERE barangay IS NOT NULL ORDER BY barangay'),
      dbQuery('SELECT DISTINCT product_category FROM products WHERE product_category IS NOT NULL ORDER BY product_category'),
      dbQuery('SELECT DISTINCT brand_name FROM brands WHERE brand_name IS NOT NULL ORDER BY brand_name')
    ]);
    
    res.json({
      regions: regions.map(r => r.region),
      barangays: barangays.map(b => b.barangay),
      categories: categories.map(c => c.product_category),
      brands: brands.map(b => b.brand_name)
    });
    
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: error.message });
  }
});

// Database stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const [
      transactionCount,
      storeCount,
      customerCount,
      productCount
    ] = await Promise.all([
      dbQuery('SELECT COUNT(*) as count FROM transactions'),
      dbQuery('SELECT COUNT(*) as count FROM stores'),
      dbQuery('SELECT COUNT(*) as count FROM customers'),
      dbQuery('SELECT COUNT(*) as count FROM products')
    ]);
    
    res.json({
      transactions: transactionCount[0].count,
      stores: storeCount[0].count,
      customers: customerCount[0].count,
      products: productCount[0].count
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get region boundaries with polygons
app.get('/api/region-boundaries', async (req, res) => {
  try {
    const sql = `
      SELECT 
        region_code,
        region_name,
        polygon,
        area_sqkm,
        population_2020,
        gdp_billion_php
      FROM region_boundaries
      ORDER BY gdp_billion_php DESC
    `;
    
    const rows = await dbQuery(sql);
    
    const boundaries = rows.map(row => ({
      id: row.region_code,
      name: row.region_name,
      polygon: JSON.parse(row.polygon),
      area: row.area_sqkm,
      population: row.population_2020,
      gdp: row.gdp_billion_php
    }));
    
    res.json(boundaries);
    
  } catch (error) {
    console.error('Error fetching region boundaries:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SQLite API Bridge running on http://localhost:${PORT}`);
  initDatabase();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down SQLite API Bridge...');
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});