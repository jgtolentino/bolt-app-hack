export interface FilterState {
  // Geographic filters
  region: string;
  city_municipality: string;
  barangay: string;
  
  // Organizational filters
  client: string;
  category: string;
  brand: string;
  sku: string;
  
  // Temporal filters
  year: string;
  month: string;
  week: string;
  day_of_week: string;
  hour: string;
  
  // Date range
  date_from: string;
  date_to: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
  children?: FilterOption[];
}

export interface KPIMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  format: 'currency' | 'number' | 'percentage';
  icon: string;
  trend?: number[];
}

export interface TransactionData {
  id: string;
  datetime: string;
  geography_id: string;
  organization_id: string;
  total_amount: number;
  quantity: number;
  unit_price: number;
  payment_method: 'Cash' | 'GCash' | 'Credit Card' | 'Bank Transfer' | 'Utang/Lista';
  customer_type: string;
}

export interface GeographyData {
  id: string;
  region: string;
  city_municipality: string;
  barangay: string;
  store_name: string;
  latitude: number;
  longitude: number;
  population?: number;
  total_sales: number;
  transaction_count: number;
  avg_transaction_value: number;
}

export interface OrganizationData {
  id: string;
  client: string;
  category: string;
  brand: string;
  sku: string;
  sku_description: string;
  unit_price: number;
  margin_percent: number;
  is_competitor: boolean;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface DrillDownData {
  dimension: string;
  total_sales: number;
  transaction_count: number;
  avg_transaction_value: number;
  growth_rate?: number;
  market_share?: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: FilterState;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: 'optimization' | 'anomaly' | 'opportunity' | 'warning';
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  context: FilterState;
}

// Payment Method specific types
export interface PaymentMethodData {
  name: 'Cash' | 'GCash' | 'Credit Card' | 'Bank Transfer' | 'Utang/Lista';
  value: number;
  count: number;
  percentage: number;
  avg_transaction_value?: number;
  customer_loyalty_score?: number;
}

// Utang/Lista specific analytics
export interface UtangListaAnalytics {
  total_credit_amount: number;
  active_credit_customers: number;
  avg_credit_amount: number;
  credit_utilization_rate: number;
  payment_collection_rate: number;
  top_credit_customers: Array<{
    customer_id: string;
    total_credit: number;
    payment_history: 'excellent' | 'good' | 'fair' | 'poor';
  }>;
}

// Substitution Pattern types
export interface SubstitutionPattern {
  source: string;
  target: string;
  value: number;
  percentage: number;
  sourceCategory?: string;
  targetCategory?: string;
  sourceBrand?: string;
  targetBrand?: string;
  priceImpact?: 'upsell' | 'downsell' | 'same';
  region?: string;
}

// Basket Combination types
export interface BasketCombination {
  products: string[];
  count: number;
  percentage: number;
  avgValue: number;
  region?: string;
  timeOfDay?: string;
}

// Request Type data
export interface RequestTypeData {
  type: 'branded' | 'unbranded' | 'pointing' | 'uncertain';
  count: number;
  percentage: number;
  avgValue: number;
  products?: string[];
  categories?: string[];
}