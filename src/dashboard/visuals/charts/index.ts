/**
 * Scout Dash 2.0 - Chart Components Export
 * Exports all chart components and registers them with the VisualRegistry
 */

import React from 'react';
import { visualRegistry, VisualRegistration } from '../VisualRegistry';
import BaseVisual from '../BaseVisual';
import BarChart from './BarChart';
import LineChart from './LineChart';
import PieChart from './PieChart';
import KPICard from './KPICard';
import TableChart from './TableChart';

// Export basic components
export {
  BaseVisual,
  BarChart,
  LineChart,
  PieChart,
  KPICard,
  TableChart
};

// Export advanced components
export * from './advanced';

// Visual registrations
const chartRegistrations: VisualRegistration[] = [
  // Bar Charts
  {
    type: 'bar.vertical',
    name: 'Vertical Bar Chart',
    description: 'Compare values across categories using vertical bars',
    category: 'chart',
    component: BarChart,
    icon: '📊',
    requirements: {
      minFields: 2,
      maxFields: 3,
      requiredEncodings: ['x', 'y'],
      optionalEncodings: ['color', 'tooltip'],
      supportedDataTypes: ['nominal', 'ordinal', 'quantitative']
    },
    defaults: {
      encoding: {
        x: { type: 'nominal' },
        y: { type: 'quantitative', aggregate: 'sum' }
      },
      style: {
        chartStyle: {
          showGrid: true,
          showLegend: false,
          showTooltip: true,
          cornerRadius: 2
        }
      },
      interactions: {
        selection: { type: 'single', on: 'click' },
        hover: { tooltip: true, highlight: true }
      }
    },
    recommender: (data) => {
      const sample = data[0] || {};
      const fields = Object.keys(sample);
      const categoricalFields = fields.filter(f => typeof sample[f] === 'string');
      const numericFields = fields.filter(f => typeof sample[f] === 'number');
      
      if (categoricalFields.length >= 1 && numericFields.length >= 1) {
        return { recommended: true, score: 85, reason: 'Perfect for categorical comparison' };
      }
      return { recommended: false, score: 0, reason: 'Requires categorical and numeric fields' };
    }
  },
  
  {
    type: 'bar.horizontal',
    name: 'Horizontal Bar Chart',
    description: 'Compare values across categories using horizontal bars',
    category: 'chart',
    component: BarChart,
    icon: '📊',
    requirements: {
      minFields: 2,
      maxFields: 3,
      requiredEncodings: ['x', 'y'],
      optionalEncodings: ['color', 'tooltip'],
      supportedDataTypes: ['nominal', 'ordinal', 'quantitative']
    },
    defaults: {
      encoding: {
        x: { type: 'quantitative', aggregate: 'sum' },
        y: { type: 'nominal' }
      },
      style: {
        chartStyle: {
          showGrid: true,
          showLegend: false,
          showTooltip: true,
          cornerRadius: 2
        }
      },
      interactions: {
        selection: { type: 'single', on: 'click' },
        hover: { tooltip: true, highlight: true }
      }
    }
  },

  // Line Charts
  {
    type: 'line.basic',
    name: 'Line Chart',
    description: 'Show trends and changes over time or continuous data',
    category: 'chart',
    component: LineChart,
    icon: '📈',
    requirements: {
      minFields: 2,
      maxFields: 4,
      requiredEncodings: ['x', 'y'],
      optionalEncodings: ['color', 'tooltip'],
      supportedDataTypes: ['quantitative', 'temporal']
    },
    defaults: {
      encoding: {
        x: { type: 'temporal' },
        y: { type: 'quantitative' }
      },
      style: {
        chartStyle: {
          showGrid: true,
          showLegend: false,
          showTooltip: true,
          strokeWidth: 2,
          pointSize: 3
        }
      },
      interactions: {
        selection: { type: 'single', on: 'click' },
        hover: { tooltip: true, highlight: true },
        brush: { enabled: true, axes: ['x'], action: 'filter' }
      }
    },
    recommender: (data) => {
      const sample = data[0] || {};
      const fields = Object.keys(sample);
      const dateFields = fields.filter(f => {
        const val = sample[f];
        return val instanceof Date || (typeof val === 'string' && !isNaN(Date.parse(val)));
      });
      const numericFields = fields.filter(f => typeof sample[f] === 'number');
      
      if (dateFields.length >= 1 && numericFields.length >= 1) {
        return { recommended: true, score: 95, reason: 'Excellent for time series data' };
      }
      if (numericFields.length >= 2) {
        return { recommended: true, score: 70, reason: 'Good for showing trends' };
      }
      return { recommended: false, score: 0, reason: 'Requires time/numeric fields' };
    }
  },

  {
    type: 'line.area',
    name: 'Area Chart',
    description: 'Show trends with filled area under the line',
    category: 'chart',
    component: LineChart,
    icon: '📈',
    requirements: {
      minFields: 2,
      maxFields: 4,
      requiredEncodings: ['x', 'y'],
      optionalEncodings: ['color', 'tooltip'],
      supportedDataTypes: ['quantitative', 'temporal']
    },
    defaults: {
      encoding: {
        x: { type: 'temporal' },
        y: { type: 'quantitative' }
      },
      style: {
        chartStyle: {
          showGrid: true,
          showLegend: false,
          showTooltip: true,
          strokeWidth: 2,
          pointSize: 3
        }
      },
      interactions: {
        selection: { type: 'single', on: 'click' },
        hover: { tooltip: true, highlight: true }
      }
    }
  },

  // Pie Charts
  {
    type: 'pie.basic',
    name: 'Pie Chart',
    description: 'Show part-to-whole relationships in a circular format',
    category: 'chart',
    component: PieChart,
    icon: '🥧',
    requirements: {
      minFields: 2,
      maxFields: 2,
      requiredEncodings: ['color', 'angle'],
      optionalEncodings: ['tooltip'],
      supportedDataTypes: ['nominal', 'ordinal', 'quantitative']
    },
    defaults: {
      encoding: {
        color: { type: 'nominal' },
        angle: { type: 'quantitative', aggregate: 'sum' }
      },
      style: {
        chartStyle: {
          showLegend: true,
          showTooltip: true
        }
      },
      interactions: {
        selection: { type: 'single', on: 'click' },
        hover: { tooltip: true, highlight: true }
      }
    },
    recommender: (data) => {
      const sample = data[0] || {};
      const fields = Object.keys(sample);
      const categoricalFields = fields.filter(f => typeof sample[f] === 'string');
      const numericFields = fields.filter(f => typeof sample[f] === 'number');
      
      if (categoricalFields.length >= 1 && numericFields.length >= 1 && data.length <= 8) {
        return { recommended: true, score: 80, reason: 'Great for part-to-whole with few categories' };
      }
      return { recommended: false, score: 0, reason: 'Best with categorical data and few segments' };
    }
  },

  {
    type: 'pie.donut',
    name: 'Donut Chart',
    description: 'Pie chart with hollow center for additional information',
    category: 'chart',
    component: PieChart,
    icon: '🍩',
    requirements: {
      minFields: 2,
      maxFields: 2,
      requiredEncodings: ['color', 'angle'],
      optionalEncodings: ['tooltip'],
      supportedDataTypes: ['nominal', 'ordinal', 'quantitative']
    },
    defaults: {
      encoding: {
        color: { type: 'nominal' },
        angle: { type: 'quantitative', aggregate: 'sum' }
      },
      style: {
        chartStyle: {
          showLegend: true,
          showTooltip: true
        }
      },
      interactions: {
        selection: { type: 'single', on: 'click' },
        hover: { tooltip: true, highlight: true }
      }
    }
  },

  // KPI Cards
  {
    type: 'kpi.card',
    name: 'KPI Card',
    description: 'Display key performance indicators with trends',
    category: 'kpi',
    component: KPICard,
    icon: '📋',
    requirements: {
      minFields: 1,
      maxFields: 2,
      requiredEncodings: ['text'],
      optionalEncodings: [],
      supportedDataTypes: ['quantitative']
    },
    defaults: {
      encoding: {
        text: { type: 'quantitative', aggregate: 'sum' }
      },
      style: {
        theme: 'default'
      },
      interactions: {
        selection: { type: 'single', on: 'click' },
        hover: { tooltip: true }
      }
    },
    recommender: (data) => {
      if (data.length === 1) {
        const sample = data[0];
        const numericFields = Object.keys(sample).filter(f => typeof sample[f] === 'number');
        if (numericFields.length >= 1) {
          return { recommended: true, score: 95, reason: 'Perfect for single metric display' };
        }
      }
      return { recommended: false, score: 0, reason: 'Best for single numeric values' };
    }
  },

  {
    type: 'kpi.gauge',
    name: 'KPI Gauge',
    description: 'Display metrics as a gauge with target comparison',
    category: 'kpi',
    component: KPICard,
    icon: '⏲️',
    requirements: {
      minFields: 1,
      maxFields: 2,
      requiredEncodings: ['text'],
      optionalEncodings: [],
      supportedDataTypes: ['quantitative']
    },
    defaults: {
      encoding: {
        text: { type: 'quantitative', aggregate: 'avg' }
      },
      style: {
        theme: 'default'
      },
      interactions: {
        hover: { tooltip: true }
      }
    }
  },

  {
    type: 'kpi.trend',
    name: 'KPI with Trend',
    description: 'KPI card with mini trend chart',
    category: 'kpi',
    component: KPICard,
    icon: '📊',
    requirements: {
      minFields: 1,
      maxFields: 3,
      requiredEncodings: ['text'],
      optionalEncodings: ['x'],
      supportedDataTypes: ['quantitative', 'temporal']
    },
    defaults: {
      encoding: {
        text: { type: 'quantitative', aggregate: 'sum' },
        x: { type: 'temporal' }
      },
      style: {
        theme: 'default'
      },
      interactions: {
        selection: { type: 'single', on: 'click' },
        hover: { tooltip: true }
      }
    }
  },

  // Table
  {
    type: 'table.basic',
    name: 'Data Table',
    description: 'Display data in rows and columns with sorting and filtering',
    category: 'table',
    component: TableChart,
    icon: '📋',
    requirements: {
      minFields: 1,
      requiredEncodings: [],
      optionalEncodings: [],
      supportedDataTypes: ['nominal', 'ordinal', 'quantitative', 'temporal']
    },
    defaults: {
      encoding: {},
      style: {
        theme: 'default'
      },
      interactions: {
        selection: { type: 'multi', on: 'click' },
        hover: { tooltip: false, highlight: true }
      }
    },
    recommender: (data) => {
      // Tables work with any data
      return { recommended: true, score: 60, reason: 'Universal data display option' };
    }
  }
];

/**
 * Initialize and register all chart components
 */
export function initializeChartComponents(): void {
  console.log('📊 Initializing Scout Dash 2.0 chart components...');
  
  chartRegistrations.forEach(registration => {
    visualRegistry.register(registration);
  });
  
  console.log(`✅ Registered ${chartRegistrations.length} basic chart components`);
  console.log('🔧 Advanced charts auto-initialized from advanced module');
}

/**
 * Get all available chart types
 */
export function getAvailableChartTypes() {
  return chartRegistrations.map(reg => ({
    type: reg.type,
    name: reg.name,
    description: reg.description,
    category: reg.category,
    icon: reg.icon
  }));
}

/**
 * Create a chart component with BaseVisual wrapper
 */
export function createChart(type: string, props: any) {
  const registration = visualRegistry.get(type as any);
  if (!registration) {
    throw new Error(`Unknown chart type: ${type}`);
  }
  
  const ChartComponent = registration.component;
  
  // Return wrapped component
  return function WrappedChart(wrapperProps: any) {
    return React.createElement(BaseVisual, wrapperProps, 
      React.createElement(ChartComponent, { ...props, ...wrapperProps })
    );
  };
}

// Auto-initialize when module is imported
initializeChartComponents();