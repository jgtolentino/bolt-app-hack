/**
 * Scout Dash 2.0 - Usage Example
 * Demonstrates how to use the dashboard framework with chart components
 */

import React, { useEffect, useState } from 'react';
import { 
  DashboardEngine, 
  Dashboard, 
  VisualBlueprint,
  visualRegistry,
  initializeDashboardFramework,
  BarChart,
  LineChart,
  KPICard,
  TableChart,
  BaseVisual
} from './index';

// Initialize the framework
initializeDashboardFramework();

// Sample data
const sampleData = [
  { month: 'Jan', sales: 12500, region: 'North', product: 'Widget A' },
  { month: 'Feb', sales: 15000, region: 'North', product: 'Widget A' },
  { month: 'Mar', sales: 18000, region: 'South', product: 'Widget B' },
  { month: 'Apr', sales: 16500, region: 'East', product: 'Widget A' },
  { month: 'May', sales: 21000, region: 'West', product: 'Widget C' },
  { month: 'Jun', sales: 19500, region: 'North', product: 'Widget B' }
];

// Create sample dashboard configuration
const sampleDashboard: Dashboard = {
  id: 'sample-dashboard',
  name: 'Sales Performance Dashboard',
  description: 'Example dashboard showing sales data across regions and time',
  
  layout: {
    type: 'grid',
    columns: 12,
    rowHeight: 100,
    margin: [10, 10],
    padding: [20, 20]
  },
  
  visuals: [
    // KPI Card
    {
      id: 'kpi-total-sales',
      type: 'kpi.card',
      title: 'Total Sales',
      layout: { x: 0, y: 0, w: 3, h: 2 },
      data: {
        source: { type: 'static' },
        query: { select: ['sales'], from: 'sales_data' }
      },
      encoding: {
        text: { field: 'sales', type: 'quantitative', aggregate: 'sum', format: 'currency' }
      },
      style: { theme: 'default' },
      interactions: {
        hover: { tooltip: true }
      }
    },
    
    // Bar Chart
    {
      id: 'bar-sales-by-region',
      type: 'bar.vertical',
      title: 'Sales by Region',
      layout: { x: 3, y: 0, w: 4, h: 4 },
      data: {
        source: { type: 'static' },
        query: { select: ['region', 'sales'], from: 'sales_data' }
      },
      encoding: {
        x: { field: 'region', type: 'nominal' },
        y: { field: 'sales', type: 'quantitative', aggregate: 'sum' }
      },
      style: {
        chartStyle: { showGrid: true, showTooltip: true }
      },
      interactions: {
        selection: { type: 'single' },
        hover: { tooltip: true, highlight: true },
        crossFilter: { enabled: true }
      }
    },
    
    // Line Chart
    {
      id: 'line-sales-trend',
      type: 'line.basic',
      title: 'Sales Trend',
      layout: { x: 7, y: 0, w: 5, h: 4 },
      data: {
        source: { type: 'static' },
        query: { select: ['month', 'sales'], from: 'sales_data' }
      },
      encoding: {
        x: { field: 'month', type: 'ordinal' },
        y: { field: 'sales', type: 'quantitative' }
      },
      style: {
        chartStyle: { showGrid: true, strokeWidth: 3, pointSize: 4 }
      },
      interactions: {
        selection: { type: 'single' },
        hover: { tooltip: true }
      }
    },
    
    // Data Table
    {
      id: 'table-detailed-data',
      type: 'table.basic',
      title: 'Detailed Sales Data',
      layout: { x: 0, y: 4, w: 12, h: 4 },
      data: {
        source: { type: 'static' },
        query: { select: ['month', 'sales', 'region', 'product'], from: 'sales_data' }
      },
      encoding: {},
      style: { theme: 'default' },
      interactions: {
        selection: { type: 'multi' },
        hover: { highlight: true }
      }
    }
  ],
  
  filters: [],
  
  settings: {
    theme: 'light',
    showTitle: true,
    showFilters: false,
    allowExport: true,
    allowEdit: false,
    caching: {
      enabled: true,
      ttl: 300,
      strategy: 'memory'
    },
    sharing: {
      public: false,
      allowComments: false,
      allowAnnotations: false
    }
  },
  
  metadata: {
    version: '2.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'demo-user',
    updatedBy: 'demo-user',
    tags: ['sales', 'demo', 'example']
  }
};

/**
 * Example React component using the dashboard framework
 */
export const DashboardExample: React.FC = () => {
  const [dashboardEngine, setDashboardEngine] = useState<DashboardEngine | null>(null);
  const [visualData, setVisualData] = useState<Record<string, any[]>>({});

  useEffect(() => {
    // Initialize dashboard engine
    const engine = new DashboardEngine(sampleDashboard);
    
    // Mock data loading since we don't have real DAL connection
    const mockData = {
      'kpi-total-sales': sampleData,
      'bar-sales-by-region': sampleData,
      'line-sales-trend': sampleData,
      'table-detailed-data': sampleData
    };
    
    setVisualData(mockData);
    setDashboardEngine(engine);
    
    // Listen for dashboard events
    engine.on('dashboard:ready', (dashboard) => {
      console.log('Dashboard ready:', dashboard.name);
    });
    
    engine.on('visual:data:loaded', (event) => {
      console.log('Visual data loaded:', event.visualId);
    });
    
    engine.on('dashboard:selection:change', (event) => {
      console.log('Selection changed:', event);
    });
    
    return () => {
      engine.destroy();
    };
  }, []);

  const handleVisualSelection = (visualId: string, field: string, selected: any[]) => {
    if (dashboardEngine) {
      dashboardEngine.setVisualSelection(visualId, field, selected);
    }
  };

  const handleVisualHover = (visualId: string, data: any) => {
    console.log(`Hover on ${visualId}:`, data);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Scout Dash 2.0 - Example Dashboard
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-12 gap-4 auto-rows-[100px]">
            {sampleDashboard.visuals.map((visual) => {
              const data = visualData[visual.id] || [];
              const VisualComponent = visualRegistry.getComponent(visual.type);
              
              if (!VisualComponent) {
                return (
                  <div
                    key={visual.id}
                    className="border border-red-200 bg-red-50 flex items-center justify-center text-red-600 text-sm rounded-md"
                    style={{
                      gridColumn: `span ${visual.layout.w}`,
                      gridRow: `span ${visual.layout.h}`
                    }}
                  >
                    Unknown visual type: {visual.type}
                  </div>
                );
              }
              
              return (
                <div
                  key={visual.id}
                  className="border border-gray-200 rounded-md overflow-hidden"
                  style={{
                    gridColumn: `span ${visual.layout.w}`,
                    gridRow: `span ${visual.layout.h}`
                  }}
                >
                  <BaseVisual
                    blueprint={visual}
                    data={data}
                    width={visual.layout.w * 80 - 20} // Approximate sizing
                    height={visual.layout.h * 100 - 20}
                    onSelection={(field, selected) => handleVisualSelection(visual.id, field, selected)}
                    onHover={(data) => handleVisualHover(visual.id, data)}
                    theme="light"
                    showToolbar={true}
                    showTitle={true}
                    interactive={true}
                  >
                    <VisualComponent />
                  </BaseVisual>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Debug info */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium">Available Visual Types:</h4>
              <ul className="mt-1 space-y-1">
                {visualRegistry.getAll().map(reg => (
                  <li key={reg.type} className="text-gray-600">
                    {reg.name} ({reg.type})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Sample Data:</h4>
              <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                {JSON.stringify(sampleData.slice(0, 2), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardExample;