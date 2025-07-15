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
  // Primary: TBWA Unified Platform (via Vercel proxy)
  baseUrl: '/api/proxy',
  
  // Direct TBWA Unified Platform (for development)
  tbwaDirectUrl: import.meta.env.VITE_TBWA_UNIFIED_API_URL || 'http://localhost:3000',
  
  // Legacy: MCP SQLite Server
  mcpUrl: import.meta.env.VITE_MCP_API_URL || 'https://mcp-sqlite-server-1.onrender.com',
  
  // Timeout in milliseconds
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  
  // Use direct connection for development
  useDirect: import.meta.env.VITE_USE_DIRECT_API === 'true' || window.location.hostname === 'localhost',
  
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
    // Choose API endpoint based on environment
    if (API_CONFIG.useDirect && window.location.hostname === 'localhost') {
      this.baseUrl = API_CONFIG.tbwaDirectUrl;
      console.log('🔧 API Service initialized with TBWA Direct:', this.baseUrl);
    } else {
      this.baseUrl = API_CONFIG.baseUrl;
      console.log('🔧 API Service initialized with Proxy:', this.baseUrl);
    }
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
    
    // Use appropriate endpoint based on API type
    let endpoint;
    if (this.baseUrl.includes('localhost:3000')) {
      // Direct TBWA Unified Platform
      endpoint = `/api/scout/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    } else if (this.baseUrl.includes('/api/proxy')) {
      // Via Vercel proxy
      endpoint = `/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    } else {
      // Legacy MCP server
      endpoint = `/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    }
    
    const data = await this.request<any[]>(endpoint);
    
    // Handle different response formats
    let transactions = data;
    if (data && data.data) transactions = data.data;
    if (data && data.transactions) transactions = data.transactions;
    
    // Transform timestamps to Date objects
    return transformTimestamp(transactions);
  }
  
  /**
   * Get handshake events (Scout Analytics integration)
   */
  async getHandshakeEvents(filters: Record<string, any> = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    let endpoint;
    if (this.baseUrl.includes('localhost:3000')) {
      endpoint = `/api/scout/handshakes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    } else if (this.baseUrl.includes('/api/proxy')) {
      endpoint = `/handshakes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    } else {
      endpoint = `/handshakes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    }
    
    const data = await this.request<any[]>(endpoint);
    let handshakes = data;
    if (data && data.data) handshakes = data.data;
    
    return transformTimestamp(handshakes);
  }
  
  /**
   * Get hourly patterns
   */
  async getHourlyPatterns() {
    // Use handshake events for hourly patterns in unified platform
    try {
      const handshakes = await this.getHandshakeEvents();
      return this.generateHourlyPatterns(handshakes);
    } catch (error) {
      console.warn('Using fallback hourly patterns:', error);
      return this.generateMockHourlyPatterns();
    }
  }
  
  /**
   * Generate hourly patterns from handshake data
   */
  private generateHourlyPatterns(handshakes: any[]) {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0,
      total_value: 0,
      avg_value: 0
    }));
    
    handshakes.forEach(handshake => {
      const hour = new Date(handshake.timestamp).getHours();
      hourlyData[hour].count++;
      hourlyData[hour].total_value += handshake.transaction_value || 0;
    });
    
    hourlyData.forEach(data => {
      data.avg_value = data.count > 0 ? data.total_value / data.count : 0;
    });
    
    return hourlyData;
  }
  
  /**
   * Generate mock hourly patterns
   */
  private generateMockHourlyPatterns() {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: Math.floor(Math.random() * 100) + 20,
      total_value: Math.floor(Math.random() * 50000) + 10000,
      avg_value: Math.floor(Math.random() * 2000) + 500
    }));
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
   * Get unified dashboard stats
   */
  async getStats() {
    let endpoint;
    if (this.baseUrl.includes('localhost:3000')) {
      endpoint = '/api/insights/dashboard';
    } else if (this.baseUrl.includes('/api/proxy')) {
      endpoint = '/dashboard';
    } else {
      endpoint = '/stats';
    }
    
    const data = await this.request<any>(endpoint);
    
    // Transform unified platform response to expected format
    if (data.metrics) {
      return {
        total_transactions: data.metrics.totalHandshakes || 0,
        total_revenue: data.metrics.quarterlyRevenue || 0,
        avg_transaction_value: data.metrics.quarterlyRevenue / (data.metrics.totalHandshakes || 1),
        active_campaigns: data.metrics.activeCampaigns || 0,
        employee_utilization: data.metrics.employeeUtilization || 0,
        client_satisfaction: data.metrics.clientSatisfaction || 0,
        palette_effectiveness: data.metrics.paletteEffectiveness || 0
      };
    }
    
    return data;
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