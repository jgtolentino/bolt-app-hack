# Scout BI File Importers

Import PowerBI and Tableau files into Scout Analytics with automatic data conversion and visual mapping.

## Overview

This package provides importers for:
- **PowerBI**: `.pbix`, `.pbit`, `.pbip` files
- **Tableau**: `.twb`, `.twbx`, `.hyper` files

Files are converted to:
- **Data**: SQLite tables in Scout's local cache
- **Visuals**: Scout blueprint JSON for rendering in React/Tailwind UI

## Quick Start

```typescript
import { importBIFile, initializeImporters } from '@scout/importers';

// Initialize importers (auto-registers all available importers)
initializeImporters();

// Import a file
const result = await importBIFile('./my-report.pbix', (progress) => {
  console.log(`${progress.step}: ${progress.progress}% - ${progress.message}`);
});

if (result.success) {
  console.log(`Imported ${result.dataFrames.length} tables and ${result.blueprints.length} visuals`);
}
```

## Supported File Types

### PowerBI Files

| Extension | Description | Method |
|-----------|-------------|---------|
| `.pbix` | PowerBI Report File | Uses `pbi-tools` for extraction |
| `.pbit` | PowerBI Template File | Uses `pbi-tools` for extraction |
| `.pbip` | PowerBI Project Folder | Direct JSON parsing (faster) |

**Requirements:**
- `pbi-tools` must be installed and in PATH for `.pbix`/`.pbit` files
- PBIP files can be imported without external dependencies

### Tableau Files

| Extension | Description | Method |
|-----------|-------------|---------|
| `.twb` | Tableau Workbook (XML) | XML parsing with `xml2js` |
| `.twbx` | Tableau Packaged Workbook | ZIP extraction + XML parsing |
| `.hyper` | Tableau Extract File | Direct data reading |

## Installation

```bash
npm install @scout/importers

# For PowerBI support, install pbi-tools globally:
npm install -g pbi-tools

# For Tableau Hyper support (optional):
npm install tableau-hyper-api
```

## Architecture

```
@scout/importers/
├── types.ts                 # TypeScript interfaces
├── ImporterRegistry.ts      # Central importer registry
├── common/
│   └── BlueprintBuilder.ts  # Visual mapping logic
├── powerbi/
│   └── PowerBIImporter.ts   # PowerBI file parser
└── tableau/
    └── TableauImporter.ts   # Tableau file parser
```

## Usage Examples

### Basic Import

```typescript
import { importBIFile } from '@scout/importers';

const result = await importBIFile('./dashboard.pbix');

// Access imported data
result.dataFrames.forEach(df => {
  console.log(`Table: ${df.tableName} (${df.rows.length} rows)`);
});

// Access visual blueprints
result.blueprints.forEach(bp => {
  console.log(`Visual: ${bp.name} (${bp.type})`);
});
```

### With Progress Tracking

```typescript
const result = await importBIFile('./large-report.twbx', (progress) => {
  switch (progress.step) {
    case 'extracting':
      console.log('Extracting archive...');
      break;
    case 'importing-data':
      console.log(`Importing data: ${progress.progress}%`);
      break;
    case 'mapping-visuals':
      console.log('Converting visualizations...');
      break;
  }
});
```

### Custom Importer Registry

```typescript
import { ImporterRegistry, PowerBIImporter, TableauImporter } from '@scout/importers';

const registry = new ImporterRegistry();
registry.register(new PowerBIImporter());
registry.register(new TableauImporter());

// Check supported extensions
console.log('Supported:', registry.getSupportedExtensions());

// Import with custom registry
const result = await registry.importFile('./report.pbix');
```

### Error Handling

```typescript
const result = await importBIFile('./report.pbix');

if (!result.success) {
  result.errors?.forEach(error => {
    console.error(`${error.severity}: ${error.message}`);
  });
}

// Check for unsupported visuals
const unsupported = result.blueprints.filter(bp => bp.type === 'unsupported');
if (unsupported.length > 0) {
  console.warn(`${unsupported.length} visuals could not be converted`);
}
```

## Visual Mapping

The importers automatically map BI visuals to Scout's visual types:

### PowerBI → Scout Mapping

| PowerBI Visual | Scout Type |
|----------------|------------|
| `clusteredColumnChart` | `bar.vertical.clustered` |
| `stackedColumnChart` | `bar.vertical.stacked` |
| `lineChart` | `line.basic` |
| `pieChart` | `pie.basic` |
| `card` | `kpi.card` |
| `table` | `table.basic` |
| `filledMap` | `map.choropleth` |
| Custom visuals | `unsupported` (fallback image) |

### Tableau → Scout Mapping

| Tableau Mark Type | Scout Type |
|-------------------|------------|
| `bar` | `bar.vertical.clustered` |
| `line` | `line.basic` |
| `circle` | `scatter.basic` |
| `pie` | `pie.basic` |
| `text` | `table.basic` |
| `map` | `map.choropleth` |

Unsupported visuals are preserved as static images with their original configuration for manual recreation.

## Data Extraction

### PowerBI Data

Data extraction from PowerBI files requires `pbi-tools`:

```bash
# Install pbi-tools
npm install -g pbi-tools

# Verify installation
pbi-tools --version
```

The importer:
1. Uses `pbi-tools extract` to explode PBIX files
2. Parses `DataModelSchema.json` for table definitions
3. Extracts data via CSV export (when available)
4. Converts to SQLite-compatible schemas

### Tableau Data

Tableau data extraction supports:
- **Hyper files**: Direct binary reading (requires `tableau-hyper-api`)
- **CSV files**: Embedded in TWBX packages
- **Database connections**: Schema-only extraction

### Data Type Mapping

| Source Type | SQLite Type |
|-------------|-------------|
| PowerBI `int64` | `INTEGER` |
| PowerBI `double` | `REAL` |
| PowerBI `string` | `TEXT` |
| PowerBI `boolean` | `BOOLEAN` |
| PowerBI `dateTime` | `DATETIME` |
| Tableau `integer` | `INTEGER` |
| Tableau `real` | `REAL` |
| Tableau `string` | `TEXT` |
| Tableau `date` | `DATETIME` |

## Configuration

### Import Configuration

```typescript
const config = {
  maxFileSize: 500 * 1024 * 1024, // 500MB
  timeoutMs: 300000, // 5 minutes
  tempDir: '/tmp/scout-imports',
  keepTempFiles: false // Clean up after import
};
```

### PowerBI Configuration

```typescript
const powerbiImporter = new PowerBIImporter();
// pbi-tools path is auto-detected from PATH
```

### Tableau Configuration

```typescript
const tableauImporter = new TableauImporter();
// Hyper API is optional - falls back to schema-only import
```

## React Integration

Use the provided React component for file import UI:

```tsx
import { ImportWizard } from '@scout/importers/react';

function App() {
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <button onClick={() => setShowImport(true)}>
        Import BI Files
      </button>
      
      <ImportWizard
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImportComplete={(result) => {
          console.log('Import completed:', result);
          // Handle imported data and blueprints
        }}
      />
    </>
  );
}
```

## Limitations

### PowerBI
- **Encrypted files**: Cannot be imported
- **Complex DAX**: Expressions are preserved but not executed
- **Custom visuals**: Rendered as static images
- **Real-time data**: Only cached data is imported

### Tableau
- **Live connections**: Schema-only import (no data)
- **Complex calculations**: Preserved as metadata
- **Dashboard actions**: Not preserved
- **Parameters**: Not fully supported

## Contributing

### Adding New Importers

1. Implement the `Importer` interface:

```typescript
export class MyImporter implements Importer {
  readonly name = 'MyBI';
  readonly supportedExtensions = ['.mybi'];
  
  match(filePath: string): boolean {
    return path.extname(filePath) === '.mybi';
  }
  
  async validate(filePath: string) {
    // Validation logic
  }
  
  async import(filePath: string, onProgress) {
    // Import logic
  }
}
```

2. Register the importer:

```typescript
import { importerRegistry } from '@scout/importers';
importerRegistry.register(new MyImporter());
```

### Visual Type Mapping

Add new visual types to `BlueprintBuilder.ts`:

```typescript
private static readonly MY_MAPPINGS: VisualTypeMapping = {
  'myVisualType': {
    scoutType: 'bar.vertical.clustered',
    requirements: { minColumns: 2 }
  }
};
```

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/scout-analytics/scout/issues)
- **Docs**: [Scout Documentation](https://docs.scout-analytics.com)
- **Community**: [Discord](https://discord.gg/scout)