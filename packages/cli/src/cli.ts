#!/usr/bin/env node

/**
 * Scout CLI - Main Entry Point
 * Command-line interface for Scout Dashboard development and deployment
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createBuildCommand } from './commands/build.js';
import { createPublishCommand } from './commands/publish.js';
import { createImportCommand } from './commands/import.js';

const program = new Command();

// CLI metadata
program
  .name('scout')
  .description('Scout Dashboard CLI - Build, deploy and publish dashboards from JSON blueprints')
  .version('3.0.0');

// Global options
program
  .option('-v, --verbose', 'Enable verbose output')
  .option('--no-color', 'Disable colored output');

// Dashboard commands
const dashCommand = new Command('dash')
  .description('Dashboard management commands');

dashCommand.addCommand(createBuildCommand());
dashCommand.addCommand(createPublishCommand());

// Import commands  
program.addCommand(createImportCommand());

// Add dashboard commands to main program
program.addCommand(dashCommand);

// Additional utility commands
program
  .command('init')
  .description('Initialize new Scout dashboard project')
  .option('-t, --template <name>', 'Template to use', 'basic')
  .option('-d, --directory <path>', 'Target directory', '.')
  .action(async (options) => {
    const { initProject } = await import('./commands/init.js');
    await initProject(options);
  });

program
  .command('validate')
  .description('Validate dashboard blueprint')
  .argument('<blueprint>', 'Path to blueprint JSON file')
  .option('--strict', 'Enable strict validation')
  .action(async (blueprintPath, options) => {
    const { validateBlueprint } = await import('./commands/validate.js');
    await validateBlueprint(blueprintPath, options);
  });

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-h, --host <host>', 'Host address', 'localhost')
  .action(async (options) => {
    const { startDevServer } = await import('./commands/dev.js');
    await startDevServer(options);
  });

program
  .command('marketplace')
  .description('Marketplace management')
  .option('--list', 'List available dashboards')
  .option('--search <query>', 'Search marketplace')
  .option('--install <id>', 'Install dashboard from marketplace')
  .action(async (options) => {
    const { manageMarketplace } = await import('./commands/marketplace.js');
    await manageMarketplace(options);
  });

// Plugin management
program
  .command('plugin')
  .description('Plugin management')
  .option('--list', 'List installed plugins')
  .option('--install <name>', 'Install plugin')
  .option('--uninstall <name>', 'Uninstall plugin')
  .option('--update [name]', 'Update plugin(s)')
  .action(async (options) => {
    const { managePlugins } = await import('./commands/plugin.js');
    await managePlugins(options);
  });

// Connector management
program
  .command('connector')
  .description('Connector management')
  .option('--list', 'List available connectors')
  .option('--test <name>', 'Test connector connection')
  .option('--configure <name>', 'Configure connector')
  .action(async (options) => {
    const { manageConnectors } = await import('./commands/connector.js');
    await manageConnectors(options);
  });

// Help improvements
program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('Examples:'));
  console.log('  scout dash build dashboard.json --output ./dist');
  console.log('  scout import pbix sales-report.pbix --to-blueprint');
  console.log('  scout dash publish ./dist --channel beta');
  console.log('  scout init --template analytics');
  console.log('');
  console.log(chalk.cyan('Quick Start:'));
  console.log('  1. scout init my-dashboard');
  console.log('  2. cd my-dashboard');
  console.log('  3. scout dash build dashboard.json');
  console.log('  4. scout dev');
  console.log('');
  console.log(chalk.gray('Documentation: https://scout-analytics.com/docs/cli'));
});

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error: any) {
  if (error.code === 'commander.help') {
    process.exit(0);
  } else if (error.code === 'commander.version') {
    process.exit(0);
  } else {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

export default program;