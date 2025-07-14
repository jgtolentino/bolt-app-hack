/**
 * Blueprint Builder
 * Maps BI visual specifications to Scout's internal visual blueprint format
 */

import { 
  VisualBlueprint, 
  ScoutVisualType, 
  VisualTypeMapping,
  FilterSpec,
  AggregationSpec 
} from '../types';

export class BlueprintBuilder {
  private static readonly POWERBI_MAPPINGS: VisualTypeMapping = {
    'clusteredColumnChart': {
      scoutType: 'bar.vertical.clustered',
      requirements: { minColumns: 2 }
    },
    'stackedColumnChart': {
      scoutType: 'bar.vertical.stacked',
      requirements: { minColumns: 2 }
    },
    'clusteredBarChart': {
      scoutType: 'bar.horizontal.clustered',
      requirements: { minColumns: 2 }
    },
    'stackedBarChart': {
      scoutType: 'bar.horizontal.stacked',
      requirements: { minColumns: 2 }
    },
    'lineChart': {
      scoutType: 'line.basic',
      requirements: { minColumns: 2 }
    },
    'areaChart': {
      scoutType: 'line.area',
      requirements: { minColumns: 2 }
    },
    'pieChart': {
      scoutType: 'pie.basic',
      requirements: { minColumns: 2, maxColumns: 2 }
    },
    'donutChart': {
      scoutType: 'pie.basic',
      requirements: { minColumns: 2, maxColumns: 2 }
    },
    'scatterChart': {
      scoutType: 'scatter.basic',
      requirements: { minColumns: 2 }
    },
    'table': {
      scoutType: 'table.basic'
    },
    'matrix': {
      scoutType: 'table.basic'
    },
    'card': {
      scoutType: 'kpi.card',
      requirements: { minColumns: 1, maxColumns: 1 }
    },
    'multiRowCard': {
      scoutType: 'kpi.card'
    },
    'gauge': {
      scoutType: 'kpi.gauge',
      requirements: { minColumns: 1, maxColumns: 3 }
    },
    'filledMap': {
      scoutType: 'map.choropleth',
      requirements: { minColumns: 2 }
    },
    'shape': {
      scoutType: 'unsupported'
    },
    'textbox': {
      scoutType: 'unsupported'
    }
  };

  private static readonly TABLEAU_MAPPINGS: VisualTypeMapping = {
    'bar': {
      scoutType: 'bar.vertical.clustered',
      requirements: { minColumns: 2 }
    },
    'line': {
      scoutType: 'line.basic',
      requirements: { minColumns: 2 }
    },
    'area': {
      scoutType: 'line.area',
      requirements: { minColumns: 2 }
    },
    'circle': {
      scoutType: 'scatter.basic',
      requirements: { minColumns: 2 }
    },
    'pie': {
      scoutType: 'pie.basic',
      requirements: { minColumns: 2 }
    },
    'text': {
      scoutType: 'table.basic'
    },
    'map': {
      scoutType: 'map.choropleth',
      requirements: { minColumns: 2 }
    },
    'polygon': {
      scoutType: 'map.choropleth',
      requirements: { minColumns: 2 }
    }
  };

  /**
   * Create visual blueprint from PowerBI visual configuration
   */
  static fromPowerBI(visualConfig: any): VisualBlueprint {
    const visualType = visualConfig.singleVisual?.visualType || 'unknown';
    const mapping = this.POWERBI_MAPPINGS[visualType];
    
    const blueprint: VisualBlueprint = {
      id: this.generateId(),
      name: visualConfig.displayName || `PowerBI ${visualType}`,
      type: mapping?.scoutType || 'unsupported',
      position: this.extractPowerBIPosition(visualConfig),
      dataSource: this.extractPowerBIDataSource(visualConfig),
      styling: this.extractPowerBIStyling(visualConfig),
      originalFormat: {
        type: 'powerbi',
        visualType,
        config: visualConfig
      }
    };

    // Add fallback image for unsupported visuals
    if (blueprint.type === 'unsupported' && visualConfig.image) {
      blueprint.fallbackImage = visualConfig.image;
    }

    return blueprint;
  }

  /**
   * Create visual blueprint from Tableau visual configuration
   */
  static fromTableau(worksheetConfig: any): VisualBlueprint {
    const viewType = worksheetConfig.view?.type || 'unknown';
    const mapping = this.TABLEAU_MAPPINGS[viewType];
    
    const blueprint: VisualBlueprint = {
      id: this.generateId(),
      name: worksheetConfig.name || `Tableau ${viewType}`,
      type: mapping?.scoutType || 'unsupported',
      position: this.extractTableauPosition(worksheetConfig),
      dataSource: this.extractTableauDataSource(worksheetConfig),
      styling: this.extractTableauStyling(worksheetConfig),
      originalFormat: {
        type: 'tableau',
        visualType: viewType,
        config: worksheetConfig
      }
    };

    return blueprint;
  }

  /**
   * Create multiple blueprints from dashboard layout
   */
  static fromDashboard(
    dashboardConfig: any,
    visualConfigs: any[],
    sourceType: 'powerbi' | 'tableau'
  ): VisualBlueprint[] {
    const blueprints: VisualBlueprint[] = [];

    if (sourceType === 'powerbi') {
      // PowerBI Report Layout
      const sections = dashboardConfig.sections || [];
      
      sections.forEach((section: any) => {
        section.visualContainers?.forEach((container: any) => {
          const blueprint = this.fromPowerBI(container);
          blueprints.push(blueprint);
        });
      });
    } else if (sourceType === 'tableau') {
      // Tableau Dashboard Zones
      const zones = dashboardConfig.zones || [];
      
      zones.forEach((zone: any) => {
        if (zone.type === 'worksheet') {
          const worksheetConfig = visualConfigs.find(v => v.name === zone.name);
          if (worksheetConfig) {
            const blueprint = this.fromTableau(worksheetConfig);
            // Override position from dashboard zone
            blueprint.position = {
              x: zone.x || 0,
              y: zone.y || 0,
              width: zone.w || 400,
              height: zone.h || 300
            };
            blueprints.push(blueprint);
          }
        }
      });
    }

    return blueprints;
  }

  // PowerBI extraction methods
  private static extractPowerBIPosition(config: any): VisualBlueprint['position'] {
    const pos = config.position || {};
    return {
      x: pos.x || 0,
      y: pos.y || 0,
      width: pos.width || 400,
      height: pos.height || 300
    };
  }

  private static extractPowerBIDataSource(config: any): VisualBlueprint['dataSource'] {
    const query = config.query || {};
    const select = query.Select || [];
    
    return {
      table: this.extractTableName(select[0]?.Name || 'unknown'),
      columns: select.map((s: any) => s.Name || s.Property || 'unknown'),
      filters: this.convertPowerBIFilters(query.Where || []),
      aggregations: this.convertPowerBIAggregations(select)
    };
  }

  private static extractPowerBIStyling(config: any): VisualBlueprint['styling'] {
    const styling = config.singleVisual?.objects || {};
    
    return {
      title: styling.general?.title?.text,
      showLegend: styling.legend?.show !== false,
      showAxes: styling.categoryAxis?.show !== false && styling.valueAxis?.show !== false,
      colors: this.extractPowerBIColors(styling)
    };
  }

  private static extractPowerBIColors(styling: any): string[] {
    const colors: string[] = [];
    
    // Extract from data colors
    if (styling.dataColors) {
      Object.values(styling.dataColors).forEach((color: any) => {
        if (color.solid?.color) {
          colors.push(color.solid.color);
        }
      });
    }

    return colors.length > 0 ? colors : undefined;
  }

  // Tableau extraction methods
  private static extractTableauPosition(config: any): VisualBlueprint['position'] {
    // Tableau positions are often in dashboard zones
    return {
      x: 0,
      y: 0,
      width: 400,
      height: 300
    };
  }

  private static extractTableauDataSource(config: any): VisualBlueprint['dataSource'] {
    const view = config.view || {};
    const marks = view.marks || [];
    
    const columns = marks.map((mark: any) => {
      return Object.values(mark.encoding || {}).map((enc: any) => enc.field);
    }).flat().filter(Boolean);

    return {
      table: view.datasource || 'unknown',
      columns: Array.from(new Set(columns)),
      filters: this.convertTableauFilters(view.filters || []),
      aggregations: this.convertTableauAggregations(marks)
    };
  }

  private static extractTableauStyling(config: any): VisualBlueprint['styling'] {
    const view = config.view || {};
    
    return {
      title: config.name,
      showLegend: true, // Tableau defaults
      showAxes: true
    };
  }

  // Filter conversion methods
  private static convertPowerBIFilters(whereClause: any[]): FilterSpec[] {
    return whereClause.map(filter => ({
      column: filter.Target?.Column || 'unknown',
      operator: this.mapPowerBIOperator(filter.Condition?.Comparison),
      value: filter.Condition?.Value
    }));
  }

  private static convertTableauFilters(filters: any[]): FilterSpec[] {
    return filters.map(filter => ({
      column: filter.field || 'unknown',
      operator: this.mapTableauOperator(filter.type),
      value: filter.values?.[0]
    }));
  }

  // Aggregation conversion methods
  private static convertPowerBIAggregations(select: any[]): AggregationSpec[] {
    return select
      .filter(s => s.Aggregation)
      .map(s => ({
        column: s.Name || s.Property || 'unknown',
        function: this.mapPowerBIAggregation(s.Aggregation),
        alias: s.Name
      }));
  }

  private static convertTableauAggregations(marks: any[]): AggregationSpec[] {
    const aggregations: AggregationSpec[] = [];
    
    marks.forEach(mark => {
      Object.values(mark.encoding || {}).forEach((enc: any) => {
        if (enc.aggregation && enc.field) {
          aggregations.push({
            column: enc.field,
            function: this.mapTableauAggregation(enc.aggregation),
            alias: enc.field
          });
        }
      });
    });

    return aggregations;
  }

  // Operator mapping helpers
  private static mapPowerBIOperator(op: string): FilterSpec['operator'] {
    const mapping: Record<string, FilterSpec['operator']> = {
      'Equal': 'eq',
      'NotEqual': 'ne',
      'GreaterThan': 'gt',
      'GreaterThanOrEqual': 'gte',
      'LessThan': 'lt',
      'LessThanOrEqual': 'lte',
      'In': 'in',
      'Contains': 'like'
    };
    
    return mapping[op] || 'eq';
  }

  private static mapTableauOperator(op: string): FilterSpec['operator'] {
    const mapping: Record<string, FilterSpec['operator']> = {
      'categorical': 'in',
      'range': 'gte', // Simplified
      'relative-date': 'gte'
    };
    
    return mapping[op] || 'eq';
  }

  // Aggregation mapping helpers
  private static mapPowerBIAggregation(agg: string): AggregationSpec['function'] {
    const mapping: Record<string, AggregationSpec['function']> = {
      'Sum': 'sum',
      'Average': 'avg',
      'Count': 'count',
      'Min': 'min',
      'Max': 'max',
      'DistinctCount': 'distinct'
    };
    
    return mapping[agg] || 'sum';
  }

  private static mapTableauAggregation(agg: string): AggregationSpec['function'] {
    const mapping: Record<string, AggregationSpec['function']> = {
      'sum': 'sum',
      'avg': 'avg',
      'count': 'count',
      'min': 'min',
      'max': 'max',
      'countd': 'distinct'
    };
    
    return mapping[agg.toLowerCase()] || 'sum';
  }

  // Utility methods
  private static generateId(): string {
    return `visual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static extractTableName(qualifiedName: string): string {
    // Extract table name from qualified names like "Table1.Column1"
    const parts = qualifiedName.split('.');
    return parts.length > 1 ? parts[0] : 'unknown';
  }

  /**
   * Validate that a visual blueprint meets Scout's requirements
   */
  static validateBlueprint(blueprint: VisualBlueprint): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!blueprint.id) errors.push('Blueprint missing ID');
    if (!blueprint.name) errors.push('Blueprint missing name');
    if (!blueprint.type) errors.push('Blueprint missing type');

    // Data source validation
    if (!blueprint.dataSource.table) errors.push('Blueprint missing data source table');
    if (!blueprint.dataSource.columns.length) errors.push('Blueprint missing data source columns');

    // Position validation
    const pos = blueprint.position;
    if (pos.width <= 0 || pos.height <= 0) {
      errors.push('Blueprint has invalid dimensions');
    }

    // Type-specific validation
    const typeRequirements = {
      'kpi.card': { minColumns: 1, maxColumns: 1 },
      'pie.basic': { minColumns: 2, maxColumns: 2 },
      'bar.vertical.clustered': { minColumns: 2 },
      'line.basic': { minColumns: 2 }
    };

    const requirements = typeRequirements[blueprint.type as keyof typeof typeRequirements];
    if (requirements) {
      const columnCount = blueprint.dataSource.columns.length;
      
      if (requirements.minColumns && columnCount < requirements.minColumns) {
        errors.push(`${blueprint.type} requires at least ${requirements.minColumns} columns`);
      }
      
      if (requirements.maxColumns && columnCount > requirements.maxColumns) {
        errors.push(`${blueprint.type} supports at most ${requirements.maxColumns} columns`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}