# Suki Analytics Database Setup Guide

## Overview

This guide explains how to set up the PostgreSQL/Supabase database for the Suki Analytics dashboard with comprehensive Philippine retail data.

## Database Features

### 🎯 Enhanced Batch Generation
- **First 2000 records** guarantee complete coverage of:
  - All 6 regions (NCR, Region III, IV-A, VI, VII, XI)
  - All product categories and brands
  - All payment methods and customer types
- **Realistic distribution patterns** based on Philippine retail behavior
- **Performance optimized** batch processing

### 📊 Data Distribution

**Geographic Coverage (by transaction weight):**
- NCR: 35%
- Region VII (Cebu): 15%
- Region III (Central Luzon): 12%
- Region IV-A (CALABARZON): 10%
- Region VI (Western Visayas): 8%
- Region XI (Davao): 5%
- Others: 15%

**Product Categories (by volume):**
- Beverages: 30%
- Snacks: 25%
- Food: 15%
- Personal Care: 12%
- Home Care: 10%
- Tobacco: 5%
- Others: 3%

**Payment Methods:**
- Cash: 50%
- Utang/Lista: 30%
- GCash: 18%
- Credit Card: 2%

## Quick Start

### 1. Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Create .env.local file with your credentials
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Run Migrations and Seed Data

```bash
# Run all migrations and seed data
npm run db:migrate

# Or run steps separately:
npx supabase db push                    # Run migrations
npm run db:seed                          # Seed master data
```

### 3. Generate TypeScript Types

```bash
npm run db:generate
```

## Database Schema

### Core Tables

1. **geography** - Philippine locations hierarchy
   - Regions → Cities/Municipalities → Barangays
   - Includes GPS coordinates and demographic data

2. **organization** - Product hierarchy
   - Client → Category → Brand → SKU
   - Pricing, margins, and competitor flags

3. **transactions** - Sales data
   - Links to geography and organization
   - Payment methods, customer types
   - Temporal data for analysis

### Enhancement Tables

- **customer_segments** - Customer segmentation
- **product_combinations** - Frequently bought together
- **ai_insights** - AI-generated recommendations
- **inventory_levels** - Stock tracking
- **price_changes** - Price history
- **competitor_pricing** - Market intelligence

## Data Generation Functions

### Generate Full Dataset (750K transactions)

```sql
-- Generate 750,000 transactions with guaranteed coverage
SELECT generate_distributed_transactions(750000, 2000);
```

### Generate Custom Batch

```sql
-- Generate specific batch with coverage
SELECT generate_comprehensive_batch(
    batch_size := 5000,
    batch_number := 1,
    ensure_full_coverage := true
);
```

### Monitor Generation Progress

```sql
-- Check generation statistics
SELECT * FROM monitor_batch_generation();
```

## Realistic Data Patterns

### Time-Based Patterns
- **Peak Hours**: 11AM-1PM (lunch), 6PM-8PM (dinner)
- **Payday Effect**: 15th and 30th (+35% sales)
- **Weekend Boost**: Saturday (+20%), Sunday (+10%)

### Regional Variations
- **NCR**: Higher transaction values, more digital payments
- **Provincial**: More cash and utang/lista payments
- **Urban**: More convenience items, prepared food
- **Rural**: Bulk purchases, basic necessities

### Category Patterns
- **Morning** (6-9AM): Coffee, bread, breakfast items
- **Noon** (11AM-2PM): Beverages, ready-to-eat snacks
- **Afternoon** (2-5PM): Students buying snacks
- **Evening** (6-9PM): Dinner ingredients, beverages

## Verification Queries

### Check Coverage

```sql
-- Verify all regions are covered
SELECT region, COUNT(*) as stores 
FROM geography 
GROUP BY region;

-- Verify all brands are covered
SELECT category, brand, COUNT(*) as products 
FROM organization 
GROUP BY category, brand 
ORDER BY category, brand;
```

### Check Distribution

```sql
-- Transaction distribution by region
SELECT 
    g.region,
    COUNT(*) as transactions,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM transactions t
JOIN geography g ON t.geography_id = g.id
GROUP BY g.region
ORDER BY percentage DESC;
```

### Performance Metrics

```sql
-- Average processing time per batch
SELECT 
    batch_number,
    processing_time,
    transactions_generated
FROM batch_logs
ORDER BY batch_number;
```

## Troubleshooting

### Common Issues

1. **Slow generation**: Increase batch size but reduce total batches
2. **Memory issues**: Reduce batch_size parameter
3. **Coverage gaps**: Ensure first batch has ensure_full_coverage = true

### Reset Database

```sql
-- Clear all transaction data
TRUNCATE TABLE transactions RESTART IDENTITY CASCADE;

-- Clear all data (careful!)
TRUNCATE TABLE geography, organization, transactions RESTART IDENTITY CASCADE;
```

## Best Practices

1. **Initial Setup**: Always run with coverage guarantee for first batch
2. **Testing**: Generate smaller datasets (10K-50K) for development
3. **Production**: Use full 750K dataset for realistic analytics
4. **Monitoring**: Check coverage statistics after generation

## Support

For issues or questions:
1. Check Supabase logs for errors
2. Verify environment variables are set correctly
3. Ensure Supabase project is on Pro plan for large datasets
4. Monitor RLS policies aren't blocking inserts