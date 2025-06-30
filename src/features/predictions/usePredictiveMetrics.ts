import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface PredictedMetric {
  id: string;
  metric_name: string;
  scope: {
    brand_id?: string;
    region_id?: string;
    store_id?: string;
    category_id?: string;
    [key: string]: any;
  };
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  prediction_date: string;
  predicted_value: number;
  lower_bound: number;
  upper_bound: number;
  confidence_level: number;
  model_name: string;
  model_version?: string;
  mae?: number;
  mape?: number;
}

export interface PredictionAccuracy {
  id: string;
  predicted_metric_id: string;
  actual_value: number;
  absolute_error: number;
  percentage_error: number;
  measured_at: string;
}

interface UsePredictiveMetricsResult {
  predictions: PredictedMetric[];
  accuracyHistory: PredictionAccuracy[];
  isLoading: boolean;
  error: Error | null;
  fetchPredictions: (metric: string, scope?: any, days?: number) => Promise<PredictedMetric[]>;
  generatePredictions: (metric: string, scope: any, days?: number) => Promise<void>;
  recordActual: (predictionId: string, actualValue: number) => Promise<void>;
  getModelPerformance: (metric: string) => Promise<ModelPerformance>;
}

interface ModelPerformance {
  metric_name: string;
  total_predictions: number;
  avg_mae: number;
  avg_mape: number;
  accuracy_rate: number;
  best_performing_scope: any;
  worst_performing_scope: any;
}

export const usePredictiveMetrics = (): UsePredictiveMetricsResult => {
  const [predictions, setPredictions] = useState<PredictedMetric[]>([]);
  const [accuracyHistory, setAccuracyHistory] = useState<PredictionAccuracy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch existing predictions
  const fetchPredictions = useCallback(async (
    metric: string,
    scope?: any,
    days: number = 7
  ): Promise<PredictedMetric[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      let query = supabase
        .from('predicted_metrics')
        .select('*')
        .eq('metric_name', metric)
        .gte('prediction_date', new Date().toISOString().split('T')[0])
        .lte('prediction_date', futureDate.toISOString().split('T')[0])
        .order('prediction_date');

      // Apply scope filters if provided
      if (scope) {
        Object.entries(scope).forEach(([key, value]) => {
          if (value) {
            query = query.eq(`scope->>${key}`, value);
          }
        });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPredictions(data || []);
      return data || [];
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate new predictions (calls external service in production)
  const generatePredictions = useCallback(async (
    metric: string,
    scope: any,
    days: number = 7
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, this would call an external ML service
      // For now, we'll use the database function
      const { data, error: genError } = await supabase.rpc('generate_metric_predictions', {
        p_metric_name: metric,
        p_scope: scope,
        p_days_ahead: days
      });

      if (genError) throw genError;

      // Save predictions
      const predictions = (data || []).map((pred: any) => ({
        metric_name: metric,
        scope,
        granularity: 'daily' as const,
        prediction_date: pred.prediction_date,
        predicted_value: pred.predicted_value,
        lower_bound: pred.lower_bound,
        upper_bound: pred.upper_bound,
        confidence_level: 0.95,
        model_name: 'prophet',
        model_version: '1.0.0'
      }));

      const { error: insertError } = await supabase
        .from('predicted_metrics')
        .upsert(predictions, {
          onConflict: 'metric_name,scope,granularity,prediction_date'
        });

      if (insertError) throw insertError;

      // Refresh predictions
      await fetchPredictions(metric, scope, days);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPredictions]);

  // Record actual value for accuracy tracking
  const recordActual = useCallback(async (
    predictionId: string,
    actualValue: number
  ) => {
    try {
      // Get the prediction
      const prediction = predictions.find(p => p.id === predictionId);
      if (!prediction) throw new Error('Prediction not found');

      const absoluteError = Math.abs(prediction.predicted_value - actualValue);
      const percentageError = (absoluteError / actualValue) * 100;

      const { data, error } = await supabase
        .from('prediction_accuracy')
        .insert({
          predicted_metric_id: predictionId,
          actual_value: actualValue,
          absolute_error: absoluteError,
          percentage_error: percentageError
        })
        .select()
        .single();

      if (error) throw error;

      // Update accuracy history
      setAccuracyHistory(prev => [...prev, data]);
    } catch (err) {
      setError(err as Error);
    }
  }, [predictions]);

  // Get model performance metrics
  const getModelPerformance = useCallback(async (
    metric: string
  ): Promise<ModelPerformance> => {
    try {
      // Get all predictions with accuracy data
      const { data, error } = await supabase
        .from('predicted_metrics')
        .select(`
          *,
          prediction_accuracy(*)
        `)
        .eq('metric_name', metric)
        .not('prediction_accuracy', 'is', null);

      if (error) throw error;

      const predictions = data || [];
      const totalPredictions = predictions.length;
      
      // Calculate aggregates
      let totalMAE = 0;
      let totalMAPE = 0;
      let accuratePredictions = 0;
      const scopePerformance: Record<string, { mae: number; count: number }> = {};

      predictions.forEach(pred => {
        const accuracy = pred.prediction_accuracy[0];
        if (accuracy) {
          totalMAE += accuracy.absolute_error;
          totalMAPE += accuracy.percentage_error;
          
          // Consider accurate if within 10% error
          if (accuracy.percentage_error <= 10) {
            accuratePredictions++;
          }

          // Track by scope
          const scopeKey = JSON.stringify(pred.scope);
          if (!scopePerformance[scopeKey]) {
            scopePerformance[scopeKey] = { mae: 0, count: 0 };
          }
          scopePerformance[scopeKey].mae += accuracy.absolute_error;
          scopePerformance[scopeKey].count++;
        }
      });

      // Find best and worst scopes
      const scopes = Object.entries(scopePerformance)
        .map(([scope, perf]) => ({
          scope: JSON.parse(scope),
          avgMae: perf.mae / perf.count
        }))
        .sort((a, b) => a.avgMae - b.avgMae);

      return {
        metric_name: metric,
        total_predictions: totalPredictions,
        avg_mae: totalPredictions > 0 ? totalMAE / totalPredictions : 0,
        avg_mape: totalPredictions > 0 ? totalMAPE / totalPredictions : 0,
        accuracy_rate: totalPredictions > 0 ? (accuratePredictions / totalPredictions) * 100 : 0,
        best_performing_scope: scopes[0]?.scope || {},
        worst_performing_scope: scopes[scopes.length - 1]?.scope || {}
      };
    } catch (err) {
      throw err;
    }
  }, []);

  // Load accuracy history on mount
  useEffect(() => {
    const loadAccuracyHistory = async () => {
      const { data } = await supabase
        .from('prediction_accuracy')
        .select('*')
        .order('measured_at', { ascending: false })
        .limit(100);

      if (data) {
        setAccuracyHistory(data);
      }
    };

    loadAccuracyHistory();
  }, []);

  return {
    predictions,
    accuracyHistory,
    isLoading,
    error,
    fetchPredictions,
    generatePredictions,
    recordActual,
    getModelPerformance
  };
};

// Common metrics for prediction
export const PREDICTABLE_METRICS = [
  { id: 'transaction_count', label: 'Transaction Count', unit: 'transactions' },
  { id: 'revenue', label: 'Total Revenue', unit: '₱' },
  { id: 'basket_size', label: 'Average Basket Size', unit: 'items' },
  { id: 'unique_customers', label: 'Unique Customers', unit: 'customers' },
  { id: 'units_sold', label: 'Units Sold', unit: 'units' }
];

// Granularity options
export const PREDICTION_GRANULARITIES = [
  { id: 'hourly', label: 'Hourly', days: 1 },
  { id: 'daily', label: 'Daily', days: 7 },
  { id: 'weekly', label: 'Weekly', days: 28 },
  { id: 'monthly', label: 'Monthly', days: 90 }
];