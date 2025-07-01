# Scout Analytics Entity Relationship Diagram

## Visual Database Schema

```mermaid
erDiagram
    %% Core Master Data
    stores {
        UUID id PK
        VARCHAR store_code UK
        VARCHAR store_name
        VARCHAR region
        VARCHAR city
        VARCHAR barangay
        DECIMAL latitude
        DECIMAL longitude
        VARCHAR store_type
        VARCHAR status
        UUID region_id FK
        UUID city_id FK
        GEOMETRY location_point
    }
    
    products {
        UUID id PK
        VARCHAR barcode UK
        VARCHAR sku UK
        VARCHAR product_name
        UUID category_id FK
        UUID brand_id FK
        UUID supplier_id FK
        DECIMAL current_price
        DECIMAL cost_price
        VARCHAR unit_of_measure
        BOOLEAN is_active
    }
    
    product_categories {
        UUID id PK
        VARCHAR category_code UK
        VARCHAR category_name
        UUID parent_category_id FK
        INTEGER level
        BOOLEAN is_active
    }
    
    brands {
        UUID id PK
        VARCHAR brand_code UK
        VARCHAR brand_name
        VARCHAR manufacturer
        BOOLEAN is_local
        BOOLEAN is_active
    }
    
    suppliers {
        UUID id PK
        VARCHAR supplier_code UK
        VARCHAR supplier_name
        VARCHAR contact_person
        VARCHAR payment_terms
        BOOLEAN is_active
    }
    
    customers {
        UUID id PK
        VARCHAR customer_code UK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR customer_type
        VARCHAR loyalty_card_number UK
        INTEGER points_balance
        DECIMAL lifetime_value
        DATE last_purchase_date
    }
    
    cashiers {
        UUID id PK
        VARCHAR employee_code UK
        VARCHAR first_name
        VARCHAR last_name
        UUID store_id FK
        DATE hire_date
        VARCHAR status
    }
    
    %% Transaction Tables
    transactions {
        UUID id PK
        VARCHAR receipt_number UK
        DATE transaction_date
        TIME transaction_time
        TIMESTAMP datetime
        UUID store_id FK
        UUID cashier_id FK
        UUID customer_id FK
        DECIMAL subtotal
        DECIMAL discount_amount
        DECIMAL tax_amount
        DECIMAL total_amount
        VARCHAR payment_method
        INTEGER items_count
        VARCHAR status
    }
    
    transaction_items {
        UUID id PK
        UUID transaction_id FK
        UUID product_id FK
        VARCHAR barcode
        VARCHAR product_name
        DECIMAL quantity
        DECIMAL unit_price
        DECIMAL discount_amount
        DECIMAL line_total
        DECIMAL profit_amount
    }
    
    %% Geographic Tables
    regions {
        UUID id PK
        VARCHAR region_code UK
        VARCHAR region_name
        VARCHAR island_group
        JSONB boundary_polygon
        GEOMETRY geometry
        DECIMAL area_sq_km
    }
    
    provinces {
        UUID id PK
        VARCHAR province_code UK
        VARCHAR province_name
        UUID region_id FK
        JSONB boundary_polygon
        GEOMETRY geometry
        DECIMAL area_sq_km
    }
    
    cities {
        UUID id PK
        VARCHAR city_code UK
        VARCHAR city_name
        VARCHAR city_class
        UUID province_id FK
        UUID region_id FK
        JSONB boundary_polygon
        GEOMETRY geometry
        DECIMAL area_sq_km
    }
    
    barangays {
        UUID id PK
        VARCHAR barangay_code UK
        VARCHAR barangay_name
        UUID city_id FK
        UUID province_id FK
        UUID region_id FK
        JSONB boundary_polygon
        GEOMETRY geometry
    }
    
    %% Analytics Tables
    price_history {
        UUID id PK
        UUID product_id FK
        UUID store_id FK
        DECIMAL old_price
        DECIMAL new_price
        TIMESTAMP change_date
        VARCHAR change_reason
    }
    
    inventory_movements {
        UUID id PK
        UUID store_id FK
        UUID product_id FK
        VARCHAR movement_type
        DECIMAL quantity
        VARCHAR reference_type
        UUID reference_id
        TIMESTAMP movement_date
    }
    
    promotions {
        UUID id PK
        VARCHAR promo_code UK
        VARCHAR promo_name
        VARCHAR promo_type
        VARCHAR discount_type
        DECIMAL discount_value
        DATE start_date
        DATE end_date
    }
    
    promotion_items {
        UUID id PK
        UUID promotion_id FK
        UUID product_id FK
        DECIMAL special_price
        INTEGER min_quantity
    }
    
    %% Relationships
    stores ||--o{ transactions : "location"
    stores ||--o{ cashiers : "employs"
    stores ||--o{ inventory_movements : "tracks"
    stores ||--o{ price_history : "has"
    
    stores }o--|| regions : "in region"
    stores }o--|| cities : "in city"
    stores }o--|| barangays : "in barangay"
    
    regions ||--o{ provinces : "contains"
    provinces ||--o{ cities : "contains"
    cities ||--o{ barangays : "contains"
    
    regions ||--o{ stores : "has stores"
    provinces ||--o{ stores : "has stores"
    cities ||--o{ stores : "has stores"
    
    transactions ||--|{ transaction_items : "contains"
    transactions }o--|| customers : "made by"
    transactions }o--|| cashiers : "processed by"
    
    products ||--o{ transaction_items : "sold as"
    products }o--|| product_categories : "categorized as"
    products }o--|| brands : "branded by"
    products }o--|| suppliers : "supplied by"
    products ||--o{ price_history : "price changes"
    products ||--o{ inventory_movements : "stock moves"
    products ||--o{ promotion_items : "on promo"
    
    product_categories ||--o{ product_categories : "parent of"
    
    customers ||--o{ transactions : "makes"
    cashiers ||--o{ transactions : "processes"
    
    promotions ||--o{ promotion_items : "includes"
    promotion_items }o--|| products : "discounts"
```

## Table Relationships Summary

### Primary Relationships

1. **Geographic Hierarchy**
   - regions → provinces → cities → barangays
   - stores linked to all geographic levels

2. **Product Hierarchy**
   - suppliers → products
   - brands → products
   - categories → products (with self-referencing hierarchy)

3. **Transaction Flow**
   - stores → transactions → transaction_items → products
   - cashiers → transactions
   - customers → transactions

4. **Inventory & Pricing**
   - stores ↔ products (via inventory_movements)
   - products → price_history
   - promotions → promotion_items → products

### Key Design Patterns

1. **Star Schema for Analytics**
   - transactions (fact table) at center
   - Dimensions: stores, products, customers, time, geography

2. **Normalized Geography**
   - Separate tables for each administrative level
   - Polygon boundaries for spatial queries
   - PostGIS geometry for performance

3. **Audit Trail**
   - price_history tracks changes
   - inventory_movements tracks stock
   - All tables have created_at/updated_at

4. **Flexible Hierarchies**
   - Self-referencing product_categories
   - Multi-level geographic hierarchy
   - Optional relationships (customers may be anonymous)

## Index Strategy

### Primary Indexes
- All primary keys (UUID)
- All unique constraints (codes, barcodes)
- All foreign keys

### Performance Indexes
- Date columns for time-based queries
- Geographic columns (GIST indexes)
- Status/active flags for filtering
- Frequently joined columns

### Composite Indexes
- (store_id, transaction_date) on transactions
- (product_id, transaction_date) on transaction_items
- (region_id, city_id) on stores

## Data Integrity Rules

### Constraints
1. **Unique Constraints**
   - store_code, receipt_number, barcode, sku
   - category_code, brand_code, supplier_code
   - loyalty_card_number

2. **Check Constraints**
   - prices >= 0
   - quantities > 0
   - dates in valid ranges
   - status in allowed values

3. **Foreign Key Constraints**
   - All relationships enforced
   - CASCADE on delete for child records
   - RESTRICT on delete for master data

### Business Rules (via Triggers)
1. Transaction total = sum of line items
2. Inventory movements on sales
3. Customer lifetime value updates
4. Geographic calculations on boundary updates
5. Updated_at timestamp maintenance