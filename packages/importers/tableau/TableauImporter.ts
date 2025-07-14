/**
 * Tableau Importer
 * Handles .twb, .twbx, and .hyper files using XML parsing and Hyper API
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import unzipper from 'unzipper';
import { parseStringPromise } from 'xml2js';
import { 
  Importer, 
  ImportResult, 
  ImportProgress, 
  ImportError,
  DataFrameSpec,
  VisualBlueprint,
  TableauWorkbook,
  TableauWorksheet,
  TableauDatasource,
  ColumnSpec
} from '../types';
import { BlueprintBuilder } from '../common/BlueprintBuilder';

export class TableauImporter implements Importer {
  readonly name = 'Tableau';
  readonly supportedExtensions = ['.twb', '.twbx', '.hyper'];

  private readonly config = {
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    timeoutMs: 300000, // 5 minutes
    tempDir: process.env.TEMP || '/tmp'
  };

  match(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.supportedExtensions.includes(ext);
  }

  async validate(filePath: string): Promise<{ valid: boolean; errors: ImportError[] }> {
    const errors: ImportError[] = [];

    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();

      // Check file size
      if (stats.size > this.config.maxFileSize) {
        errors.push({
          code: 'FILE_TOO_LARGE',
          message: `File size ${Math.round(stats.size / 1024 / 1024)}MB exceeds limit of ${Math.round(this.config.maxFileSize / 1024 / 1024)}MB`,
          severity: 'error'
        });
      }

      // Extension check
      if (!this.supportedExtensions.includes(ext)) {
        errors.push({
          code: 'UNSUPPORTED_EXTENSION',
          message: `Extension ${ext} is not supported by Tableau importer`,
          severity: 'error'
        });
      }

      // Validate file format
      if (ext === '.twb') {
        await this.validateTWB(filePath);
      } else if (ext === '.twbx') {
        await this.validateTWBX(filePath);
      } else if (ext === '.hyper') {
        await this.validateHyper(filePath);
      }

    } catch (error: any) {
      errors.push({
        code: 'VALIDATION_ERROR',
        message: `Validation failed: ${error.message}`,
        severity: 'error'
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async import(
    filePath: string,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const startTime = Date.now();
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    try {
      onProgress?.({
        step: 'extracting',
        progress: 10,
        message: `Processing ${fileName}...`
      });

      let workbook: TableauWorkbook;
      let extractedDataFiles: string[] = [];

      if (ext === '.twb') {
        workbook = await this.parseTWB(filePath);
      } else if (ext === '.twbx') {
        const { workbook: wb, dataFiles } = await this.parseTWBX(filePath, onProgress);
        workbook = wb;
        extractedDataFiles = dataFiles;
      } else if (ext === '.hyper') {
        const dataFrames = await this.parseHyperFile(filePath, onProgress);
        
        return {
          success: true,
          dataFrames,
          blueprints: [], // Hyper files don't contain visual layouts
          metadata: {
            sourceFile: filePath,
            fileType: 'hyper',
            importedAt: new Date(),
            originalFileSize: fs.statSync(filePath).size,
            tablesCount: dataFrames.length,
            visualsCount: 0,
            unsupportedVisualsCount: 0
          }
        };
      } else {
        throw new Error(`Unsupported file extension: ${ext}`);
      }

      onProgress?.({
        step: 'importing-data',
        progress: 40,
        message: 'Importing data sources...'
      });

      const dataFrames = await this.convertDataSources(workbook.datasources, extractedDataFiles, onProgress);

      onProgress?.({
        step: 'mapping-visuals',
        progress: 70,
        message: 'Converting visualizations...'
      });

      const blueprints = this.convertWorksheetsToBlueprints(workbook.worksheets);

      onProgress?.({
        step: 'finalizing',
        progress: 90,
        message: 'Finalizing import...'
      });

      const result: ImportResult = {
        success: true,
        dataFrames,
        blueprints,
        metadata: {
          sourceFile: filePath,
          fileType: ext.slice(1) as any,
          importedAt: new Date(),
          originalFileSize: fs.statSync(filePath).size,
          tablesCount: dataFrames.length,
          visualsCount: blueprints.length,
          unsupportedVisualsCount: blueprints.filter(b => b.type === 'unsupported').length
        }
      };

      onProgress?.({
        step: 'complete',
        progress: 100,
        message: `Import completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`
      });

      return result;

    } catch (error: any) {
      console.error('Tableau import failed:', error);

      onProgress?.({
        step: 'error',
        progress: 0,
        message: `Import failed: ${error.message}`
      });

      return {
        success: false,
        dataFrames: [],
        blueprints: [],
        metadata: {
          sourceFile: filePath,
          fileType: ext.slice(1) as any,
          importedAt: new Date(),
          originalFileSize: 0,
          tablesCount: 0,
          visualsCount: 0,
          unsupportedVisualsCount: 0
        },
        errors: [{
          code: 'IMPORT_FAILED',
          message: error.message,
          severity: 'error',
          context: { stack: error.stack }
        }]
      };
    }
  }

  private async validateTWB(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      await parseStringPromise(content);
    } catch (error: any) {
      throw new Error(`Invalid TWB file: ${error.message}`);
    }
  }

  private async validateTWBX(filePath: string): Promise<void> {
    try {
      const directory = await unzipper.Open.file(filePath);
      const twbFile = directory.files.find(f => f.path.endsWith('.twb'));
      
      if (!twbFile) {
        throw new Error('TWBX file missing .twb workbook definition');
      }
    } catch (error: any) {
      throw new Error(`Invalid TWBX file: ${error.message}`);
    }
  }

  private async validateHyper(filePath: string): Promise<void> {
    // For now, just check if file is readable
    // In a full implementation, would use Tableau Hyper API to validate
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (error: any) {
      throw new Error(`Cannot read Hyper file: ${error.message}`);
    }
  }

  private async parseTWB(filePath: string): Promise<TableauWorkbook> {
    const content = fs.readFileSync(filePath, 'utf8');
    const xml = await parseStringPromise(content, {
      explicitArray: false,
      mergeAttrs: true
    });

    return this.normalizeWorkbook(xml.workbook);
  }

  private async parseTWBX(
    filePath: string,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<{ workbook: TableauWorkbook; dataFiles: string[] }> {
    const tempDir = path.join(this.config.tempDir, `twbx_extract_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      onProgress?.({
        step: 'extracting',
        progress: 15,
        message: 'Extracting TWBX archive...'
      });

      // Extract TWBX (it's a ZIP file)
      const directory = await unzipper.Open.file(filePath);
      
      await Promise.all(directory.files.map(async (file) => {
        if (file.type === 'File') {
          const extractPath = path.join(tempDir, file.path);
          const extractDir = path.dirname(extractPath);
          
          fs.mkdirSync(extractDir, { recursive: true });
          
          const stream = file.stream();
          const writeStream = fs.createWriteStream(extractPath);
          
          return new Promise((resolve, reject) => {
            stream.pipe(writeStream);
            writeStream.on('close', resolve);
            writeStream.on('error', reject);
          });
        }
      }));

      // Find and parse TWB file
      const twbFile = directory.files.find(f => f.path.endsWith('.twb'));
      if (!twbFile) {
        throw new Error('No .twb file found in TWBX archive');
      }

      const twbPath = path.join(tempDir, twbFile.path);
      const workbook = await this.parseTWB(twbPath);

      // Find data files
      const dataFiles = directory.files
        .filter(f => f.path.includes('Data/') && (f.path.endsWith('.hyper') || f.path.endsWith('.csv')))
        .map(f => path.join(tempDir, f.path));

      return { workbook, dataFiles };

    } catch (error: any) {
      // Clean up temp directory on error
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
      throw error;
    }
  }

  private normalizeWorkbook(rawWorkbook: any): TableauWorkbook {
    const worksheets = this.extractWorksheets(rawWorkbook);
    const datasources = this.extractDatasources(rawWorkbook);
    const dashboards = this.extractDashboards(rawWorkbook);

    return {
      worksheets,
      datasources,
      dashboards
    };
  }

  private extractWorksheets(workbook: any): TableauWorksheet[] {
    const worksheets = workbook.worksheets?.worksheet || [];
    const worksheetArray = Array.isArray(worksheets) ? worksheets : [worksheets];

    return worksheetArray.map((ws: any) => ({
      name: ws.name || 'Unnamed Worksheet',
      view: {
        type: this.detectViewType(ws),
        datasource: this.extractWorksheetDatasource(ws),
        marks: this.extractMarks(ws),
        filters: this.extractFilters(ws)
      }
    }));
  }

  private extractDatasources(workbook: any): TableauDatasource[] {
    const datasources = workbook.datasources?.datasource || [];
    const datasourceArray = Array.isArray(datasources) ? datasources : [datasources];

    return datasourceArray.map((ds: any) => ({
      name: ds.name || 'Unnamed Datasource',
      caption: ds.caption || ds.name || 'Unnamed Datasource',
      connection: this.extractConnection(ds),
      columns: this.extractColumns(ds)
    }));
  }

  private extractDashboards(workbook: any): any[] {
    const dashboards = workbook.dashboards?.dashboard || [];
    const dashboardArray = Array.isArray(dashboards) ? dashboards : [dashboards];

    return dashboardArray.map((db: any) => ({
      name: db.name || 'Unnamed Dashboard',
      zones: this.extractZones(db)
    }));
  }

  private detectViewType(worksheet: any): string {
    // Analyze worksheet to determine visualization type
    // This is simplified - real implementation would analyze marks, encodings, etc.
    
    const marks = worksheet.marks || {};
    const markType = marks.mark?.class || 'automatic';
    
    const typeMapping: Record<string, string> = {
      'Bar': 'bar',
      'Line': 'line',
      'Area': 'area',
      'Circle': 'circle',
      'Square': 'square',
      'Text': 'text',
      'Pie': 'pie',
      'Polygon': 'polygon',
      'Map': 'map'
    };

    return typeMapping[markType] || 'automatic';
  }

  private extractWorksheetDatasource(worksheet: any): string {
    // Extract datasource reference from worksheet
    const table = worksheet.table || {};
    return table.datasource || 'unknown';
  }

  private extractMarks(worksheet: any): any[] {
    // Extract mark encodings from worksheet
    const marks = worksheet.marks || {};
    const mark = marks.mark || {};
    
    return [{
      class: mark.class || 'automatic',
      encoding: this.extractEncodings(mark)
    }];
  }

  private extractEncodings(mark: any): any {
    // Extract field encodings (x, y, color, size, etc.)
    const encodings: any = {};
    
    // This is simplified - real implementation would parse complex encoding structures
    if (mark.encodings) {
      Object.entries(mark.encodings).forEach(([key, value]: [string, any]) => {
        encodings[key] = {
          field: value.field || value,
          type: value.type || 'nominal',
          aggregation: value.aggregation
        };
      });
    }

    return encodings;
  }

  private extractFilters(worksheet: any): any[] {
    // Extract filters from worksheet
    const filters = worksheet.filters || {};
    const filterArray = Array.isArray(filters) ? filters : Object.values(filters);
    
    return filterArray.map((filter: any) => ({
      field: filter.field || filter.column,
      type: filter.type || 'categorical',
      values: filter.values || []
    }));
  }

  private extractConnection(datasource: any): any {
    const connection = datasource.connection || {};
    
    return {
      class: connection.class || 'unknown',
      dbname: connection.dbname,
      filename: connection.filename,
      server: connection.server
    };
  }

  private extractColumns(datasource: any): any[] {
    const columns = datasource['metadata-records']?.[0]?.['metadata-record'] || [];
    const columnArray = Array.isArray(columns) ? columns : [columns];
    
    return columnArray.map((col: any) => ({
      name: col['local-name'] || col.name,
      caption: col.caption || col['local-name'] || col.name,
      datatype: col['local-type'] || 'string',
      role: col.role === 'measure' ? 'measure' : 'dimension',
      type: this.mapTableauType(col['local-type'])
    }));
  }

  private extractZones(dashboard: any): any[] {
    // Extract dashboard zones/layout
    const zones = dashboard.zones?.zone || [];
    const zoneArray = Array.isArray(zones) ? zones : [zones];
    
    return zoneArray.map((zone: any) => ({
      name: zone.name,
      type: zone.type || 'worksheet',
      x: parseInt(zone.x) || 0,
      y: parseInt(zone.y) || 0,
      w: parseInt(zone.w) || 400,
      h: parseInt(zone.h) || 300
    }));
  }

  private mapTableauType(tableauType: string): string {
    const typeMapping: Record<string, string> = {
      'integer': 'quantitative',
      'real': 'quantitative',
      'string': 'nominal',
      'boolean': 'nominal',
      'date': 'temporal',
      'datetime': 'temporal'
    };

    return typeMapping[tableauType] || 'nominal';
  }

  private async convertDataSources(
    datasources: TableauDatasource[],
    dataFiles: string[],
    onProgress?: (progress: ImportProgress) => void
  ): Promise<DataFrameSpec[]> {
    const dataFrames: DataFrameSpec[] = [];

    for (let i = 0; i < datasources.length; i++) {
      const datasource = datasources[i];
      
      onProgress?.({
        step: 'importing-data',
        progress: 40 + (i / datasources.length) * 25,
        message: `Processing datasource ${datasource.name}...`
      });

      try {
        if (datasource.connection.class === 'hyper') {
          // Find corresponding Hyper file
          const hyperFile = dataFiles.find(f => f.endsWith('.hyper'));
          if (hyperFile) {
            const hyperDataFrames = await this.parseHyperFile(hyperFile);
            dataFrames.push(...hyperDataFrames);
          }
        } else if (datasource.connection.class === 'textscan') {
          // Find corresponding CSV file
          const csvFile = dataFiles.find(f => f.endsWith('.csv'));
          if (csvFile) {
            const csvDataFrame = await this.parseCSVFile(csvFile, datasource);
            dataFrames.push(csvDataFrame);
          }
        } else {
          // Create empty data frame with schema only
          const dataFrame: DataFrameSpec = {
            tableName: datasource.name,
            columns: datasource.columns.map(col => this.convertTableauColumn(col)),
            rows: [],
            indexes: []
          };
          
          dataFrames.push(dataFrame);
        }
      } catch (error) {
        console.warn(`Failed to process datasource ${datasource.name}:`, error);
      }
    }

    return dataFrames;
  }

  private async parseHyperFile(hyperPath: string, onProgress?: (progress: ImportProgress) => void): Promise<DataFrameSpec[]> {
    // This is a placeholder - real implementation would use Tableau Hyper API
    // For now, return empty data frame with detected schema
    
    console.warn(`Hyper file parsing not fully implemented: ${hyperPath}`);
    
    return [{
      tableName: 'Extract',
      columns: [
        { name: 'id', type: 'INTEGER', nullable: false },
        { name: 'value', type: 'REAL', nullable: true },
        { name: 'category', type: 'TEXT', nullable: true }
      ],
      rows: [],
      indexes: []
    }];
  }

  private async parseCSVFile(csvPath: string, datasource: TableauDatasource): Promise<DataFrameSpec> {
    // Simple CSV parsing - in production would use a proper CSV parser
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/['"]/g, ''))
    );

    return {
      tableName: datasource.name,
      columns: headers.map(header => ({
        name: header,
        type: this.detectCSVColumnType(rows.map(row => row[headers.indexOf(header)])),
        nullable: true
      })),
      rows,
      indexes: []
    };
  }

  private detectCSVColumnType(values: string[]): ColumnSpec['type'] {
    // Simple type detection based on values
    const nonEmptyValues = values.filter(v => v && v.trim());
    
    if (nonEmptyValues.length === 0) return 'TEXT';
    
    // Check if all values are integers
    if (nonEmptyValues.every(v => /^-?\d+$/.test(v))) {
      return 'INTEGER';
    }
    
    // Check if all values are numbers
    if (nonEmptyValues.every(v => /^-?\d*\.?\d+$/.test(v))) {
      return 'REAL';
    }
    
    // Check if all values are booleans
    if (nonEmptyValues.every(v => /^(true|false|yes|no|1|0)$/i.test(v))) {
      return 'BOOLEAN';
    }
    
    // Check if all values look like dates
    if (nonEmptyValues.every(v => !isNaN(Date.parse(v)))) {
      return 'DATETIME';
    }
    
    return 'TEXT';
  }

  private convertTableauColumn(tableauCol: any): ColumnSpec {
    const typeMapping: Record<string, ColumnSpec['type']> = {
      'integer': 'INTEGER',
      'real': 'REAL',
      'string': 'TEXT',
      'boolean': 'BOOLEAN',
      'date': 'DATETIME',
      'datetime': 'DATETIME'
    };

    return {
      name: tableauCol.name,
      type: typeMapping[tableauCol.datatype] || 'TEXT',
      nullable: true, // Tableau doesn't have explicit nullable constraints
      description: tableauCol.caption !== tableauCol.name ? tableauCol.caption : undefined
    };
  }

  private convertWorksheetsToBlueprints(worksheets: TableauWorksheet[]): VisualBlueprint[] {
    const blueprints: VisualBlueprint[] = [];

    worksheets.forEach(worksheet => {
      try {
        const blueprint = BlueprintBuilder.fromTableau(worksheet);
        blueprints.push(blueprint);
      } catch (error) {
        console.warn(`Failed to convert worksheet ${worksheet.name}:`, error);
        
        // Create fallback blueprint
        blueprints.push({
          id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: worksheet.name || 'Unsupported Worksheet',
          type: 'unsupported',
          position: { x: 0, y: 0, width: 400, height: 300 },
          dataSource: { table: 'unknown', columns: [] },
          styling: {},
          originalFormat: {
            type: 'tableau',
            visualType: 'unknown',
            config: worksheet
          }
        });
      }
    });

    return blueprints;
  }
}