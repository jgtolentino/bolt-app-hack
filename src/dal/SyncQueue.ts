/**
 * Sync Queue Manager
 * Handles offline write operations and synchronization
 * Stores failed operations and retries them when connectivity is restored
 */

import { SyncQueueItem } from './types';

export interface SyncQueueConfig {
  maxQueueSize: number;
  maxItemSize: number; // bytes
  persistToStorage: boolean;
  retryDelays: number[]; // milliseconds for each retry attempt
  compressionEnabled: boolean;
}

export interface SyncQueueMetrics {
  totalItems: number;
  pendingItems: number;
  failedItems: number;
  successfulSyncs: number;
  queueSizeBytes: number;
  lastSyncAttempt?: Date;
  lastSuccessfulSync?: Date;
}

export class SyncQueue {
  private queue: SyncQueueItem[] = [];
  private config: SyncQueueConfig;
  private metrics: SyncQueueMetrics;
  private storage?: Storage;
  private isProcessing = false;
  private onSyncComplete?: (item: SyncQueueItem, success: boolean) => void;

  constructor(
    config: Partial<SyncQueueConfig> = {},
    onSyncComplete?: (item: SyncQueueItem, success: boolean) => void
  ) {
    this.config = {
      maxQueueSize: 10000,
      maxItemSize: 1024 * 1024, // 1MB per item
      persistToStorage: typeof localStorage !== 'undefined',
      retryDelays: [1000, 2000, 5000, 10000, 30000], // 1s, 2s, 5s, 10s, 30s
      compressionEnabled: false,
      ...config
    };

    this.onSyncComplete = onSyncComplete;

    this.metrics = {
      totalItems: 0,
      pendingItems: 0,
      failedItems: 0,
      successfulSyncs: 0,
      queueSizeBytes: 0
    };

    // Initialize storage if available
    if (this.config.persistToStorage && typeof localStorage !== 'undefined') {
      this.storage = localStorage;
      this.loadFromStorage();
    }

    console.log('📋 Sync Queue initialized:', this.config);
  }

  /**
   * Add item to sync queue
   */
  enqueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): string {
    const queueItem: SyncQueueItem = {
      ...item,
      id: this.generateId(),
      timestamp: new Date(),
      retries: 0
    };

    // Check item size
    const itemSize = this.calculateItemSize(queueItem);
    if (itemSize > this.config.maxItemSize) {
      throw new Error(`Sync item too large: ${itemSize} bytes (max: ${this.config.maxItemSize})`);
    }

    // Check queue size
    if (this.queue.length >= this.config.maxQueueSize) {
      console.warn('Sync queue full, removing oldest item');
      this.queue.shift();
    }

    this.queue.push(queueItem);
    this.metrics.totalItems++;
    this.metrics.pendingItems++;
    this.updateMetrics();

    // Persist to storage
    if (this.storage) {
      this.saveToStorage();
    }

    console.log(`📝 Queued ${item.operation} operation: ${queueItem.id} (queue size: ${this.queue.length})`);
    return queueItem.id;
  }

  /**
   * Process sync queue with connector
   */
  async processQueue(
    syncFunction: (item: SyncQueueItem) => Promise<boolean>
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    
    if (this.isProcessing) {
      console.log('Sync queue already processing, skipping...');
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;
    this.metrics.lastSyncAttempt = new Date();

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    console.log(`🔄 Processing sync queue (${this.queue.length} items)...`);

    // Process items in order (FIFO)
    const itemsToProcess = [...this.queue];
    
    for (const item of itemsToProcess) {
      try {
        processed++;
        
        // Check if item should be retried (based on retry delays)
        if (item.retries > 0 && item.retries <= this.config.retryDelays.length) {
          const retryDelay = this.config.retryDelays[item.retries - 1];
          const timeSinceLastTry = Date.now() - item.timestamp.getTime();
          
          if (timeSinceLastTry < retryDelay) {
            console.log(`⏳ Skipping ${item.id} - waiting ${retryDelay - timeSinceLastTry}ms for retry`);
            continue;
          }
        }

        // Attempt to sync
        const success = await syncFunction(item);
        
        if (success) {
          // Remove from queue
          this.removeItem(item.id);
          succeeded++;
          this.metrics.successfulSyncs++;
          this.metrics.lastSuccessfulSync = new Date();
          
          console.log(`✅ Synced: ${item.id}`);
          
          if (this.onSyncComplete) {
            this.onSyncComplete(item, true);
          }
        } else {
          // Increment retry count
          item.retries++;
          item.timestamp = new Date(); // Update timestamp for retry delay calculation
          
          if (item.retries > this.config.retryDelays.length) {
            // Max retries exceeded, remove from queue
            console.error(`❌ Max retries exceeded for ${item.id}, dropping`);
            this.removeItem(item.id);
            this.metrics.failedItems++;
            failed++;
            
            if (this.onSyncComplete) {
              this.onSyncComplete(item, false);
            }
          } else {
            console.warn(`⚠️ Sync failed for ${item.id}, retry ${item.retries}/${this.config.retryDelays.length}`);
            failed++;
          }
        }
      } catch (error) {
        console.error(`💥 Error processing sync item ${item.id}:`, error);
        item.retries++;
        failed++;
      }
    }

    this.updateMetrics();
    
    // Persist changes
    if (this.storage) {
      this.saveToStorage();
    }

    this.isProcessing = false;

    console.log(`✅ Sync queue processed: ${processed} items (${succeeded} succeeded, ${failed} failed)`);
    
    return { processed, succeeded, failed };
  }

  /**
   * Remove specific item from queue
   */
  removeItem(itemId: string): boolean {
    const index = this.queue.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.metrics.pendingItems--;
      this.updateMetrics();
      return true;
    }
    return false;
  }

  /**
   * Clear all items from queue
   */
  clear(): void {
    const count = this.queue.length;
    this.queue = [];
    this.updateMetrics();
    
    if (this.storage) {
      this.storage.removeItem('scout-sync-queue');
    }
    
    console.log(`🧹 Cleared sync queue (${count} items removed)`);
  }

  /**
   * Get queue status
   */
  getStatus(): {
    items: SyncQueueItem[];
    metrics: SyncQueueMetrics;
    isProcessing: boolean;
  } {
    return {
      items: [...this.queue],
      metrics: { ...this.metrics },
      isProcessing: this.isProcessing
    };
  }

  /**
   * Get items by operation type
   */
  getItemsByOperation(operation: SyncQueueItem['operation']): SyncQueueItem[] {
    return this.queue.filter(item => item.operation === operation);
  }

  /**
   * Get items by table
   */
  getItemsByTable(table: string): SyncQueueItem[] {
    return this.queue.filter(item => item.table === table);
  }

  /**
   * Get retry statistics
   */
  getRetryStats(): Record<number, number> {
    const stats: Record<number, number> = {};
    
    this.queue.forEach(item => {
      stats[item.retries] = (stats[item.retries] || 0) + 1;
    });
    
    return stats;
  }

  // Private methods

  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateItemSize(item: SyncQueueItem): number {
    return JSON.stringify(item).length * 2; // Rough UTF-16 size estimation
  }

  private updateMetrics(): void {
    this.metrics.pendingItems = this.queue.length;
    this.metrics.queueSizeBytes = this.queue.reduce(
      (total, item) => total + this.calculateItemSize(item),
      0
    );
  }

  private saveToStorage(): void {
    if (!this.storage) return;
    
    try {
      const data = {
        queue: this.queue,
        metrics: this.metrics,
        timestamp: new Date().toISOString()
      };
      
      this.storage.setItem('scout-sync-queue', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save sync queue to storage:', error);
    }
  }

  private loadFromStorage(): void {
    if (!this.storage) return;
    
    try {
      const stored = this.storage.getItem('scout-sync-queue');
      if (stored) {
        const data = JSON.parse(stored);
        
        // Restore queue items
        this.queue = data.queue.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        
        // Restore metrics (but reset processing state)
        this.metrics = {
          ...data.metrics,
          pendingItems: this.queue.length
        };
        
        console.log(`📦 Loaded ${this.queue.length} items from storage`);
      }
    } catch (error) {
      console.warn('Failed to load sync queue from storage:', error);
    }
  }
}

/**
 * Create SQL-based sync queue for database operations
 */
export function createSQLSyncQueue(config?: Partial<SyncQueueConfig>): SyncQueue {
  return new SyncQueue({
    ...config,
    maxQueueSize: 5000, // Smaller queue for SQL operations
    maxItemSize: 512 * 1024, // 512KB per SQL operation
  });
}

/**
 * Create API-based sync queue for REST operations
 */
export function createAPISyncQueue(config?: Partial<SyncQueueConfig>): SyncQueue {
  return new SyncQueue({
    ...config,
    maxQueueSize: 10000,
    maxItemSize: 1024 * 1024, // 1MB per API call
    retryDelays: [2000, 5000, 15000, 60000], // Longer delays for API calls
  });
}