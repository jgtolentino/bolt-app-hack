/**
 * Scout BI File Importer Types
 * Defines interfaces for importing PowerBI and Tableau files
 */

export interface ImportResult {
  success: boolean;
  dataFrames: DataFrameSpec[];
  blueprints: VisualBlueprint[];
  metadata: ImportMetadata;
  errors?: ImportError[];
}

export interface DataFrameSpec {
  tableName: string;
  columns: ColumnSpec[];
  rows: any[][];
  primaryKey?: string;
  foreignKeys?: ForeignKeySpec[];
  indexes?: IndexSpec[];
}

export interface ColumnSpec {
  name: string;
  type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'BOOLEAN' | 'DATETIME';
  nullable: boolean;
  defaultValue?: any;
  description?: string;
}

export interface ForeignKeySpec {
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface IndexSpec {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface VisualBlueprint {
  id: string;
  name: string;
  type: ScoutVisualType;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  dataSource: {
    table: string;
    columns: string[];
    filters?: FilterSpec[];
    aggregations?: AggregationSpec[];
  };
  styling: {
    colors?: string[];
    title?: string;
    showLegend?: boolean;
    showAxes?: boolean;
  };
  originalFormat?: {
    type: 'powerbi' | 'tableau';
    visualType: string;
    config: any;
  };
  fallbackImage?: string; // Base64 encoded PNG for unsupported visuals
}

export type ScoutVisualType = 
  | 'bar.vertical.stacked'
  | 'bar.vertical.clustered'
  | 'bar.horizontal.stacked'
  | 'line.basic'
  | 'line.area'
  | 'pie.basic'
  | 'scatter.basic'
  | 'table.basic'
  | 'kpi.card'
  | 'kpi.gauge'
  | 'map.choropleth'
  | 'unsupported';

export interface FilterSpec {
  column: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';
  value: any;
}

export interface AggregationSpec {
  column: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct';
  alias?: string;
}

export interface ImportMetadata {
  sourceFile: string;
  fileType: 'pbix' | 'pbit' | 'pbip' | 'twb' | 'twbx' | 'hyper';
  importedAt: Date;
  originalFileSize: number;
  tablesCount: number;
  visualsCount: number;
  unsupportedVisualsCount: number;
  version?: string;
  author?: string;
  description?: string;
  relationships?: RelationshipSpec[];
  measures?: MeasureSpec[];
}

export interface RelationshipSpec {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  crossFilterDirection: 'single' | 'both';
}

export interface MeasureSpec {
  name: string;
  expression: string; // DAX or calculated field expression
  description?: string;
  formatString?: string;
  isHidden?: boolean;
}

export interface ImportError {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  context?: any;
}

export interface ImportProgress {
  step: ImportStep;
  progress: number; // 0-100
  message: string;
  errors?: ImportError[];
}

export type ImportStep = 
  | 'validating'
  | 'extracting'
  | 'parsing-schema'
  | 'importing-data'
  | 'mapping-visuals'
  | 'building-blueprints'
  | 'finalizing'
  | 'complete'
  | 'error';

export interface Importer {
  readonly name: string;
  readonly supportedExtensions: string[];
  
  /**
   * Check if this importer can handle the given file
   */
  match(filePath: string): boolean;
  
  /**
   * Import the file and return structured data
   */
  import(filePath: string, onProgress?: (progress: ImportProgress) => void): Promise<ImportResult>;
  
  /**
   * Validate file before import
   */
  validate(filePath: string): Promise<{ valid: boolean; errors: ImportError[] }>;
}

export interface ImporterRegistry {
  register(importer: Importer): void;
  unregister(importerName: string): void;
  getImporter(filePath: string): Importer | null;
  getSupportedExtensions(): string[];
  listImporters(): Importer[];
}

export interface ImportConfig {
  maxFileSize: number; // bytes
  maxTableSize: number; // rows
  timeoutMs: number;
  tempDir: string;
  keepTempFiles: boolean;
  enablePreviews: boolean;
}

// Visual type mapping configurations
export interface VisualTypeMapping {
  [sourceType: string]: {
    scoutType: ScoutVisualType;
    configMapper?: (sourceConfig: any) => any;
    requirements?: {
      minColumns?: number;
      maxColumns?: number;
      requiredColumnTypes?: string[];
    };
  };
}

// PowerBI specific types
export interface PowerBIModel {
  name: string;
  culture: string;
  tables: PowerBITable[];
  relationships: PowerBIRelationship[];
  expressions: PowerBIExpression[];
}

export interface PowerBITable {
  name: string;
  columns: PowerBIColumn[];
  partitions: PowerBIPartition[];
  measures?: PowerBIMeasure[];
}

export interface PowerBIColumn {
  name: string;
  dataType: string;
  isHidden?: boolean;
  formatString?: string;
  description?: string;
}

export interface PowerBIPartition {
  name: string;
  source: {
    type: string;
    query?: string;
  };
}

export interface PowerBIMeasure {
  name: string;
  expression: string;
  formatString?: string;
  description?: string;
}

export interface PowerBIRelationship {
  name: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  crossFilteringBehavior: string;
}

export interface PowerBIExpression {
  name: string;
  kind: string;
  expression: string;
}

// Tableau specific types
export interface TableauWorkbook {
  worksheets: TableauWorksheet[];
  datasources: TableauDatasource[];
  dashboards: TableauDashboard[];
}

export interface TableauWorksheet {
  name: string;
  view: TableauView;
}

export interface TableauView {
  type: string;
  datasource: string;
  marks: TableauMark[];
  filters: TableauFilter[];
}

export interface TableauMark {
  class: string;
  encoding: {
    [key: string]: {
      field: string;
      type: string;
      aggregation?: string;
    };
  };
}

export interface TableauFilter {
  field: string;
  type: string;
  values: any[];
}

export interface TableauDatasource {
  name: string;
  caption: string;
  connection: TableauConnection;
  columns: TableauColumn[];
}

export interface TableauConnection {
  class: string;
  dbname?: string;
  filename?: string;
  server?: string;
}

export interface TableauColumn {
  name: string;
  caption: string;
  datatype: string;
  role: 'dimension' | 'measure';
  type: 'nominal' | 'ordinal' | 'quantitative';
}

export interface TableauDashboard {
  name: string;
  zones: TableauZone[];
}

export interface TableauZone {
  name: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
}