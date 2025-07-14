/**
 * Scout Dash 2.0 - Widget Library
 * Advanced widget components inspired by retail-insights-dashboard-ph
 */

// Export widget components
export { default as SmartInsightCard } from './SmartInsightCard';
export { default as RealTimeMetricCard } from './RealTimeMetricCard';
export { default as InteractiveDataTable } from './InteractiveDataTable';

// Export component types
export type { SmartInsightCardProps } from './SmartInsightCard';
export type { RealTimeMetricCardProps } from './RealTimeMetricCard';
export type { InteractiveDataTableProps, TableColumn } from './InteractiveDataTable';

/**
 * Widget library overview:
 * 
 * 1. SmartInsightCard - AI-powered insights with trend analysis and recommendations
 * 2. RealTimeMetricCard - Live updating metrics with sparklines and targets
 * 3. InteractiveDataTable - Advanced data table with sorting, filtering, and export
 * 
 * These widgets complement the basic chart library and provide higher-level
 * dashboard components for common use cases in retail analytics and business intelligence.
 */