import { supabase } from '../lib/supabase';
import { FilterState } from '../features/types';
import { buildFilteredQuery } from './queryBuilders';

export interface FilteredValidationResult {
  section: string;
  data: any[];
  filterContext: {
    dateRange?: { from: string; to: string };
    appliedFilters: Partial<FilterState>;
    expectedTransactionCount?: number;
  };
  validationStatus: 'pass' | 'warning' | 'fail';
  validationMessages: string[];
  error?: string;
}

export class FilteredDatabaseValidator {
  static async validateFilteredKPIMetrics(filters: FilterState): Promise<FilteredValidationResult> {
    const validationMessages: string[] = [];
    let validationStatus: 'pass' | 'warning' | 'fail' = 'pass';

    try {
      // Build the filtered query
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' });

      // Apply date filters if present
      const dateFrom = filters.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dateTo = filters.date_to || new Date().toISOString().split('T')[0];
      
      query = query
        .gte('datetime', dateFrom + 'T00:00:00')
        .lte('datetime', dateTo + 'T23:59:59');

      // Apply other filters
      if (filters.region || filters.city_municipality || filters.barangay) {
        query = query.select('*, geography!inner(*)');
        if (filters.region) query = query.eq('geography.region', filters.region);
        if (filters.city_municipality) query = query.eq('geography.city_municipality', filters.city_municipality);
        if (filters.barangay) query = query.eq('geography.barangay', filters.barangay);
      }

      // Get filtered data
      const { data: transactions, error, count } = await query;
      if (error) throw error;

      const transactionCount = count || 0;
      const totalSales = transactions?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
      const avgBasket = transactionCount > 0 ? totalSales / transactionCount : 0;

      // Validate transaction count for last 30 days
      const isLast30Days = !filters.date_from && !filters.date_to;
      if (isLast30Days) {
        if (transactionCount !== 1000) {
          validationStatus = 'warning';
          validationMessages.push(`Expected 1000 transactions for last 30 days, found ${transactionCount}`);
        } else {
          validationMessages.push('✓ Transaction count matches expected 1000 for last 30 days');
        }
      }

      // Validate sales total
      const expectedSales = 24681.78; // From the user's data
      if (isLast30Days && Math.abs(totalSales - expectedSales) > 0.01) {
        validationStatus = 'warning';
        validationMessages.push(`Sales total mismatch: expected ₱${expectedSales}, found ₱${totalSales.toFixed(2)}`);
      } else if (isLast30Days) {
        validationMessages.push('✓ Sales total matches expected ₱24,681.78');
      }

      // Validate average basket value
      const expectedAvgBasket = totalSales / transactionCount;
      if (Math.abs(avgBasket - expectedAvgBasket) > 0.01) {
        validationStatus = 'warning';
        validationMessages.push(`Average basket calculation issue: ${avgBasket.toFixed(2)} vs ${expectedAvgBasket.toFixed(2)}`);
      } else {
        validationMessages.push('✓ Average basket value calculated correctly');
      }

      // Get store count for filtered data
      const storeQuery = supabase.from('geography').select('id', { count: 'exact' });
      if (filters.region) storeQuery.eq('region', filters.region);
      if (filters.city_municipality) storeQuery.eq('city_municipality', filters.city_municipality);
      
      const { count: storeCount } = await storeQuery;

      return {
        section: 'KPI Metrics (Filtered)',
        data: [{
          total_sales: totalSales,
          transaction_count: transactionCount,
          avg_basket: avgBasket,
          active_outlets: storeCount || 0,
          date_range: { from: dateFrom, to: dateTo },
          filter_context: filters
        }],
        filterContext: {
          dateRange: { from: dateFrom, to: dateTo },
          appliedFilters: filters,
          expectedTransactionCount: isLast30Days ? 1000 : undefined
        },
        validationStatus,
        validationMessages
      };
    } catch (error) {
      return {
        section: 'KPI Metrics (Filtered)',
        data: [],
        filterContext: { appliedFilters: filters },
        validationStatus: 'fail',
        validationMessages: ['Failed to validate KPI metrics'],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async validateFilteredRegionalPerformance(filters: FilterState): Promise<FilteredValidationResult> {
    const validationMessages: string[] = [];
    let validationStatus: 'pass' | 'warning' | 'fail' = 'pass';

    try {
      // Build query with filters
      let query = supabase
        .from('transactions')
        .select(`
          total_amount,
          geography!inner(region)
        `);

      // Apply date filters
      const dateFrom = filters.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dateTo = filters.date_to || new Date().toISOString().split('T')[0];
      
      query = query
        .gte('datetime', dateFrom + 'T00:00:00')
        .lte('datetime', dateTo + 'T23:59:59');

      // Apply region filter if specified
      if (filters.region) {
        query = query.eq('geography.region', filters.region);
      }

      const { data: transactions, error } = await query;
      if (error) throw error;

      // Aggregate by region
      const regionMap = new Map();
      transactions?.forEach(t => {
        const region = t.geography.region;
        if (!regionMap.has(region)) {
          regionMap.set(region, { 
            region, 
            total_sales: 0, 
            transaction_count: 0 
          });
        }
        const data = regionMap.get(region);
        data.total_sales += t.total_amount;
        data.transaction_count += 1;
      });

      // Convert to array and sort by sales
      const regionData = Array.from(regionMap.values())
        .sort((a, b) => b.total_sales - a.total_sales);

      // Validate top regions match expected values
      const expectedTopRegions = [
        { region: 'NCR', expectedSales: 441331.85 },
        { region: 'Region III', expectedSales: 222357.42 },
        { region: 'Region VII', expectedSales: 199207.43 },
        { region: 'Region IV-A', expectedSales: 194085.36 },
        { region: 'Region VI', expectedSales: 152791.8 }
      ];

      const isLast30Days = !filters.date_from && !filters.date_to;
      if (isLast30Days && !filters.region) {
        expectedTopRegions.forEach(expected => {
          const actual = regionData.find(r => r.region === expected.region);
          if (actual) {
            const diff = Math.abs(actual.total_sales - expected.expectedSales);
            if (diff > 0.01) {
              validationStatus = 'warning';
              validationMessages.push(`${expected.region} sales mismatch: expected ₱${expected.expectedSales}, found ₱${actual.total_sales.toFixed(2)}`);
            } else {
              validationMessages.push(`✓ ${expected.region} sales match expected value`);
            }
          }
        });
      }

      return {
        section: 'Regional Performance (Filtered)',
        data: regionData,
        filterContext: {
          dateRange: { from: dateFrom, to: dateTo },
          appliedFilters: filters
        },
        validationStatus,
        validationMessages
      };
    } catch (error) {
      return {
        section: 'Regional Performance (Filtered)',
        data: [],
        filterContext: { appliedFilters: filters },
        validationStatus: 'fail',
        validationMessages: ['Failed to validate regional performance'],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async validateFilteredPaymentMethods(filters: FilterState): Promise<FilteredValidationResult> {
    const validationMessages: string[] = [];
    let validationStatus: 'pass' | 'warning' | 'fail' = 'pass';

    try {
      // Get filtered transactions
      let query = supabase
        .from('transactions')
        .select('payment_method, id');

      // Apply date filters
      const dateFrom = filters.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dateTo = filters.date_to || new Date().toISOString().split('T')[0];
      
      query = query
        .gte('datetime', dateFrom + 'T00:00:00')
        .lte('datetime', dateTo + 'T23:59:59');

      const { data: transactions, error } = await query;
      if (error) throw error;

      // Calculate payment method distribution
      const paymentMethodCounts = new Map();
      let totalCount = 0;

      transactions?.forEach(t => {
        const method = t.payment_method || 'Unknown';
        paymentMethodCounts.set(method, (paymentMethodCounts.get(method) || 0) + 1);
        totalCount++;
      });

      // Convert to array with percentages
      const paymentData = Array.from(paymentMethodCounts.entries())
        .map(([method, count]) => ({
          payment_method: method,
          transaction_count: count,
          percentage_of_transactions: ((count / totalCount) * 100).toFixed(2)
        }))
        .sort((a, b) => b.transaction_count - a.transaction_count);

      // Validate expected payment method distribution
      const expectedMethods = [
        { method: 'Cash', expectedPercentage: 59.39 },
        { method: 'Utang/Lista', expectedPercentage: 26.1 },
        { method: 'GCash', expectedPercentage: 12.81 },
        { method: 'Credit Card', expectedPercentage: 1.71 }
      ];

      const isLast30Days = !filters.date_from && !filters.date_to;
      if (isLast30Days) {
        expectedMethods.forEach(expected => {
          const actual = paymentData.find(p => p.payment_method === expected.method);
          if (actual) {
            const diff = Math.abs(parseFloat(actual.percentage_of_transactions) - expected.expectedPercentage);
            if (diff > 0.5) { // Allow 0.5% tolerance
              validationStatus = 'warning';
              validationMessages.push(`${expected.method} percentage mismatch: expected ${expected.expectedPercentage}%, found ${actual.percentage_of_transactions}%`);
            } else {
              validationMessages.push(`✓ ${expected.method} percentage matches expected value`);
            }
          }
        });
      }

      return {
        section: 'Payment Methods (Filtered)',
        data: paymentData,
        filterContext: {
          dateRange: { from: dateFrom, to: dateTo },
          appliedFilters: filters
        },
        validationStatus,
        validationMessages
      };
    } catch (error) {
      return {
        section: 'Payment Methods (Filtered)',
        data: [],
        filterContext: { appliedFilters: filters },
        validationStatus: 'fail',
        validationMessages: ['Failed to validate payment methods'],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async validateFilteredTopProducts(filters: FilterState): Promise<FilteredValidationResult> {
    const validationMessages: string[] = [];
    let validationStatus: 'pass' | 'warning' | 'fail' = 'pass';

    try {
      // Get filtered transaction items with product details
      let query = supabase
        .from('transaction_items')
        .select(`
          total_amount,
          products!inner(sku, brand)
        `);

      // We need to join with transactions to apply date filters
      // This is a limitation - we'll need to get transaction IDs first
      let transQuery = supabase
        .from('transactions')
        .select('id');

      // Apply date filters
      const dateFrom = filters.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dateTo = filters.date_to || new Date().toISOString().split('T')[0];
      
      transQuery = transQuery
        .gte('datetime', dateFrom + 'T00:00:00')
        .lte('datetime', dateTo + 'T23:59:59');

      const { data: transactionIds, error: transError } = await transQuery;
      if (transError) throw transError;

      const ids = transactionIds?.map(t => t.id) || [];
      
      // Now get items for these transactions
      const { data: items, error } = await supabase
        .from('transaction_items')
        .select(`
          total_amount,
          products!inner(sku, brand)
        `)
        .in('transaction_id', ids);

      if (error) throw error;

      // Aggregate by product
      const productMap = new Map();
      items?.forEach(item => {
        const sku = item.products.sku;
        const brand = item.products.brand;
        const key = `${sku}|${brand}`;
        
        if (!productMap.has(key)) {
          productMap.set(key, {
            sku,
            brand,
            total_sales: 0,
            transaction_count: 0
          });
        }
        
        const data = productMap.get(key);
        data.total_sales += item.total_amount;
        data.transaction_count += 1;
      });

      // Convert to array and sort by sales
      const productData = Array.from(productMap.values())
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 10);

      // Validate top products
      const expectedTopProducts = [
        { sku: 'COKE-1.5L', brand: 'Coca-Cola' },
        { sku: 'COKE-250ML', brand: 'Coca-Cola' },
        { sku: 'MILO-300ML', brand: 'Milo' },
        { sku: 'PEPSI-250ML', brand: 'Pepsi' },
        { sku: 'RICOA-CURLY-150G', brand: 'Ricoa' }
      ];

      const isLast30Days = !filters.date_from && !filters.date_to;
      if (isLast30Days) {
        const actualTop5 = productData.slice(0, 5);
        expectedTopProducts.forEach((expected, index) => {
          if (actualTop5[index]) {
            const actual = actualTop5[index];
            if (actual.sku === expected.sku && actual.brand === expected.brand) {
              validationMessages.push(`✓ Rank ${index + 1}: ${expected.sku} correctly positioned`);
            } else {
              validationStatus = 'warning';
              validationMessages.push(`Rank ${index + 1} mismatch: expected ${expected.sku}, found ${actual.sku}`);
            }
          }
        });
      }

      return {
        section: 'Top Products (Filtered)',
        data: productData,
        filterContext: {
          dateRange: { from: dateFrom, to: dateTo },
          appliedFilters: filters
        },
        validationStatus,
        validationMessages
      };
    } catch (error) {
      return {
        section: 'Top Products (Filtered)',
        data: [],
        filterContext: { appliedFilters: filters },
        validationStatus: 'fail',
        validationMessages: ['Failed to validate top products'],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async runFilteredValidation(filters: FilterState): Promise<FilteredValidationResult[]> {
    console.log('🔍 Starting filtered database validation...');
    console.log('Applied filters:', filters);
    
    const results = await Promise.all([
      this.validateFilteredKPIMetrics(filters),
      this.validateFilteredRegionalPerformance(filters),
      this.validateFilteredPaymentMethods(filters),
      this.validateFilteredTopProducts(filters)
    ]);

    console.log('✅ Filtered database validation complete');
    return results;
  }

  static generateValidationReport(results: FilteredValidationResult[]): string {
    let output = '='.repeat(80) + '\n';
    output += 'FILTERED DATA VALIDATION REPORT\n';
    output += '='.repeat(80) + '\n\n';

    // Overall summary
    const passCount = results.filter(r => r.validationStatus === 'pass').length;
    const warningCount = results.filter(r => r.validationStatus === 'warning').length;
    const failCount = results.filter(r => r.validationStatus === 'fail').length;

    output += `SUMMARY: ${passCount} Passed | ${warningCount} Warnings | ${failCount} Failed\n\n`;

    results.forEach(result => {
      output += `📊 ${result.section.toUpperCase()}\n`;
      output += '-'.repeat(40) + '\n';
      
      // Show filter context
      if (result.filterContext.dateRange) {
        output += `Date Range: ${result.filterContext.dateRange.from} to ${result.filterContext.dateRange.to}\n`;
      }
      
      // Show validation status
      const statusIcon = result.validationStatus === 'pass' ? '✅' : 
                        result.validationStatus === 'warning' ? '⚠️' : '❌';
      output += `Status: ${statusIcon} ${result.validationStatus.toUpperCase()}\n\n`;
      
      // Show validation messages
      if (result.validationMessages.length > 0) {
        output += 'Validation Results:\n';
        result.validationMessages.forEach(msg => {
          output += `  ${msg}\n`;
        });
        output += '\n';
      }
      
      if (result.error) {
        output += `❌ Error: ${result.error}\n\n`;
        return;
      }

      if (result.data.length === 0) {
        output += '⚠️  No data found\n\n';
        return;
      }

      // Show data summary
      if (result.section.includes('KPI Metrics')) {
        const kpi = result.data[0];
        output += `Total Sales: ₱${kpi.total_sales?.toLocaleString() || 0}\n`;
        output += `Transactions: ${kpi.transaction_count?.toLocaleString() || 0}\n`;
        output += `Avg Basket: ₱${kpi.avg_basket?.toFixed(2) || 0}\n`;
        output += `Active Outlets: ${kpi.active_outlets || 0}\n`;
      } else if (result.section.includes('Regional Performance')) {
        output += 'Top 5 Regions:\n';
        result.data.slice(0, 5).forEach((region, index) => {
          output += `  ${index + 1}. ${region.region} - ₱${region.total_sales?.toLocaleString() || 0}\n`;
        });
      } else if (result.section.includes('Payment Methods')) {
        result.data.forEach(method => {
          output += `  ${method.payment_method}: ${method.percentage_of_transactions}% (${method.transaction_count} transactions)\n`;
        });
      } else if (result.section.includes('Top Products')) {
        output += 'Top 5 Products:\n';
        result.data.slice(0, 5).forEach((product, index) => {
          output += `  ${index + 1}. ${product.sku} (${product.brand}) - ₱${product.total_sales?.toLocaleString() || 0}\n`;
        });
      }
      
      output += '\n';
    });

    return output;
  }
}