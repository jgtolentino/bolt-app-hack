/**
 * Navigation utilities for drill-down from Executive Overview
 * Maps KPIs to their detail pages with context
 */

import { NavigateFunction } from 'react-router-dom';

export interface DrillDownContext {
  metric: string;
  value?: any;
  filters?: Record<string, any>;
  timeRange?: string;
}

/**
 * Navigate to detail page with context from Executive Overview
 */
export const drillDown = (
  navigate: NavigateFunction,
  target: string,
  context?: DrillDownContext
) => {
  // Build query params from context
  const params = new URLSearchParams();
  
  if (context?.filters) {
    Object.entries(context.filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }
  
  if (context?.metric) {
    params.append('metric', context.metric);
  }
  
  if (context?.timeRange) {
    params.append('timeRange', context.timeRange);
  }
  
  // Navigate with query params
  const queryString = params.toString();
  navigate(`${target}${queryString ? `?${queryString}` : ''}`);
};

/**
 * KPI to Detail Page Mapping
 */
export const KPI_DRILL_PATHS = {
  total_sales: {
    path: '/transaction-timing',
    defaultFilters: { view: 'revenue' }
  },
  active_stores: {
    path: '/demographics',
    defaultFilters: { view: 'geographic' }
  },
  avg_basket: {
    path: '/consumer-patterns',
    defaultFilters: { metric: 'basket_value' }
  },
  substitution_rate: {
    path: '/brand-switching',
    defaultFilters: { view: 'substitution_matrix' }
  },
  suggestion_conversion: {
    path: '/consumer-patterns',
    defaultFilters: { metric: 'suggestion_acceptance' }
  },
  top_sku: {
    path: '/product-sku',
    defaultFilters: { sort: 'revenue_desc' }
  },
  market_share: {
    path: '/brand-switching',
    defaultFilters: { view: 'competitor_analysis' }
  },
  regional_performance: {
    path: '/demographics',
    defaultFilters: { view: 'heatmap' }
  }
};

/**
 * Generate breadcrumb trail
 */
export const getBreadcrumbs = (pathname: string): Array<{label: string, path: string}> => {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Dashboard', path: '/' }];
  
  const routeLabels: Record<string, string> = {
    'transaction-timing': 'Transaction Timing',
    'product-sku': 'Product & SKU',
    'consumer-patterns': 'Consumer Patterns',
    'brand-switching': 'Brand Switching',
    'demographics': 'Demographics',
    'ai-chat': 'AI Chat',
    'saved-queries': 'Saved Queries',
    'alerts-anomalies': 'Alerts & Anomalies',
    'validation': 'Data Validation'
  };
  
  paths.forEach((path, index) => {
    const fullPath = '/' + paths.slice(0, index + 1).join('/');
    const label = routeLabels[path] || path;
    breadcrumbs.push({ label, path: fullPath });
  });
  
  return breadcrumbs;
};

/**
 * JTI-specific metric questions mapping
 */
export const JTI_METRICS = {
  market_position: {
    question: "Are we still #1 in our category?",
    kpi: 'market_share',
    drillPath: '/brand-switching?view=market_position'
  },
  regional_growth: {
    question: "Which regions are driving growth?",
    kpi: 'regional_performance',
    drillPath: '/demographics?view=growth_map'
  },
  portfolio_health: {
    question: "Is our SKU mix healthy?",
    kpi: 'sku_contribution',
    drillPath: '/product-sku?view=portfolio_analysis'
  },
  competitor_threat: {
    question: "Where are competitors gaining share?",
    kpi: 'substitution_rate',
    drillPath: '/brand-switching?view=competitor_gains'
  },
  operational_alerts: {
    question: "What needs immediate attention?",
    kpi: 'ai_alerts',
    drillPath: '/ai-chat?template=urgent_alerts'
  }
};