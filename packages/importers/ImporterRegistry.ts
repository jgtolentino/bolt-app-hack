/**
 * Scout Importer Registry
 * Central registry for all BI file importers
 */

import path from 'path';
import { Importer, ImporterRegistry as IImporterRegistry, ImportError } from './types';

export class ImporterRegistry implements IImporterRegistry {
  private importers: Map<string, Importer> = new Map();

  register(importer: Importer): void {
    if (this.importers.has(importer.name)) {
      throw new Error(`Importer '${importer.name}' is already registered`);
    }

    this.importers.set(importer.name, importer);
    console.log(`📥 Registered importer: ${importer.name} (${importer.supportedExtensions.join(', ')})`);
  }

  unregister(importerName: string): void {
    if (this.importers.delete(importerName)) {
      console.log(`📤 Unregistered importer: ${importerName}`);
    }
  }

  getImporter(filePath: string): Importer | null {
    const extension = path.extname(filePath).toLowerCase();
    
    for (const importer of this.importers.values()) {
      if (importer.match(filePath)) {
        return importer;
      }
    }

    return null;
  }

  getSupportedExtensions(): string[] {
    const extensions = new Set<string>();
    
    for (const importer of this.importers.values()) {
      importer.supportedExtensions.forEach(ext => extensions.add(ext));
    }

    return Array.from(extensions).sort();
  }

  listImporters(): Importer[] {
    return Array.from(this.importers.values());
  }

  /**
   * Validate and import a file using the appropriate importer
   */
  async importFile(
    filePath: string,
    onProgress?: (progress: import('./types').ImportProgress) => void
  ): Promise<import('./types').ImportResult> {
    const importer = this.getImporter(filePath);
    
    if (!importer) {
      const extension = path.extname(filePath).toLowerCase();
      const supportedExts = this.getSupportedExtensions();
      
      return {
        success: false,
        dataFrames: [],
        blueprints: [],
        metadata: {
          sourceFile: filePath,
          fileType: extension.slice(1) as any,
          importedAt: new Date(),
          originalFileSize: 0,
          tablesCount: 0,
          visualsCount: 0,
          unsupportedVisualsCount: 0
        },
        errors: [{
          code: 'UNSUPPORTED_FORMAT',
          message: `File format '${extension}' is not supported. Supported formats: ${supportedExts.join(', ')}`,
          severity: 'error'
        }]
      };
    }

    try {
      // Validate first
      onProgress?.({
        step: 'validating',
        progress: 0,
        message: `Validating ${path.basename(filePath)}...`
      });

      const validation = await importer.validate(filePath);
      if (!validation.valid) {
        return {
          success: false,
          dataFrames: [],
          blueprints: [],
          metadata: {
            sourceFile: filePath,
            fileType: path.extname(filePath).slice(1) as any,
            importedAt: new Date(),
            originalFileSize: 0,
            tablesCount: 0,
            visualsCount: 0,
            unsupportedVisualsCount: 0
          },
          errors: validation.errors
        };
      }

      // Import
      return await importer.import(filePath, onProgress);
    } catch (error: any) {
      console.error(`Import failed for ${filePath}:`, error);
      
      return {
        success: false,
        dataFrames: [],
        blueprints: [],
        metadata: {
          sourceFile: filePath,
          fileType: path.extname(filePath).slice(1) as any,
          importedAt: new Date(),
          originalFileSize: 0,
          tablesCount: 0,
          visualsCount: 0,
          unsupportedVisualsCount: 0
        },
        errors: [{
          code: 'IMPORT_FAILED',
          message: `Import failed: ${error.message}`,
          severity: 'error',
          context: { stack: error.stack }
        }]
      };
    }
  }

  /**
   * Get detailed information about all registered importers
   */
  getImporterInfo(): Array<{
    name: string;
    extensions: string[];
    description: string;
    capabilities: string[];
  }> {
    return this.listImporters().map(importer => ({
      name: importer.name,
      extensions: importer.supportedExtensions,
      description: this.getImporterDescription(importer),
      capabilities: this.getImporterCapabilities(importer)
    }));
  }

  private getImporterDescription(importer: Importer): string {
    switch (importer.name) {
      case 'PowerBI':
        return 'Import PowerBI files (.pbix, .pbit, .pbip) including datasets and visual layouts';
      case 'Tableau':
        return 'Import Tableau workbooks (.twb, .twbx, .hyper) with data and visualizations';
      default:
        return `Import ${importer.name} files`;
    }
  }

  private getImporterCapabilities(importer: Importer): string[] {
    const capabilities = ['Data Import', 'Schema Detection'];
    
    if (importer.name === 'PowerBI') {
      capabilities.push('DAX Expressions', 'Relationships', 'Measures', 'Visual Mapping');
    }
    
    if (importer.name === 'Tableau') {
      capabilities.push('Calculated Fields', 'Hyper Files', 'XML Parsing', 'Dashboard Layout');
    }
    
    return capabilities;
  }
}

// Singleton registry instance
export const importerRegistry = new ImporterRegistry();