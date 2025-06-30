import { supabase } from '../../lib/supabase';
import { 
  DIMENSIONS, 
  getDimension, 
  getHierarchyPath,
  canCombineDimensions,
  type QueryConfig,
  type QueryFilter 
} from '../../constants/registry';

export interface QueryResult {
  data: any[];
  error: Error | null;
  query: string;
  executionTime: number;
}

export interface JoinConfig {
  table: string;
  alias?: string;
  on: string;
  type?: 'inner' | 'left' | 'right';
}

export interface AggregateConfig {
  function: 'sum' | 'avg' | 'count' | 'min' | 'max';
  column: string;
  alias: string;
}

export class QueryBuilder {
  private selectClauses: string[] = [];
  private fromTable: string = 'transactions';
  private joins: JoinConfig[] = [];
  private whereClauses: string[] = [];
  private groupByClauses: string[] = [];
  private orderByClauses: string[] = [];
  private limitValue?: number;
  private aggregates: AggregateConfig[] = [];

  constructor(private config: QueryConfig) {
    this.buildQuery();
  }

  private buildQuery(): void {
    // Validate dimension combinations
    this.validateDimensions();
    
    // Set up base table and joins
    this.setupJoins();
    
    // Build SELECT clause
    this.buildSelectClause();
    
    // Build WHERE clause from filters
    this.buildWhereClause();
    
    // Build GROUP BY if needed
    this.buildGroupByClause();
    
    // Build ORDER BY
    this.buildOrderByClause();
    
    // Set LIMIT
    if (this.config.limit) {
      this.limitValue = this.config.limit;
    }
  }

  private validateDimensions(): void {
    const { dimensions } = this.config;
    
    // Check if all dimensions can be combined
    for (let i = 0; i < dimensions.length; i++) {
      for (let j = i + 1; j < dimensions.length; j++) {
        if (!canCombineDimensions(dimensions[i], dimensions[j])) {
          throw new Error(
            `Cannot combine dimensions ${dimensions[i]} and ${dimensions[j]} in the same query`
          );
        }
      }
    }
  }

  private setupJoins(): void {
    const dimensionTables = new Set<string>();
    
    // Collect all tables needed for dimensions and filters
    [...this.config.dimensions, ...this.config.filters.map(f => f.dimension)]
      .forEach(dimId => {
        const dimension = getDimension(dimId);
        if (dimension) {
          // Get full hierarchy path to ensure all parent tables are joined
          const path = getHierarchyPath(dimId);
          path.forEach(dim => dimensionTables.add(dim.table));
        }
      });
    
    // Add joins for each required table
    if (dimensionTables.has('stores')) {
      this.joins.push({
        table: 'stores',
        alias: 's',
        on: 't.store_id = s.id',
        type: 'inner'
      });
    }
    
    if (dimensionTables.has('products')) {
      this.joins.push({
        table: 'transaction_items',
        alias: 'ti',
        on: 't.id = ti.transaction_id',
        type: 'inner'
      });
      this.joins.push({
        table: 'products',
        alias: 'p',
        on: 'ti.product_id = p.id',
        type: 'inner'
      });
    }
    
    if (dimensionTables.has('brands')) {
      if (!dimensionTables.has('products')) {
        // Need to join through products
        this.joins.push({
          table: 'transaction_items',
          alias: 'ti',
          on: 't.id = ti.transaction_id',
          type: 'inner'
        });
        this.joins.push({
          table: 'products',
          alias: 'p',
          on: 'ti.product_id = p.id',
          type: 'inner'
        });
      }
      this.joins.push({
        table: 'brands',
        alias: 'b',
        on: 'p.brand_id = b.id',
        type: 'inner'
      });
    }
    
    if (dimensionTables.has('product_categories')) {
      if (!dimensionTables.has('products')) {
        this.joins.push({
          table: 'transaction_items',
          alias: 'ti',
          on: 't.id = ti.transaction_id',
          type: 'inner'
        });
        this.joins.push({
          table: 'products',
          alias: 'p',
          on: 'ti.product_id = p.id',
          type: 'inner'
        });
      }
      this.joins.push({
        table: 'product_categories',
        alias: 'pc',
        on: 'p.category_id = pc.id',
        type: 'inner'
      });
    }
    
    if (dimensionTables.has('clients')) {
      this.joins.push({
        table: 'clients',
        alias: 'cl',
        on: 't.client_id = cl.id',
        type: 'left'
      });
    }
    
    if (dimensionTables.has('client_brands')) {
      if (!dimensionTables.has('clients')) {
        this.joins.push({
          table: 'clients',
          alias: 'cl',
          on: 't.client_id = cl.id',
          type: 'left'
        });
      }
      this.joins.push({
        table: 'client_brands',
        alias: 'cb',
        on: 'cl.id = cb.client_id',
        type: 'left'
      });
    }
  }

  private buildSelectClause(): void {
    // Add dimension columns
    this.config.dimensions.forEach(dimId => {
      const dimension = getDimension(dimId);
      if (dimension) {
        const tableAlias = this.getTableAlias(dimension.table);
        this.selectClauses.push(`${tableAlias}.${dimension.displayField} as ${dimId}`);
        this.groupByClauses.push(`${tableAlias}.${dimension.displayField}`);
      }
    });
    
    // Add metric aggregations
    this.config.metrics.forEach(metric => {
      switch (metric) {
        case 'revenue':
          this.aggregates.push({
            function: 'sum',
            column: 't.total_amount',
            alias: 'total_revenue'
          });
          break;
        case 'transactions':
          this.aggregates.push({
            function: 'count',
            column: 'DISTINCT t.id',
            alias: 'transaction_count'
          });
          break;
        case 'units_sold':
          this.aggregates.push({
            function: 'sum',
            column: 'ti.quantity',
            alias: 'total_units'
          });
          break;
        case 'avg_basket_size':
          this.aggregates.push({
            function: 'avg',
            column: 't.items_count',
            alias: 'avg_basket_size'
          });
          break;
        case 'unique_products':
          this.aggregates.push({
            function: 'count',
            column: 'DISTINCT ti.product_id',
            alias: 'unique_products'
          });
          break;
        case 'unique_stores':
          this.aggregates.push({
            function: 'count',
            column: 'DISTINCT t.store_id',
            alias: 'unique_stores'
          });
          break;
      }
    });
    
    // Add aggregates to SELECT
    this.aggregates.forEach(agg => {
      this.selectClauses.push(`${agg.function}(${agg.column}) as ${agg.alias}`);
    });
  }

  private buildWhereClause(): void {
    // Always filter for completed transactions
    this.whereClauses.push("t.status = 'completed'");
    
    // Add dimension filters
    this.config.filters.forEach(filter => {
      const dimension = getDimension(filter.dimension);
      if (dimension) {
        const tableAlias = this.getTableAlias(dimension.table);
        const column = `${tableAlias}.${dimension.filterField || dimension.key}`;
        
        switch (filter.operator) {
          case 'eq':
            this.whereClauses.push(`${column} = '${filter.value}'`);
            break;
          case 'in':
            const values = Array.isArray(filter.value) 
              ? filter.value.map(v => `'${v}'`).join(', ')
              : `'${filter.value}'`;
            this.whereClauses.push(`${column} IN (${values})`);
            break;
          case 'gte':
            this.whereClauses.push(`${column} >= '${filter.value}'`);
            break;
          case 'lte':
            this.whereClauses.push(`${column} <= '${filter.value}'`);
            break;
          case 'like':
            this.whereClauses.push(`${column} LIKE '%${filter.value}%'`);
            break;
          case 'between':
            if (Array.isArray(filter.value) && filter.value.length === 2) {
              this.whereClauses.push(
                `${column} BETWEEN '${filter.value[0]}' AND '${filter.value[1]}'`
              );
            }
            break;
        }
      }
    });
  }

  private buildGroupByClause(): void {
    // GROUP BY is already populated in buildSelectClause for dimensions
    // This method is for any additional grouping logic
  }

  private buildOrderByClause(): void {
    if (this.config.orderBy) {
      this.config.orderBy.forEach(order => {
        const dimension = getDimension(order.dimension);
        if (dimension) {
          const tableAlias = this.getTableAlias(dimension.table);
          this.orderByClauses.push(
            `${tableAlias}.${dimension.displayField} ${order.direction.toUpperCase()}`
          );
        } else {
          // Might be ordering by a metric
          const metricAlias = this.aggregates.find(agg => 
            agg.alias.toLowerCase().includes(order.dimension.toLowerCase())
          )?.alias;
          if (metricAlias) {
            this.orderByClauses.push(`${metricAlias} ${order.direction.toUpperCase()}`);
          }
        }
      });
    }
  }

  private getTableAlias(tableName: string): string {
    const aliasMap: Record<string, string> = {
      'transactions': 't',
      'stores': 's',
      'products': 'p',
      'brands': 'b',
      'product_categories': 'pc',
      'transaction_items': 'ti',
      'clients': 'cl',
      'client_brands': 'cb'
    };
    return aliasMap[tableName] || tableName;
  }

  public toSQL(): string {
    const parts: string[] = [];
    
    // SELECT
    parts.push(`SELECT ${this.selectClauses.join(', ')}`);
    
    // FROM
    parts.push(`FROM ${this.fromTable} t`);
    
    // JOINS
    this.joins.forEach(join => {
      const joinType = join.type?.toUpperCase() || 'INNER';
      parts.push(`${joinType} JOIN ${join.table} ${join.alias} ON ${join.on}`);
    });
    
    // WHERE
    if (this.whereClauses.length > 0) {
      parts.push(`WHERE ${this.whereClauses.join(' AND ')}`);
    }
    
    // GROUP BY
    if (this.groupByClauses.length > 0) {
      parts.push(`GROUP BY ${this.groupByClauses.join(', ')}`);
    }
    
    // ORDER BY
    if (this.orderByClauses.length > 0) {
      parts.push(`ORDER BY ${this.orderByClauses.join(', ')}`);
    }
    
    // LIMIT
    if (this.limitValue) {
      parts.push(`LIMIT ${this.limitValue}`);
    }
    
    return parts.join('\n');
  }

  public async execute(): Promise<QueryResult> {
    const startTime = Date.now();
    const query = this.toSQL();
    
    try {
      // For now, we'll use raw SQL execution
      // In production, this should use proper parameterized queries
      const { data, error } = await supabase.rpc('execute_dynamic_query', {
        query_text: query
      });
      
      const executionTime = Date.now() - startTime;
      
      return {
        data: data || [],
        error: error as Error | null,
        query,
        executionTime
      };
    } catch (error) {
      return {
        data: [],
        error: error as Error,
        query,
        executionTime: Date.now() - startTime
      };
    }
  }
}

// Helper function to create common queries
export const createQuery = (config: QueryConfig): QueryBuilder => {
  return new QueryBuilder(config);
};

// Preset query templates
export const QueryTemplates = {
  // Sales by region and time
  regionalSales: (filters: QueryFilter[]): QueryConfig => ({
    metrics: ['revenue', 'transactions'],
    dimensions: ['region', 'month'],
    filters,
    orderBy: [
      { dimension: 'month', direction: 'asc' },
      { dimension: 'revenue', direction: 'desc' }
    ]
  }),
  
  // Product performance by client
  clientProductPerformance: (clientName: string): QueryConfig => ({
    metrics: ['revenue', 'units_sold', 'transactions'],
    dimensions: ['client', 'category', 'brand', 'sku'],
    filters: [
      { dimension: 'client', operator: 'eq', value: clientName }
    ],
    orderBy: [
      { dimension: 'revenue', direction: 'desc' }
    ],
    limit: 100
  }),
  
  // Store coverage analysis
  storeCoverage: (filters: QueryFilter[]): QueryConfig => ({
    metrics: ['unique_stores', 'revenue', 'transactions'],
    dimensions: ['region', 'city', 'barangay'],
    filters,
    orderBy: [
      { dimension: 'unique_stores', direction: 'desc' }
    ]
  }),
  
  // Category mix analysis
  categoryMix: (filters: QueryFilter[]): QueryConfig => ({
    metrics: ['revenue', 'units_sold', 'unique_products'],
    dimensions: ['category', 'subcategory'],
    filters,
    orderBy: [
      { dimension: 'revenue', direction: 'desc' }
    ]
  })
};