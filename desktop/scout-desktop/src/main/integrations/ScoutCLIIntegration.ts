/**
 * Scout Desktop - Scout CLI Integration
 * Provides seamless integration with Scout CLI for dashboard operations
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';

export interface BuildOptions {
  output?: string;
  target?: 'desktop' | 'web' | 'both';
  env?: string;
  skipPlugins?: boolean;
  skipSignature?: boolean;
  verbose?: boolean;
}

export interface PublishOptions {
  channel?: 'stable' | 'beta' | 'alpha' | 'dev';
  notes?: string;
  force?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface ImportOptions {
  toBlueprint?: boolean;
  output?: string;
  format?: 'json' | 'yaml';
  interactive?: boolean;
  verbose?: boolean;
}

export interface CLIResult {
  success: boolean;
  output: string;
  error?: string;
  code?: number;
}

export class ScoutCLIIntegration {
  private cliPath: string;
  private isInitialized: boolean = false;

  constructor() {
    // Determine CLI path based on environment
    if (process.env.NODE_ENV === 'development') {
      this.cliPath = path.join(__dirname, '../../../../packages/cli/dist/cli.js');
    } else {
      this.cliPath = path.join(process.resourcesPath, 'cli', 'cli.js');
    }
  }

  async initialize(): Promise<void> {
    try {
      // Check if CLI is available
      const exists = await fs.pathExists(this.cliPath);
      if (!exists) {
        throw new Error(`Scout CLI not found at: ${this.cliPath}`);
      }

      // Test CLI execution
      const result = await this.executeCommand(['--version']);
      if (!result.success) {
        throw new Error(`Scout CLI test failed: ${result.error}`);
      }

      this.isInitialized = true;
      console.log('✅ Scout CLI integration initialized');
    } catch (error) {
      console.error('❌ Scout CLI integration failed:', error);
      throw error;
    }
  }

  async build(blueprintPath: string, options: BuildOptions = {}): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const args = ['dash', 'build', blueprintPath];

    if (options.output) args.push('--output', options.output);
    if (options.target) args.push('--target', options.target);
    if (options.env) args.push('--env', options.env);
    if (options.skipPlugins) args.push('--skip-plugins');
    if (options.skipSignature) args.push('--skip-signature');
    if (options.verbose) args.push('--verbose');

    return this.executeCommand(args);
  }

  async publish(dashboardPath: string, options: PublishOptions = {}): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const args = ['dash', 'publish', dashboardPath];

    if (options.channel) args.push('--channel', options.channel);
    if (options.notes) args.push('--notes', options.notes);
    if (options.force) args.push('--force');
    if (options.dryRun) args.push('--dry-run');
    if (options.verbose) args.push('--verbose');

    return this.executeCommand(args);
  }

  async import(type: string, filePath: string, options: ImportOptions = {}): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const args = ['import', type, filePath];

    if (options.toBlueprint) args.push('--to-blueprint');
    if (options.output) args.push('--output', options.output);
    if (options.format) args.push('--format', options.format);
    if (options.interactive) args.push('--interactive');
    if (options.verbose) args.push('--verbose');

    return this.executeCommand(args);
  }

  async validate(blueprintPath: string): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.executeCommand(['validate', blueprintPath]);
  }

  async init(projectPath: string, template: string = 'basic'): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.executeCommand(['init', projectPath, '--template', template]);
  }

  async listMarketplace(query?: string): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const args = ['marketplace'];
    if (query) {
      args.push('--search', query);
    } else {
      args.push('--list');
    }

    return this.executeCommand(args);
  }

  async installFromMarketplace(dashboardId: string): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.executeCommand(['marketplace', '--install', dashboardId]);
  }

  async listPlugins(): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.executeCommand(['plugin', '--list']);
  }

  async installPlugin(pluginName: string): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.executeCommand(['plugin', '--install', pluginName]);
  }

  async uninstallPlugin(pluginName: string): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.executeCommand(['plugin', '--uninstall', pluginName]);
  }

  async listConnectors(): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.executeCommand(['connector', '--list']);
  }

  async testConnector(connectorName: string): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.executeCommand(['connector', '--test', connectorName]);
  }

  async configureConnector(connectorName: string): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.executeCommand(['connector', '--configure', connectorName]);
  }

  private async executeCommand(args: string[]): Promise<CLIResult> {
    return new Promise((resolve) => {
      const child: ChildProcess = spawn('node', [this.cliPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || 'production'
        }
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const success = code === 0;
        resolve({
          success,
          output: stdout,
          error: stderr || undefined,
          code: code || undefined
        });
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: error.message,
          code: -1
        });
      });
    });
  }

  // Streaming execution for real-time output
  executeCommandStreaming(
    args: string[], 
    onOutput: (data: string) => void,
    onError: (data: string) => void
  ): Promise<CLIResult> {
    return new Promise((resolve) => {
      const child: ChildProcess = spawn('node', [this.cliPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || 'production'
        }
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        onOutput(output);
      });

      child.stderr?.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        onError(error);
      });

      child.on('close', (code) => {
        const success = code === 0;
        resolve({
          success,
          output: stdout,
          error: stderr || undefined,
          code: code || undefined
        });
      });

      child.on('error', (error) => {
        onError(error.message);
        resolve({
          success: false,
          output: '',
          error: error.message,
          code: -1
        });
      });
    });
  }

  // Get CLI status and version info
  async getStatus(): Promise<{
    available: boolean;
    version?: string;
    path: string;
    initialized: boolean;
  }> {
    try {
      const exists = await fs.pathExists(this.cliPath);
      if (!exists) {
        return {
          available: false,
          path: this.cliPath,
          initialized: false
        };
      }

      const result = await this.executeCommand(['--version']);
      return {
        available: result.success,
        version: result.success ? result.output.trim() : undefined,
        path: this.cliPath,
        initialized: this.isInitialized
      };
    } catch (error) {
      return {
        available: false,
        path: this.cliPath,
        initialized: false
      };
    }
  }

  // Create a new dashboard project with guided setup
  async createProject(config: {
    name: string;
    path: string;
    template: string;
    datasource?: string;
    includeDemo?: boolean;
  }): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Initialize project
    const initResult = await this.init(config.path, config.template);
    if (!initResult.success) {
      return initResult;
    }

    // Customize based on config
    const projectPath = path.join(config.path, config.name);
    const blueprintPath = path.join(projectPath, 'dashboard.json');

    try {
      // Read and modify blueprint
      const blueprint = await fs.readJSON(blueprintPath);
      blueprint.title = config.name;
      
      if (config.datasource) {
        blueprint.datasource = config.datasource;
      }

      await fs.writeJSON(blueprintPath, blueprint, { spaces: 2 });

      return {
        success: true,
        output: `Project created successfully at ${projectPath}`
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Failed to customize project: ${error.message}`
      };
    }
  }
}