// StockBot Widget Adapters for Scout Analytics
// These components transform TradingView-style widgets into Scout retail analytics

export { SalesHeatmap } from './SalesHeatmap';
export { BrandKpiCard } from './BrandKpiCard';
export { SalesTrendChart } from './SalesTrendChart';
export { PricingVolatilityChart } from './PricingVolatilityChart';
export { InsightsFeed } from './InsightsFeed';
export { RegionalPerformanceTable } from './RegionalPerformanceTable';
export { ProductScreener } from './ProductScreener';
export { TopProductsTicker } from './TopProductsTicker';
export { CategoryPerformanceHeatmap } from './CategoryPerformanceHeatmap';

// Widget Registry and utilities
export { 
  widgetRegistry, 
  findWidgetByQuery, 
  getWidgetComponent,
  getWidgetsByCategory,
  generateOpenAISchema 
} from './widgetRegistry';

// Re-export types
export type { WidgetConfig, WidgetParameter } from './widgetRegistry';