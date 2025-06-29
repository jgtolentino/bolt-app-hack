import { supabase, fetchAllRecords } from '../lib/supabase';

export interface ProValidationResult {
  section: string;
  status: 'success' | 'warning' | 'error';
  data: any;
  recordCount?: number;
  executionTime?: number;
  message?: string;
}

export class ProAccountValidator {
  
  static async validateProPlanLimits(): Promise<ProValidationResult> {
    const startTime = Date.now();
    
    try {
      // Test large query capability (Pro plan feature)
      const { data, error, count } = await supabase
        .from('transactions')
        .select('id, total_amount', { count: 'exact' })
        .limit(10000); // Test Pro plan limit
      
      if (error) throw error;
      
      const executionTime = Date.now() - startTime;
      
      return {
        section: 'Pro Plan Limits',
        status: count && count > 1000 ? 'success' : 'warning',
        data: {
          totalRecords: count,
          queriedRecords: data?.length || 0,
          planType: count && count > 1000 ? 'Pro/Team' : 'Free',
          maxQueryLimit: count && count > 1000 ? '1M records' : '1K records'
        },
        recordCount: count || 0,
        executionTime,
        message: count && count > 1000 
          ? 'Pro plan features confirmed - large dataset access available'
          : 'Limited to free tier query limits'
      };
    } catch (error) {
      return {
        section: 'Pro Plan Limits',
        status: 'error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        executionTime: Date.now() - startTime
      };
    }
  }

  static async validateLargeDatasetAccess(): Promise<ProValidationResult> {
    const startTime = Date.now();
    
    try {
      // Test fetching all transactions using pagination
      const query = supabase
        .from('transactions')
        .select('id, total_amount, datetime')
        .order('datetime', { ascending: false });
      
      const allTransactions = await fetchAllRecords(query, 10000, 100000);
      
      const executionTime = Date.now() - startTime;
      
      return {
        section: 'Large Dataset Access',
        status: 'success',
        data: {
          totalFetched: allTransactions.length,
          sampleData: allTransactions.slice(0, 3),
          avgFetchTime: executionTime / allTransactions.length,
          totalValue: allTransactions.reduce((sum, t) => sum + t.total_amount, 0)
        },
        recordCount: allTransactions.length,
        executionTime,
        message: `Successfully fetched ${allTransactions.length} records using Pro plan pagination`
      };
    } catch (error) {
      return {
        section: 'Large Dataset Access',
        status: 'error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        executionTime: Date.now() - startTime
      };
    }
  }

  static async validateComplexQueries(): Promise<ProValidationResult> {
    const startTime = Date.now();
    
    try {
      // Test complex aggregation query
      const { data, error } = await supabase
        .rpc('get_geographic_performance', {
          start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        });
      
      if (error) throw error;
      
      const executionTime = Date.now() - startTime;
      
      return {
        section: 'Complex Queries',
        status: 'success',
        data: {
          functionResult: data?.slice(0, 5) || [],
          totalRegions: data?.length || 0,
          topPerformer: data?.[0] || null
        },
        recordCount: data?.length || 0,
        executionTime,
        message: 'Complex database functions executing successfully'
      };
    } catch (error) {
      return {
        section: 'Complex Queries',
        status: 'error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        executionTime: Date.now() - startTime
      };
    }
  }

  static async validateRealtimeCapabilities(): Promise<ProValidationResult> {
    const startTime = Date.now();
    
    try {
      // Test realtime subscription capability
      const channel = supabase
        .channel('test-channel')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'transactions' }, 
          (payload) => {
            console.log('Realtime test:', payload);
          }
        );
      
      const subscriptionResult = await channel.subscribe();
      
      // Clean up
      await supabase.removeChannel(channel);
      
      const executionTime = Date.now() - startTime;
      
      return {
        section: 'Realtime Capabilities',
        status: subscriptionResult === 'SUBSCRIBED' ? 'success' : 'warning',
        data: {
          subscriptionStatus: subscriptionResult,
          realtimeEnabled: subscriptionResult === 'SUBSCRIBED'
        },
        executionTime,
        message: subscriptionResult === 'SUBSCRIBED' 
          ? 'Realtime subscriptions working correctly'
          : 'Realtime subscriptions may have issues'
      };
    } catch (error) {
      return {
        section: 'Realtime Capabilities',
        status: 'error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        executionTime: Date.now() - startTime
      };
    }
  }

  static async validateDashboardMetrics(): Promise<ProValidationResult> {
    const startTime = Date.now();
    
    try {
      // Validate all dashboard KPIs with Pro plan data access
      const [salesData, geoData, productData, paymentData] = await Promise.all([
        fetchAllRecords(
          supabase
            .from('transactions')
            .select('total_amount, datetime')
            .gte('datetime', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
          10000
        ),
        supabase.from('v_geographic_performance').select('*').order('total_sales', { ascending: false }),
        supabase.from('v_product_performance').select('*').order('total_sales', { ascending: false }).limit(10),
        supabase.from('v_payment_method_analysis').select('*').order('transaction_count', { ascending: false })
      ]);

      const totalSales = salesData.reduce((sum, t) => sum + t.total_amount, 0);
      const transactionCount = salesData.length;
      const avgBasket = transactionCount > 0 ? totalSales / transactionCount : 0;

      const executionTime = Date.now() - startTime;

      return {
        section: 'Dashboard Metrics',
        status: 'success',
        data: {
          kpis: {
            totalSales,
            transactionCount,
            avgBasket,
            activeOutlets: geoData.data?.length || 0
          },
          topRegion: geoData.data?.[0] || null,
          topProduct: productData.data?.[0] || null,
          paymentMethods: paymentData.data || [],
          dataFreshness: new Date().toISOString()
        },
        recordCount: transactionCount,
        executionTime,
        message: `Dashboard metrics calculated from ${transactionCount} transactions`
      };
    } catch (error) {
      return {
        section: 'Dashboard Metrics',
        status: 'error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        executionTime: Date.now() - startTime
      };
    }
  }

  static async runFullProValidation(): Promise<ProValidationResult[]> {
    console.log('🚀 Starting Supabase Pro Account Validation...');
    
    const results = await Promise.all([
      this.validateProPlanLimits(),
      this.validateLargeDatasetAccess(),
      this.validateComplexQueries(),
      this.validateRealtimeCapabilities(),
      this.validateDashboardMetrics()
    ]);

    console.log('✅ Pro account validation complete');
    return results;
  }

  static generateProReport(results: ProValidationResult[]): string {
    let report = '='.repeat(80) + '\n';
    report += 'SUPABASE PRO ACCOUNT VALIDATION REPORT\n';
    report += '='.repeat(80) + '\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n\n`;

    results.forEach(result => {
      const statusIcon = result.status === 'success' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : '❌';
      
      report += `${statusIcon} ${result.section.toUpperCase()}\n`;
      report += '-'.repeat(50) + '\n';
      report += `Status: ${result.status.toUpperCase()}\n`;
      
      if (result.recordCount !== undefined) {
        report += `Records: ${result.recordCount.toLocaleString()}\n`;
      }
      
      if (result.executionTime !== undefined) {
        report += `Execution Time: ${result.executionTime}ms\n`;
      }
      
      if (result.message) {
        report += `Message: ${result.message}\n`;
      }
      
      report += '\n';
    });

    // Summary
    const successCount = results.filter(r => r.status === 'success').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    report += 'SUMMARY\n';
    report += '-'.repeat(20) + '\n';
    report += `✅ Passed: ${successCount}\n`;
    report += `⚠️ Warnings: ${warningCount}\n`;
    report += `❌ Errors: ${errorCount}\n\n`;

    if (successCount === results.length) {
      report += '🎉 All Pro plan features are working correctly!\n';
    } else if (errorCount === 0) {
      report += '👍 Pro plan is working with minor warnings.\n';
    } else {
      report += '🔧 Some Pro plan features need attention.\n';
    }

    return report;
  }

  // Improved function to generate 750K transactions using batched approach
  static async generate750KTransactions(): Promise<ProValidationResult> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting batched 750K transaction generation...');
      
      const targetTransactions = 750000;
      const batchSize = 5000; // Smaller batch size to avoid timeouts
      const totalBatches = Math.ceil(targetTransactions / batchSize);
      
      console.log(`📊 Generating ${targetTransactions} transactions in ${totalBatches} batches of ${batchSize}`);
      
      // Start the generation process by calling the first batch
      const { data, error } = await supabase.rpc('generate_transaction_batch', {
        batch_size: batchSize,
        batch_number: 1,
        total_batches: totalBatches
      });
      
      if (error) throw error;
      
      const executionTime = Date.now() - startTime;
      
      return {
        section: '750K Transaction Generation',
        status: 'success',
        data: {
          result: data,
          batchSize,
          totalBatches,
          targetTransactions,
          generationStarted: true,
          message: 'Batched generation initiated successfully'
        },
        executionTime,
        message: `Successfully started batched generation: ${totalBatches} batches of ${batchSize} transactions each`
      };
    } catch (error) {
      // If the batch function doesn't exist, fall back to smaller direct generation
      console.log('⚠️ Batch function not available, trying smaller direct generation...');
      
      try {
        const { data, error } = await supabase.rpc('generate_full_dataset', {
          total_transactions: 50000, // Much smaller number to avoid timeout
          batch_size: 5000
        });
        
        if (error) throw error;
        
        return {
          section: '750K Transaction Generation',
          status: 'warning',
          data: {
            result: data,
            actualGenerated: 50000,
            targetTransactions: 750000,
            message: 'Generated smaller dataset due to timeout constraints'
          },
          executionTime: Date.now() - startTime,
          message: 'Generated 50K transactions instead of 750K to avoid timeout. Consider implementing batched generation on the database side.'
        };
      } catch (fallbackError) {
        return {
          section: '750K Transaction Generation',
          status: 'error',
          data: { 
            error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
            originalError: error instanceof Error ? error.message : 'Unknown error'
          },
          executionTime: Date.now() - startTime,
          message: 'Failed to generate transactions. Database timeout occurred. Consider increasing statement timeout in Supabase settings or implementing server-side batching.'
        };
      }
    }
  }

  // Function to monitor generation progress
  static async monitorGenerationProgress(): Promise<ProValidationResult> {
    const startTime = Date.now();
    
    try {
      // Get current transaction count
      const { count, error } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      const currentCount = count || 0;
      const targetCount = 750000;
      const percentage = Math.min((currentCount / targetCount) * 100, 100);
      
      // Get today's transactions
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .gte('datetime', `${today}T00:00:00Z`)
        .lt('datetime', `${today}T23:59:59Z`);
      
      const executionTime = Date.now() - startTime;
      
      return {
        section: 'Generation Progress',
        status: 'success',
        data: {
          total_transactions: currentCount,
          target_percentage: Math.round(percentage * 100) / 100,
          transactions_today: todayCount || 0,
          remaining: Math.max(targetCount - currentCount, 0),
          avg_per_hour: todayCount ? Math.round((todayCount || 0) / 24) : 0
        },
        recordCount: currentCount,
        executionTime,
        message: `Progress: ${percentage.toFixed(1)}% complete (${currentCount.toLocaleString()}/${targetCount.toLocaleString()} transactions)`
      };
    } catch (error) {
      return {
        section: 'Generation Progress',
        status: 'error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        executionTime: Date.now() - startTime
      };
    }
  }

  // New function to continue batch generation
  static async continueBatchGeneration(currentBatch: number, totalBatches: number, batchSize: number): Promise<ProValidationResult> {
    const startTime = Date.now();
    
    try {
      if (currentBatch > totalBatches) {
        return {
          section: 'Batch Generation',
          status: 'success',
          data: { message: 'All batches completed' },
          executionTime: Date.now() - startTime,
          message: 'Batch generation completed successfully'
        };
      }
      
      const { data, error } = await supabase.rpc('generate_transaction_batch', {
        batch_size: batchSize,
        batch_number: currentBatch,
        total_batches: totalBatches
      });
      
      if (error) throw error;
      
      const executionTime = Date.now() - startTime;
      
      return {
        section: 'Batch Generation',
        status: 'success',
        data: {
          result: data,
          currentBatch,
          totalBatches,
          progress: (currentBatch / totalBatches) * 100
        },
        executionTime,
        message: `Batch ${currentBatch}/${totalBatches} completed`
      };
    } catch (error) {
      return {
        section: 'Batch Generation',
        status: 'error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        executionTime: Date.now() - startTime,
        message: `Failed to generate batch ${currentBatch}/${totalBatches}`
      };
    }
  }
}