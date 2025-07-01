/**
 * RAG (Retrieval-Augmented Generation) Engine
 * Core system for converting natural language to SQL and generating contextual insights
 */

import { supabase } from '../config/supabase';
import { credentials } from '../config/credentials';

export interface SchemaColumn {
  name: string;
  type: string;
  description: string;
  sample_values?: string[];
  foreign_key?: string;
}

export interface SchemaTable {
  name: string;
  description: string;
  columns: SchemaColumn[];
  relationships: string[];
  common_queries: string[];
}

export interface QueryIntent {
  type: 'analytical' | 'operational' | 'predictive' | 'comparative';
  entities: string[];
  metrics: string[];
  timeframe?: string;
  filters?: Record<string, any>;
  confidence: number;
}

export interface RAGResponse {
  sql: string;
  intent: QueryIntent;
  explanation: string;
  confidence: number;
  fallback_reason?: string;
}

/**
 * Complete database schema with business context
 */
const DATABASE_SCHEMA: Record<string, SchemaTable> = {
  transactions: {
    name: 'transactions',
    description: 'Core transaction records with payment and timing data',
    columns: [
      { name: 'id', type: 'uuid', description: 'Unique transaction ID' },
      { name: 'store_id', type: 'uuid', description: 'Reference to store', foreign_key: 'stores.id' },
      { name: 'timestamp', type: 'timestamptz', description: 'Transaction date and time' },
      { name: 'total_amount', type: 'decimal', description: 'Total transaction value in PHP' },
      { name: 'payment_method', type: 'text', description: 'Payment type', sample_values: ['cash', 'gcash', 'card', 'bank_transfer'] },
      { name: 'customer_age_group', type: 'text', description: 'Customer demographic', sample_values: ['18-25', '26-35', '36-45', '46-55', '56+'] },
      { name: 'discount_amount', type: 'decimal', description: 'Total discounts applied' },
      { name: 'tax_amount', type: 'decimal', description: 'Tax portion of transaction' },
      { name: 'items_count', type: 'integer', description: 'Number of items in basket' }
    ],
    relationships: ['stores', 'transaction_items'],
    common_queries: [
      'Daily sales totals',
      'Payment method distribution',
      'Peak hour analysis',
      'Customer age group preferences'
    ]
  },
  stores: {
    name: 'stores',
    description: 'Store locations and operational data',
    columns: [
      { name: 'id', type: 'uuid', description: 'Unique store ID' },
      { name: 'name', type: 'text', description: 'Store name/identifier' },
      { name: 'region', type: 'text', description: 'Philippine region', sample_values: ['NCR', 'Region I', 'Region II', 'Region III', 'Region IV-A', 'Region IV-B', 'Region V', 'Region VI', 'Region VII', 'Region VIII', 'Region IX', 'Region X', 'Region XI', 'Region XII', 'Region XIII', 'CAR', 'ARMM', 'Caraga'] },
      { name: 'city', type: 'text', description: 'City location' },
      { name: 'store_type', type: 'text', description: 'Store format', sample_values: ['convenience', 'supermarket', 'hypermarket', 'specialty'] },
      { name: 'is_active', type: 'boolean', description: 'Operational status' },
      { name: 'opening_hours', type: 'text', description: 'Operating schedule' }
    ],
    relationships: ['transactions'],
    common_queries: [
      'Regional performance analysis',
      'Store type comparison',
      'Geographic sales distribution'
    ]
  },
  products: {
    name: 'products',
    description: 'Product catalog with brand and category data',
    columns: [
      { name: 'id', type: 'uuid', description: 'Unique product ID' },
      { name: 'name', type: 'text', description: 'Product name' },
      { name: 'brand', type: 'text', description: 'Brand name', sample_values: ['JTI', 'Philip Morris', 'Unilever', 'Nestle', 'Coca-Cola', 'Pepsi'] },
      { name: 'category', type: 'text', description: 'Product category', sample_values: ['cigarettes', 'beverages', 'snacks', 'personal_care', 'household'] },
      { name: 'subcategory', type: 'text', description: 'Product subcategory' },
      { name: 'sku', type: 'text', description: 'Stock keeping unit code' },
      { name: 'unit_price', type: 'decimal', description: 'Standard retail price in PHP' },
      { name: 'pack_size', type: 'text', description: 'Package size/volume' }
    ],
    relationships: ['transaction_items'],
    common_queries: [
      'Brand performance analysis',
      'Category sales trends',
      'Price sensitivity analysis',
      'SKU performance ranking'
    ]
  },
  transaction_items: {
    name: 'transaction_items',
    description: 'Individual items within transactions',
    columns: [
      { name: 'id', type: 'uuid', description: 'Unique item ID' },
      { name: 'transaction_id', type: 'uuid', description: 'Parent transaction', foreign_key: 'transactions.id' },
      { name: 'product_id', type: 'uuid', description: 'Product reference', foreign_key: 'products.id' },
      { name: 'quantity', type: 'integer', description: 'Items purchased' },
      { name: 'unit_price', type: 'decimal', description: 'Price per unit' },
      { name: 'total_price', type: 'decimal', description: 'Line total (quantity × price)' },
      { name: 'discount_applied', type: 'decimal', description: 'Item-level discount' },
      { name: 'is_substitution', type: 'boolean', description: 'Item was a substitution' },
      { name: 'suggested_by_ai', type: 'boolean', description: 'AI recommendation accepted' }
    ],
    relationships: ['transactions', 'products'],
    common_queries: [
      'Product mix analysis',
      'Substitution pattern analysis',
      'AI suggestion effectiveness',
      'Basket composition insights'
    ]
  }
};

/**
 * Intent classification patterns
 */
const INTENT_PATTERNS = {
  analytical: [
    /trend|pattern|analysis|compare|correlation/i,
    /revenue|sales|performance|growth/i,
    /top|best|worst|ranking/i
  ],
  operational: [
    /alert|issue|problem|stock|inventory/i,
    /operational|efficiency|process/i,
    /real.?time|current|now|today/i
  ],
  predictive: [
    /forecast|predict|future|next|expected/i,
    /will|going to|likely|probable/i,
    /demand|projection|estimate/i
  ],
  comparative: [
    /vs|versus|compared to|against/i,
    /difference|better|worse|higher|lower/i,
    /benchmark|baseline|competition/i
  ]
};

/**
 * Common query templates for quick SQL generation
 */
const QUERY_TEMPLATES = {
  daily_sales: `
    SELECT 
      DATE(timestamp) as date,
      COUNT(*) as transaction_count,
      SUM(total_amount) as revenue,
      AVG(total_amount) as avg_basket
    FROM transactions 
    WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
  `,
  
  regional_performance: `
    SELECT 
      s.region,
      COUNT(t.id) as transactions,
      SUM(t.total_amount) as revenue,
      AVG(t.total_amount) as avg_basket
    FROM transactions t
    JOIN stores s ON t.store_id = s.id
    WHERE t.timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY s.region
    ORDER BY revenue DESC
  `,
  
  brand_analysis: `
    SELECT 
      p.brand,
      p.category,
      SUM(ti.quantity) as units_sold,
      SUM(ti.total_price) as revenue,
      COUNT(DISTINCT ti.transaction_id) as transactions
    FROM transaction_items ti
    JOIN products p ON ti.product_id = p.id
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE t.timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY p.brand, p.category
    ORDER BY revenue DESC
  `,
  
  substitution_analysis: `
    SELECT 
      p.brand,
      p.category,
      COUNT(*) as substitution_count,
      COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as substitution_rate
    FROM transaction_items ti
    JOIN products p ON ti.product_id = p.id
    WHERE ti.is_substitution = true
    GROUP BY p.brand, p.category
    ORDER BY substitution_count DESC
  `,
  
  ai_effectiveness: `
    SELECT 
      DATE(t.timestamp) as date,
      COUNT(CASE WHEN ti.suggested_by_ai THEN 1 END) as ai_suggestions,
      COUNT(*) as total_items,
      COUNT(CASE WHEN ti.suggested_by_ai THEN 1 END) * 100.0 / COUNT(*) as suggestion_rate
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE t.timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(t.timestamp)
    ORDER BY date DESC
  `
};

export class RAGEngine {
  private openaiApiKey: string;
  private anthropicApiKey: string;

  constructor() {
    this.openaiApiKey = credentials.ai.openai?.apiKey || '';
    this.anthropicApiKey = credentials.ai.anthropic?.apiKey || '';
  }

  /**
   * Main entry point: Convert natural language to SQL with context
   */
  async queryToSQL(naturalQuery: string, context?: Record<string, any>): Promise<RAGResponse> {
    try {
      // 1. Classify intent
      const intent = this.classifyIntent(naturalQuery);
      
      // 2. Check for template match first (fast path)
      const templateMatch = this.matchQueryTemplate(naturalQuery);
      if (templateMatch) {
        return {
          sql: templateMatch,
          intent,
          explanation: `Using optimized template for common query pattern`,
          confidence: 0.9
        };
      }

      // 3. Use AI to generate SQL with schema context
      const aiResponse = await this.generateSQLWithAI(naturalQuery, intent, context);
      
      return aiResponse;
    } catch (error) {
      console.error('RAG Engine error:', error);
      
      // Fallback to template-based response
      return {
        sql: QUERY_TEMPLATES.daily_sales,
        intent: { type: 'analytical', entities: [], metrics: ['sales'], confidence: 0.3 },
        explanation: 'Using fallback query due to processing error',
        confidence: 0.3,
        fallback_reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Classify user intent from natural language
   */
  private classifyIntent(query: string): QueryIntent {
    const lowercaseQuery = query.toLowerCase();
    
    // Detect intent type
    let intentType: QueryIntent['type'] = 'analytical';
    let maxMatches = 0;
    
    Object.entries(INTENT_PATTERNS).forEach(([type, patterns]) => {
      const matches = patterns.filter(pattern => pattern.test(query)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        intentType = type as QueryIntent['type'];
      }
    });

    // Extract entities (brands, regions, products)
    const entities: string[] = [];
    
    // Brand detection
    const brands = ['jti', 'philip morris', 'unilever', 'nestle', 'coca-cola', 'pepsi'];
    brands.forEach(brand => {
      if (lowercaseQuery.includes(brand)) entities.push(brand);
    });
    
    // Region detection
    const regions = ['ncr', 'metro manila', 'mindanao', 'visayas', 'luzon'];
    regions.forEach(region => {
      if (lowercaseQuery.includes(region)) entities.push(region);
    });

    // Metric detection
    const metrics: string[] = [];
    const metricKeywords = {
      'sales': ['sales', 'revenue', 'income'],
      'volume': ['volume', 'quantity', 'units'],
      'basket': ['basket', 'transaction', 'purchase'],
      'substitution': ['substitution', 'replacement', 'switch']
    };
    
    Object.entries(metricKeywords).forEach(([metric, keywords]) => {
      if (keywords.some(keyword => lowercaseQuery.includes(keyword))) {
        metrics.push(metric);
      }
    });

    return {
      type: intentType,
      entities,
      metrics,
      confidence: maxMatches > 0 ? 0.8 : 0.5
    };
  }

  /**
   * Match common query patterns to templates
   */
  private matchQueryTemplate(query: string): string | null {
    const lowercaseQuery = query.toLowerCase();
    
    const patterns = [
      { keywords: ['daily', 'sales', 'trend'], template: QUERY_TEMPLATES.daily_sales },
      { keywords: ['regional', 'performance', 'region'], template: QUERY_TEMPLATES.regional_performance },
      { keywords: ['brand', 'analysis', 'performance'], template: QUERY_TEMPLATES.brand_analysis },
      { keywords: ['substitution', 'switching'], template: QUERY_TEMPLATES.substitution_analysis },
      { keywords: ['ai', 'suggestion', 'effectiveness'], template: QUERY_TEMPLATES.ai_effectiveness }
    ];

    for (const pattern of patterns) {
      const matchCount = pattern.keywords.filter(keyword => 
        lowercaseQuery.includes(keyword)
      ).length;
      
      if (matchCount >= 2) {
        return pattern.template;
      }
    }

    return null;
  }

  /**
   * Generate SQL using AI with full schema context
   */
  private async generateSQLWithAI(
    query: string, 
    intent: QueryIntent, 
    context?: Record<string, any>
  ): Promise<RAGResponse> {
    const schemaContext = this.buildSchemaContext();
    const businessContext = this.buildBusinessContext();
    
    const prompt = `You are a SQL expert for a Philippine retail analytics system. Generate PostgreSQL queries based on natural language.

DATABASE SCHEMA:
${schemaContext}

BUSINESS CONTEXT:
${businessContext}

USER INTENT: ${intent.type}
DETECTED ENTITIES: ${intent.entities.join(', ') || 'none'}
DETECTED METRICS: ${intent.metrics.join(', ') || 'none'}

QUERY: "${query}"

REQUIREMENTS:
1. Generate ONLY valid PostgreSQL SQL
2. Use proper JOINs for related tables
3. Include appropriate WHERE clauses for filtering
4. Use aggregate functions for summary queries
5. Format dates properly for Philippine timezone
6. Handle NULL values appropriately
7. Optimize for performance

RESPONSE FORMAT:
{
  "sql": "SELECT ...",
  "explanation": "Brief explanation of what this query does",
  "confidence": 0.8
}`;

    try {
      // Try OpenAI first
      if (this.openaiApiKey) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 1000
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiResult = JSON.parse(data.choices[0].message.content);
          
          return {
            sql: aiResult.sql,
            intent,
            explanation: aiResult.explanation,
            confidence: aiResult.confidence
          };
        }
      }

      // Fallback to Anthropic
      if (this.anthropicApiKey) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': this.anthropicApiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiResult = JSON.parse(data.content[0].text);
          
          return {
            sql: aiResult.sql,
            intent,
            explanation: aiResult.explanation,
            confidence: aiResult.confidence
          };
        }
      }

      throw new Error('No AI providers available');
    } catch (error) {
      console.error('AI SQL generation failed:', error);
      
      // Return template fallback
      return {
        sql: QUERY_TEMPLATES.daily_sales,
        intent,
        explanation: 'AI generation failed, using template fallback',
        confidence: 0.4,
        fallback_reason: 'AI provider unavailable'
      };
    }
  }

  /**
   * Build comprehensive schema context for AI
   */
  private buildSchemaContext(): string {
    let context = '';
    
    Object.values(DATABASE_SCHEMA).forEach(table => {
      context += `\nTable: ${table.name}\n`;
      context += `Description: ${table.description}\n`;
      context += `Columns:\n`;
      
      table.columns.forEach(col => {
        context += `  - ${col.name} (${col.type}): ${col.description}`;
        if (col.sample_values) {
          context += ` [Examples: ${col.sample_values.join(', ')}]`;
        }
        if (col.foreign_key) {
          context += ` [FK: ${col.foreign_key}]`;
        }
        context += '\n';
      });
      
      context += `Relationships: ${table.relationships.join(', ')}\n`;
      context += `Common Queries: ${table.common_queries.join(', ')}\n`;
    });

    return context;
  }

  /**
   * Build business context for better query generation
   */
  private buildBusinessContext(): string {
    return `
BUSINESS CONTEXT:
- This is a retail analytics system for Philippine convenience stores
- Primary client: JTI (Japan Tobacco International) - cigarette brand
- Key metrics: sales revenue, substitution rates, regional performance
- Geographic focus: 18 Philippine regions (NCR, Region I-XIII, etc.)
- Payment methods: Cash dominates, GCash growing
- Product categories: cigarettes, beverages, snacks, personal care, household
- Peak hours: typically 6-8 PM for convenience stores
- Currency: Philippine Peso (PHP)
- Time zone: Asia/Manila (UTC+8)

KEY BUSINESS QUESTIONS:
1. Market share analysis (JTI vs competitors)
2. Regional performance (which regions drive growth)
3. Substitution patterns (when customers switch brands)
4. AI suggestion effectiveness (recommendation acceptance rates)
5. Operational insights (stock levels, peak hours)
6. Customer behavior (age groups, payment preferences)
    `;
  }

  /**
   * Execute generated SQL and return results
   */
  async executeQuery(sql: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('execute_raw_sql', { query: sql });
      
      if (error) {
        console.error('SQL execution error:', error);
        throw new Error(`SQL Error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Get schema information for a specific table
   */
  getTableSchema(tableName: string): SchemaTable | null {
    return DATABASE_SCHEMA[tableName] || null;
  }

  /**
   * Get all available tables
   */
  getAllTables(): string[] {
    return Object.keys(DATABASE_SCHEMA);
  }
}

// Export singleton instance
export const ragEngine = new RAGEngine();