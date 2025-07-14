/**
 * SQLite Connector
 * Handles SQLite database connections (better-sqlite3 for Node.js environments)
 */

import { BaseConnector } from '../BaseConnector';
import { ConnectorConfig } from '../types';

export class SQLiteConnector extends BaseConnector {
  private db: any = null;

  constructor(config: ConnectorConfig) {
    super(config);
  }

  protected async connect(): Promise<void> {
    try {
      // Check if we're in a Node.js environment (Electron main process)
      if (typeof window === 'undefined') {
        const Database = require('better-sqlite3');
        this.db = new Database(this.config.connectionString, {
          verbose: process.env.NODE_ENV === 'development' ? console.log : null,
          ...(this.config.options || {})
        });

        // Enable WAL mode for better concurrency
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('synchronous = NORMAL');
        this.db.pragma('cache_size = -64000'); // 64MB cache
        
        this.connectionMetadata = {
          walMode: true,
          cacheSize: '64MB',
          path: this.config.connectionString
        };
      } else {
        throw new Error('SQLite connector not supported in browser environment');
      }
    } catch (error: any) {
      throw this.handleError(error, 'connection failed');
    }
  }

  protected async disconnect(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
      } catch (error: any) {
        throw this.handleError(error, 'disconnect failed');
      }
    }
  }

  protected async executeQuery<T>(sql: string, params?: any[]): Promise<T[]> {
    this.logQuery(sql, params);
    
    try {
      if (!this.db) {
        throw new Error('Database not connected');
      }

      const stmt = this.db.prepare(sql);
      let result;

      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        result = params ? stmt.all(...params) : stmt.all();
      } else {
        result = params ? stmt.run(...params) : stmt.run();
        // For non-SELECT queries, return metadata about the operation
        return [{
          changes: result.changes,
          lastInsertRowid: result.lastInsertRowid
        }] as T[];
      }

      return result as T[];
    } catch (error: any) {
      throw this.handleError(error, 'query execution failed');
    }
  }

  protected async executeCommand(sql: string, params?: any[]): Promise<{ rowsAffected?: number }> {
    this.logQuery(sql, params);
    
    try {
      if (!this.db) {
        throw new Error('Database not connected');
      }

      const stmt = this.db.prepare(sql);
      const result = params ? stmt.run(...params) : stmt.run();

      return {
        rowsAffected: result.changes
      };
    } catch (error: any) {
      throw this.handleError(error, 'command execution failed');
    }
  }

  // SQLite-specific utilities
  async vacuum(): Promise<void> {
    await this.execute('VACUUM');
  }

  async analyze(): Promise<void> {
    await this.execute('ANALYZE');
  }

  async getTableInfo(tableName: string): Promise<any[]> {
    const result = await this.query(`PRAGMA table_info(${tableName})`);
    return result.data;
  }

  async getTables(): Promise<string[]> {
    const result = await this.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    return result.data.map((row: any) => row.name);
  }

  async getIndexes(tableName?: string): Promise<any[]> {
    const sql = tableName 
      ? `SELECT * FROM sqlite_master WHERE type='index' AND tbl_name='${tableName}'`
      : `SELECT * FROM sqlite_master WHERE type='index'`;
    
    const result = await this.query(sql);
    return result.data;
  }

  async backup(backupPath: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const Database = require('better-sqlite3');
    const backup = this.db.backup(backupPath);
    
    return new Promise((resolve, reject) => {
      backup.step(-1); // Copy all pages
      backup.finish();
      resolve();
    });
  }

  getMetadata(): Record<string, any> {
    const baseMetadata = super.getMetadata();
    
    if (this.db) {
      try {
        const info = this.db.pragma('database_list');
        const pageCount = this.db.pragma('page_count');
        const pageSize = this.db.pragma('page_size');
        
        baseMetadata.database = {
          files: info,
          pageCount,
          pageSize,
          sizeBytes: pageCount * pageSize
        };
      } catch (error) {
        // Non-critical metadata gathering
      }
    }

    return baseMetadata;
  }
}