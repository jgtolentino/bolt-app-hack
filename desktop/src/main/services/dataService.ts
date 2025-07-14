/**
 * Data Service - Implements DAL switching and offline cache
 * PRD Requirements: F-2, F-3
 */

import Database from 'better-sqlite3';
import Store from 'electron-store';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import log from 'electron-log';

export interface DataSourceConfig {
  dataSource: 'local' | 'cloud' | 'custom';
  apiBaseUrl?: string;
}

export class DataService {
  private db: Database.Database | null = null;
  private store: Store;
  private dataPath: string;

  constructor(store: Store) {
    this.store = store;
    this.dataPath = path.join(app.getPath('userData'), 'data');
  }

  async initialize() {
    // Ensure data directory exists
    await fs.mkdir(this.dataPath, { recursive: true });

    // Initialize local SQLite cache
    const dbPath = path.join(this.dataPath, 'scout-cache.db');
    this.db = new Database(dbPath);
    
    log.info('Local database initialized at:', dbPath);

    // Create tables if not exist
    this.initializeSchema();
  }

  private initializeSchema() {
    if (!this.db) return;

    // Core tables matching cloud schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id TEXT PRIMARY KEY,
        timestamp DATETIME NOT NULL,
        store_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        transaction_value REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        final_amount REAL NOT NULL,
        payment_method TEXT,
        duration_seconds INTEGER,
        units_total INTEGER,
        day_of_week TEXT,
        hour_of_day INTEGER,
        weather TEXT,
        is_payday BOOLEAN DEFAULT 0,
        influenced_by_campaign BOOLEAN DEFAULT 0,
        synced_at DATETIME,
        INDEX idx_timestamp (timestamp),
        INDEX idx_store_id (store_id)
      );

      CREATE TABLE IF NOT EXISTS stores (
        store_id TEXT PRIMARY KEY,
        store_name TEXT NOT NULL,
        store_type TEXT,
        region TEXT,
        province TEXT,
        city_municipality TEXT,
        barangay TEXT,
        latitude REAL,
        longitude REAL,
        economic_class TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
        sku_id TEXT PRIMARY KEY,
        product_name TEXT NOT NULL,
        product_category TEXT,
        product_subcategory TEXT,
        brand_name TEXT,
        unit_price REAL,
        INDEX idx_category (product_category),
        INDEX idx_brand (brand_name)
      );

      CREATE TABLE IF NOT EXISTS sync_metadata (
        table_name TEXT PRIMARY KEY,
        last_sync DATETIME,
        record_count INTEGER,
        sync_status TEXT
      );
    `);
  }

  async query(sql: string, params?: any[]): Promise<any> {
    const dataSource = this.store.get('dataSource');
    
    switch (dataSource) {
      case 'local':
        return this.queryLocal(sql, params);
      
      case 'cloud':
        try {
          // Try cloud first
          const result = await this.queryCloud(sql, params);
          // Cache results locally
          this.cacheResults(sql, result);
          return result;
        } catch (error) {
          log.warn('Cloud query failed, falling back to local:', error);
          // Fall back to local cache
          return this.queryLocal(sql, params);
        }
      
      case 'custom':
        return this.queryCustom(sql, params);
      
      default:
        throw new Error(`Unknown data source: ${dataSource}`);
    }
  }

  private queryLocal(sql: string, params?: any[]): any {
    if (!this.db) {
      throw new Error('Local database not initialized');
    }

    try {
      // Handle SELECT queries
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = this.db.prepare(sql);
        return params ? stmt.all(...params) : stmt.all();
      }
      
      // Handle other queries (INSERT, UPDATE, DELETE)
      const stmt = this.db.prepare(sql);
      const result = params ? stmt.run(...params) : stmt.run();
      return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
    } catch (error) {
      log.error('Local query error:', error);
      throw error;
    }
  }

  private async queryCloud(sql: string, params?: any[]): Promise<any> {
    const apiBaseUrl = this.store.get('apiBaseUrl');
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.store.get('authToken')}`
        },
        body: JSON.stringify({ sql, params })
      });

      if (!response.ok) {
        throw new Error(`Cloud query failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      log.error('Cloud query error:', error);
      throw error;
    }
  }

  private async queryCustom(sql: string, params?: any[]): Promise<any> {
    const customUrl = this.store.get('apiBaseUrl');
    
    // Similar to cloud but with custom endpoint
    const response = await fetch(`${customUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    });

    if (!response.ok) {
      throw new Error(`Custom query failed: ${response.statusText}`);
    }

    return await response.json();
  }

  private cacheResults(sql: string, results: any[]): void {
    // Simple caching strategy - cache SELECT results
    if (!sql.trim().toUpperCase().startsWith('SELECT')) return;
    
    // TODO: Implement intelligent caching based on query patterns
    log.debug('Caching query results:', sql.substring(0, 50));
  }

  async switchDataSource(config: DataSourceConfig): Promise<void> {
    log.info('Switching data source to:', config.dataSource);
    
    // If switching to cloud, attempt sync
    if (config.dataSource === 'cloud') {
      try {
        await this.syncWithCloud();
      } catch (error) {
        log.warn('Initial sync failed:', error);
      }
    }
  }

  async syncWithCloud(): Promise<{ success: boolean; syncedTables: string[] }> {
    const apiBaseUrl = this.store.get('apiBaseUrl');
    const syncedTables: string[] = [];

    try {
      // Sync each table
      const tables = ['transactions', 'stores', 'products'];
      
      for (const table of tables) {
        log.info(`Syncing table: ${table}`);
        
        // Get last sync timestamp
        const lastSync = this.getLastSync(table);
        
        // Fetch updates from cloud
        const response = await fetch(`${apiBaseUrl}/api/sync/${table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.store.get('authToken')}`
          },
          body: JSON.stringify({ since: lastSync })
        });

        if (response.ok) {
          const data = await response.json();
          
          // Update local cache
          this.updateLocalTable(table, data);
          
          // Update sync metadata
          this.updateSyncMetadata(table, new Date().toISOString(), data.length);
          
          syncedTables.push(table);
        }
      }

      return { success: true, syncedTables };
    } catch (error) {
      log.error('Sync error:', error);
      return { success: false, syncedTables };
    }
  }

  private getLastSync(table: string): string | null {
    if (!this.db) return null;
    
    const row = this.db.prepare(
      'SELECT last_sync FROM sync_metadata WHERE table_name = ?'
    ).get(table);
    
    return row ? row.last_sync : null;
  }

  private updateLocalTable(table: string, data: any[]): void {
    if (!this.db || data.length === 0) return;

    const transaction = this.db.transaction((items) => {
      for (const item of items) {
        // Upsert logic - insert or replace
        const columns = Object.keys(item).join(', ');
        const placeholders = Object.keys(item).map(() => '?').join(', ');
        const values = Object.values(item);
        
        this.db!.prepare(
          `INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${placeholders})`
        ).run(...values);
      }
    });

    transaction(data);
    log.info(`Updated ${data.length} records in ${table}`);
  }

  private updateSyncMetadata(table: string, timestamp: string, recordCount: number): void {
    if (!this.db) return;

    this.db.prepare(`
      INSERT OR REPLACE INTO sync_metadata (table_name, last_sync, record_count, sync_status)
      VALUES (?, ?, ?, 'success')
    `).run(table, timestamp, recordCount);
  }

  async importCSV(filePath: string): Promise<{ success: boolean; rowCount: number }> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid');
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Parse rows
      const rows = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',');
          const row: any = {};
          headers.forEach((header, i) => {
            row[header] = values[i]?.trim();
          });
          return row;
        });

      // Auto-detect table based on columns
      const table = this.detectTableFromColumns(headers);
      
      // Insert data
      this.updateLocalTable(table, rows);

      return { success: true, rowCount: rows.length };
    } catch (error) {
      log.error('CSV import error:', error);
      throw error;
    }
  }

  private detectTableFromColumns(columns: string[]): string {
    // Simple heuristic - detect table based on column names
    if (columns.includes('transaction_id')) return 'transactions';
    if (columns.includes('store_id') && columns.includes('store_name')) return 'stores';
    if (columns.includes('sku_id')) return 'products';
    
    // Default to transactions
    return 'transactions';
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}