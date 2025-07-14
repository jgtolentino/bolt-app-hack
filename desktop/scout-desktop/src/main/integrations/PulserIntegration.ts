/**
 * Scout Desktop - Pulser Integration
 * Integrates Pulser AI for intelligent analytics and automation
 */

import { spawn, ChildProcess } from 'child_process';
import { WebSocket } from 'ws';
import path from 'path';
import fs from 'fs-extra';
import { EventEmitter } from 'events';

export interface PulserConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  workspace?: string;
  apiKey?: string;
}

export interface PulserCommand {
  type: 'analyze' | 'generate' | 'optimize' | 'explain' | 'query';
  input: string;
  context?: any;
  options?: Record<string, any>;
}

export interface PulserResponse {
  id: string;
  type: string;
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    model: string;
    timestamp: string;
    processingTime: number;
  };
}

export class PulserIntegration extends EventEmitter {
  private pulserProcess: ChildProcess | null = null;
  private webSocket: WebSocket | null = null;
  private isRunning: boolean = false;
  private config: PulserConfig = {};
  private workspace: string;

  constructor() {
    super();
    this.workspace = path.join(process.env.HOME || process.cwd(), '.pulser');
  }

  async initialize(): Promise<void> {
    try {
      // Ensure workspace exists
      await fs.ensureDir(this.workspace);

      // Load configuration
      const configPath = path.join(this.workspace, 'config.json');
      if (await fs.pathExists(configPath)) {
        this.config = await fs.readJSON(configPath);
      }

      console.log('✅ Pulser integration initialized');
    } catch (error) {
      console.error('❌ Pulser integration failed:', error);
      throw error;
    }
  }

  async start(config: Partial<PulserConfig> = {}): Promise<void> {
    if (this.isRunning) {
      console.log('Pulser is already running');
      return;
    }

    try {
      // Merge config
      this.config = { ...this.config, ...config };

      // Start Pulser process
      await this.startPulserProcess();

      // Establish WebSocket connection
      await this.connectWebSocket();

      this.isRunning = true;
      this.emit('started');
      console.log('🚀 Pulser started successfully');
    } catch (error) {
      console.error('❌ Failed to start Pulser:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Close WebSocket
      if (this.webSocket) {
        this.webSocket.close();
        this.webSocket = null;
      }

      // Terminate process
      if (this.pulserProcess) {
        this.pulserProcess.kill('SIGTERM');
        this.pulserProcess = null;
      }

      this.isRunning = false;
      this.emit('stopped');
      console.log('🛑 Pulser stopped');
    } catch (error) {
      console.error('❌ Error stopping Pulser:', error);
    }
  }

  async executeCommand(command: PulserCommand): Promise<PulserResponse> {
    if (!this.isRunning) {
      throw new Error('Pulser is not running. Start it first.');
    }

    return new Promise((resolve, reject) => {
      const commandId = this.generateId();
      const timeout = setTimeout(() => {
        reject(new Error('Command timeout'));
      }, 30000); // 30 second timeout

      // Listen for response
      const responseHandler = (response: PulserResponse) => {
        if (response.id === commandId) {
          clearTimeout(timeout);
          this.off('response', responseHandler);
          resolve(response);
        }
      };

      this.on('response', responseHandler);

      // Send command
      if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
        this.webSocket.send(JSON.stringify({
          id: commandId,
          ...command
        }));
      } else {
        clearTimeout(timeout);
        this.off('response', responseHandler);
        reject(new Error('WebSocket not connected'));
      }
    });
  }

  // High-level analysis methods
  async analyzeData(data: any[], question: string): Promise<PulserResponse> {
    return this.executeCommand({
      type: 'analyze',
      input: question,
      context: { data },
      options: {
        includeVisualization: true,
        generateInsights: true
      }
    });
  }

  async generateDashboard(requirements: string, data?: any[]): Promise<PulserResponse> {
    return this.executeCommand({
      type: 'generate',
      input: requirements,
      context: { data, type: 'dashboard' },
      options: {
        outputFormat: 'scout-blueprint',
        includeCharts: true,
        generateMockData: !data
      }
    });
  }

  async optimizeDashboard(blueprint: any): Promise<PulserResponse> {
    return this.executeCommand({
      type: 'optimize',
      input: 'Optimize this dashboard for performance and user experience',
      context: { blueprint },
      options: {
        optimizationType: 'performance',
        includeRecommendations: true
      }
    });
  }

  async explainChart(chartConfig: any, data?: any[]): Promise<PulserResponse> {
    return this.executeCommand({
      type: 'explain',
      input: 'Explain this chart and provide insights',
      context: { chartConfig, data },
      options: {
        includeStatistics: true,
        generateNarrative: true
      }
    });
  }

  async queryData(query: string, schema?: any): Promise<PulserResponse> {
    return this.executeCommand({
      type: 'query',
      input: query,
      context: { schema },
      options: {
        outputFormat: 'sql',
        validateSyntax: true
      }
    });
  }

  // Smart recommendations
  async getChartRecommendations(data: any[]): Promise<PulserResponse> {
    return this.executeCommand({
      type: 'analyze',
      input: 'Recommend the best chart types for this data',
      context: { data },
      options: {
        analysisType: 'chart-recommendation',
        includeRationale: true
      }
    });
  }

  async getInsights(data: any[], domain?: string): Promise<PulserResponse> {
    return this.executeCommand({
      type: 'analyze',
      input: 'Generate insights and findings from this data',
      context: { data, domain },
      options: {
        analysisType: 'insight-generation',
        includeStatistics: true,
        generateHypotheses: true
      }
    });
  }

  // Configuration management
  async updateConfig(newConfig: Partial<PulserConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    const configPath = path.join(this.workspace, 'config.json');
    await fs.writeJSON(configPath, this.config, { spaces: 2 });

    // Restart if running to apply new config
    if (this.isRunning) {
      await this.stop();
      await this.start();
    }
  }

  getStatus(): {
    running: boolean;
    config: PulserConfig;
    workspace: string;
    connections: {
      process: boolean;
      websocket: boolean;
    };
  } {
    return {
      running: this.isRunning,
      config: this.config,
      workspace: this.workspace,
      connections: {
        process: this.pulserProcess !== null,
        websocket: this.webSocket?.readyState === WebSocket.OPEN
      }
    };
  }

  // Private methods
  private async startPulserProcess(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Start Pulser CLI in server mode
      this.pulserProcess = spawn('pulser', ['server', '--port', '8080'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PULSER_WORKSPACE: this.workspace,
          PULSER_MODEL: this.config.model || 'claude-3-5-sonnet',
          PULSER_API_KEY: this.config.apiKey || process.env.ANTHROPIC_API_KEY
        }
      });

      let output = '';

      this.pulserProcess.stdout?.on('data', (data) => {
        output += data.toString();
        if (output.includes('Server started on port 8080')) {
          resolve();
        }
      });

      this.pulserProcess.stderr?.on('data', (data) => {
        console.error('Pulser stderr:', data.toString());
      });

      this.pulserProcess.on('error', (error) => {
        reject(new Error(`Failed to start Pulser process: ${error.message}`));
      });

      this.pulserProcess.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Pulser process exited with code ${code}`));
        }
        this.isRunning = false;
        this.emit('stopped');
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pulserProcess && !this.isRunning) {
          this.pulserProcess.kill();
          reject(new Error('Pulser startup timeout'));
        }
      }, 10000);
    });
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.webSocket = new WebSocket('ws://localhost:8080/ws');

      this.webSocket.on('open', () => {
        console.log('📡 Pulser WebSocket connected');
        resolve();
      });

      this.webSocket.on('message', (data) => {
        try {
          const response: PulserResponse = JSON.parse(data.toString());
          this.emit('response', response);
        } catch (error) {
          console.error('Error parsing Pulser response:', error);
        }
      });

      this.webSocket.on('error', (error) => {
        console.error('Pulser WebSocket error:', error);
        reject(error);
      });

      this.webSocket.on('close', () => {
        console.log('📡 Pulser WebSocket disconnected');
        this.webSocket = null;
      });

      // Connection timeout
      setTimeout(() => {
        if (this.webSocket?.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 5000);
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Convenience methods for Scout Desktop integration
  async processDashboardRequest(request: {
    type: 'create' | 'analyze' | 'optimize';
    input: string;
    context?: any;
  }): Promise<any> {
    try {
      let result: PulserResponse;

      switch (request.type) {
        case 'create':
          result = await this.generateDashboard(request.input, request.context?.data);
          break;
        case 'analyze':
          result = await this.analyzeData(request.context?.data || [], request.input);
          break;
        case 'optimize':
          result = await this.optimizeDashboard(request.context?.blueprint);
          break;
        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }

      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}