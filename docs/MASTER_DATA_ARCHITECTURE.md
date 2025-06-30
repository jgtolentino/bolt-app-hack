# Master Data Architecture for Scout Analytics

## Overview
Master data represents the relatively static reference entities that form the backbone of the analytics system. These tables create a star schema around the central `transactions` fact table.

## Master Data Domains

### 1. Products Domain
- **Tables**: `products`, `brands`, `product_categories`
- **Key Relationships**: 
  - `products.brand_id` → `brands.brand_id`
  - `products.category_id` → `product_categories.category_id`
- **Usage**: SKU attributes, product hierarchy, brand management

### 2. Geography Domain
- **Tables**: `stores`, `regions`, `cities`, `barangays` (implied structure)
- **Key Relationships**:
  - `stores.region` (currently text, should be normalized)
  - `stores.city` (currently text, should be normalized)
  - `stores.barangay` (currently text, should be normalized)
- **Usage**: Spatial hierarchy, location-based filtering, regional analysis

### 3. Business Organization Domain
- **Tables**: `stores`, `clients` (implied), `channels` (implied)
- **Key Relationships**:
  - Transaction ownership and location tracking
- **Usage**: Store performance, client management

### 4. Time Domain
- **Tables**: `dim_calendar` (to be created)
- **Key Relationships**:
  - `transactions.transaction_date` → `dim_calendar.date`
- **Usage**: Consistent fiscal periods, time-based analysis

## Current State vs Target State

### Current Implementation
```
transactions
├── product_id → products → brands, product_categories
├── store_id → stores (denormalized geography)
└── transaction_date (no calendar dimension)
```

### Target Implementation
```
transactions
├── product_id → products → brands, categories
├── store_id → stores → cities → regions
├── calendar_id → dim_calendar
└── client_id → clients
```

## Filter Bar Integration

### Current Flow
1. Filters load from denormalized `stores` table
2. Region/City/Barangay are text fields causing inefficient queries
3. No proper cascading due to lack of normalized relationships

### Target Flow
1. Normalized tables with proper PKs/FKs
2. Efficient indexed lookups
3. True cascading based on relationships

## Query Builder Integration

### Dimension Registry
```typescript
export const DIMENSIONS = [
  { id: 'brand', table: 'brands', key: 'brand_id', label: 'Brand' },
  { id: 'region', table: 'regions', key: 'region_id', label: 'Region' },
  { id: 'category', table: 'categories', key: 'category_id', label: 'Category' },
  { id: 'store', table: 'stores', key: 'store_id', label: 'Store' },
  { id: 'date', table: 'dim_calendar', key: 'calendar_id', label: 'Date' },
];
```

### SQL Generation Pattern
```sql
SELECT 
  brands.brand_name,
  regions.region_name,
  SUM(t.total_amount) as sales
FROM transactions t
JOIN products p ON t.product_id = p.product_id
JOIN brands b ON p.brand_id = b.brand_id
JOIN stores s ON t.store_id = s.store_id
JOIN cities c ON s.city_id = c.city_id
JOIN regions r ON c.region_id = r.region_id
WHERE [global filters]
GROUP BY brands.brand_name, regions.region_name
ORDER BY sales DESC
```

## Implementation Roadmap

### Phase 1: Normalize Geography (Priority)
1. Create `regions`, `cities`, `barangays` tables
2. Add FK columns to `stores` table
3. Migrate text data to normalized IDs
4. Update filter queries to use new structure

### Phase 2: Calendar Dimension
1. Create `dim_calendar` table
2. Populate with date attributes (fiscal periods, holidays, etc.)
3. Add calendar_id to transactions (optional optimization)

### Phase 3: Client/Channel Management
1. Extract client data from transactions
2. Create `clients` and `channels` tables
3. Update relationships

### Phase 4: Query Builder Enhancement
1. Implement dimension registry
2. Dynamic SQL generation based on selected dimensions
3. Metadata-driven UI components

## Data Quality Controls

### Constraints
- Foreign key constraints on all relationships
- NOT NULL constraints on required fields
- UNIQUE constraints on natural keys
- CHECK constraints for valid values

### Triggers
- Audit triggers for master data changes
- Notification triggers for cache invalidation
- Validation triggers for data integrity

### RLS Policies
- Read access for all authenticated users
- Write access only for admin/data-steward roles
- Row-level filtering based on user permissions

## Maintenance Strategy

### Manual Updates
- Supabase table editor for small changes
- Admin UI at `/admin/master-data` for controlled updates

### Bulk Operations
- CSV import via Edge Functions
- Staging table pattern for validation
- Upsert operations to handle updates

### Version Control
- `valid_from` and `valid_to` timestamps
- `is_active` flag for soft deletes
- Audit trail in separate history tables

## Performance Optimizations

### Indexing Strategy
- Primary key indexes (automatic)
- Foreign key indexes for joins
- Composite indexes for common filter combinations
- Partial indexes for active records only

### Caching Strategy
- 5-minute cache for filter options
- 30-minute cache for dimension metadata
- Event-driven invalidation on updates

### Query Optimization
- Materialized views for common aggregations
- Partition tables by date for large datasets
- Statistics updates for query planner

## Next Steps

1. **Immediate**: Fix cascading filters with current denormalized structure
2. **Short-term**: Create geography normalization migration
3. **Medium-term**: Implement dimension registry and query builder
4. **Long-term**: Full star schema with all master data domains