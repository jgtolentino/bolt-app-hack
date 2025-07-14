/**
 * Scout Dash 2.0 - Main Dashboard Export
 * Central export for the complete dashboard framework
 */

// Core framework
export * from './types';
export { DashboardEngine } from './DashboardEngine';
export { visualRegistry, VisualRegistry } from './visuals/VisualRegistry';
export { default as BaseVisual } from './visuals/BaseVisual';

// Chart components
export * from './visuals/charts';

// Layout system
export * from './layout';

// Filter system
export * from './filters';

// Persistence system
export * from './persistence';

// Re-export for convenience
export { 
  initializeChartComponents, 
  getAvailableChartTypes, 
  createChart 
} from './visuals/charts';

/**
 * Initialize the complete dashboard framework
 */
export function initializeDashboardFramework(): void {
  console.log('🚀 Initializing Scout Dash 2.0 Framework...');
  
  // Chart components are auto-initialized when imported
  // Layout system is ready to use
  // Filter system requires provider setup
  // Persistence system requires configuration
  
  console.log('✅ Scout Dash 2.0 Framework ready');
  console.log('📊 Available systems:');
  console.log('  - Visual Registry & Chart Components');
  console.log('  - Dashboard Layout Engine');
  console.log('  - Filter & Cross-Chart Interactions');
  console.log('  - Dashboard Persistence');
}