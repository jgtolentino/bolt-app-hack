import { lazy } from 'react';

// Widget type definitions
export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  category: 'visualization' | 'metric' | 'analysis' | 'interactive';
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  defaultProps?: Record<string, any>;
  parameters: WidgetParameter[];
  examples: string[];
}

export interface WidgetParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'dateRange';
  description: string;
  required?: boolean;
  default?: any;
  options?: string[]; // For enum types
}

// Lazy load all widget components
const SalesHeatmap = lazy(() => import('./SalesHeatmap'));
const BrandKpiCard = lazy(() => import('./BrandKpiCard'));
const SalesTrendChart = lazy(() => import('./SalesTrendChart'));
const PricingVolatilityChart = lazy(() => import('./PricingVolatilityChart'));
const InsightsFeed = lazy(() => import('./InsightsFeed'));
const RegionalPerformanceTable = lazy(() => import('./RegionalPerformanceTable'));
const ProductScreener = lazy(() => import('./ProductScreener'));
const TopProductsTicker = lazy(() => import('./TopProductsTicker'));
const CategoryPerformanceHeatmap = lazy(() => import('./CategoryPerformanceHeatmap'));

// Widget Registry
export const widgetRegistry: Record<string, WidgetConfig> = {
  salesHeatmap: {
    id: 'salesHeatmap',
    name: 'Sales Heatmap',
    description: 'Visual heatmap showing sales performance across categories or regions',
    category: 'visualization',
    component: SalesHeatmap,
    defaultProps: { dateRange: 'last7Days' },
    parameters: [
      {
        name: 'regionFilter',
        type: 'string',
        description: 'Filter by specific region'
      },
      {
        name: 'categoryFilter',
        type: 'string',
        description: 'Filter by specific category'
      },
      {
        name: 'dateRange',
        type: 'dateRange',
        description: 'Time period for data',
        default: 'last7Days'
      }
    ],
    examples: [
      'Show me a sales heatmap for electronics in NCR',
      'Display category performance heatmap for last month'
    ]
  },

  brandKpiCard: {
    id: 'brandKpiCard',
    name: 'Brand KPI Card',
    description: 'Comprehensive KPI metrics for a specific brand',
    category: 'metric',
    component: BrandKpiCard,
    parameters: [
      {
        name: 'brandId',
        type: 'string',
        description: 'Specific brand to display metrics for'
      },
      {
        name: 'dateRange',
        type: 'dateRange',
        description: 'Time period for metrics',
        default: 'last7Days'
      }
    ],
    examples: [
      'Show Nike brand performance',
      'Display Samsung KPIs for this quarter'
    ]
  },

  salesTrendChart: {
    id: 'salesTrendChart',
    name: 'Sales Trend Chart',
    description: 'Line chart showing sales trends over time with moving averages',
    category: 'visualization',
    component: SalesTrendChart,
    defaultProps: { height: 400 },
    parameters: [
      {
        name: 'dateRange',
        type: 'dateRange',
        description: 'Time period for trend',
        default: 'last30Days'
      },
      {
        name: 'storeId',
        type: 'string',
        description: 'Filter by specific store'
      },
      {
        name: 'showVolume',
        type: 'boolean',
        description: 'Show transaction volume overlay',
        default: false
      }
    ],
    examples: [
      'Show sales trend for SM Mall this month',
      'Display 90-day sales trend with volume'
    ]
  },

  pricingVolatilityChart: {
    id: 'pricingVolatilityChart',
    name: 'Pricing Volatility Chart',
    description: 'Candlestick-style chart showing price variations and volatility',
    category: 'analysis',
    component: PricingVolatilityChart,
    parameters: [
      {
        name: 'productId',
        type: 'string',
        description: 'Specific product to analyze'
      },
      {
        name: 'dateRange',
        type: 'dateRange',
        description: 'Time period for analysis',
        default: 'last30Days'
      }
    ],
    examples: [
      'Show pricing volatility for iPhone 15',
      'Analyze price variations for Nike shoes'
    ]
  },

  insightsFeed: {
    id: 'insightsFeed',
    name: 'AI Insights Feed',
    description: 'AI-generated insights and recommendations based on data patterns',
    category: 'analysis',
    component: InsightsFeed,
    parameters: [
      {
        name: 'limit',
        type: 'number',
        description: 'Number of insights to display',
        default: 5
      },
      {
        name: 'category',
        type: 'string',
        description: 'Filter insights by category'
      }
    ],
    examples: [
      'Show me AI insights for electronics',
      'Display top 10 business recommendations'
    ]
  },

  regionalPerformanceTable: {
    id: 'regionalPerformanceTable',
    name: 'Regional Performance Table',
    description: 'Sortable table showing performance metrics by region',
    category: 'analysis',
    component: RegionalPerformanceTable,
    parameters: [
      {
        name: 'dateRange',
        type: 'dateRange',
        description: 'Time period for data',
        default: 'last7Days'
      },
      {
        name: 'sortBy',
        type: 'enum',
        description: 'Sort table by metric',
        options: ['revenue', 'growth', 'transactions', 'aov'],
        default: 'revenue'
      }
    ],
    examples: [
      'Show regional performance sorted by growth',
      'Display region metrics for last month'
    ]
  },

  productScreener: {
    id: 'productScreener',
    name: 'Product Screener',
    description: 'Advanced product search and filtering tool with multi-dimensional filters',
    category: 'interactive',
    component: ProductScreener,
    parameters: [
      {
        name: 'dateRange',
        type: 'dateRange',
        description: 'Time period for metrics',
        default: 'last7Days'
      },
      {
        name: 'initialFilters',
        type: 'string',
        description: 'Pre-set filter configuration'
      }
    ],
    examples: [
      'Find all Nike products with >20% growth',
      'Screen products in NCR with revenue >100k'
    ]
  },

  topProductsTicker: {
    id: 'topProductsTicker',
    name: 'Top Products Ticker',
    description: 'Auto-scrolling ticker showing top performing products',
    category: 'metric',
    component: TopProductsTicker,
    defaultProps: { autoScroll: true },
    parameters: [
      {
        name: 'limit',
        type: 'number',
        description: 'Number of products to show',
        default: 10
      },
      {
        name: 'autoScroll',
        type: 'boolean',
        description: 'Enable auto-scrolling',
        default: true
      },
      {
        name: 'category',
        type: 'string',
        description: 'Filter by category'
      }
    ],
    examples: [
      'Show top 5 electronics products',
      'Display trending fashion items'
    ]
  },

  categoryPerformanceHeatmap: {
    id: 'categoryPerformanceHeatmap',
    name: 'Category Performance Heatmap',
    description: 'Treemap-style heatmap showing hierarchical performance data',
    category: 'visualization',
    component: CategoryPerformanceHeatmap,
    parameters: [
      {
        name: 'groupBy',
        type: 'enum',
        description: 'Group data by dimension',
        options: ['category', 'brand', 'region'],
        default: 'category'
      },
      {
        name: 'metric',
        type: 'enum',
        description: 'Performance metric to visualize',
        options: ['revenue', 'growth', 'volume', 'margin'],
        default: 'revenue'
      }
    ],
    examples: [
      'Show brand performance heatmap by growth',
      'Display regional heatmap by revenue'
    ]
  }
};

// Helper function to find widgets by natural language query
export function findWidgetByQuery(query: string): WidgetConfig | null {
  const normalizedQuery = query.toLowerCase();
  
  // Direct name matches
  for (const [key, widget] of Object.entries(widgetRegistry)) {
    if (normalizedQuery.includes(widget.name.toLowerCase())) {
      return widget;
    }
  }
  
  // Example matches
  for (const [key, widget] of Object.entries(widgetRegistry)) {
    for (const example of widget.examples) {
      if (example.toLowerCase().includes(normalizedQuery) || 
          normalizedQuery.includes(example.toLowerCase())) {
        return widget;
      }
    }
  }
  
  // Keyword matches
  const keywords: Record<string, string[]> = {
    salesHeatmap: ['heatmap', 'heat map', 'category performance', 'visual map'],
    brandKpiCard: ['brand', 'kpi', 'metrics', 'performance card'],
    salesTrendChart: ['trend', 'line chart', 'sales over time', 'time series'],
    pricingVolatilityChart: ['pricing', 'volatility', 'price variation', 'candlestick'],
    insightsFeed: ['insights', 'ai', 'recommendations', 'analysis feed'],
    regionalPerformanceTable: ['regional', 'region table', 'geographic performance'],
    productScreener: ['screener', 'search products', 'filter', 'product finder'],
    topProductsTicker: ['top products', 'ticker', 'trending', 'best sellers'],
    categoryPerformanceHeatmap: ['treemap', 'hierarchy', 'category heatmap']
  };
  
  for (const [widgetId, widgetKeywords] of Object.entries(keywords)) {
    if (widgetKeywords.some(keyword => normalizedQuery.includes(keyword))) {
      return widgetRegistry[widgetId];
    }
  }
  
  return null;
}

// Export widget component getter for dynamic rendering
export function getWidgetComponent(widgetId: string) {
  const widget = widgetRegistry[widgetId];
  return widget ? widget.component : null;
}

// Export function to get all widgets by category
export function getWidgetsByCategory(category: WidgetConfig['category']) {
  return Object.values(widgetRegistry).filter(widget => widget.category === category);
}

// OpenAI function calling schema generator
export function generateOpenAISchema() {
  return Object.values(widgetRegistry).map(widget => ({
    name: `render_${widget.id}`,
    description: widget.description,
    parameters: {
      type: 'object',
      properties: widget.parameters.reduce((acc, param) => ({
        ...acc,
        [param.name]: {
          type: param.type === 'enum' ? 'string' : param.type,
          description: param.description,
          ...(param.options && { enum: param.options }),
          ...(param.default !== undefined && { default: param.default })
        }
      }), {}),
      required: widget.parameters.filter(p => p.required).map(p => p.name)
    }
  }));
}