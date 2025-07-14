/**
 * API Service for Scout Dashboard
 * Handles all API communications with proper error handling and fallbacks
 * Supports both web and desktop (Electron) environments
 */

// Check if running in Electron
const isElectron = !!(window as any).scoutAPI;

// Import desktop service if available
let desktopService: any = null;
if (isElectron) {
  import('../../desktop/src/renderer/desktopIntegration').then(module => {
    desktopService = module.desktopService;
  }).catch(() => {
    // Desktop integration not available
  });
}

// Configuration from environment variables
const API_CONFIG = {
  // Direct MCP SQLite Server endpoint (bypasses proxy)
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://mcp-sqlite-server-1.onrender.com',
  
  // Fallback to local proxy if needed
  fallbackUrl: '/api/proxy',
  
  // Timeout in milliseconds
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  
  // Use direct connection or proxy
  useDirect: import.meta.env.VITE_USE_DIRECT_API !== 'false',
  
  // Use mock data as fallback
  useMockFallback: import.meta.env.VITE_USE_MOCK_FALLBACK !== 'false'
};

// Data transformation utilities
const transformTimestamp = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      timestamp: typeof item.timestamp === 'string' 
        ? new Date(item.timestamp) 
        : item.timestamp || new Date()
    }));
  }
  return data;
};

// API Service class
class ApiService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = API_CONFIG.useDirect ? API_CONFIG.baseUrl : API_CONFIG.fallbackUrl;
    console.log('🔧 API Service initialized with:', this.baseUrl);
  }
  
  /**
   * Fetch with timeout and error handling
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeout);
      return response;
    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${API_CONFIG.timeout}ms`);
      }
      throw error;
    }
  }
  
  /**
   * Generic API request handler
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('📡 API Request:', url);
    
    try {
      const response = await this.fetchWithTimeout(url, options);
      
      if (!response.ok) {
        // Check if it's a 404 and we're using MCP server
        if (response.status === 404 && this.baseUrl.includes('mcp-sqlite-server')) {
          console.warn('⚠️ MCP SQLite Server endpoint not found. Database might be empty or endpoints different.');
          throw new Error('Database endpoint not configured. Using mock data.');
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check for empty database
      if (this.baseUrl.includes('mcp-sqlite-server') && endpoint.includes('tables')) {
        if (data.success && data.tables && data.tables.length === 0) {
          console.warn('⚠️ MCP SQLite Server has no tables. Database needs initialization.');
          throw new Error('Database is empty. Using mock data.');
        }
      }
      
      console.log('✅ API Response:', endpoint, 'returned', Array.isArray(data) ? `${data.length} items` : 'data');
      
      return data;
    } catch (error: any) {
      console.error('❌ API Error:', error.message);
      
      // If direct connection fails, try fallback
      if (API_CONFIG.useDirect && this.baseUrl !== API_CONFIG.fallbackUrl && !error.message.includes('mock data')) {
        console.log('🔄 Trying fallback URL...');
        this.baseUrl = API_CONFIG.fallbackUrl;
        return this.request<T>(endpoint, options);
      }
      
      throw error;
    }
  }
  
  /**
   * Get transactions with filters
   */
  async getTransactions(filters: Record<string, any> = {}) {
    // If running in desktop mode, use desktop service
    if (isElectron && desktopService) {
      try {
        return await desktopService.getTransactions(filters);
      } catch (error) {
        console.warn('Desktop query failed, falling back to web API:', error);
      }
    }

    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    // Check if using MCP SQLite server pattern
    const endpoint = this.baseUrl.includes('mcp-sqlite-server') 
      ? `/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      : `/api/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const data = await this.request<any[]>(endpoint);
    
    // Transform timestamps to Date objects
    return transformTimestamp(data);
  }
  
  /**
   * Get hourly patterns
   */
  async getHourlyPatterns() {
    const endpoint = this.baseUrl.includes('mcp-sqlite-server') 
      ? '/hourly-patterns' 
      : '/api/hourly-patterns';
    const data = await this.request<any[]>(endpoint);
    return transformTimestamp(data);
  }
  
  /**
   * Get geographic data
   */
  async getGeographicData() {
    const endpoint = this.baseUrl.includes('mcp-sqlite-server') 
      ? '/geographic' 
      : '/api/geographic';
    return this.request<any[]>(endpoint);
  }
  
  /**
   * Get substitution data
   */
  async getSubstitutionData() {
    const endpoint = this.baseUrl.includes('mcp-sqlite-server') 
      ? '/substitutions' 
      : '/api/substitutions';
    return this.request<any[]>(endpoint);
  }
  
  /**
   * Get filter options
   */
  async getFilterOptions() {
    const endpoint = this.baseUrl.includes('mcp-sqlite-server') 
      ? '/filter-options' 
      : '/api/filter-options';
    return this.request<any>(endpoint);
  }
  
  /**
   * Get stats
   */
  async getStats() {
    const endpoint = this.baseUrl.includes('mcp-sqlite-server') 
      ? '/stats' 
      : '/api/stats';
    return this.request<any>(endpoint);
  }
  
  /**
   * Health check
   */
  async healthCheck() {
    const endpoint = this.baseUrl.includes('mcp-sqlite-server') 
      ? '/health' 
      : '/api/health';
    return this.request<any>(endpoint);
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types
export interface Transaction {
  id: string;
  timestamp: Date;
  transaction_value: number;
  final_amount: number;
  store_id: string;
  customer_id: string;
  region?: string;
  barangay?: string;
  category?: string;
  brand?: string;
  items?: any[];
  duration_seconds?: number;
  units_total?: number;
  payment_method?: string;
  stores?: {
    store_name: string;
    region: string;
    barangay: string;
    latitude?: number;
    longitude?: number;
  };
  transaction_items?: Array<{
    products?: {
      product_category: string;
      brand_name: string;
    };
  }>;
}

// Export mock data fallback
export async function getTransactionsWithFallback(filters: Record<string, any> = {}): Promise<Transaction[]> {
  try {
    return await apiService.getTransactions(filters);
  } catch (error) {
    console.warn('⚠️ API unavailable:', error);
    
    // Check if mock fallback is enabled
    if (!API_CONFIG.useMockFallback) {
      throw error;
    }
    
    console.log('📊 Using mock data as fallback');
    
    // Generate mock data as fallback
    const { generateMockData } = await import('../utils/mockDataGenerator');
    const mockData = generateMockData(1000);
    
    // Apply filters to mock data
    return mockData.filter(t => {
      if (filters.region && t.region !== filters.region) return false;
      if (filters.barangay && t.barangay !== filters.barangay) return false;
      if (filters.category && !t.items.some(i => i.category === filters.category)) return false;
      return true;
    });
  }
}