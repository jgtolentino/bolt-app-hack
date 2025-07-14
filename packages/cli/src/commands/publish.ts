/**
 * Scout CLI - Publish Command
 * Publishes built dashboard to Scout Marketplace
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import archiver from 'archiver';
import { MarketplaceClient } from '../marketplace/MarketplaceClient.js';
import { validateBlueprint } from '../schemas/blueprint.js';

export interface PublishOptions {
  channel?: 'stable' | 'beta' | 'alpha' | 'dev';
  notes?: string;
  force?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

export function createPublishCommand(): Command {
  return new Command('publish')
    .description('Publish dashboard to Scout Marketplace')
    .argument('<path>', 'Path to built dashboard directory')
    .option('-c, --channel <channel>', 'Release channel', 'stable')
    .option('-n, --notes <notes>', 'Release notes')
    .option('-f, --force', 'Force publish without confirmation')
    .option('--dry-run', 'Simulate publish without uploading')
    .option('-v, --verbose', 'Verbose output')
    .action(async (dashboardPath: string, options: PublishOptions) => {
      await publishDashboard(dashboardPath, options);
    });
}

export async function publishDashboard(dashboardPath: string, options: PublishOptions): Promise<void> {
  const spinner = ora();
  
  try {
    // 1. Validate dashboard directory
    spinner.start('Validating dashboard...');
    
    if (!await fs.pathExists(dashboardPath)) {
      throw new Error(`Dashboard directory not found: ${dashboardPath}`);
    }
    
    const manifestPath = path.join(dashboardPath, 'manifest.json');
    if (!await fs.pathExists(manifestPath)) {
      throw new Error(`Dashboard manifest not found: ${manifestPath}`);
    }
    
    const manifest = await fs.readJSON(manifestPath);
    const validation = validateBlueprint(manifest.blueprint);
    
    if (!validation.success) {
      throw new Error(`Invalid blueprint: ${validation.errors?.join(', ')}`);
    }
    
    const blueprint = validation.data!;
    
    // Check signature
    const signaturePath = path.join(dashboardPath, 'signature.json');
    if (!await fs.pathExists(signaturePath)) {
      throw new Error('Dashboard not signed. Run build without --skip-signature first.');
    }
    
    spinner.succeed('Dashboard validated');
    
    // 2. Pre-publish checks
    spinner.start('Running pre-publish checks...');
    
    const checks = await runPrePublishChecks(dashboardPath, blueprint);
    
    if (checks.errors.length > 0) {
      spinner.fail('Pre-publish checks failed');
      console.error(chalk.red('Errors:'));
      checks.errors.forEach(error => {
        console.error(chalk.red(`  • ${error}`));
      });
      return;
    }
    
    if (checks.warnings.length > 0) {
      spinner.warn('Pre-publish checks completed with warnings');
      checks.warnings.forEach(warning => {
        console.warn(chalk.yellow(`  ⚠ ${warning}`));
      });
    } else {
      spinner.succeed('Pre-publish checks passed');
    }
    
    // 3. Confirm publish details
    if (!options.force && !options.dryRun) {
      console.log(chalk.cyan('\n📦 Publish Summary:'));
      console.log(`  Title: ${blueprint.title}`);
      console.log(`  Version: ${blueprint.version}`);
      console.log(`  Channel: ${options.channel}`);
      console.log(`  Author: ${blueprint.author || 'Unknown'}`);
      console.log(`  Charts: ${blueprint.charts.length}`);
      console.log(`  Plugins: ${blueprint.plugins.length}`);
      
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with publish?',
        default: false
      }]);
      
      if (!confirm) {
        console.log(chalk.gray('Publish cancelled'));
        return;
      }
    }
    
    // 4. Create package
    spinner.start('Creating package...');
    
    const packagePath = await createPackage(dashboardPath, blueprint);
    const packageSize = (await fs.stat(packagePath)).size;
    
    spinner.succeed(`Package created (${formatBytes(packageSize)})`);
    
    if (options.dryRun) {
      console.log(chalk.green('\n✅ Dry run completed successfully'));
      console.log(`Package would be uploaded to: ${options.channel} channel`);
      await fs.remove(packagePath);
      return;
    }
    
    // 5. Upload to marketplace
    spinner.start('Uploading to marketplace...');
    
    const marketplaceClient = new MarketplaceClient();
    
    try {
      const result = await marketplaceClient.publish({
        packagePath,
        blueprint,
        channel: options.channel || 'stable',
        releaseNotes: options.notes,
        metadata: {
          size: packageSize,
          checksums: await calculateChecksums(packagePath)
        }
      });
      
      spinner.succeed('Upload completed');
      
      // 6. Clean up
      await fs.remove(packagePath);
      
      // Success summary
      console.log(chalk.green('\n🎉 Dashboard published successfully!'));
      console.log(`📦 Package ID: ${result.packageId}`);
      console.log(`🔗 Marketplace URL: ${result.marketplaceUrl}`);
      console.log(`📊 Dashboard will be available in ~5 minutes`);
      
      if (options.channel !== 'stable') {
        console.log(chalk.yellow(`⚠ Published to ${options.channel} channel - promote to stable when ready`));
      }
      
    } catch (error) {
      // Clean up on error
      await fs.remove(packagePath);
      throw error;
    }
    
  } catch (error) {
    spinner.fail('Publish failed');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function runPrePublishChecks(dashboardPath: string, blueprint: any): Promise<{
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required files
  const requiredFiles = ['manifest.json', 'signature.json', 'dashboard.tsx'];
  
  for (const file of requiredFiles) {
    if (!await fs.pathExists(path.join(dashboardPath, file))) {
      errors.push(`Missing required file: ${file}`);
    }
  }
  
  // Check blueprint completeness
  if (!blueprint.title || blueprint.title.length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  
  if (!blueprint.description) {
    warnings.push('No description provided');
  }
  
  if (!blueprint.author) {
    warnings.push('No author specified');
  }
  
  if (blueprint.charts.length === 0) {
    errors.push('Dashboard must contain at least one chart');
  }
  
  // Check for plugin dependencies
  const hasPluginCharts = blueprint.charts.some((c: any) => c.type.startsWith('plugin:'));
  if (hasPluginCharts && blueprint.plugins.length === 0) {
    warnings.push('Plugin charts detected but no plugins declared');
  }
  
  // Check package size
  const packageSize = await calculateDirectorySize(dashboardPath);
  if (packageSize > 50 * 1024 * 1024) { // 50MB
    errors.push('Package size exceeds 50MB limit');
  } else if (packageSize > 10 * 1024 * 1024) { // 10MB
    warnings.push('Package size is large (>10MB)');
  }
  
  return { errors, warnings };
}

async function createPackage(dashboardPath: string, blueprint: any): Promise<string> {
  const packageName = `${blueprint.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${blueprint.version}.scout`;
  const packagePath = path.join(process.cwd(), packageName);
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(packagePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => resolve(packagePath));
    archive.on('error', reject);
    
    archive.pipe(output);
    archive.directory(dashboardPath, false);
    archive.finalize();
  });
}

async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      totalSize += await calculateDirectorySize(filePath);
    } else {
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }
  }
  
  return totalSize;
}

async function calculateChecksums(filePath: string): Promise<{
  md5: string;
  sha256: string;
}> {
  const crypto = await import('crypto');
  const data = await fs.readFile(filePath);
  
  return {
    md5: crypto.createHash('md5').update(data).digest('hex'),
    sha256: crypto.createHash('sha256').update(data).digest('hex')
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}