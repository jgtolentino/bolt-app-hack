/**
 * Scout CLI - Build Command
 * Builds dashboard from JSON blueprint with plugin/connector resolution
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { validateBlueprint, migrateDash2Blueprint, DashboardBlueprint } from '../schemas/blueprint.js';
import { PluginManager } from '../plugins/PluginManager.js';
import { ConnectorManager } from '../connectors/ConnectorManager.js';
import { DashboardGenerator } from '../generators/DashboardGenerator.js';
import { SignatureManager } from '../security/SignatureManager.js';

export interface BuildOptions {
  output: string;
  target: 'desktop' | 'web' | 'both';
  env?: string;
  skipPlugins?: boolean;
  skipSignature?: boolean;
  verbose?: boolean;
}

export function createBuildCommand(): Command {
  return new Command('build')
    .description('Build dashboard from JSON blueprint')
    .argument('<blueprint>', 'Path to dashboard blueprint JSON file')
    .option('-o, --output <path>', 'Output directory', './dist')
    .option('-t, --target <target>', 'Build target', 'both')
    .option('-e, --env <environment>', 'Environment config to use')
    .option('--skip-plugins', 'Skip plugin installation')
    .option('--skip-signature', 'Skip artifact signing')
    .option('-v, --verbose', 'Verbose output')
    .action(async (blueprintPath: string, options: BuildOptions) => {
      await buildDashboard(blueprintPath, options);
    });
}

export async function buildDashboard(blueprintPath: string, options: BuildOptions): Promise<void> {
  const spinner = ora();
  
  try {
    // 1. Load and validate blueprint
    spinner.start('Loading blueprint...');
    
    if (!await fs.pathExists(blueprintPath)) {
      throw new Error(`Blueprint file not found: ${blueprintPath}`);
    }
    
    const blueprintContent = await fs.readJSON(blueprintPath);
    const validation = validateBlueprint(blueprintContent);
    
    if (!validation.success) {
      spinner.fail('Blueprint validation failed');
      console.error(chalk.red('Validation errors:'));
      validation.errors?.forEach(error => {
        console.error(chalk.red(`  • ${error}`));
      });
      return;
    }
    
    let blueprint = validation.data!;
    
    // Handle migration from Dash 2.0
    if (!blueprint.version || blueprint.version.startsWith('2.')) {
      spinner.text = 'Migrating from Dash 2.0 format...';
      blueprint = migrateDash2Blueprint(blueprintContent);
      
      // Save migrated blueprint
      const migratedPath = blueprintPath.replace('.json', '.v3.json');
      await fs.writeJSON(migratedPath, blueprint, { spaces: 2 });
      console.log(chalk.yellow(`📄 Migrated blueprint saved as: ${migratedPath}`));
    }
    
    spinner.succeed('Blueprint loaded and validated');
    
    // 2. Apply environment overrides
    if (options.env && blueprint.deployment?.environments?.[options.env]) {
      spinner.start('Applying environment configuration...');
      const envConfig = blueprint.deployment.environments[options.env];
      
      if (envConfig.datasource) {
        blueprint.datasource = envConfig.datasource;
      }
      
      // Apply environment variables
      if (envConfig.variables) {
        blueprint.charts = blueprint.charts.map(chart => ({
          ...chart,
          query: replaceVariables(chart.query, envConfig.variables!)
        }));
      }
      
      spinner.succeed(`Environment '${options.env}' applied`);
    }
    
    // 3. Resolve and install plugins
    if (!options.skipPlugins) {
      const pluginManager = new PluginManager();
      const requiredPlugins = extractPluginDependencies(blueprint);
      
      if (requiredPlugins.length > 0) {
        spinner.start(`Installing ${requiredPlugins.length} plugins...`);
        
        for (const plugin of requiredPlugins) {
          try {
            await pluginManager.install(plugin.name, plugin.version);
            if (options.verbose) {
              console.log(chalk.green(`  ✓ ${plugin.name}@${plugin.version || 'latest'}`));
            }
          } catch (error) {
            if (plugin.required) {
              throw new Error(`Failed to install required plugin: ${plugin.name}`);
            } else {
              console.warn(chalk.yellow(`  ⚠ Optional plugin failed: ${plugin.name}`));
            }
          }
        }
        
        spinner.succeed('Plugins installed');
      }
    }
    
    // 4. Resolve and install connectors
    const connectorManager = new ConnectorManager();
    const requiredConnectors = extractConnectorDependencies(blueprint);
    
    if (requiredConnectors.length > 0) {
      spinner.start(`Setting up ${requiredConnectors.length} connectors...`);
      
      for (const connector of requiredConnectors) {
        await connectorManager.ensureInstalled(connector.name, connector.version);
        if (options.verbose) {
          console.log(chalk.green(`  ✓ ${connector.name}`));
        }
      }
      
      spinner.succeed('Connectors configured');
    }
    
    // 5. Generate dashboard code
    spinner.start('Generating dashboard code...');
    
    const generator = new DashboardGenerator(blueprint, {
      target: options.target,
      outputDir: options.output,
      verbose: options.verbose
    });
    
    const artifacts = await generator.generate();
    
    spinner.succeed(`Dashboard generated in ${options.output}`);
    
    // 6. Run tests
    spinner.start('Running generated tests...');
    
    try {
      await generator.runTests();
      spinner.succeed('Tests passed');
    } catch (error) {
      spinner.warn('Some tests failed (non-blocking)');
      if (options.verbose) {
        console.error(chalk.yellow(error));
      }
    }
    
    // 7. Sign artifacts
    if (!options.skipSignature) {
      spinner.start('Signing artifacts...');
      
      const signatureManager = new SignatureManager();
      const signature = await signatureManager.signArtifacts(artifacts);
      
      // Write signature manifest
      await fs.writeJSON(path.join(options.output, 'signature.json'), {
        algorithm: 'ecdsa-p256-sha256',
        signature,
        timestamp: new Date().toISOString(),
        artifacts: artifacts.map(a => ({
          path: a.path,
          hash: a.hash,
          size: a.size
        }))
      }, { spaces: 2 });
      
      spinner.succeed('Artifacts signed');
    }
    
    // 8. Update dashboard index
    await updateDashboardIndex(blueprint, options.output);
    
    // Success summary
    console.log(chalk.green('\n🎉 Dashboard build completed successfully!'));
    console.log(chalk.gray('Generated files:'));
    
    artifacts.forEach(artifact => {
      console.log(chalk.gray(`  📄 ${artifact.path}`));
    });
    
    if (options.target === 'both' || options.target === 'desktop') {
      console.log(chalk.blue('\n💻 Desktop: Copy to ~/Scout/dashboards/'));
    }
    
    if (options.target === 'both' || options.target === 'web') {
      console.log(chalk.blue('🌐 Web: Run `next build` to deploy'));
    }
    
  } catch (error) {
    spinner.fail('Build failed');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

function extractPluginDependencies(blueprint: DashboardBlueprint): Array<{name: string, version?: string, required: boolean}> {
  const plugins = new Set<string>();
  
  // Extract from chart types
  blueprint.charts.forEach(chart => {
    if (chart.type.startsWith('plugin:')) {
      const pluginName = chart.type.replace('plugin:', '');
      plugins.add(pluginName);
    }
    
    if (chart.plugin) {
      plugins.add(chart.plugin.name);
    }
  });
  
  // Convert to array with metadata
  return Array.from(plugins).map(name => ({
    name,
    version: blueprint.plugins.find(p => p.name === name)?.version,
    required: blueprint.plugins.find(p => p.name === name)?.required ?? true
  }));
}

function extractConnectorDependencies(blueprint: DashboardBlueprint): Array<{name: string, version?: string}> {
  const connectors = new Set<string>();
  
  // Extract from datasource
  if (typeof blueprint.datasource === 'string') {
    connectors.add(blueprint.datasource);
  } else {
    connectors.add(blueprint.datasource.type);
  }
  
  // Extract from explicit connector requirements
  blueprint.connectors.forEach(connector => {
    connectors.add(connector.name);
  });
  
  return Array.from(connectors).map(name => ({
    name,
    version: blueprint.connectors.find(c => c.name === name)?.version
  }));
}

function replaceVariables(query: string, variables: Record<string, string>): string {
  let result = query;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}

async function updateDashboardIndex(blueprint: DashboardBlueprint, outputDir: string): Promise<void> {
  const indexPath = path.join(outputDir, '..', 'index.json');
  
  let index: any = { dashboards: [] };
  
  if (await fs.pathExists(indexPath)) {
    index = await fs.readJSON(indexPath);
  }
  
  // Remove existing entry
  index.dashboards = index.dashboards.filter((d: any) => d.id !== blueprint.title);
  
  // Add new entry
  index.dashboards.push({
    id: blueprint.title,
    title: blueprint.title,
    description: blueprint.description,
    path: path.basename(outputDir),
    version: blueprint.version,
    author: blueprint.author,
    tags: blueprint.tags,
    createdAt: new Date().toISOString()
  });
  
  await fs.writeJSON(indexPath, index, { spaces: 2 });
}