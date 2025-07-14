/**
 * Scout Dash 2.0 - Dashboard Engine
 * Core orchestrator for dashboard state, data flow, and visual coordination
 */

import { EventEmitter } from 'events';
import { 
  Dashboard, 
  VisualBlueprint, 
  DataSet, 
  DashboardEvent,
  FilterChangeEvent,
  SelectionChangeEvent,
  DataUpdateEvent,
  GlobalFilterConfig
} from './types';
import { getDAL } from '../dal';

export class DashboardEngine extends EventEmitter {
  private dashboard: Dashboard;
  private datasets: Map<string, DataSet> = new Map();
  private visualData: Map<string, any[]> = new Map();
  private globalFilters: Map<string, any> = new Map();
  private selections: Map<string, any[]> = new Map();
  
  // Performance and caching
  private queryCache: Map<string, { data: any[]; timestamp: number; ttl: number }> = new Map();
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Cross-filtering state
  private crossFilters: Map<string, FilterChangeEvent[]> = new Map();
  
  constructor(dashboard: Dashboard) {
    super();
    this.dashboard = dashboard;
    this.initializeEngine();
  }

  private async initializeEngine(): Promise<void> {
    console.log(`🚀 Initializing dashboard: ${this.dashboard.name}`);
    
    // Initialize global filters
    this.dashboard.filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        this.globalFilters.set(filter.id, filter.defaultValue);
      }
    });
    
    // Load initial data for all visuals
    await this.loadAllVisualData();
    
    // Setup auto-refresh if configured
    this.setupAutoRefresh();
    
    // Setup cross-filtering
    this.setupCrossFiltering();
    
    console.log(`✅ Dashboard engine initialized with ${this.dashboard.visuals.length} visuals`);
    this.emit('dashboard:ready', this.dashboard);
  }

  /**
   * Load data for all visuals in the dashboard
   */
  private async loadAllVisualData(): Promise<void> {
    const loadPromises = this.dashboard.visuals.map(visual => 
      this.loadVisualData(visual.id)
    );
    
    await Promise.allSettled(loadPromises);
  }

  /**
   * Load data for a specific visual
   */
  async loadVisualData(visualId: string): Promise<any[]> {
    const visual = this.dashboard.visuals.find(v => v.id === visualId);
    if (!visual) {
      throw new Error(`Visual not found: ${visualId}`);
    }

    try {
      console.log(`📊 Loading data for visual: ${visual.title}`);
      
      // Build query with filters applied
      const query = this.buildQuery(visual);
      const cacheKey = this.getCacheKey(visualId, query);
      
      // Check cache first
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log(`📋 Using cached data for ${visual.title}`);
        this.visualData.set(visualId, cached.data);
        this.emit('visual:data:loaded', { visualId, data: cached.data, cached: true });
        return cached.data;
      }

      // Execute query through DAL
      const dal = await getDAL();
      const result = await dal.query(query.sql, query.params);
      
      if (!result.success) {
        throw new Error(`Query failed: ${result.error}`);
      }

      // Process and transform data
      const processedData = this.processVisualData(visual, result.data);
      
      // Cache the result
      const ttl = visual.data.refresh?.interval || this.dashboard.settings.caching.ttl * 1000;
      this.queryCache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now(),
        ttl
      });

      // Update visual data
      this.visualData.set(visualId, processedData);
      
      console.log(`✅ Loaded ${processedData.length} rows for ${visual.title}`);
      this.emit('visual:data:loaded', { visualId, data: processedData, cached: false });
      
      return processedData;
      
    } catch (error: any) {
      console.error(`❌ Failed to load data for ${visual.title}:`, error);
      this.emit('visual:data:error', { visualId, error: error.message });
      throw error;
    }
  }

  /**
   * Build SQL query for a visual with applied filters
   */
  private buildQuery(visual: VisualBlueprint): { sql: string; params: any[] } {
    const { query } = visual.data;
    const params: any[] = [];
    let paramIndex = 1;

    // Base SELECT clause
    let sql = `SELECT ${query.select.join(', ')} FROM ${query.from}`;
    
    // Add computed fields to SELECT
    if (query.computed && query.computed.length > 0) {
      const computedSelects = query.computed.map(field => {
        if (field.type === 'sql') {
          return `${field.expression} AS ${field.name}`;
        } else {
          // JavaScript computed fields would need client-side processing
          return null;
        }
      }).filter(Boolean);
      
      if (computedSelects.length > 0) {
        sql = sql.replace('SELECT ', `SELECT ${computedSelects.join(', ')}, `);
      }
    }

    // WHERE clause with filters
    const whereConditions: string[] = [];
    
    // Apply query-level filters
    if (query.where && query.where.length > 0) {
      query.where.forEach(filter => {
        const condition = this.buildFilterCondition(filter, paramIndex);
        whereConditions.push(condition.sql);
        params.push(...condition.params);
        paramIndex += condition.params.length;
      });
    }
    
    // Apply global dashboard filters
    this.globalFilters.forEach((value, filterId) => {
      const filterConfig = this.dashboard.filters.find(f => f.id === filterId);
      if (filterConfig && value !== null && value !== undefined && value !== '') {
        const condition = this.buildFilterCondition({
          field: filterConfig.field,
          operator: Array.isArray(value) ? 'in' : 'eq',
          value: value
        }, paramIndex);
        
        whereConditions.push(condition.sql);
        params.push(...condition.params);
        paramIndex += condition.params.length;
      }
    });
    
    // Apply cross-filters from other visuals
    const crossFiltersForVisual = this.crossFilters.get(visual.id) || [];
    crossFiltersForVisual.forEach(filterEvent => {
      const condition = this.buildFilterCondition({
        field: filterEvent.data.field,
        operator: filterEvent.data.operator,
        value: filterEvent.data.value
      }, paramIndex);
      
      whereConditions.push(condition.sql);
      params.push(...condition.params);
      paramIndex += condition.params.length;
    });

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // GROUP BY clause
    if (query.groupBy && query.groupBy.length > 0) {
      sql += ` GROUP BY ${query.groupBy.join(', ')}`;
    }

    // ORDER BY clause
    if (query.orderBy && query.orderBy.length > 0) {
      const orderClauses = query.orderBy.map(order => 
        `${order.field} ${order.direction.toUpperCase()}`
      );
      sql += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    // LIMIT clause
    if (query.limit) {
      sql += ` LIMIT ${query.limit}`;
    }

    return { sql, params };
  }

  /**
   * Build filter condition SQL
   */
  private buildFilterCondition(filter: any, startParamIndex: number): { sql: string; params: any[] } {
    const { field, operator, value } = filter;
    const params: any[] = [];

    switch (operator) {
      case 'eq':
        return { sql: `${field} = $${startParamIndex}`, params: [value] };
      case 'ne':
        return { sql: `${field} != $${startParamIndex}`, params: [value] };
      case 'gt':
        return { sql: `${field} > $${startParamIndex}`, params: [value] };
      case 'gte':
        return { sql: `${field} >= $${startParamIndex}`, params: [value] };
      case 'lt':
        return { sql: `${field} < $${startParamIndex}`, params: [value] };
      case 'lte':
        return { sql: `${field} <= $${startParamIndex}`, params: [value] };
      case 'like':
        return { sql: `${field} LIKE $${startParamIndex}`, params: [`%${value}%`] };
      case 'in':
        const inValues = Array.isArray(value) ? value : [value];
        const placeholders = inValues.map((_, i) => `$${startParamIndex + i}`).join(', ');
        return { sql: `${field} IN (${placeholders})`, params: inValues };
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          return { 
            sql: `${field} BETWEEN $${startParamIndex} AND $${startParamIndex + 1}`, 
            params: value 
          };
        }
        throw new Error(`Invalid BETWEEN value: ${value}`);
      default:
        throw new Error(`Unsupported filter operator: ${operator}`);
    }
  }

  /**
   * Process raw query data for visual consumption
   */
  private processVisualData(visual: VisualBlueprint, rawData: any[]): any[] {
    // Apply aggregations if specified
    if (visual.data.query.aggregations && visual.data.query.aggregations.length > 0) {
      return this.applyAggregations(rawData, visual.data.query.aggregations);
    }

    // Apply computed fields (JavaScript-based)
    const computedFields = visual.data.query.computed?.filter(f => f.type === 'javascript') || [];
    if (computedFields.length > 0) {
      return this.applyComputedFields(rawData, computedFields);
    }

    return rawData;
  }

  /**
   * Apply aggregations to data
   */
  private applyAggregations(data: any[], aggregations: any[]): any[] {
    // Group by non-aggregated fields first
    const groupFields = Object.keys(data[0] || {}).filter(field => 
      !aggregations.some(agg => agg.field === field)
    );

    if (groupFields.length === 0) {
      // Global aggregation
      const result: any = {};
      aggregations.forEach(agg => {
        result[agg.alias || agg.field] = this.calculateAggregation(data, agg.field, agg.function);
      });
      return [result];
    }

    // Group-wise aggregation
    const groups = new Map<string, any[]>();
    
    data.forEach(row => {
      const groupKey = groupFields.map(field => row[field]).join('|');
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(row);
    });

    const result: any[] = [];
    groups.forEach((groupData, groupKey) => {
      const resultRow: any = {};
      
      // Add group fields
      const groupValues = groupKey.split('|');
      groupFields.forEach((field, index) => {
        resultRow[field] = groupValues[index];
      });
      
      // Add aggregated fields
      aggregations.forEach(agg => {
        resultRow[agg.alias || agg.field] = this.calculateAggregation(groupData, agg.field, agg.function);
      });
      
      result.push(resultRow);
    });

    return result;
  }

  /**
   * Calculate aggregation value
   */
  private calculateAggregation(data: any[], field: string, func: string): any {
    const values = data.map(row => row[field]).filter(v => v !== null && v !== undefined);
    
    switch (func) {
      case 'sum':
        return values.reduce((sum, val) => sum + Number(val), 0);
      case 'avg':
        return values.length > 0 ? values.reduce((sum, val) => sum + Number(val), 0) / values.length : 0;
      case 'count':
        return values.length;
      case 'min':
        return Math.min(...values.map(Number));
      case 'max':
        return Math.max(...values.map(Number));
      case 'distinctCount':
        return new Set(values).size;
      default:
        throw new Error(`Unsupported aggregation function: ${func}`);
    }
  }

  /**
   * Apply JavaScript computed fields
   */
  private applyComputedFields(data: any[], computedFields: any[]): any[] {
    return data.map(row => {
      const newRow = { ...row };
      
      computedFields.forEach(field => {
        try {
          // Create a safe evaluation context
          const context = { ...row, Math, Date };
          const func = new Function(...Object.keys(context), `return ${field.expression}`);
          newRow[field.name] = func(...Object.values(context));
        } catch (error) {
          console.warn(`Error computing field ${field.name}:`, error);
          newRow[field.name] = null;
        }
      });
      
      return newRow;
    });
  }

  /**
   * Get cache key for query
   */
  private getCacheKey(visualId: string, query: { sql: string; params: any[] }): string {
    return `${visualId}:${btoa(JSON.stringify({ sql: query.sql, params: query.params }))}`;
  }

  /**
   * Setup auto-refresh for visuals
   */
  private setupAutoRefresh(): void {
    this.dashboard.visuals.forEach(visual => {
      if (visual.data.refresh?.enabled && visual.data.refresh.interval > 0) {
        const timer = setInterval(() => {
          this.refreshVisual(visual.id);
        }, visual.data.refresh.interval);
        
        this.refreshTimers.set(visual.id, timer);
      }
    });

    // Dashboard-level auto-refresh
    if (this.dashboard.settings.refreshInterval && this.dashboard.settings.refreshInterval > 0) {
      const timer = setInterval(() => {
        this.refreshAllVisuals();
      }, this.dashboard.settings.refreshInterval);
      
      this.refreshTimers.set('dashboard', timer);
    }
  }

  /**
   * Setup cross-filtering between visuals
   */
  private setupCrossFiltering(): void {
    this.dashboard.visuals.forEach(visual => {
      if (visual.interactions?.crossFilter?.enabled) {
        // Listen for selection events from this visual
        this.on(`visual:${visual.id}:selection`, (event: SelectionChangeEvent) => {
          this.applyCrossFilter(visual.id, event);
        });
      }
    });
  }

  /**
   * Apply cross-filter from one visual to others
   */
  private applyCrossFilter(sourceVisualId: string, selectionEvent: SelectionChangeEvent): void {
    const sourceVisual = this.dashboard.visuals.find(v => v.id === sourceVisualId);
    if (!sourceVisual?.interactions?.crossFilter) return;

    const { targets, bidirectional } = sourceVisual.interactions.crossFilter;
    const targetVisuals = targets || this.dashboard.visuals
      .filter(v => v.id !== sourceVisualId)
      .map(v => v.id);

    // Create filter events for target visuals
    targetVisuals.forEach(targetId => {
      const filterEvent: FilterChangeEvent = {
        type: 'filter:change',
        source: sourceVisualId,
        target: targetId,
        data: {
          filterId: `crossfilter:${sourceVisualId}`,
          field: selectionEvent.data.field,
          value: selectionEvent.data.selected,
          operator: 'in'
        },
        timestamp: new Date()
      };

      // Store cross-filter
      if (!this.crossFilters.has(targetId)) {
        this.crossFilters.set(targetId, []);
      }
      
      // Remove existing cross-filter from same source
      const existingFilters = this.crossFilters.get(targetId)!;
      const filteredFilters = existingFilters.filter(f => f.source !== sourceVisualId);
      
      // Add new cross-filter if selection is not empty
      if (selectionEvent.data.selected.length > 0) {
        filteredFilters.push(filterEvent);
      }
      
      this.crossFilters.set(targetId, filteredFilters);

      // Refresh target visual
      this.refreshVisual(targetId);
    });
  }

  // Public API Methods

  /**
   * Get data for a specific visual
   */
  getVisualData(visualId: string): any[] | undefined {
    return this.visualData.get(visualId);
  }

  /**
   * Update global filter value
   */
  async setGlobalFilter(filterId: string, value: any): Promise<void> {
    const oldValue = this.globalFilters.get(filterId);
    this.globalFilters.set(filterId, value);

    const filterEvent: FilterChangeEvent = {
      type: 'filter:change',
      source: 'dashboard',
      data: {
        filterId,
        field: this.dashboard.filters.find(f => f.id === filterId)?.field || '',
        value,
        operator: Array.isArray(value) ? 'in' : 'eq'
      },
      timestamp: new Date()
    };

    this.emit('dashboard:filter:change', filterEvent);

    // Refresh all visuals affected by this filter
    await this.refreshAllVisuals();
  }

  /**
   * Get current global filter value
   */
  getGlobalFilter(filterId: string): any {
    return this.globalFilters.get(filterId);
  }

  /**
   * Update visual selection
   */
  setVisualSelection(visualId: string, field: string, selected: any[]): void {
    this.selections.set(visualId, selected);

    const selectionEvent: SelectionChangeEvent = {
      type: 'selection:change',
      source: visualId,
      data: {
        selected,
        field
      },
      timestamp: new Date()
    };

    this.emit(`visual:${visualId}:selection`, selectionEvent);
    this.emit('dashboard:selection:change', selectionEvent);
  }

  /**
   * Refresh specific visual
   */
  async refreshVisual(visualId: string): Promise<void> {
    try {
      // Clear cache for this visual
      Array.from(this.queryCache.keys())
        .filter(key => key.startsWith(visualId))
        .forEach(key => this.queryCache.delete(key));

      await this.loadVisualData(visualId);
    } catch (error) {
      console.error(`Failed to refresh visual ${visualId}:`, error);
    }
  }

  /**
   * Refresh all visuals
   */
  async refreshAllVisuals(): Promise<void> {
    this.queryCache.clear();
    await this.loadAllVisualData();
  }

  /**
   * Clear all cross-filters
   */
  clearCrossFilters(): void {
    this.crossFilters.clear();
    this.refreshAllVisuals();
  }

  /**
   * Export dashboard data
   */
  exportData(format: 'json' | 'csv'): any {
    const exportData = {
      dashboard: this.dashboard,
      data: Object.fromEntries(this.visualData),
      filters: Object.fromEntries(this.globalFilters),
      selections: Object.fromEntries(this.selections),
      timestamp: new Date().toISOString()
    };

    if (format === 'json') {
      return exportData;
    } else if (format === 'csv') {
      // Convert to CSV format - simplified implementation
      const allData = Array.from(this.visualData.values()).flat();
      return this.convertToCSV(allData);
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all timers
    this.refreshTimers.forEach(timer => clearInterval(timer));
    this.refreshTimers.clear();

    // Clear caches
    this.queryCache.clear();
    this.crossFilters.clear();
    this.visualData.clear();
    this.globalFilters.clear();
    this.selections.clear();

    // Remove all listeners
    this.removeAllListeners();

    console.log(`🧹 Dashboard engine destroyed: ${this.dashboard.name}`);
  }
}