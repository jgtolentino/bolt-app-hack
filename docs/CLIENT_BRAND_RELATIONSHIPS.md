# Client-Brand Relationships Documentation

## Overview

This document explains how TBWA and other advertising/marketing clients are linked to their brands and products in the Scout Analytics platform.

## Database Schema

### 1. Clients Table (`clients`)
Stores information about advertising/marketing clients like TBWA.

```sql
- id: UUID primary key
- client_code: Unique identifier (e.g., 'TBWA-001')
- client_name: Display name (e.g., 'TBWA\Philippines')
- client_type: 'agency', 'direct', or 'distributor'
- industry: Client's industry
- is_active: Boolean flag
```

### 2. Client-Brands Junction Table (`client_brands`)
Many-to-many relationship between clients and brands.

```sql
- client_id: Foreign key to clients
- brand_id: Foreign key to brands
- relationship_type: 'exclusive', 'shared', or 'regional'
- start_date/end_date: Relationship duration
- is_active: Boolean flag
```

### 3. Supporting Tables

#### client_categories
- Links clients to product categories they focus on
- Allows filtering by client → category → brand → SKU

#### client_products
- Specific SKUs managed by clients
- Includes campaign details and featured products

## Relationship Types

### Exclusive
- Only this client manages the brand
- Example: TBWA exclusively manages Pantene, Head & Shoulders

### Shared
- Multiple clients can manage the brand
- Example: Coca-Cola may have multiple agency partners

### Regional
- Client manages brand in specific geographic regions

## Filter Hierarchy

The cascading filter now follows this path:

```
Client (TBWA)
  ├── Category (Personal Care)
  │   ├── Brand (Pantene)
  │   │   └── SKU (Pantene 200ml Shampoo)
  │   └── Brand (Head & Shoulders)
  │       └── SKU (H&S Anti-Dandruff 200ml)
  └── Category (Beverages)
      ├── Brand (Coca-Cola)
      │   └── SKU (Coke 250ml Can)
      └── Brand (Sprite)
          └── SKU (Sprite 250ml Can)
```

## Implementation Details

### Filter Service Updates

The `FilterDataService` has been updated to:

1. **getClients()**: Fetches from `clients` table instead of `brands`
2. **getCategories()**: When client is selected, shows only categories for that client's brands
3. **getBrands()**: Filters brands based on client_brands relationship
4. **getSkus()**: Shows only SKUs for brands managed by the selected client

### Example Query Flow

When user selects "TBWA" as client:

```typescript
// 1. Get client's brands
const clientBrands = await supabase
  .from('client_brands')
  .select('brand_id')
  .eq('client_id', tbwaId);

// 2. Get categories for those brands
const categories = await supabase
  .from('products')
  .select('product_categories(*)')
  .in('brand_id', clientBrandIds);

// 3. Filter brands by category if selected
const brands = await supabase
  .from('brands')
  .select('*')
  .in('id', clientBrandIds)
  .eq('category', selectedCategory);
```

## Migration Script

The migration creates all necessary tables and relationships:

```sql
-- Run migration
supabase migration up 20250701_client_brand_relationships.sql

-- Verify relationships
SELECT 
  c.client_name,
  b.brand_name,
  cb.relationship_type
FROM clients c
JOIN client_brands cb ON c.id = cb.client_id
JOIN brands b ON cb.brand_id = b.id
WHERE c.client_code = 'TBWA-001';
```

## Benefits

1. **Clear Ownership**: Know which agency manages which brands
2. **Accurate Filtering**: Filter data by client's actual portfolio
3. **Campaign Tracking**: Link transactions to specific client campaigns
4. **Performance Metrics**: Measure client/agency effectiveness
5. **Multi-tenant Support**: Different clients see only their brands

## Future Enhancements

1. **Regional Management**: Add geographic restrictions to client-brand relationships
2. **Time-based Relationships**: Track when clients gain/lose brand management
3. **Performance Dashboard**: Client-specific KPIs and metrics
4. **Access Control**: Restrict data access based on client login