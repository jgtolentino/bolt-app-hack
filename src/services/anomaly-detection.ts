/**
 * Anomaly Detection Engine
 * Real-time detection of business anomalies and operational issues
 */

import { supabase } from '../config/supabase';

export interface AnomalyRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  threshold_type: 'absolute' | 'percentage' | 'statistical';
  threshold_value: number;
  time_window: string; // e.g., '1 hour', '1 day', '1 week'
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  sql_query: string;
  expected_range?: { min: number; max: number };
}

export interface AnomalyDetection {
  id: string;
  rule_id: string;
  rule_name: string;
  detected_at: Date;
  metric_value: number;
  expected_value: number;
  deviation_percentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  affected_entities?: string[];
}

export interface AnomalyAlert {
  id: string;
  detection_id: string;
  alert_type: 'email' | 'sms' | 'dashboard' | 'webhook';
  recipient: string;
  sent_at: Date;
  status: 'sent' | 'failed' | 'pending';
}

/**
 * Pre-configured anomaly detection rules for retail intelligence
 */
const DEFAULT_ANOMALY_RULES: Omit<AnomalyRule, 'id'>[] = [
  {
    name: 'Daily Sales Drop',
    description: 'Detect significant drops in daily sales revenue',
    metric: 'daily_sales',
    threshold_type: 'percentage',
    threshold_value: -20, // 20% drop
    time_window: '1 day',
    severity: 'high',
    is_active: true,
    sql_query: `
      SELECT 
        DATE(timestamp) as date,
        SUM(total_amount) as daily_sales
      FROM transactions 
      WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `
  },
  {
    name: 'Regional Performance Anomaly',
    description: 'Detect unusual regional performance variations',
    metric: 'regional_sales',
    threshold_type: 'statistical',
    threshold_value: 2.5, // 2.5 standard deviations
    time_window: '1 day',
    severity: 'medium',
    is_active: true,
    sql_query: `
      SELECT 
        s.region,
        SUM(t.total_amount) as regional_sales,
        COUNT(t.id) as transaction_count
      FROM transactions t
      JOIN stores s ON t.store_id = s.id
      WHERE t.timestamp >= CURRENT_DATE - INTERVAL '1 day'
      GROUP BY s.region
    `
  },
  {
    name: 'Stock Level Critical',
    description: 'Detect critically low stock levels',
    metric: 'stock_velocity',
    threshold_type: 'absolute',
    threshold_value: 2, // Less than 2 days of stock
    time_window: '1 hour',
    severity: 'critical',
    is_active: true,
    sql_query: `
      SELECT 
        p.name as product_name,
        p.sku,
        SUM(ti.quantity) as daily_velocity,
        -- Mock stock calculation (in production, would come from inventory system)
        (100 - SUM(ti.quantity)) as estimated_stock_days
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.timestamp >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY p.id, p.name, p.sku
      HAVING (100 - SUM(ti.quantity)) < 10
    `
  },
  {
    name: 'Payment Method Anomaly',
    description: 'Detect unusual payment method distribution',
    metric: 'payment_distribution',
    threshold_type: 'percentage',
    threshold_value: 30, // 30% deviation from normal
    time_window: '1 day',
    severity: 'medium',
    is_active: true,
    sql_query: `
      SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
      FROM transactions
      WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day'
      GROUP BY payment_method
    `
  },
  {
    name: 'Substitution Rate Spike',
    description: 'Detect unusual increases in product substitutions',
    metric: 'substitution_rate',
    threshold_type: 'percentage',
    threshold_value: 50, // 50% increase
    time_window: '1 day',
    severity: 'high',
    is_active: true,
    sql_query: `
      SELECT 
        p.brand,
        COUNT(CASE WHEN ti.is_substitution THEN 1 END) as substitutions,
        COUNT(*) as total_sales,
        COUNT(CASE WHEN ti.is_substitution THEN 1 END) * 100.0 / COUNT(*) as substitution_rate
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.timestamp >= CURRENT_DATE - INTERVAL '1 day'
      GROUP BY p.brand
      HAVING COUNT(*) > 10
    `
  },
  {
    name: 'AI Suggestion Effectiveness Drop',
    description: 'Detect drops in AI suggestion acceptance rates',
    metric: 'ai_effectiveness',
    threshold_type: 'percentage',
    threshold_value: -25, // 25% drop
    time_window: '1 day',
    severity: 'medium',
    is_active: true,
    sql_query: `
      SELECT 
        COUNT(CASE WHEN suggested_by_ai THEN 1 END) as ai_suggestions,
        COUNT(*) as total_items,
        COUNT(CASE WHEN suggested_by_ai THEN 1 END) * 100.0 / COUNT(*) as effectiveness_rate
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.timestamp >= CURRENT_DATE - INTERVAL '1 day'
    `
  },
  {
    name: 'Peak Hour Shift',
    description: 'Detect changes in peak transaction hours',
    metric: 'peak_hours',
    threshold_type: 'statistical',
    threshold_value: 2.0, // 2 standard deviations
    time_window: '1 day',
    severity: 'low',
    is_active: true,
    sql_query: `
      SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day'
      GROUP BY EXTRACT(HOUR FROM timestamp)
      ORDER BY hour
    `
  }
];

/**
 * Anomaly Detection Engine Class
 */
export class AnomalyDetectionEngine {
  private rules: AnomalyRule[] = [];
  private detections: AnomalyDetection[] = [];
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.initializeRules();
  }

  /**
   * Initialize default anomaly detection rules
   */
  private async initializeRules(): Promise<void> {
    this.rules = DEFAULT_ANOMALY_RULES.map((rule, index) => ({
      id: `rule-${index + 1}`,
      ...rule
    }));
  }

  /**
   * Start real-time anomaly detection
   */
  start(intervalMinutes = 15): void {
    if (this.isRunning) {
      console.warn('Anomaly detection already running');
      return;
    }

    console.log(`Starting anomaly detection engine (interval: ${intervalMinutes} minutes)`);
    this.isRunning = true;

    // Run initial scan
    this.runDetectionCycle();

    // Schedule periodic scans
    this.intervalId = setInterval(() => {
      this.runDetectionCycle();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop anomaly detection
   */
  stop(): void {
    if (!this.isRunning) return;

    console.log('Stopping anomaly detection engine');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * Run a complete detection cycle for all active rules
   */
  private async runDetectionCycle(): Promise<void> {
    console.log('Running anomaly detection cycle...');
    
    const activeRules = this.rules.filter(rule => rule.is_active);
    const detectionPromises = activeRules.map(rule => this.runRuleDetection(rule));
    
    try {
      const results = await Promise.allSettled(detectionPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Rule ${activeRules[index].name} failed:`, result.reason);
        }
      });
      
      console.log(`Detection cycle completed. Found ${this.detections.length} active anomalies.`);
    } catch (error) {
      console.error('Detection cycle failed:', error);
    }
  }

  /**
   * Run detection for a specific rule
   */
  private async runRuleDetection(rule: AnomalyRule): Promise<void> {
    try {
      // Execute the rule's SQL query
      const { data, error } = await supabase.rpc('execute_raw_sql', { 
        query: rule.sql_query 
      });

      if (error) {
        console.error(`SQL error for rule ${rule.name}:`, error);
        return;
      }

      if (!data || data.length === 0) {
        console.warn(`No data returned for rule ${rule.name}`);
        return;
      }

      // Analyze data for anomalies based on rule type
      const anomalies = this.analyzeDataForAnomalies(rule, data);
      
      // Process detected anomalies
      anomalies.forEach(anomaly => this.processAnomalyDetection(anomaly));

    } catch (error) {
      console.error(`Failed to run detection for rule ${rule.name}:`, error);
    }
  }

  /**
   * Analyze data for anomalies based on rule configuration
   */
  private analyzeDataForAnomalies(rule: AnomalyRule, data: any[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];

    switch (rule.threshold_type) {
      case 'absolute':
        anomalies.push(...this.detectAbsoluteAnomalies(rule, data));
        break;
      case 'percentage':
        anomalies.push(...this.detectPercentageAnomalies(rule, data));
        break;
      case 'statistical':
        anomalies.push(...this.detectStatisticalAnomalies(rule, data));
        break;
    }

    return anomalies;
  }

  /**
   * Detect absolute threshold violations
   */
  private detectAbsoluteAnomalies(rule: AnomalyRule, data: any[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];

    data.forEach((row, index) => {
      const value = this.extractMetricValue(row, rule.metric);
      
      if (value !== null && value < rule.threshold_value) {
        anomalies.push({
          id: `anomaly-${Date.now()}-${index}`,
          rule_id: rule.id,
          rule_name: rule.name,
          detected_at: new Date(),
          metric_value: value,
          expected_value: rule.threshold_value,
          deviation_percentage: ((value - rule.threshold_value) / rule.threshold_value) * 100,
          severity: rule.severity,
          context: row,
          status: 'active',
          affected_entities: this.extractAffectedEntities(row)
        });
      }
    });

    return anomalies;
  }

  /**
   * Detect percentage-based anomalies (comparing to historical baseline)
   */
  private detectPercentageAnomalies(rule: AnomalyRule, data: any[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];

    if (data.length < 2) return anomalies;

    // For simplicity, compare latest value to previous values
    const latest = data[0];
    const historical = data.slice(1);
    
    const latestValue = this.extractMetricValue(latest, rule.metric);
    const historicalAvg = historical.reduce((sum, row) => {
      const val = this.extractMetricValue(row, rule.metric);
      return sum + (val || 0);
    }, 0) / historical.length;

    if (latestValue !== null && historicalAvg > 0) {
      const percentageChange = ((latestValue - historicalAvg) / historicalAvg) * 100;
      
      if (Math.abs(percentageChange) > Math.abs(rule.threshold_value)) {
        anomalies.push({
          id: `anomaly-${Date.now()}`,
          rule_id: rule.id,
          rule_name: rule.name,
          detected_at: new Date(),
          metric_value: latestValue,
          expected_value: historicalAvg,
          deviation_percentage: percentageChange,
          severity: rule.severity,
          context: latest,
          status: 'active',
          affected_entities: this.extractAffectedEntities(latest)
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect statistical anomalies using standard deviation
   */
  private detectStatisticalAnomalies(rule: AnomalyRule, data: any[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];

    if (data.length < 3) return anomalies;

    const values = data.map(row => this.extractMetricValue(row, rule.metric)).filter(v => v !== null) as number[];
    
    if (values.length < 3) return anomalies;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    data.forEach((row, index) => {
      const value = this.extractMetricValue(row, rule.metric);
      
      if (value !== null) {
        const zScore = Math.abs((value - mean) / stdDev);
        
        if (zScore > rule.threshold_value) {
          anomalies.push({
            id: `anomaly-${Date.now()}-${index}`,
            rule_id: rule.id,
            rule_name: rule.name,
            detected_at: new Date(),
            metric_value: value,
            expected_value: mean,
            deviation_percentage: ((value - mean) / mean) * 100,
            severity: rule.severity,
            context: { ...row, z_score: zScore },
            status: 'active',
            affected_entities: this.extractAffectedEntities(row)
          });
        }
      }
    });

    return anomalies;
  }

  /**
   * Extract metric value from data row
   */
  private extractMetricValue(row: any, metricKey: string): number | null {
    // Try common variations of the metric key
    const possibleKeys = [
      metricKey,
      metricKey.toLowerCase(),
      metricKey.replace(/_/g, ''),
      Object.keys(row).find(key => key.toLowerCase().includes(metricKey.toLowerCase()))
    ].filter(Boolean);

    for (const key of possibleKeys) {
      if (key && row[key] !== undefined && row[key] !== null) {
        const value = parseFloat(row[key]);
        return isNaN(value) ? null : value;
      }
    }

    return null;
  }

  /**
   * Extract affected entities from context
   */
  private extractAffectedEntities(row: any): string[] {
    const entities: string[] = [];
    
    // Common entity fields
    const entityFields = ['region', 'store_name', 'brand', 'product_name', 'sku', 'payment_method'];
    
    entityFields.forEach(field => {
      if (row[field] && typeof row[field] === 'string') {
        entities.push(row[field]);
      }
    });

    return entities;
  }

  /**
   * Process a detected anomaly
   */
  private async processAnomalyDetection(anomaly: AnomalyDetection): Promise<void> {
    // Check if this anomaly already exists (avoid duplicates)
    const existingAnomaly = this.detections.find(existing => 
      existing.rule_id === anomaly.rule_id &&
      existing.status === 'active' &&
      JSON.stringify(existing.context) === JSON.stringify(anomaly.context)
    );

    if (existingAnomaly) {
      // Update existing anomaly
      existingAnomaly.detected_at = anomaly.detected_at;
      existingAnomaly.metric_value = anomaly.metric_value;
      existingAnomaly.deviation_percentage = anomaly.deviation_percentage;
    } else {
      // Add new anomaly
      this.detections.unshift(anomaly);
      
      // Trigger alerts for high/critical severity
      if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
        await this.triggerAlert(anomaly);
      }
    }

    // Keep only last 100 detections
    if (this.detections.length > 100) {
      this.detections = this.detections.slice(0, 100);
    }
  }

  /**
   * Trigger alert for anomaly
   */
  private async triggerAlert(anomaly: AnomalyDetection): Promise<void> {
    console.warn(`🚨 ANOMALY DETECTED: ${anomaly.rule_name}`, {
      metric: anomaly.metric_value,
      expected: anomaly.expected_value,
      deviation: `${anomaly.deviation_percentage.toFixed(1)}%`,
      severity: anomaly.severity,
      context: anomaly.affected_entities
    });

    // In production, this would send actual alerts (email, SMS, Slack, etc.)
    // For now, we'll just log and store the alert
    const alert: AnomalyAlert = {
      id: `alert-${Date.now()}`,
      detection_id: anomaly.id,
      alert_type: 'dashboard',
      recipient: 'operations@retailer.com',
      sent_at: new Date(),
      status: 'sent'
    };

    // Store alert (in production, this would go to a database)
    console.log('Alert created:', alert);
  }

  /**
   * Get current active anomalies
   */
  getActiveAnomalies(): AnomalyDetection[] {
    return this.detections.filter(d => d.status === 'active');
  }

  /**
   * Get anomalies by severity
   */
  getAnomaliesBySeverity(severity: AnomalyDetection['severity']): AnomalyDetection[] {
    return this.detections.filter(d => d.severity === severity && d.status === 'active');
  }

  /**
   * Acknowledge an anomaly
   */
  acknowledgeAnomaly(anomalyId: string, acknowledgedBy: string): boolean {
    const anomaly = this.detections.find(d => d.id === anomalyId);
    if (anomaly) {
      anomaly.status = 'acknowledged';
      anomaly.context = { ...anomaly.context, acknowledged_by: acknowledgedBy, acknowledged_at: new Date() };
      return true;
    }
    return false;
  }

  /**
   * Resolve an anomaly
   */
  resolveAnomaly(anomalyId: string, resolvedBy: string, resolution: string): boolean {
    const anomaly = this.detections.find(d => d.id === anomalyId);
    if (anomaly) {
      anomaly.status = 'resolved';
      anomaly.context = { 
        ...anomaly.context, 
        resolved_by: resolvedBy, 
        resolved_at: new Date(),
        resolution
      };
      return true;
    }
    return false;
  }

  /**
   * Add custom anomaly rule
   */
  addRule(rule: Omit<AnomalyRule, 'id'>): string {
    const newRule: AnomalyRule = {
      id: `custom-rule-${Date.now()}`,
      ...rule
    };
    
    this.rules.push(newRule);
    return newRule.id;
  }

  /**
   * Get all rules
   */
  getRules(): AnomalyRule[] {
    return [...this.rules];
  }

  /**
   * Get detection statistics
   */
  getStatistics() {
    const active = this.getActiveAnomalies();
    
    return {
      total_detections: this.detections.length,
      active_anomalies: active.length,
      by_severity: {
        critical: active.filter(d => d.severity === 'critical').length,
        high: active.filter(d => d.severity === 'high').length,
        medium: active.filter(d => d.severity === 'medium').length,
        low: active.filter(d => d.severity === 'low').length
      },
      active_rules: this.rules.filter(r => r.is_active).length,
      is_running: this.isRunning
    };
  }
}

// Export singleton instance
export const anomalyDetectionEngine = new AnomalyDetectionEngine();