/**
 * Desktop Integration Layer
 * Connects the React app to Electron APIs
 */

export class DesktopDataService {
  private isDesktop = !!(window as any).scoutAPI;
  private offlineMode = false;

  constructor() {
    if (this.isDesktop) {
      // Track desktop start
      this.trackEvent('desktop_start');
      
      // Check offline mode
      this.checkOfflineMode();
    }
  }

  async checkOfflineMode() {
    if (!this.isDesktop) return;
    
    try {
      // Try to ping the API
      const config = await window.scoutAPI.dal.getConfig();
      if (config.dataSource === 'local') {
        this.offlineMode = true;
      }
    } catch {
      this.offlineMode = true;
    }
  }

  async query(sql: string, params?: any[]): Promise<any> {
    if (!this.isDesktop) {
      throw new Error('Desktop API not available');
    }

    return window.scoutAPI.dal.query(sql, params);
  }

  async getTransactions(filters: Record<string, any> = {}): Promise<any[]> {
    // Build SQL query based on filters
    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];

    if (filters.region) {
      sql += ' AND store_id IN (SELECT store_id FROM stores WHERE region = ?)';
      params.push(filters.region);
    }

    if (filters.startDate && filters.endDate) {
      sql += ' AND timestamp BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    sql += ' ORDER BY timestamp DESC LIMIT 1000';

    const results = await this.query(sql, params);
    
    // Transform results to match expected format
    return results.map((row: any) => ({
      ...row,
      timestamp: new Date(row.timestamp)
    }));
  }

  async syncWithCloud(): Promise<void> {
    if (!this.isDesktop) return;

    try {
      const result = await window.scoutAPI.dal.sync();
      this.trackEvent('sync_ok', { tables: result.syncedTables });
    } catch (error) {
      this.trackEvent('sync_fail', { error: error.message });
      throw error;
    }
  }

  async importCSV(): Promise<{ success: boolean; rowCount: number } | null> {
    if (!this.isDesktop) return null;

    const result = await window.scoutAPI.import.csv();
    if (result) {
      this.trackEvent('import_csv', { rowCount: result.rowCount });
    }
    return result;
  }

  async switchDataSource(source: 'local' | 'cloud' | 'custom', customUrl?: string) {
    if (!this.isDesktop) return;

    const config = {
      dataSource: source,
      apiBaseUrl: customUrl || (source === 'cloud' ? 'https://api.scout.ai' : undefined)
    };

    await window.scoutAPI.dal.setDataSource(config);
    this.offlineMode = source === 'local';
  }

  onUpdateAvailable(callback: () => void) {
    if (!this.isDesktop) return;
    window.scoutAPI.update.onAvailable(callback);
  }

  onUpdateReady(callback: () => void) {
    if (!this.isDesktop) return;
    window.scoutAPI.update.onReady(callback);
  }

  async installUpdate() {
    if (!this.isDesktop) return;
    await window.scoutAPI.update.install();
  }

  private trackEvent(event: string, properties?: any) {
    if (!this.isDesktop) return;
    window.scoutAPI.analytics.track(event, properties);
  }

  get isOffline(): boolean {
    return this.offlineMode;
  }

  get isDesktopApp(): boolean {
    return this.isDesktop;
  }

  get platform(): string {
    if (!this.isDesktop) return 'web';
    return window.scoutAPI.platform.type;
  }
}

// Export singleton instance
export const desktopService = new DesktopDataService();