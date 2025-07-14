/**
 * PowerBI Importer
 * Handles .pbix, .pbit, and .pbip files using pbi-tools and direct parsing
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { pipeline } from 'stream';
import unzipper from 'unzipper';
import { 
  Importer, 
  ImportResult, 
  ImportProgress, 
  ImportError,
  DataFrameSpec,
  VisualBlueprint,
  PowerBIModel,
  PowerBITable,
  ColumnSpec
} from '../types';
import { BlueprintBuilder } from '../common/BlueprintBuilder';

const pipelineAsync = promisify(pipeline);

export class PowerBIImporter implements Importer {
  readonly name = 'PowerBI';
  readonly supportedExtensions = ['.pbix', '.pbit', '.pbip'];

  private readonly config = {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    timeoutMs: 300000, // 5 minutes
    tempDir: process.env.TEMP || '/tmp',
    pbiToolsPath: 'pbi-tools' // Assumes pbi-tools is in PATH
  };

  match(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.supportedExtensions.includes(ext);
  }

  async validate(filePath: string): Promise<{ valid: boolean; errors: ImportError[] }> {
    const errors: ImportError[] = [];

    try {
      // Check file exists and size
      const stats = fs.statSync(filePath);
      
      if (stats.size > this.config.maxFileSize) {
        errors.push({
          code: 'FILE_TOO_LARGE',
          message: `File size ${Math.round(stats.size / 1024 / 1024)}MB exceeds limit of ${Math.round(this.config.maxFileSize / 1024 / 1024)}MB`,
          severity: 'error'
        });
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (!this.supportedExtensions.includes(ext)) {
        errors.push({
          code: 'UNSUPPORTED_EXTENSION',
          message: `Extension ${ext} is not supported by PowerBI importer`,
          severity: 'error'
        });
      }

      // For PBIP, check if it's a directory
      if (ext === '.pbip') {
        const isDirectory = stats.isDirectory();
        if (!isDirectory) {
          errors.push({
            code: 'INVALID_PBIP',
            message: 'PBIP must be a directory containing model.bim file',
            severity: 'error'
          });
        } else {
          // Check for model.bim
          const modelPath = path.join(filePath, 'model.bim');
          if (!fs.existsSync(modelPath)) {
            errors.push({
              code: 'MISSING_MODEL_FILE',
              message: 'PBIP directory missing model.bim file',
              severity: 'error'
            });
          }
        }
      }

      // For encrypted files, we can detect but not import
      if (ext === '.pbix' || ext === '.pbit') {
        try {
          await this.checkIfEncrypted(filePath);
        } catch (error: any) {
          if (error.message.includes('encrypted')) {
            errors.push({
              code: 'ENCRYPTED_FILE',
              message: 'Encrypted PowerBI files cannot be imported',
              severity: 'error'
            });
          }
        }
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
        message: `Extracting ${fileName}...`
      });

      let model: PowerBIModel;
      let layoutData: any = null;
      
      if (ext === '.pbip') {
        // Direct PBIP parsing (faster path)
        model = await this.parsePBIP(filePath);
      } else {
        // Use pbi-tools for .pbix/.pbit
        const extractedPath = await this.extractWithPbiTools(filePath, onProgress);
        model = await this.parseExtractedModel(extractedPath);
        layoutData = await this.parseLayoutData(extractedPath);
      }

      onProgress?.({
        step: 'parsing-schema',
        progress: 30,
        message: 'Parsing data model...'
      });

      // Convert tables to DataFrameSpec
      const dataFrames = await this.convertTablesToDataFrames(model, onProgress);

      onProgress?.({
        step: 'mapping-visuals',
        progress: 60,
        message: 'Mapping visual layouts...'
      });

      // Convert visuals to blueprints
      const blueprints = this.convertVisualsToBlueprints(layoutData);

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
          unsupportedVisualsCount: blueprints.filter(b => b.type === 'unsupported').length,
          version: model.name || 'Unknown',
          relationships: this.convertRelationships(model),
          measures: this.convertMeasures(model)
        }
      };

      onProgress?.({
        step: 'complete',
        progress: 100,
        message: `Import completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`
      });

      return result;

    } catch (error: any) {
      console.error('PowerBI import failed:', error);

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

  private async checkIfEncrypted(filePath: string): Promise<void> {
    // Quick check by trying to read as zip
    try {
      const directory = await unzipper.Open.file(filePath);
      const entries = directory.files;
      
      // If we can't find expected files, might be encrypted
      const hasDataModel = entries.some(f => f.path.includes('DataModel'));
      const hasLayout = entries.some(f => f.path.includes('Layout'));
      
      if (!hasDataModel && !hasLayout) {
        throw new Error('File appears to be encrypted or corrupted');
      }
    } catch (error: any) {
      if (error.message.includes('wrong password') || error.message.includes('encrypted')) {
        throw new Error('File is encrypted and cannot be imported');
      }
      // Other errors might not be encryption-related
    }
  }

  private async extractWithPbiTools(
    filePath: string,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<string> {
    const tempDir = path.join(this.config.tempDir, `pbix_extract_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    return new Promise((resolve, reject) => {
      const args = ['extract', filePath, '--output', tempDir];
      const child = spawn(this.config.pbiToolsPath, args);

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(tempDir);
        } else {
          // Clean up on failure
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch {}
          
          reject(new Error(`pbi-tools extraction failed: ${stderr || stdout}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to run pbi-tools: ${error.message}. Ensure pbi-tools is installed and in PATH.`));
      });

      // Timeout handling
      setTimeout(() => {
        child.kill();
        reject(new Error('pbi-tools extraction timed out'));
      }, this.config.timeoutMs);
    });
  }

  private async parsePBIP(pbipPath: string): Promise<PowerBIModel> {
    const modelPath = path.join(pbipPath, 'model.bim');
    const modelData = fs.readFileSync(modelPath, 'utf8');
    
    try {
      const model = JSON.parse(modelData);
      return this.normalizeModel(model);
    } catch (error: any) {
      throw new Error(`Failed to parse PBIP model: ${error.message}`);
    }
  }

  private async parseExtractedModel(extractedPath: string): Promise<PowerBIModel> {
    const modelPath = path.join(extractedPath, 'Model', 'DataModelSchema.json');
    
    if (!fs.existsSync(modelPath)) {
      throw new Error('DataModelSchema.json not found in extracted files');
    }

    const modelData = fs.readFileSync(modelPath, 'utf8');
    
    try {
      const model = JSON.parse(modelData);
      return this.normalizeModel(model.model || model);
    } catch (error: any) {
      throw new Error(`Failed to parse model schema: ${error.message}`);
    }
  }

  private async parseLayoutData(extractedPath: string): Promise<any> {
    const layoutPath = path.join(extractedPath, 'Report', 'Layout.json');
    
    if (!fs.existsSync(layoutPath)) {
      console.warn('Layout.json not found, skipping visual import');
      return null;
    }

    try {
      const layoutData = fs.readFileSync(layoutPath, 'utf8');
      return JSON.parse(layoutData);
    } catch (error: any) {
      console.warn(`Failed to parse layout data: ${error.message}`);
      return null;
    }
  }

  private normalizeModel(rawModel: any): PowerBIModel {
    return {
      name: rawModel.name || 'PowerBI Model',
      culture: rawModel.culture || 'en-US',
      tables: (rawModel.tables || []).map(this.normalizeTable),
      relationships: rawModel.relationships || [],
      expressions: rawModel.expressions || []
    };
  }

  private normalizeTable(rawTable: any): PowerBITable {
    return {
      name: rawTable.name,
      columns: (rawTable.columns || []).map(col => ({
        name: col.name,
        dataType: col.dataType || 'string',
        isHidden: col.isHidden || false,
        formatString: col.formatString,
        description: col.description
      })),
      partitions: rawTable.partitions || [],
      measures: rawTable.measures || []
    };
  }

  private async convertTablesToDataFrames(
    model: PowerBIModel,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<DataFrameSpec[]> {
    const dataFrames: DataFrameSpec[] = [];

    for (let i = 0; i < model.tables.length; i++) {
      const table = model.tables[i];
      
      onProgress?.({
        step: 'importing-data',
        progress: 40 + (i / model.tables.length) * 20,
        message: `Processing table ${table.name}...`
      });

      const dataFrame: DataFrameSpec = {
        tableName: table.name,
        columns: table.columns.map(col => this.convertColumn(col)),
        rows: await this.extractTableData(table),
        indexes: []
      };

      // Add primary key if we can detect one
      const pkColumn = table.columns.find(col => 
        col.name.toLowerCase().includes('id') || 
        col.name.toLowerCase().includes('key')
      );
      
      if (pkColumn) {
        dataFrame.primaryKey = pkColumn.name;
      }

      dataFrames.push(dataFrame);
    }

    return dataFrames;
  }

  private convertColumn(powerbiCol: any): ColumnSpec {
    // Map PowerBI data types to SQLite types
    const typeMapping: Record<string, ColumnSpec['type']> = {
      'int64': 'INTEGER',
      'double': 'REAL',
      'string': 'TEXT',
      'boolean': 'BOOLEAN',
      'dateTime': 'DATETIME',
      'decimal': 'REAL',
      'binary': 'BLOB'
    };

    return {
      name: powerbiCol.name,
      type: typeMapping[powerbiCol.dataType] || 'TEXT',
      nullable: !powerbiCol.isKey, // Assume keys are not nullable
      description: powerbiCol.description
    };
  }

  private async extractTableData(table: PowerBITable): Promise<any[][]> {
    // For now, return empty data since extracting actual data from PBIX
    // requires more complex parsing of the binary data model
    // In a full implementation, this would:
    // 1. Use pbi-tools to export CSV data per table
    // 2. Parse the CSV and convert to row arrays
    // 3. Handle data type conversions
    
    console.warn(`Data extraction not implemented for table ${table.name}, returning empty data`);
    return [];
  }

  private convertVisualsToBlueprints(layoutData: any): VisualBlueprint[] {
    if (!layoutData) return [];

    const blueprints: VisualBlueprint[] = [];

    try {
      // PowerBI layout structure varies, but generally has sections with visual containers
      const sections = layoutData.sections || [];
      
      sections.forEach((section: any) => {
        const visualContainers = section.visualContainers || [];
        
        visualContainers.forEach((container: any) => {
          try {
            const blueprint = BlueprintBuilder.fromPowerBI(container);
            blueprints.push(blueprint);
          } catch (error) {
            console.warn(`Failed to convert visual:`, error);
            
            // Create fallback blueprint for unsupported visual
            blueprints.push({
              id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: 'Unsupported Visual',
              type: 'unsupported',
              position: { x: 0, y: 0, width: 400, height: 300 },
              dataSource: { table: 'unknown', columns: [] },
              styling: {},
              originalFormat: {
                type: 'powerbi',
                visualType: 'unknown',
                config: container
              }
            });
          }
        });
      });
    } catch (error) {
      console.warn('Failed to parse visual layouts:', error);
    }

    return blueprints;
  }

  private convertRelationships(model: PowerBIModel): any[] {
    return model.relationships.map(rel => ({
      fromTable: rel.fromTable,
      fromColumn: rel.fromColumn,
      toTable: rel.toTable,
      toColumn: rel.toColumn,
      cardinality: this.mapCardinality(rel.crossFilteringBehavior),
      crossFilterDirection: rel.crossFilteringBehavior === 'bothDirections' ? 'both' : 'single'
    }));
  }

  private convertMeasures(model: PowerBIModel): any[] {
    const measures: any[] = [];
    
    model.tables.forEach(table => {
      table.measures?.forEach(measure => {
        measures.push({
          name: measure.name,
          expression: measure.expression,
          description: measure.description,
          formatString: measure.formatString
        });
      });
    });

    return measures;
  }

  private mapCardinality(crossFiltering: string): string {
    // Simplified mapping - in reality, PowerBI has more complex cardinality rules
    switch (crossFiltering) {
      case 'oneToMany': return 'one-to-many';
      case 'manyToOne': return 'many-to-one';
      case 'oneToOne': return 'one-to-one';
      default: return 'many-to-many';
    }
  }
}