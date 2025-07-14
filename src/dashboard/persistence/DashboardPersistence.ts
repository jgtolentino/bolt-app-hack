/**
 * Scout Dash 2.0 - Dashboard Persistence
 * Handles saving and loading dashboard state to/from various storage backends
 */

import { Dashboard, VisualBlueprint } from '../types';

export interface PersistenceConfig {
  strategy: 'localStorage' | 'indexedDB' | 'remote' | 'file';
  autoSave: boolean;
  autoSaveInterval: number; // milliseconds
  versioning: boolean;
  compression: boolean;
}

export interface DashboardVersion {
  id: string;
  dashboardId: string;
  version: number;
  timestamp: Date;
  data: Dashboard;
  description?: string;
  createdBy: string;
}

export interface PersistenceMetadata {
  lastSaved: Date;
  saveCount: number;
  size: number; // bytes
  checksum: string;
}

export class DashboardPersistence {
  private config: PersistenceConfig;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private cache: Map<string, Dashboard> = new Map();

  constructor(config: Partial<PersistenceConfig> = {}) {
    this.config = {
      strategy: 'localStorage',
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      versioning: true,
      compression: false,
      ...config
    };
  }

  // Dashboard CRUD operations
  async saveDashboard(dashboard: Dashboard): Promise<void> {
    try {
      // Update metadata
      const updatedDashboard = {
        ...dashboard,
        lastModified: new Date().toISOString(),
        metadata: {
          ...dashboard.metadata,
          updatedAt: new Date(),
          updatedBy: 'current-user' // TODO: Get from auth context
        }
      };

      // Save to cache
      this.cache.set(dashboard.id, updatedDashboard);

      // Save with versioning if enabled
      if (this.config.versioning) {
        await this.createVersion(updatedDashboard);
      }

      // Save to persistent storage
      await this.persistToStorage(updatedDashboard);

      console.log(`Dashboard ${dashboard.id} saved successfully`);
    } catch (error) {
      console.error('Failed to save dashboard:', error);
      throw new Error(`Failed to save dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadDashboard(id: string): Promise<Dashboard | null> {
    try {
      // Check cache first
      if (this.cache.has(id)) {
        return this.cache.get(id)!;
      }

      // Load from storage
      const dashboard = await this.loadFromStorage(id);
      if (dashboard) {
        this.cache.set(id, dashboard);
      }

      return dashboard;
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      return null;
    }
  }

  async deleteDashboard(id: string): Promise<void> {
    try {
      // Remove from cache
      this.cache.delete(id);

      // Delete versions if versioning is enabled
      if (this.config.versioning) {
        await this.deleteVersions(id);
      }

      // Delete from storage
      await this.deleteFromStorage(id);

      console.log(`Dashboard ${id} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
      throw new Error(`Failed to delete dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listDashboards(): Promise<Dashboard[]> {
    try {
      return await this.listFromStorage();
    } catch (error) {
      console.error('Failed to list dashboards:', error);
      return [];
    }
  }

  // Auto-save functionality
  enableAutoSave(dashboard: Dashboard): void {
    if (!this.config.autoSave) return;

    this.disableAutoSave(); // Clear existing timer

    this.autoSaveTimer = setInterval(async () => {
      try {
        await this.saveDashboard(dashboard);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, this.config.autoSaveInterval);
  }

  disableAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // Version management
  async createVersion(dashboard: Dashboard, description?: string): Promise<DashboardVersion> {
    const versions = await this.getVersions(dashboard.id);
    const nextVersion = Math.max(...versions.map(v => v.version), 0) + 1;

    const version: DashboardVersion = {
      id: `${dashboard.id}_v${nextVersion}`,
      dashboardId: dashboard.id,
      version: nextVersion,
      timestamp: new Date(),
      data: dashboard,
      description,
      createdBy: 'current-user' // TODO: Get from auth context
    };

    await this.saveVersion(version);
    return version;
  }

  async getVersions(dashboardId: string): Promise<DashboardVersion[]> {
    const key = `dashboard_versions_${dashboardId}`;
    
    switch (this.config.strategy) {
      case 'localStorage':
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
      
      case 'indexedDB':
        // TODO: Implement IndexedDB version storage
        return [];
      
      default:
        return [];
    }
  }

  async restoreVersion(dashboardId: string, version: number): Promise<Dashboard | null> {
    const versions = await this.getVersions(dashboardId);
    const targetVersion = versions.find(v => v.version === version);
    
    if (!targetVersion) {
      throw new Error(`Version ${version} not found for dashboard ${dashboardId}`);
    }

    // Restore as current dashboard
    await this.saveDashboard(targetVersion.data);
    return targetVersion.data;
  }

  // Storage strategy implementations
  private async persistToStorage(dashboard: Dashboard): Promise<void> {
    const data = this.config.compression ? this.compress(dashboard) : dashboard;

    switch (this.config.strategy) {
      case 'localStorage':
        localStorage.setItem(`dashboard_${dashboard.id}`, JSON.stringify(data));
        break;

      case 'indexedDB':
        await this.saveToIndexedDB(dashboard.id, data);
        break;

      case 'remote':
        await this.saveToRemote(dashboard.id, data);
        break;

      case 'file':
        await this.saveToFile(dashboard.id, data);
        break;

      default:
        throw new Error(`Unsupported storage strategy: ${this.config.strategy}`);
    }
  }

  private async loadFromStorage(id: string): Promise<Dashboard | null> {
    let data: any = null;

    switch (this.config.strategy) {
      case 'localStorage':
        const stored = localStorage.getItem(`dashboard_${id}`);
        data = stored ? JSON.parse(stored) : null;
        break;

      case 'indexedDB':
        data = await this.loadFromIndexedDB(id);
        break;

      case 'remote':
        data = await this.loadFromRemote(id);
        break;

      case 'file':
        data = await this.loadFromFile(id);
        break;

      default:
        throw new Error(`Unsupported storage strategy: ${this.config.strategy}`);
    }

    if (!data) return null;

    return this.config.compression ? this.decompress(data) : data;
  }

  private async deleteFromStorage(id: string): Promise<void> {
    switch (this.config.strategy) {
      case 'localStorage':
        localStorage.removeItem(`dashboard_${id}`);
        break;

      case 'indexedDB':
        await this.deleteFromIndexedDB(id);
        break;

      case 'remote':
        await this.deleteFromRemote(id);
        break;

      case 'file':
        await this.deleteFromFile(id);
        break;

      default:
        throw new Error(`Unsupported storage strategy: ${this.config.strategy}`);
    }
  }

  private async listFromStorage(): Promise<Dashboard[]> {
    switch (this.config.strategy) {
      case 'localStorage':
        const dashboards: Dashboard[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('dashboard_')) {
            const stored = localStorage.getItem(key);
            if (stored) {
              try {
                const dashboard = JSON.parse(stored);
                dashboards.push(this.config.compression ? this.decompress(dashboard) : dashboard);
              } catch (error) {
                console.warn(`Failed to parse dashboard from key ${key}:`, error);
              }
            }
          }
        }
        return dashboards;

      case 'indexedDB':
        return await this.listFromIndexedDB();

      case 'remote':
        return await this.listFromRemote();

      case 'file':
        return await this.listFromFile();

      default:
        return [];
    }
  }

  // IndexedDB implementation
  private async saveToIndexedDB(id: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ScoutDashboards', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['dashboards'], 'readwrite');
        const store = transaction.objectStore('dashboards');
        
        const putRequest = store.put({ id, data, timestamp: new Date() });
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('dashboards')) {
          db.createObjectStore('dashboards', { keyPath: 'id' });
        }
      };
    });
  }

  private async loadFromIndexedDB(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ScoutDashboards', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['dashboards'], 'readonly');
        const store = transaction.objectStore('dashboards');
        
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          resolve(getRequest.result?.data || null);
        };
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  }

  private async deleteFromIndexedDB(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ScoutDashboards', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['dashboards'], 'readwrite');
        const store = transaction.objectStore('dashboards');
        
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
    });
  }

  private async listFromIndexedDB(): Promise<Dashboard[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ScoutDashboards', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['dashboards'], 'readonly');
        const store = transaction.objectStore('dashboards');
        
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          const results = getAllRequest.result.map(item => item.data);
          resolve(results);
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
    });
  }

  // Placeholder implementations for other storage strategies
  private async saveToRemote(id: string, data: any): Promise<void> {
    // TODO: Implement remote API save
    throw new Error('Remote storage not yet implemented');
  }

  private async loadFromRemote(id: string): Promise<any> {
    // TODO: Implement remote API load
    throw new Error('Remote storage not yet implemented');
  }

  private async deleteFromRemote(id: string): Promise<void> {
    // TODO: Implement remote API delete
    throw new Error('Remote storage not yet implemented');
  }

  private async listFromRemote(): Promise<Dashboard[]> {
    // TODO: Implement remote API list
    throw new Error('Remote storage not yet implemented');
  }

  private async saveToFile(id: string, data: any): Promise<void> {
    // TODO: Implement file system save (for Electron)
    throw new Error('File storage not yet implemented');
  }

  private async loadFromFile(id: string): Promise<any> {
    // TODO: Implement file system load (for Electron)
    throw new Error('File storage not yet implemented');
  }

  private async deleteFromFile(id: string): Promise<void> {
    // TODO: Implement file system delete (for Electron)
    throw new Error('File storage not yet implemented');
  }

  private async listFromFile(): Promise<Dashboard[]> {
    // TODO: Implement file system list (for Electron)
    throw new Error('File storage not yet implemented');
  }

  // Compression utilities
  private compress(data: any): string {
    // Simple JSON string compression (in production, use a proper compression library)
    return JSON.stringify(data);
  }

  private decompress(data: string): any {
    return JSON.parse(data);
  }

  // Version storage helpers
  private async saveVersion(version: DashboardVersion): Promise<void> {
    const key = `dashboard_versions_${version.dashboardId}`;
    const versions = await this.getVersions(version.dashboardId);
    
    // Add new version and keep only last 10 versions
    const updatedVersions = [version, ...versions].slice(0, 10);
    
    switch (this.config.strategy) {
      case 'localStorage':
        localStorage.setItem(key, JSON.stringify(updatedVersions));
        break;
      
      // TODO: Implement for other storage strategies
      default:
        break;
    }
  }

  private async deleteVersions(dashboardId: string): Promise<void> {
    const key = `dashboard_versions_${dashboardId}`;
    
    switch (this.config.strategy) {
      case 'localStorage':
        localStorage.removeItem(key);
        break;
      
      // TODO: Implement for other storage strategies
      default:
        break;
    }
  }

  // Utility methods
  getMetadata(dashboardId: string): PersistenceMetadata | null {
    // TODO: Implement metadata tracking
    return null;
  }

  cleanup(): void {
    this.disableAutoSave();
    this.cache.clear();
  }
}

export default DashboardPersistence;