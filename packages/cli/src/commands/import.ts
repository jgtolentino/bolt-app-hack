/**
 * Scout CLI - Import Command
 * Import PowerBI/Tableau files and convert to Scout blueprints
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { 
  importBIFile, 
  initializeImporters,
  ImportProgress,
  ImportResult 
} from '../../../importers/index.js';
import { DashboardBlueprint } from '../schemas/blueprint.js';

export interface ImportOptions {
  toBlueprint?: boolean;
  output?: string;
  format?: 'json' | 'yaml';
  interactive?: boolean;
  verbose?: boolean;
}

export function createImportCommand(): Command {
  return new Command('import')
    .description('Import BI files to Scout format')
    .argument('<type>', 'File type (pbix, twbx, twb, pbit, pbip, hyper)')
    .argument('<file>', 'Path to BI file')
    .option('--to-blueprint', 'Generate Scout blueprint JSON')
    .option('-o, --output <path>', 'Output directory', './imported')
    .option('-f, --format <format>', 'Output format for blueprint', 'json')
    .option('-i, --interactive', 'Interactive mode for configuration')
    .option('-v, --verbose', 'Verbose output')
    .action(async (type: string, filePath: string, options: ImportOptions) => {
      await importBIFile_command(type, filePath, options);
    });
}

export async function importBIFile_command(
  type: string, 
  filePath: string, 
  options: ImportOptions
): Promise<void> {
  const spinner = ora();
  
  try {
    // Initialize importers
    initializeImporters();
    
    // Validate input file
    spinner.start('Validating input file...');
    
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const fileStats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Validate file type
    const supportedExtensions = ['.pbix', '.pbit', '.pbip', '.twb', '.twbx', '.hyper'];
    if (!supportedExtensions.includes(fileExt)) {
      throw new Error(`Unsupported file type: ${fileExt}`);
    }
    
    spinner.succeed(`File validated (${formatBytes(fileStats.size)})`);
    
    // Progress tracking
    const progressCallback = (progress: ImportProgress) => {
      if (progress.step === 'parsing') {
        spinner.text = `Parsing ${fileName}...`;
      } else if (progress.step === 'extracting') {
        spinner.text = `Extracting data (${progress.progress}%)...`;
      } else if (progress.step === 'transforming') {
        spinner.text = 'Transforming visuals...';
      } else if (progress.step === 'generating') {
        spinner.text = 'Generating blueprints...';
      }
      
      if (options.verbose && progress.errors && progress.errors.length > 0) {
        progress.errors.forEach(error => {
          console.warn(chalk.yellow(`  ⚠ ${error.message}`));
        });
      }
    };
    
    // Import the file
    spinner.start(`Importing ${fileName}...`);
    
    const result: ImportResult = await importBIFile(filePath, progressCallback);
    
    if (!result.success) {
      spinner.fail('Import failed');
      console.error(chalk.red('Import errors:'));
      result.errors?.forEach(error => {
        console.error(chalk.red(`  • ${error.message}`));
      });
      return;
    }
    
    spinner.succeed('Import completed');
    
    // Create output directory
    const outputDir = path.resolve(options.output || './imported');
    await fs.ensureDir(outputDir);
    
    // Summary
    console.log(chalk.cyan('\n📊 Import Summary:'));
    console.log(`  Source: ${fileName}`);
    console.log(`  Tables: ${result.dataFrames.length}`);
    console.log(`  Visuals: ${result.blueprints.length}`);
    console.log(`  Supported: ${result.blueprints.filter(b => b.type !== 'unsupported').length}`);
    console.log(`  Unsupported: ${result.metadata.unsupportedVisualsCount}`);
    
    // Save data tables
    if (result.dataFrames.length > 0) {
      spinner.start('Saving data tables...');
      
      const dataDir = path.join(outputDir, 'data');
      await fs.ensureDir(dataDir);
      
      for (const dataFrame of result.dataFrames) {
        const tablePath = path.join(dataDir, `${dataFrame.tableName}.json`);
        await fs.writeJSON(tablePath, {
          tableName: dataFrame.tableName,
          columns: dataFrame.columns,
          rows: dataFrame.rows,
          primaryKey: dataFrame.primaryKey,
          metadata: {
            rowCount: dataFrame.rows.length,
            columnCount: dataFrame.columns.length,
            importedAt: new Date().toISOString()
          }
        }, { spaces: 2 });
      }
      
      spinner.succeed(`Saved ${result.dataFrames.length} data tables`);
    }
    
    // Generate Scout blueprint if requested
    if (options.toBlueprint) {
      spinner.start('Generating Scout blueprint...');
      
      const blueprint = await generateScoutBlueprint(result, fileName, options);
      
      const blueprintFileName = options.format === 'yaml' 
        ? 'dashboard.yaml' 
        : 'dashboard.json';
      const blueprintPath = path.join(outputDir, blueprintFileName);
      
      if (options.format === 'yaml') {
        const yaml = await import('yaml');
        await fs.writeFile(blueprintPath, yaml.stringify(blueprint));
      } else {
        await fs.writeJSON(blueprintPath, blueprint, { spaces: 2 });
      }
      
      spinner.succeed(`Blueprint generated: ${blueprintFileName}`);
      
      // Generate build script
      const buildScript = generateBuildScript(blueprint, options);
      await fs.writeFile(path.join(outputDir, 'build.sh'), buildScript);
      await fs.chmod(path.join(outputDir, 'build.sh'), '755');
    }
    
    // Save visual blueprints
    if (result.blueprints.length > 0) {
      const visualsDir = path.join(outputDir, 'visuals');
      await fs.ensureDir(visualsDir);
      
      for (const visual of result.blueprints) {
        const visualPath = path.join(visualsDir, `${visual.id}.json`);
        await fs.writeJSON(visualPath, visual, { spaces: 2 });
      }
    }
    
    // Save metadata
    const metadataPath = path.join(outputDir, 'metadata.json');
    await fs.writeJSON(metadataPath, {
      ...result.metadata,
      importedAt: new Date().toISOString(),
      importedBy: 'scout-cli',
      originalFile: fileName
    }, { spaces: 2 });
    
    // Success summary
    console.log(chalk.green('\n🎉 Import completed successfully!'));
    console.log(`📂 Output directory: ${outputDir}`);
    
    if (options.toBlueprint) {
      console.log(chalk.blue('\n🚀 Next steps:'));
      console.log(`  1. Review the generated blueprint: ${outputDir}/dashboard.json`);
      console.log(`  2. Build dashboard: cd ${outputDir} && ./build.sh`);
      console.log(`  3. Test locally before publishing`);
    }
    
    // Show warnings for unsupported visuals
    if (result.metadata.unsupportedVisualsCount > 0) {
      console.log(chalk.yellow('\n⚠ Unsupported Visuals:'));
      result.blueprints
        .filter(b => b.type === 'unsupported')
        .forEach(visual => {
          console.log(chalk.yellow(`  • ${visual.name}: ${visual.originalFormat?.visualType}`));
        });
      console.log(chalk.gray('These will be displayed as static images in Scout'));
    }
    
  } catch (error) {
    spinner.fail('Import failed');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function generateScoutBlueprint(
  result: ImportResult, 
  fileName: string, 
  options: ImportOptions
): Promise<DashboardBlueprint> {
  const blueprint: DashboardBlueprint = {
    version: '3.0',
    title: `Imported Dashboard - ${path.basename(fileName, path.extname(fileName))}`,
    description: `Dashboard imported from ${fileName}`,
    author: 'Scout CLI Import',
    tags: ['imported', result.metadata.fileType],
    
    layout: 'grid',
    columns: 12,
    rowHeight: 100,
    margin: [10, 10],
    padding: [20, 20],
    
    datasource: {
      type: 'static',
      connection: 'imported-data',
      cache: true
    },
    
    charts: result.blueprints.map((visual, index) => ({
      id: visual.id,
      type: visual.type === 'unsupported' ? 'table.basic' : visual.type as any,
      title: visual.name,
      description: visual.description,
      query: generateQueryFromVisual(visual, result.dataFrames),
      
      position: {
        x: (index % 3) * 4,
        y: Math.floor(index / 3) * 4,
        w: 4,
        h: 4
      },
      
      encoding: visual.encoding ? {
        x: visual.encoding.x ? {
          field: visual.encoding.x.field,
          type: visual.encoding.x.type as any,
          aggregate: visual.encoding.x.aggregate as any
        } : undefined,
        y: visual.encoding.y ? {
          field: visual.encoding.y.field,
          type: visual.encoding.y.type as any,
          aggregate: visual.encoding.y.aggregate as any
        } : undefined,
        color: visual.encoding.color ? {
          field: visual.encoding.color.field,
          type: visual.encoding.color.type as any
        } : undefined
      } : undefined,
      
      style: {
        theme: 'default',
        showGrid: true,
        showLegend: true,
        showTooltip: true
      }
    })),
    
    filters: [],
    
    settings: {
      theme: 'light',
      showTitle: true,
      showFilters: false,
      allowExport: true,
      allowEdit: false,
      responsive: true
    },
    
    plugins: [],
    connectors: [{ name: 'static' }],
    
    deployment: {
      target: ['desktop', 'web'],
      publish: {
        channel: 'beta',
        visibility: 'private'
      }
    }
  };
  
  return blueprint;
}

function generateQueryFromVisual(visual: any, dataFrames: any[]): string {
  if (visual.dataSource && visual.dataSource.table) {
    const table = visual.dataSource.table;
    const columns = visual.dataSource.columns || ['*'];
    
    let query = `SELECT ${columns.join(', ')} FROM ${table}`;
    
    if (visual.dataSource.filters && visual.dataSource.filters.length > 0) {
      const whereClause = visual.dataSource.filters
        .map((f: any) => `${f.field} ${f.operator} '${f.value}'`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
    }
    
    if (visual.dataSource.aggregations && visual.dataSource.aggregations.length > 0) {
      const groupBy = visual.dataSource.aggregations
        .filter((a: any) => a.type === 'group')
        .map((a: any) => a.field);
      
      if (groupBy.length > 0) {
        query += ` GROUP BY ${groupBy.join(', ')}`;
      }
    }
    
    return query;
  }
  
  // Fallback to first available table
  const firstTable = dataFrames[0]?.tableName || 'data';
  return `SELECT * FROM ${firstTable}`;
}

function generateBuildScript(blueprint: DashboardBlueprint, options: ImportOptions): string {
  return `#!/bin/bash

# Scout Dashboard Build Script
# Generated by scout-cli import

echo "🏗️  Building imported dashboard: ${blueprint.title}"

# Build the dashboard
scout dash build dashboard.json \\
  --output ./dist \\
  --target both \\
  --verbose

echo "✅ Build completed"
echo "📂 Output in ./dist"
echo ""
echo "🚀 Next steps:"
echo "  1. Test: Open ./dist in Scout Desktop"
echo "  2. Publish: scout dash publish ./dist"
`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}