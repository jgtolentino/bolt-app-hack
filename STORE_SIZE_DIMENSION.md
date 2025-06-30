# Store Size Dimension for Philippine Retail Data

## Current Store Types (4)
- **Sari-sari** (neighborhood stores)
- **Grocery** 
- **Mini-mart**
- **Convenience**

## Proposed Store Size Dimension for Sari-Sari Stores

Based on population served and sales volume analysis, sari-sari stores can be further categorized into 5 size classifications:

### 🏪 Sari-Sari Store Sizes

#### 1. **Micro Sari-Sari**
- Population served: < 10,000
- Typical sales: < ₱50,000
- Characteristics: Very small neighborhood stores, often home-based

#### 2. **Small Sari-Sari** 
- Population served: 10,000 - 30,000
- Typical sales: ₱50,000 - ₱100,000
- Characteristics: Standard neighborhood stores serving a few barangays

#### 3. **Medium Sari-Sari**
- Population served: 30,000 - 60,000
- Typical sales: ₱100,000 - ₱200,000
- Characteristics: Larger neighborhood stores with wider product range

#### 4. **Large Sari-Sari**
- Population served: 60,000 - 100,000
- Typical sales: ₱200,000 - ₱500,000
- Characteristics: High-traffic stores in dense urban areas

#### 5. **Extra Large Sari-Sari**
- Population served: > 100,000
- Typical sales: > ₱500,000
- Characteristics: Major neighborhood hubs, almost mini-mart scale

## Current Distribution (22 Sari-Sari Stores)

Based on population analysis:
- **Micro**: 0 stores
- **Small**: 4 stores (18%)
- **Medium**: 10 stores (45%)
- **Large**: 6 stores (27%)
- **Extra Large**: 2 stores (9%)

## Regional Distribution
- NCR: 5 sari-sari stores
- Region XI: 3 stores
- Region III: 3 stores
- Region IV-A: 3 stores
- Region VII: 3 stores
- Region VI: 2 stores
- Others: 3 stores

## Implementation

To add this dimension to your database:

1. Run the migration: `20250629123000_add_store_size_dimension.sql`
2. This will add a `store_size` column to the geography table
3. Existing stores will be automatically classified based on population
4. New views will be created for analysis:
   - `v_store_distribution` - Overview of all stores by type and size
   - `v_sari_sari_analysis` - Detailed sari-sari store metrics

## Benefits of Size Dimension

1. **Better Segmentation**: Understand different sari-sari store segments
2. **Targeted Strategies**: Develop size-specific product assortments
3. **Performance Analysis**: Compare stores within size categories
4. **Resource Allocation**: Optimize delivery and support by store size
5. **Growth Tracking**: Monitor stores transitioning between size categories