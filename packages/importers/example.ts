/**
 * Scout BI Importers - Usage Examples
 * Demonstrates how to import PowerBI and Tableau files
 */

import { 
  importBIFile, 
  initializeImporters, 
  importerRegistry,
  PowerBIImporter,
  TableauImporter,
  getSupportedFileTypes,
  ImportResult,
  ImportProgress
} from './index';

// Initialize importers
initializeImporters();

/**
 * Example 1: Basic file import
 */
async function basicImportExample() {
  console.log('🚀 Example 1: Basic Import');
  
  try {
    // Import a PowerBI file
    const result = await importBIFile('./sample-data/sales-report.pbix');
    
    if (result.success) {
      console.log(`✅ Import successful!`);
      console.log(`📊 Tables: ${result.dataFrames.length}`);
      console.log(`📈 Visuals: ${result.blueprints.length}`);
      console.log(`⚠️  Unsupported: ${result.metadata.unsupportedVisualsCount}`);
      
      // Show table information
      result.dataFrames.forEach(df => {
        console.log(`  📋 ${df.tableName}: ${df.rows.length} rows, ${df.columns.length} columns`);
      });
      
      // Show visual information
      result.blueprints.forEach(bp => {
        console.log(`  📊 ${bp.name}: ${bp.type}`);
      });
    } else {
      console.log('❌ Import failed');
      result.errors?.forEach(error => {
        console.log(`  ${error.severity}: ${error.message}`);
      });
    }
  } catch (error) {
    console.error('Import failed:', error);
  }
}

/**
 * Example 2: Import with progress tracking
 */
async function progressTrackingExample() {
  console.log('🚀 Example 2: Progress Tracking');
  
  const progressCallback = (progress: ImportProgress) => {
    const progressBar = '█'.repeat(Math.floor(progress.progress / 5)) + 
                       '░'.repeat(20 - Math.floor(progress.progress / 5));
    
    console.log(`[${progressBar}] ${progress.progress}% - ${progress.step}: ${progress.message}`);
    
    if (progress.errors && progress.errors.length > 0) {
      progress.errors.forEach(error => {
        console.log(`  ⚠️  ${error.message}`);
      });
    }
  };
  
  try {
    const result = await importBIFile('./sample-data/tableau-dashboard.twbx', progressCallback);
    console.log(result.success ? '✅ Import completed!' : '❌ Import failed');
  } catch (error) {
    console.error('Import failed:', error);
  }
}

/**
 * Example 3: Batch import multiple files
 */
async function batchImportExample() {
  console.log('🚀 Example 3: Batch Import');
  
  const files = [
    './sample-data/sales-report.pbix',
    './sample-data/marketing-dashboard.twb',
    './sample-data/customer-analysis.pbip',
    './sample-data/revenue-extract.hyper'
  ];
  
  const results: ImportResult[] = [];
  
  for (const filePath of files) {
    console.log(`\n📥 Importing ${filePath}...`);
    
    try {
      const result = await importBIFile(filePath, (progress) => {
        if (progress.step === 'complete') {
          console.log(`  ✅ ${progress.message}`);
        }
      });
      
      results.push(result);
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n📊 Batch Import Summary:`);
  console.log(`  ✅ Successful: ${successful.length}`);
  console.log(`  ❌ Failed: ${failed.length}`);
  console.log(`  📋 Total Tables: ${successful.reduce((sum, r) => sum + r.dataFrames.length, 0)}`);
  console.log(`  📈 Total Visuals: ${successful.reduce((sum, r) => sum + r.blueprints.length, 0)}`);
}

/**
 * Example 4: Custom importer registry
 */
async function customRegistryExample() {
  console.log('🚀 Example 4: Custom Registry');
  
  // Create custom registry
  const customRegistry = new ImporterRegistry();
  
  // Register only specific importers
  customRegistry.register(new PowerBIImporter());
  // customRegistry.register(new TableauImporter()); // Skip Tableau
  
  console.log('Supported extensions:', customRegistry.getSupportedExtensions());
  
  // Try to import Tableau file (should fail)
  try {
    const result = await customRegistry.importFile('./sample-data/tableau-dashboard.twb');
    console.log('Result:', result.success ? 'Success' : 'Failed');
    
    if (!result.success) {
      result.errors?.forEach(error => {
        console.log(`  ${error.code}: ${error.message}`);
      });
    }
  } catch (error) {
    console.error('Import failed:', error);
  }
}

/**
 * Example 5: Exploring imported data
 */
async function dataExplorationExample() {
  console.log('🚀 Example 5: Data Exploration');
  
  const result = await importBIFile('./sample-data/sales-report.pbix');
  
  if (!result.success) {
    console.log('❌ Import failed, cannot explore data');
    return;
  }
  
  console.log('📊 Data Exploration Results:');
  
  // Explore tables
  result.dataFrames.forEach(df => {
    console.log(`\n📋 Table: ${df.tableName}`);
    console.log(`  Columns: ${df.columns.length}`);
    console.log(`  Rows: ${df.rows.length}`);
    console.log(`  Primary Key: ${df.primaryKey || 'None'}`);
    
    // Show column details
    df.columns.forEach(col => {
      console.log(`    ${col.name}: ${col.type}${col.nullable ? ' (nullable)' : ''}`);
    });
    
    // Show sample data (first 3 rows)
    if (df.rows.length > 0) {
      console.log(`  Sample data:`);
      df.rows.slice(0, 3).forEach((row, i) => {
        const rowData = df.columns.map((col, j) => `${col.name}=${row[j]}`).join(', ');
        console.log(`    Row ${i + 1}: ${rowData}`);
      });
    }
  });
  
  // Explore visuals
  console.log(`\n📈 Visual Blueprints:`);
  result.blueprints.forEach(bp => {
    console.log(`  ${bp.name} (${bp.type})`);
    console.log(`    Position: ${bp.position.x},${bp.position.y} (${bp.position.width}x${bp.position.height})`);
    console.log(`    Data Source: ${bp.dataSource.table}`);
    console.log(`    Columns: ${bp.dataSource.columns.join(', ')}`);
    
    if (bp.dataSource.filters && bp.dataSource.filters.length > 0) {
      console.log(`    Filters: ${bp.dataSource.filters.length}`);
    }
    
    if (bp.dataSource.aggregations && bp.dataSource.aggregations.length > 0) {
      console.log(`    Aggregations: ${bp.dataSource.aggregations.length}`);
    }
    
    if (bp.type === 'unsupported') {
      console.log(`    ⚠️  Original type: ${bp.originalFormat?.visualType}`);
      console.log(`    📸 Fallback image available: ${!!bp.fallbackImage}`);
    }
  });
  
  // Explore metadata
  console.log(`\n📄 Metadata:`);
  console.log(`  Source: ${result.metadata.sourceFile}`);
  console.log(`  Type: ${result.metadata.fileType}`);
  console.log(`  Size: ${(result.metadata.originalFileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Import Time: ${result.metadata.importedAt.toISOString()}`);
  
  if (result.metadata.relationships && result.metadata.relationships.length > 0) {
    console.log(`  Relationships: ${result.metadata.relationships.length}`);
    result.metadata.relationships.forEach(rel => {
      console.log(`    ${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn} (${rel.cardinality})`);
    });
  }
  
  if (result.metadata.measures && result.metadata.measures.length > 0) {
    console.log(`  Measures: ${result.metadata.measures.length}`);
    result.metadata.measures.forEach(measure => {
      console.log(`    ${measure.name}: ${measure.expression}`);
    });
  }
}

/**
 * Example 6: Error handling and validation
 */
async function errorHandlingExample() {
  console.log('🚀 Example 6: Error Handling');
  
  const testFiles = [
    './sample-data/corrupted-file.pbix',
    './sample-data/encrypted-file.pbix',
    './sample-data/too-large-file.twbx',
    './sample-data/unsupported-format.xlsx'
  ];
  
  for (const filePath of testFiles) {
    console.log(`\n🔍 Testing ${filePath}...`);
    
    try {
      // Get appropriate importer
      const importer = importerRegistry.getImporter(filePath);
      
      if (!importer) {
        console.log(`  ❌ No importer found for this file type`);
        continue;
      }
      
      console.log(`  📥 Using ${importer.name} importer`);
      
      // Validate first
      const validation = await importer.validate(filePath);
      
      if (!validation.valid) {
        console.log(`  ❌ Validation failed:`);
        validation.errors.forEach(error => {
          console.log(`    ${error.severity}: ${error.message}`);
        });
        continue;
      }
      
      console.log(`  ✅ Validation passed`);
      
      // Try import
      const result = await importer.import(filePath);
      
      if (result.success) {
        console.log(`  ✅ Import successful`);
      } else {
        console.log(`  ❌ Import failed:`);
        result.errors?.forEach(error => {
          console.log(`    ${error.code}: ${error.message}`);
        });
      }
      
    } catch (error) {
      console.log(`  💥 Exception: ${error.message}`);
    }
  }
}

/**
 * Example 7: File type detection and capabilities
 */
async function fileTypeDetectionExample() {
  console.log('🚀 Example 7: File Type Detection');
  
  // Show supported file types
  const supportedTypes = getSupportedFileTypes();
  
  console.log('📋 Supported File Types:');
  supportedTypes.forEach(type => {
    console.log(`  ${type.extension}: ${type.description} (${type.importer})`);
  });
  
  // Show importer capabilities
  console.log('\n🔧 Importer Capabilities:');
  const importerInfo = importerRegistry.getImporterInfo();
  
  importerInfo.forEach(info => {
    console.log(`\n  ${info.name}:`);
    console.log(`    Extensions: ${info.extensions.join(', ')}`);
    console.log(`    Description: ${info.description}`);
    console.log(`    Capabilities: ${info.capabilities.join(', ')}`);
  });
  
  // Test file detection
  const testFiles = [
    'report.pbix',
    'dashboard.twb',
    'data.hyper',
    'template.pbit',
    'workbook.twbx',
    'project.pbip',
    'unknown.xlsx'
  ];
  
  console.log('\n🔍 File Detection Test:');
  testFiles.forEach(file => {
    const importer = importerRegistry.getImporter(file);
    console.log(`  ${file}: ${importer ? importer.name : 'No importer found'}`);
  });
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🎯 Scout BI Importers - Examples\n');
  
  try {
    await basicImportExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await progressTrackingExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await batchImportExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await customRegistryExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await dataExplorationExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await errorHandlingExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await fileTypeDetectionExample();
    
    console.log('\n🎉 All examples completed!');
  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Export examples for individual testing
export {
  basicImportExample,
  progressTrackingExample,
  batchImportExample,
  customRegistryExample,
  dataExplorationExample,
  errorHandlingExample,
  fileTypeDetectionExample,
  runAllExamples
};

// Run all examples if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllExamples().catch(console.error);
}