/**
 * Scout BI File Importers
 * Main export point for all importer functionality
 */

// Core types and interfaces
export * from './types';

// Registry
export { ImporterRegistry, importerRegistry } from './ImporterRegistry';

// Importers
export { PowerBIImporter } from './powerbi/PowerBIImporter';
export { TableauImporter } from './tableau/TableauImporter';

// Blueprint builder
export { BlueprintBuilder } from './common/BlueprintBuilder';

// Main initialization function
import { importerRegistry } from './ImporterRegistry';
import { PowerBIImporter } from './powerbi/PowerBIImporter';
import { TableauImporter } from './tableau/TableauImporter';

/**
 * Initialize all importers and register them
 */
export function initializeImporters(): void {
  // Register PowerBI importer
  importerRegistry.register(new PowerBIImporter());
  
  // Register Tableau importer
  importerRegistry.register(new TableauImporter());
  
  console.log('📥 Initialized BI file importers:', importerRegistry.getSupportedExtensions().join(', '));
}

/**
 * Quick import function for single files
 */
export async function importBIFile(
  filePath: string,
  onProgress?: (progress: import('./types').ImportProgress) => void
): Promise<import('./types').ImportResult> {
  return await importerRegistry.importFile(filePath, onProgress);
}

/**
 * Get information about supported file types
 */
export function getSupportedFileTypes(): Array<{
  extension: string;
  description: string;
  importer: string;
}> {
  const importers = importerRegistry.getImporterInfo();
  const fileTypes: Array<{ extension: string; description: string; importer: string }> = [];
  
  importers.forEach(importer => {
    importer.extensions.forEach(ext => {
      fileTypes.push({
        extension: ext,
        description: getFileTypeDescription(ext),
        importer: importer.name
      });
    });
  });
  
  return fileTypes.sort((a, b) => a.extension.localeCompare(b.extension));
}

function getFileTypeDescription(extension: string): string {
  const descriptions: Record<string, string> = {
    '.pbix': 'PowerBI Report File',
    '.pbit': 'PowerBI Template File',
    '.pbip': 'PowerBI Project Folder',
    '.twb': 'Tableau Workbook File',
    '.twbx': 'Tableau Packaged Workbook',
    '.hyper': 'Tableau Extract File'
  };
  
  return descriptions[extension] || `${extension.toUpperCase()} File`;
}

// Auto-initialize when module is imported
initializeImporters();