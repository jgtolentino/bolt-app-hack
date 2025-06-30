// Master Data Dimension Registry
// This registry defines all hierarchical relationships and metadata for the Scout Analytics platform

export interface Dimension {
  id: string;
  table: string;
  key: string;
  label: string;
  parent: string | null;
  displayField: string;
  filterField?: string;
  icon?: string;
  pillar: 'location' | 'business' | 'client' | 'time' | 'consumer' | 'payment';
}

export interface Hierarchy {
  id: string;
  name: string;
  dimensions: string[];
  rootDimension: string;
  description: string;
}

// Define all dimensions with their relationships
export const DIMENSIONS: Dimension[] = [
  // Location Pillar
  {
    id: 'region',
    table: 'stores', // Currently denormalized
    key: 'region',
    label: 'Region',
    parent: null,
    displayField: 'region',
    filterField: 'region',
    icon: '🌏',
    pillar: 'location'
  },
  {
    id: 'city',
    table: 'stores',
    key: 'city',
    label: 'City/Municipality',
    parent: 'region',
    displayField: 'city',
    filterField: 'city_municipality',
    icon: '🏙️',
    pillar: 'location'
  },
  {
    id: 'barangay',
    table: 'stores',
    key: 'barangay',
    label: 'Barangay',
    parent: 'city',
    displayField: 'barangay',
    filterField: 'barangay',
    icon: '🏘️',
    pillar: 'location'
  },
  {
    id: 'store',
    table: 'stores',
    key: 'id',
    label: 'Store',
    parent: 'barangay',
    displayField: 'store_name',
    filterField: 'store_id',
    icon: '🏪',
    pillar: 'location'
  },

  // Business/Product Pillar
  {
    id: 'category',
    table: 'product_categories',
    key: 'category_id',
    label: 'Category',
    parent: null,
    displayField: 'category_name',
    filterField: 'category',
    icon: '📦',
    pillar: 'business'
  },
  {
    id: 'subcategory',
    table: 'product_subcategories',
    key: 'subcategory_id',
    label: 'Subcategory',
    parent: 'category',
    displayField: 'subcategory_name',
    filterField: 'subcategory',
    icon: '📂',
    pillar: 'business'
  },
  {
    id: 'brand',
    table: 'brands',
    key: 'brand_id',
    label: 'Brand',
    parent: 'subcategory',
    displayField: 'brand_name',
    filterField: 'brand',
    icon: '🏷️',
    pillar: 'business'
  },
  {
    id: 'sku',
    table: 'products',
    key: 'product_id',
    label: 'SKU',
    parent: 'brand',
    displayField: 'product_name',
    filterField: 'sku',
    icon: '📦',
    pillar: 'business'
  },

  // Client Pillar (TBWA and other advertising clients)
  {
    id: 'client',
    table: 'clients',
    key: 'client_id',
    label: 'Client',
    parent: null,
    displayField: 'client_name',
    filterField: 'client',
    icon: '🏢',
    pillar: 'client'
  },
  {
    id: 'client_category',
    table: 'client_categories',
    key: 'category_id',
    label: 'Client Category',
    parent: 'client',
    displayField: 'category_name',
    filterField: 'client_category',
    icon: '📊',
    pillar: 'client'
  },
  {
    id: 'client_brand',
    table: 'client_brands',
    key: 'brand_id',
    label: 'Client Brand',
    parent: 'client_category',
    displayField: 'brand_name',
    filterField: 'client_brand',
    icon: '🎯',
    pillar: 'client'
  },
  {
    id: 'client_sku',
    table: 'client_products',
    key: 'product_id',
    label: 'Client SKU',
    parent: 'client_brand',
    displayField: 'product_name',
    filterField: 'client_sku',
    icon: '🎁',
    pillar: 'client'
  },

  // Time Pillar
  {
    id: 'year',
    table: 'time_dimension',
    key: 'year',
    label: 'Year',
    parent: null,
    displayField: 'year',
    filterField: 'year',
    icon: '📅',
    pillar: 'time'
  },
  {
    id: 'quarter',
    table: 'time_dimension',
    key: 'quarter',
    label: 'Quarter',
    parent: 'year',
    displayField: 'quarter_name',
    filterField: 'quarter',
    icon: '📊',
    pillar: 'time'
  },
  {
    id: 'month',
    table: 'time_dimension',
    key: 'month',
    label: 'Month',
    parent: 'quarter',
    displayField: 'month_name',
    filterField: 'month',
    icon: '📆',
    pillar: 'time'
  },
  {
    id: 'week',
    table: 'time_dimension',
    key: 'week',
    label: 'Week',
    parent: 'month',
    displayField: 'week_of_year',
    filterField: 'week',
    icon: '📅',
    pillar: 'time'
  },
  {
    id: 'day',
    table: 'time_dimension',
    key: 'date',
    label: 'Day',
    parent: 'week',
    displayField: 'date',
    filterField: 'day',
    icon: '📆',
    pillar: 'time'
  },

  // Consumer Pillar
  {
    id: 'consumer_segment',
    table: 'consumer_segments',
    key: 'segment_id',
    label: 'Consumer Segment',
    parent: null,
    displayField: 'segment_name',
    filterField: 'consumer_segment',
    icon: '👥',
    pillar: 'consumer'
  },
  {
    id: 'age_group',
    table: 'consumer_profiles',
    key: 'age_bracket',
    label: 'Age Group',
    parent: 'consumer_segment',
    displayField: 'age_bracket',
    filterField: 'age_group',
    icon: '👶',
    pillar: 'consumer'
  },
  {
    id: 'gender',
    table: 'consumer_profiles',
    key: 'gender',
    label: 'Gender',
    parent: 'consumer_segment',
    displayField: 'gender',
    filterField: 'gender',
    icon: '👤',
    pillar: 'consumer'
  },

  // Payment Pillar
  {
    id: 'payment_type',
    table: 'payment_methods',
    key: 'method_type',
    label: 'Payment Type',
    parent: null,
    displayField: 'method_type',
    filterField: 'payment_type',
    icon: '💳',
    pillar: 'payment'
  },
  {
    id: 'payment_provider',
    table: 'payment_methods',
    key: 'provider',
    label: 'Payment Provider',
    parent: 'payment_type',
    displayField: 'provider',
    filterField: 'payment_provider',
    icon: '🏦',
    pillar: 'payment'
  }
];

// Define hierarchies (drill-down paths)
export const HIERARCHIES: Hierarchy[] = [
  {
    id: 'geography',
    name: 'Geographic Hierarchy',
    dimensions: ['region', 'city', 'barangay', 'store'],
    rootDimension: 'region',
    description: 'Drill down from Region → City → Barangay → Store'
  },
  {
    id: 'product',
    name: 'Product Hierarchy',
    dimensions: ['category', 'subcategory', 'brand', 'sku'],
    rootDimension: 'category',
    description: 'Drill down from Category → Subcategory → Brand → SKU'
  },
  {
    id: 'client_product',
    name: 'Client Product Hierarchy',
    dimensions: ['client', 'client_category', 'client_brand', 'client_sku'],
    rootDimension: 'client',
    description: 'Drill down from Client → Category → Brand → SKU (for TBWA clients)'
  },
  {
    id: 'time',
    name: 'Time Hierarchy',
    dimensions: ['year', 'quarter', 'month', 'week', 'day'],
    rootDimension: 'year',
    description: 'Drill down from Year → Quarter → Month → Week → Day'
  },
  {
    id: 'consumer',
    name: 'Consumer Hierarchy',
    dimensions: ['consumer_segment', 'age_group', 'gender'],
    rootDimension: 'consumer_segment',
    description: 'Drill down from Segment → Age Group/Gender'
  },
  {
    id: 'payment',
    name: 'Payment Hierarchy',
    dimensions: ['payment_type', 'payment_provider'],
    rootDimension: 'payment_type',
    description: 'Drill down from Payment Type → Provider'
  }
];

// Helper functions
export const getDimension = (id: string): Dimension | undefined => {
  return DIMENSIONS.find(d => d.id === id);
};

export const getHierarchy = (id: string): Hierarchy | undefined => {
  return HIERARCHIES.find(h => h.id === id);
};

export const getDimensionsByPillar = (pillar: string): Dimension[] => {
  return DIMENSIONS.filter(d => d.pillar === pillar);
};

export const getChildDimensions = (parentId: string): Dimension[] => {
  return DIMENSIONS.filter(d => d.parent === parentId);
};

export const getParentDimension = (dimensionId: string): Dimension | undefined => {
  const dimension = getDimension(dimensionId);
  if (!dimension || !dimension.parent) return undefined;
  return getDimension(dimension.parent);
};

export const getHierarchyPath = (dimensionId: string): Dimension[] => {
  const path: Dimension[] = [];
  let current = getDimension(dimensionId);
  
  while (current) {
    path.unshift(current);
    current = current.parent ? getDimension(current.parent) : undefined;
  }
  
  return path;
};

// Client-Brand relationship mapping
export interface ClientBrandMapping {
  clientId: string;
  clientName: string;
  brands: {
    brandId: string;
    brandName: string;
    categories: string[];
    isExclusive: boolean;
  }[];
}

// Example TBWA client mappings (would be loaded from database)
export const CLIENT_BRAND_MAPPINGS: ClientBrandMapping[] = [
  {
    clientId: 'tbwa-001',
    clientName: 'TBWA',
    brands: [
      {
        brandId: 'brand-001',
        brandName: 'Coca-Cola',
        categories: ['Beverages', 'Soft Drinks'],
        isExclusive: false
      },
      {
        brandId: 'brand-002',
        brandName: 'Sprite',
        categories: ['Beverages', 'Soft Drinks'],
        isExclusive: false
      },
      {
        brandId: 'brand-003',
        brandName: 'Royal',
        categories: ['Beverages', 'Soft Drinks'],
        isExclusive: false
      },
      {
        brandId: 'brand-004',
        brandName: 'Pantene',
        categories: ['Personal Care', 'Hair Care'],
        isExclusive: true
      },
      {
        brandId: 'brand-005',
        brandName: 'Head & Shoulders',
        categories: ['Personal Care', 'Hair Care'],
        isExclusive: true
      }
    ]
  }
];

// Query builder helpers
export interface QueryFilter {
  dimension: string;
  operator: 'eq' | 'in' | 'gte' | 'lte' | 'like' | 'between';
  value: any;
}

export interface QueryConfig {
  metrics: string[];
  dimensions: string[];
  filters: QueryFilter[];
  orderBy?: { dimension: string; direction: 'asc' | 'desc' }[];
  limit?: number;
}

// Validate if a dimension can be used with another in the same query
export const canCombineDimensions = (dim1: string, dim2: string): boolean => {
  const d1 = getDimension(dim1);
  const d2 = getDimension(dim2);
  
  if (!d1 || !d2) return false;
  
  // Same pillar dimensions can usually be combined
  if (d1.pillar === d2.pillar) return true;
  
  // Cross-pillar combinations that make sense
  const validCombinations = [
    ['location', 'business'],
    ['location', 'client'],
    ['location', 'time'],
    ['business', 'time'],
    ['client', 'time'],
    ['consumer', 'location'],
    ['consumer', 'business'],
    ['payment', 'location'],
    ['payment', 'time']
  ];
  
  return validCombinations.some(combo => 
    (combo.includes(d1.pillar) && combo.includes(d2.pillar))
  );
};

// Export registry version for cache invalidation
export const REGISTRY_VERSION = '1.0.0';