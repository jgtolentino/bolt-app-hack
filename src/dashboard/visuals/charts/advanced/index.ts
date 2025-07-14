/**
 * Scout Dash 2.0 - Advanced Chart Components
 * Enhanced chart library inspired by retail-insights-dashboard-ph
 */

import { visualRegistry } from '../../VisualRegistry';

// Import advanced chart components
export { default as ParetoChart } from './ParetoChart';
export { default as SankeyDiagram } from './SankeyDiagram';
export { default as GeospatialHeatmap } from './GeospatialHeatmap';
export { default as TransactionTrendsChart } from './TransactionTrendsChart';
export { default as HierarchicalChart } from './HierarchicalChart';

// Import components for registration
import ParetoChart from './ParetoChart';
import SankeyDiagram from './SankeyDiagram';
import GeospatialHeatmap from './GeospatialHeatmap';
import TransactionTrendsChart from './TransactionTrendsChart';
import HierarchicalChart from './HierarchicalChart';

// Advanced chart type definitions
export type AdvancedChartType = 
  | 'pareto.analysis'
  | 'sankey.flow'
  | 'geospatial.heatmap'
  | 'trend.analysis'
  | 'hierarchy.treemap'
  | 'hierarchy.sunburst';

/**
 * Register advanced chart components with the visual registry
 */
export function initializeAdvancedCharts(): void {
  console.log('🔧 Initializing Scout Dash 2.0 Advanced Charts...');

  // Register Pareto Analysis Chart
  visualRegistry.register('pareto.analysis', {
    component: ParetoChart,
    name: 'Pareto Analysis',
    category: 'advanced',
    description: 'Visualize the 80/20 rule with dual-axis bar and line chart',
    requiredEncodings: ['x', 'y'],
    optionalEncodings: ['color', 'tooltip'],
    supportedDataTypes: ['quantitative'],
    icon: '📊',
    defaultConfig: {
      threshold: 80,
      showCumulative: true,
      showThresholdLine: true
    }
  });

  // Register Sankey Flow Diagram
  visualRegistry.register('sankey.flow', {
    component: SankeyDiagram,
    name: 'Sankey Flow Diagram',
    category: 'advanced',
    description: 'Show flows and connections between categories',
    requiredEncodings: ['x', 'y', 'size'],
    optionalEncodings: ['color', 'tooltip'],
    supportedDataTypes: ['nominal', 'ordinal'],
    icon: '🌊',
    defaultConfig: {
      nodeWidth: 15,
      nodePadding: 10,
      linkOpacity: 0.7
    }
  });

  // Register Geospatial Heatmap
  visualRegistry.register('geospatial.heatmap', {
    component: GeospatialHeatmap,
    name: 'Geospatial Heatmap',
    category: 'advanced',
    description: 'Interactive map with intensity-based heatmap overlay',
    requiredEncodings: ['latitude', 'longitude'],
    optionalEncodings: ['size', 'color', 'text'],
    supportedDataTypes: ['quantitative'],
    icon: '🗺️',
    defaultConfig: {
      center: [14.5995, 120.9842], // Philippines
      zoom: 6,
      heatmapRadius: 20
    }
  });

  // Register Transaction Trends Chart
  visualRegistry.register('trend.analysis', {
    component: TransactionTrendsChart,
    name: 'Transaction Trends',
    category: 'advanced',
    description: 'Advanced time series with dual metrics and peak detection',
    requiredEncodings: ['x', 'y'],
    optionalEncodings: ['color', 'size'],
    supportedDataTypes: ['temporal', 'quantitative'],
    icon: '📈',
    defaultConfig: {
      showBrush: true,
      showPeakDetection: true,
      dualAxis: true
    }
  });

  // Register Hierarchical Treemap
  visualRegistry.register('hierarchy.treemap', {
    component: HierarchicalChart,
    name: 'Hierarchical Treemap',
    category: 'advanced',
    description: 'Nested rectangles showing hierarchical data structure',
    requiredEncodings: ['text', 'size'],
    optionalEncodings: ['color', 'tooltip'],
    supportedDataTypes: ['nominal', 'quantitative'],
    icon: '🔲',
    defaultConfig: {
      chartType: 'treemap',
      aspectRatio: 4/3
    }
  });

  console.log('✅ Advanced charts registered:');
  console.log('  - Pareto Analysis (80/20 rule visualization)');
  console.log('  - Sankey Flow Diagram (process flows)');
  console.log('  - Geospatial Heatmap (interactive maps)');
  console.log('  - Transaction Trends (time series analysis)');
  console.log('  - Hierarchical Treemap (nested data)');
}

/**
 * Get all available advanced chart types
 */
export function getAdvancedChartTypes(): AdvancedChartType[] {
  return [
    'pareto.analysis',
    'sankey.flow', 
    'geospatial.heatmap',
    'trend.analysis',
    'hierarchy.treemap'
  ];
}

/**
 * Create an advanced chart component instance
 */
export function createAdvancedChart(type: AdvancedChartType, props: any) {
  const registration = visualRegistry.get(type);
  if (!registration) {
    throw new Error(`Advanced chart type '${type}' not found`);
  }
  
  const Component = registration.component;
  return Component(props);
}

// Auto-initialize when imported
initializeAdvancedCharts();