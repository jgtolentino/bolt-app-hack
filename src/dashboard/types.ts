/**
 * Scout Dash 2.0 - Core Dashboard Types
 * Type definitions for dashboard framework, visual blueprints, and layouts
 */

// Visual Blueprint Types (evolved from importer system)
export interface VisualBlueprint {
  id: string;
  type: ScoutVisualType;
  title: string;
  description?: string;
  
  // Layout positioning
  layout: {
    x: number;
    y: number;
    w: number; // Grid units (1-12)
    h: number; // Grid units
  };
  
  // Data configuration
  data: {
    source: DataSource;
    query: QuerySpec;
    refresh?: RefreshConfig;
  };
  
  // Visual encoding
  encoding: VisualEncoding;
  
  // Styling and appearance
  style: VisualStyle;
  
  // Interaction configuration
  interactions?: InteractionConfig;
  
  // Plugin metadata (Dash 3.0 prep)
  plugin?: {
    name: string;
    version: string;
    config?: Record<string, any>;
  };
}

export type ScoutVisualType = 
  | 'bar.vertical'
  | 'bar.horizontal' 
  | 'bar.stacked'
  | 'line.basic'
  | 'line.area'
  | 'line.multi'
  | 'pie.basic'
  | 'pie.donut'
  | 'scatter.basic'
  | 'scatter.bubble'
  | 'table.basic'
  | 'table.pivot'
  | 'kpi.card'
  | 'kpi.gauge'
  | 'kpi.trend'
  | 'map.choropleth'
  | 'map.scatter'
  | 'heatmap.basic'
  | 'custom'; // For plugin visuals

// Data Source Configuration
export interface DataSource {
  type: 'dal' | 'static' | 'computed';
  connector?: string; // DAL connector ID
  table?: string;
  cache?: boolean;
}

export interface QuerySpec {
  select: string[];
  from: string;
  where?: FilterSpec[];
  groupBy?: string[];
  orderBy?: OrderSpec[];
  limit?: number;
  
  // Computed fields
  computed?: ComputedField[];
  
  // Aggregations
  aggregations?: AggregationSpec[];
}

export interface FilterSpec {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'between';
  value: any;
  label?: string; // Display name for UI
}

export interface OrderSpec {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ComputedField {
  name: string;
  expression: string; // SQL expression or JS function
  type: 'sql' | 'javascript';
  dataType: 'string' | 'number' | 'date' | 'boolean';
}

export interface AggregationSpec {
  field: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinctCount';
  alias?: string;
}

export interface RefreshConfig {
  enabled: boolean;
  interval: number; // milliseconds
  conditions?: string[]; // Conditional refresh triggers
}

// Visual Encoding (inspired by Vega-Lite)
export interface VisualEncoding {
  x?: FieldEncoding;
  y?: FieldEncoding;
  color?: FieldEncoding;
  size?: FieldEncoding;
  opacity?: FieldEncoding;
  shape?: FieldEncoding;
  text?: FieldEncoding;
  tooltip?: FieldEncoding[];
  
  // Chart-specific encodings
  angle?: FieldEncoding; // For pie charts
  radius?: FieldEncoding; // For polar charts
  latitude?: FieldEncoding; // For maps
  longitude?: FieldEncoding; // For maps
}

export interface FieldEncoding {
  field: string;
  type: 'nominal' | 'ordinal' | 'quantitative' | 'temporal';
  scale?: ScaleConfig;
  axis?: AxisConfig;
  legend?: LegendConfig;
  format?: string; // Display format
  aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface ScaleConfig {
  type?: 'linear' | 'log' | 'pow' | 'sqrt' | 'time' | 'band' | 'point';
  domain?: any[];
  range?: any[];
  nice?: boolean;
  zero?: boolean;
}

export interface AxisConfig {
  title?: string;
  labelAngle?: number;
  labelLimit?: number;
  grid?: boolean;
  ticks?: boolean;
  format?: string;
}

export interface LegendConfig {
  title?: string;
  orient?: 'left' | 'right' | 'top' | 'bottom';
  symbolType?: string;
  values?: any[];
}

// Visual Styling
export interface VisualStyle {
  theme?: 'default' | 'dark' | 'minimal' | 'colorful';
  colors?: ColorScheme;
  fonts?: FontConfig;
  spacing?: SpacingConfig;
  borders?: BorderConfig;
  background?: string;
  
  // Chart-specific styling
  chartStyle?: {
    showGrid?: boolean;
    showLegend?: boolean;
    showTooltip?: boolean;
    strokeWidth?: number;
    pointSize?: number;
    cornerRadius?: number;
  };
}

export interface ColorScheme {
  primary: string[];
  secondary?: string[];
  diverging?: string[];
  categorical?: string[];
  sequential?: string[];
}

export interface FontConfig {
  family?: string;
  sizes?: {
    title?: number;
    subtitle?: number;
    axis?: number;
    label?: number;
    legend?: number;
  };
  weights?: {
    title?: number;
    subtitle?: number;
    normal?: number;
  };
}

export interface SpacingConfig {
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export interface BorderConfig {
  width?: number;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  radius?: number;
}

// Interaction Configuration
export interface InteractionConfig {
  selection?: SelectionConfig;
  hover?: HoverConfig;
  click?: ClickConfig;
  brush?: BrushConfig;
  zoom?: ZoomConfig;
  crossFilter?: CrossFilterConfig;
}

export interface SelectionConfig {
  type: 'single' | 'multi';
  fields?: string[];
  on?: 'click' | 'mouseover';
  clear?: string; // Event that clears selection
}

export interface HoverConfig {
  tooltip?: boolean;
  highlight?: boolean;
  style?: Partial<VisualStyle>;
}

export interface ClickConfig {
  action: 'filter' | 'drill' | 'navigate' | 'custom';
  target?: string; // Target visual or dashboard
  params?: Record<string, any>;
}

export interface BrushConfig {
  enabled: boolean;
  axes?: ('x' | 'y')[];
  action?: 'filter' | 'zoom';
}

export interface ZoomConfig {
  enabled: boolean;
  type?: 'wheel' | 'drag' | 'both';
  extent?: [number, number]; // Min/max zoom levels
}

export interface CrossFilterConfig {
  enabled: boolean;
  targets?: string[]; // Visual IDs to cross-filter
  bidirectional?: boolean;
}

// Dashboard Layout Types
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  
  // Layout configuration (single layout for simple cases)
  layout?: DashboardLayout;
  
  // Responsive layouts (for responsive dashboards)
  layouts?: ResponsiveLayouts;
  
  // Visual components
  visuals: VisualBlueprint[];
  
  // Global filters
  filters: GlobalFilterConfig[];
  
  // Dashboard-level settings
  settings: DashboardSettings;
  
  // Metadata
  metadata: DashboardMetadata;
  
  // Modification tracking
  lastModified?: string;
}

export interface DashboardLayout {
  columns: number; // Grid columns (typically 12)
  rowHeight: number; // Grid row height in pixels
  margin: [number, number]; // [x, y] margins
  padding: [number, number]; // [x, y] padding
}

export interface ResponsiveLayouts {
  xs: DashboardLayout;  // < 576px
  sm: DashboardLayout;  // >= 576px
  md: DashboardLayout;  // >= 768px
  lg: DashboardLayout;  // >= 1024px
  xl: DashboardLayout;  // >= 1400px
}

export interface GlobalFilterConfig {
  id: string;
  name: string;
  field: string;
  type: 'select' | 'multiselect' | 'range' | 'date' | 'text';
  options?: FilterOption[];
  defaultValue?: any;
  required?: boolean;
  
  // UI configuration
  ui: {
    position: 'top' | 'left' | 'right' | 'floating';
    width?: number;
    collapsed?: boolean;
  };
}

export interface FilterOption {
  label: string;
  value: any;
  icon?: string;
  color?: string;
}

export interface DashboardSettings {
  theme: 'light' | 'dark' | 'auto';
  refreshInterval?: number; // Auto-refresh in milliseconds
  showTitle: boolean;
  showFilters: boolean;
  allowExport: boolean;
  allowEdit: boolean;
  
  // Performance settings
  caching: {
    enabled: boolean;
    ttl: number; // Cache TTL in seconds
    strategy: 'memory' | 'disk' | 'hybrid';
  };
  
  // Collaboration settings
  sharing: {
    public: boolean;
    allowComments: boolean;
    allowAnnotations: boolean;
  };
}

export interface DashboardMetadata {
  version: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  tags: string[];
  category?: string;
  
  // Usage analytics
  analytics?: {
    views: number;
    lastViewed: Date;
    avgSessionTime: number;
  };
  
  // Import source (for migrated dashboards)
  importSource?: {
    type: 'powerbi' | 'tableau' | 'manual';
    originalFile?: string;
    importedAt: Date;
  };
}

// Data Processing Types
export interface DataSet {
  id: string;
  name: string;
  schema: DataSchema;
  data: any[];
  metadata: DataSetMetadata;
}

export interface DataSchema {
  columns: ColumnSchema[];
  primaryKey?: string;
  indexes?: string[][];
  relationships?: RelationshipSchema[];
}

export interface ColumnSchema {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'json';
  nullable: boolean;
  unique?: boolean;
  description?: string;
  format?: string; // Display format
  
  // Statistics for optimization
  stats?: {
    distinctCount: number;
    nullCount: number;
    min?: any;
    max?: any;
    avg?: number;
  };
}

export interface RelationshipSchema {
  from: string; // Column name
  to: string; // Table.column
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface DataSetMetadata {
  source: string;
  lastUpdated: Date;
  rowCount: number;
  size: number; // Bytes
  quality: DataQualityInfo;
}

export interface DataQualityInfo {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  consistency: number; // 0-1
  issues: DataQualityIssue[];
}

export interface DataQualityIssue {
  type: 'missing' | 'invalid' | 'duplicate' | 'inconsistent';
  field: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// Event Types (for interactions and updates)
export interface DashboardEvent {
  type: string;
  source: string; // Visual ID or 'dashboard'
  target?: string; // Target visual ID
  data: any;
  timestamp: Date;
}

export interface FilterChangeEvent extends DashboardEvent {
  type: 'filter:change';
  data: {
    filterId: string;
    field: string;
    value: any;
    operator: string;
  };
}

export interface SelectionChangeEvent extends DashboardEvent {
  type: 'selection:change';
  data: {
    selected: any[];
    field: string;
  };
}

export interface DataUpdateEvent extends DashboardEvent {
  type: 'data:update';
  data: {
    datasetId: string;
    changeType: 'insert' | 'update' | 'delete' | 'refresh';
    affectedRows: number;
  };
}

// Plugin System Types (Dash 3.0 preparation)
export interface PluginManifest {
  name: string;
  version: string;
  displayName: string;
  description: string;
  author: string;
  
  type: 'visual' | 'connector' | 'transform' | 'insight';
  entry: string; // Entry point file
  
  permissions: PluginPermissions;
  dependencies?: string[];
  
  // Visual plugin specific
  visualConfig?: {
    supportedEncodings: string[];
    requiredFields: number;
    maxFields?: number;
    category: string;
  };
  
  // Connector plugin specific
  connectorConfig?: {
    protocol: string;
    authentication: string[];
    capabilities: string[];
  };
}

export interface PluginPermissions {
  network: string[]; // Allowed domains
  storage: boolean; // Local storage access
  clipboard: boolean; // Clipboard access
  fileSystem: boolean; // File system access
}

// Export/Import Types
export interface DashboardExport {
  format: 'json' | 'pdf' | 'png' | 'svg' | 'csv' | 'excel';
  options: ExportOptions;
}

export interface ExportOptions {
  includeData?: boolean;
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  quality?: 'low' | 'medium' | 'high';
  dateRange?: {
    start: Date;
    end: Date;
  };
}