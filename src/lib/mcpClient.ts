/**
 * MCP Client for SQLite Database
 * Connects to the MCP SQLite server to execute queries
 */

import { spawn, ChildProcess } from 'child_process';

export interface MCPRequest {
  jsonrpc: string;
  id: string;
  method: string;
  params: any;
}

export interface MCPResponse {
  jsonrpc: string;
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class MCPSQLiteClient {
  private serverProcess: ChildProcess | null = null;
  private isConnected = false;
  private requestId = 0;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      // Start MCP server process
      this.serverProcess = spawn('node', ['dist/index.js'], {
        cwd: '/Users/tbwa/Documents/GitHub/mcp-sqlite-server',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (!this.serverProcess.stdout || !this.serverProcess.stdin) {
        throw new Error('Failed to start MCP server process');
      }

      // Handle stdout data
      this.serverProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response: MCPResponse = JSON.parse(line.trim());
              this.handleResponse(response);
            } catch (e) {
              console.error('Failed to parse MCP response:', line);
            }
          }
        }
      });

      // Handle stderr
      this.serverProcess.stderr?.on('data', (data) => {
        console.error('MCP Server Error:', data.toString());
      });

      // Handle process exit
      this.serverProcess.on('exit', (code) => {
        console.log('MCP Server exited with code:', code);
        this.isConnected = false;
        this.serverProcess = null;
      });

      this.isConnected = true;
      console.log('✅ Connected to MCP SQLite server');

    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      throw error;
    }
  }

  private handleResponse(response: MCPResponse) {
    const pending = this.pendingRequests.get(response.id);
    if (pending) {
      this.pendingRequests.delete(response.id);
      if (response.error) {
        pending.reject(new Error(response.error.message));
      } else {
        pending.resolve(response.result);
      }
    }
  }

  private async sendRequest(method: string, params: any = {}): Promise<any> {
    if (!this.isConnected || !this.serverProcess?.stdin) {
      throw new Error('MCP client not connected');
    }

    const id = (++this.requestId).toString();
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      // Set timeout for request
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Request timeout'));
      }, 30000);

      this.pendingRequests.set(id, {
        resolve: (value: any) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error: any) => {
          clearTimeout(timeout);
          reject(error);
        }
      });

      // Send request
      const requestLine = JSON.stringify(request) + '\n';
      this.serverProcess!.stdin!.write(requestLine);
    });
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'sqlite_query',
        arguments: { sql, params }
      });

      // Parse the result
      if (result && result.content && result.content[0] && result.content[0].text) {
        return JSON.parse(result.content[0].text);
      }
      return [];

    } catch (error) {
      console.error('SQLite query error:', error);
      throw error;
    }
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'sqlite_execute',
        arguments: { sql, params }
      });

      return result;

    } catch (error) {
      console.error('SQLite execute error:', error);
      throw error;
    }
  }

  async listTables(): Promise<string[]> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'sqlite_list_tables',
        arguments: {}
      });

      if (result && result.content && result.content[0] && result.content[0].text) {
        const tables = JSON.parse(result.content[0].text);
        return tables.map((table: any) => table.name);
      }
      return [];

    } catch (error) {
      console.error('List tables error:', error);
      throw error;
    }
  }

  async getTableInfo(tableName: string): Promise<any> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'sqlite_table_info',
        arguments: { table: tableName }
      });

      if (result && result.content && result.content[0] && result.content[0].text) {
        return JSON.parse(result.content[0].text);
      }
      return null;

    } catch (error) {
      console.error('Table info error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
    this.isConnected = false;
    this.pendingRequests.clear();
  }
}

// Export singleton instance
export const mcpClient = new MCPSQLiteClient();

// Auto-connect on import (for browser usage, this would need modification)
if (typeof window === 'undefined') {
  // Node.js environment
  mcpClient.connect().catch(console.error);
}