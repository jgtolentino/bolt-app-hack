/**
 * Scout CLI - Blueprint Schema v3.0
 * Zod validation schema for dashboard blueprints with backward compatibility
 */

import { z } from 'zod';

// Base types
export const ScoutVisualTypeSchema = z.enum([
  'bar.vertical',
  'bar.horizontal', 
  'bar.stacked',
  'line.basic',
  'line.area',
  'line.multi',
  'pie.basic',
  'pie.donut',
  'scatter.basic',
  'scatter.bubble',
  'table.basic',
  'table.pivot',
  'kpi.card',
  'kpi.gauge',
  'kpi.trend',
  'map.choropleth',
  'map.scatter',
  'heatmap.basic',
  'custom'
]).or(z.string().regex(/^plugin:/, 'Plugin visual types must start with "plugin:"'));

export const DataSourceTypeSchema = z.enum(['dal', 'static', 'computed', 'supabase', 'sqlite', 'mock']);

export const FilterComponentSchema = z.enum(['select', 'multiselect', 'range', 'daterange', 'text', 'checkbox']);

export const LayoutTypeSchema = z.enum(['grid', 'freeform', 'responsive']);

export const ThemeSchema = z.enum(['light', 'dark', 'auto', 'default', 'minimal', 'colorful']);

export const TargetSchema = z.enum(['desktop', 'web', 'both']);

export const ChannelSchema = z.enum(['stable', 'beta', 'alpha', 'dev']);

// Chart configuration
export const ChartConfigSchema = z.object({
  id: z.string(),
  type: ScoutVisualTypeSchema,
  title: z.string().optional(),
  description: z.string().optional(),
  query: z.string(),
  
  // Layout positioning (grid units)
  position: z.object({
    x: z.number().min(0).default(0),
    y: z.number().min(0).default(0),
    w: z.number().min(1).max(12).default(6),
    h: z.number().min(1).default(4)
  }).optional(),
  
  // Visual encoding (optional, auto-detected if not specified)
  encoding: z.object({
    x: z.object({
      field: z.string(),
      type: z.enum(['nominal', 'ordinal', 'quantitative', 'temporal']),
      aggregate: z.enum(['sum', 'avg', 'count', 'min', 'max']).optional(),
      format: z.string().optional()
    }).optional(),
    y: z.object({
      field: z.string(),
      type: z.enum(['nominal', 'ordinal', 'quantitative', 'temporal']),
      aggregate: z.enum(['sum', 'avg', 'count', 'min', 'max']).optional(),
      format: z.string().optional()
    }).optional(),
    color: z.object({
      field: z.string(),
      type: z.enum(['nominal', 'ordinal', 'quantitative', 'temporal'])
    }).optional(),
    size: z.object({
      field: z.string(),
      type: z.enum(['quantitative'])
    }).optional(),
    text: z.object({
      field: z.string(),
      type: z.enum(['quantitative', 'nominal']),
      aggregate: z.enum(['sum', 'avg', 'count', 'min', 'max']).optional(),
      format: z.string().optional()
    }).optional()
  }).optional(),
  
  // Style configuration
  style: z.object({
    theme: ThemeSchema.optional(),
    colors: z.array(z.string()).optional(),
    showGrid: z.boolean().optional(),
    showLegend: z.boolean().optional(),
    showTooltip: z.boolean().optional()
  }).optional(),
  
  // Plugin-specific configuration
  plugin: z.object({
    name: z.string(),
    version: z.string().optional(),
    config: z.record(z.any()).optional()
  }).optional(),
  
  // Refresh configuration
  refresh: z.object({
    enabled: z.boolean().default(false),
    interval: z.number().min(1000).optional() // milliseconds
  }).optional()
});

// Filter configuration
export const FilterConfigSchema = z.object({
  id: z.string(),
  field: z.string(),
  component: FilterComponentSchema,
  label: z.string().optional(),
  defaultValue: z.any().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.any()
  })).optional(),
  required: z.boolean().default(false),
  
  // UI configuration
  position: z.enum(['top', 'left', 'right', 'floating']).default('top'),
  width: z.number().optional(),
  collapsed: z.boolean().default(false)
});

// Dashboard blueprint schema (v3.0)
export const DashboardBlueprintSchema = z.object({
  // Metadata
  version: z.string().default('3.0'),
  title: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
  
  // Layout configuration
  layout: LayoutTypeSchema.default('grid'),
  columns: z.number().min(1).max(24).default(12),
  rowHeight: z.number().min(50).default(100),
  margin: z.tuple([z.number(), z.number()]).default([10, 10]),
  padding: z.tuple([z.number(), z.number()]).default([20, 20]),
  
  // Data source configuration
  datasource: z.union([
    z.string(), // Simple string for backward compatibility
    z.object({
      type: DataSourceTypeSchema,
      connection: z.string(),
      schema: z.string().optional(),
      cache: z.boolean().default(true)
    })
  ]),
  
  // Charts/visuals
  charts: z.array(ChartConfigSchema).min(1),
  
  // Global filters
  filters: z.array(FilterConfigSchema).default([]),
  
  // Dashboard settings
  settings: z.object({
    theme: ThemeSchema.default('light'),
    refreshInterval: z.number().min(0).optional(), // Global auto-refresh in ms
    showTitle: z.boolean().default(true),
    showFilters: z.boolean().default(true),
    allowExport: z.boolean().default(true),
    allowEdit: z.boolean().default(false),
    responsive: z.boolean().default(true)
  }).default({}),
  
  // Plugin requirements (auto-detected from chart types)
  plugins: z.array(z.object({
    name: z.string(),
    version: z.string().optional(),
    required: z.boolean().default(true),
    source: z.string().optional() // Marketplace URL or git repo
  })).default([]),
  
  // Connector requirements (auto-detected from datasource)
  connectors: z.array(z.object({
    name: z.string(),
    version: z.string().optional(),
    config: z.record(z.any()).optional()
  })).default([]),
  
  // Deployment configuration
  deployment: z.object({
    target: z.array(TargetSchema).default(['desktop', 'web']),
    environments: z.record(z.object({
      datasource: z.string(),
      variables: z.record(z.string()).optional()
    })).optional(),
    
    // Publishing configuration
    publish: z.object({
      channel: ChannelSchema.default('stable'),
      visibility: z.enum(['public', 'private', 'team']).default('private'),
      category: z.string().optional(),
      keywords: z.array(z.string()).default([]),
      license: z.string().default('MIT'),
      pricing: z.object({
        type: z.enum(['free', 'paid', 'subscription']).default('free'),
        amount: z.number().optional(),
        currency: z.string().default('USD')
      }).optional()
    }).optional()
  }).default({}),
  
  // Backward compatibility fields (Dash 2.0)
  id: z.string().optional(),
  name: z.string().optional(),
  visuals: z.array(z.any()).optional() // Will be migrated to charts
});

export type DashboardBlueprint = z.infer<typeof DashboardBlueprintSchema>;
export type ChartConfig = z.infer<typeof ChartConfigSchema>;
export type FilterConfig = z.infer<typeof FilterConfigSchema>;

// Validation helper
export function validateBlueprint(data: unknown): {
  success: boolean;
  data?: DashboardBlueprint;
  errors?: string[];
} {
  try {
    const result = DashboardBlueprintSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    };
  }
}

// Migration helper for Dash 2.0 blueprints
export function migrateDash2Blueprint(oldBlueprint: any): DashboardBlueprint {
  const migrated: any = {
    version: '3.0',
    title: oldBlueprint.name || oldBlueprint.title || 'Migrated Dashboard',
    description: oldBlueprint.description,
    layout: oldBlueprint.layout?.type || 'grid',
    columns: oldBlueprint.layout?.columns || 12,
    rowHeight: oldBlueprint.layout?.rowHeight || 100,
    margin: oldBlueprint.layout?.margin || [10, 10],
    padding: oldBlueprint.layout?.padding || [20, 20],
    datasource: 'dal', // Default for migrated dashboards
    charts: [],
    filters: oldBlueprint.filters || [],
    settings: oldBlueprint.settings || {}
  };
  
  // Migrate visuals to charts
  if (oldBlueprint.visuals) {
    migrated.charts = oldBlueprint.visuals.map((visual: any) => ({
      id: visual.id,
      type: visual.type,
      title: visual.title,
      query: generateQueryFromVisual(visual),
      position: {
        x: visual.layout?.x || 0,
        y: visual.layout?.y || 0,
        w: visual.layout?.w || 6,
        h: visual.layout?.h || 4
      },
      encoding: visual.encoding,
      style: visual.style
    }));
  }
  
  return DashboardBlueprintSchema.parse(migrated);
}

function generateQueryFromVisual(visual: any): string {
  // Simple query generation for migration
  const fields = [];
  
  if (visual.encoding?.x?.field) fields.push(visual.encoding.x.field);
  if (visual.encoding?.y?.field) fields.push(visual.encoding.y.field);
  if (visual.encoding?.color?.field) fields.push(visual.encoding.color.field);
  if (visual.encoding?.text?.field) fields.push(visual.encoding.text.field);
  
  const selectClause = fields.length > 0 ? fields.join(', ') : '*';
  const fromClause = visual.data?.query?.from || 'data';
  
  return `SELECT ${selectClause} FROM ${fromClause}`;
}

export default DashboardBlueprintSchema;