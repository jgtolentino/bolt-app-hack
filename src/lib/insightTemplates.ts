export interface InsightTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'behavior' | 'demographic' | 'operational' | 'predictive';
  inputSchema: string[];
  aiPromptTemplate: string;
  requiredDataPoints?: string[];
}

export const insightTemplates: InsightTemplate[] = [
  // Sales & Revenue Insights
  {
    id: 'priceSensitivity',
    name: 'Price Sensitivity Analysis',
    description: 'Analyze demand elasticity across SKUs and regions',
    category: 'sales',
    inputSchema: ['product_id', 'unit_price', 'quantity_sold', 'region'],
    aiPromptTemplate: `
      Analyze price sensitivity using the following data:
      - Product prices and quantities sold
      - Regional variations
      - Time-based patterns
      
      Calculate:
      1. Price elasticity coefficients
      2. Optimal price points
      3. Revenue maximization opportunities
      4. Regional price tolerance differences
      
      Output format: Actionable insights with specific SKUs and price recommendations.
    `,
    requiredDataPoints: ['transactions', 'products', 'geography']
  },
  
  // Consumer Behavior Insights
  {
    id: 'substitutionMap',
    name: 'Brand Substitution Mapping',
    description: 'Track substitution flows and fallback patterns',
    category: 'behavior',
    inputSchema: ['requested_brand', 'purchased_brand', 'region', 'frequency'],
    aiPromptTemplate: `
      Generate comprehensive substitution analysis:
      - Map brand switching patterns (A → B flows)
      - Calculate substitution rates by category
      - Identify loyalty vs. price-driven switches
      - Regional substitution preferences
      
      Visualize as:
      1. Sankey diagram data structure
      2. Top 10 substitution pairs
      3. Revenue impact per substitution
      4. Recommendations to minimize unwanted substitutions
    `
  },
  
  {
    id: 'basketComposition',
    name: 'Basket Analysis & Cross-Sell',
    description: 'Identify purchase patterns and bundle opportunities',
    category: 'behavior',
    inputSchema: ['transaction_id', 'products', 'quantities', 'total_value'],
    aiPromptTemplate: `
      Perform market basket analysis:
      - Identify frequently co-purchased items
      - Calculate lift and confidence scores
      - Segment baskets by size and value
      - Time-of-day basket variations
      
      Generate:
      1. Top 20 product associations
      2. Bundle recommendations with expected lift
      3. Cross-category purchase patterns
      4. Seasonal basket changes
    `
  },
  
  // Demographic Insights
  {
    id: 'genderPreference',
    name: 'Gender-Based Preference Mapping',
    description: 'Analyze purchasing patterns by inferred gender',
    category: 'demographic',
    inputSchema: ['gender', 'product_category', 'basket_value', 'frequency'],
    aiPromptTemplate: `
      Analyze gender-based purchasing patterns:
      - Category preferences by gender
      - Basket value differences
      - Brand loyalty variations
      - Time-of-day shopping patterns
      
      Identify:
      1. Strongly gender-skewed products
      2. Cross-gender appeal opportunities
      3. Marketing message optimization
      4. Inventory planning by demographic
    `
  },
  
  {
    id: 'ageGroupAnalysis',
    name: 'Age Group Behavior Patterns',
    description: 'Segment customers by age and analyze behaviors',
    category: 'demographic',
    inputSchema: ['age_group', 'purchase_history', 'payment_method', 'visit_frequency'],
    aiPromptTemplate: `
      Segment analysis by age group:
      - Purchase preferences by generation
      - Payment method adoption rates
      - Shopping frequency patterns
      - Price sensitivity by age
      
      Output:
      1. Generational product affinities
      2. Digital payment adoption curves
      3. Loyalty program effectiveness by age
      4. Targeted promotion strategies
    `
  },
  
  // Operational Insights
  {
    id: 'peakHourAnalysis',
    name: 'Peak Hour Optimization',
    description: 'Analyze transaction patterns by time of day',
    category: 'operational',
    inputSchema: ['hour', 'transaction_count', 'avg_basket', 'staff_count'],
    aiPromptTemplate: `
      Analyze hourly transaction patterns:
      - Identify true peak hours vs. staff coverage
      - Calculate revenue per hour
      - Queue time estimation
      - Conversion rate by hour
      
      Recommend:
      1. Optimal staffing schedules
      2. Happy hour timing
      3. Inventory refresh schedules
      4. Express lane hours
    `
  },
  
  {
    id: 'stockoutPrediction',
    name: 'Stock-out Risk Assessment',
    description: 'Predict and prevent stock-out scenarios',
    category: 'operational',
    inputSchema: ['sku', 'current_stock', 'sales_velocity', 'lead_time'],
    aiPromptTemplate: `
      Predict stock-out risks:
      - Calculate days-to-stockout per SKU
      - Factor in seasonal variations
      - Consider substitution impact
      - Regional stock imbalances
      
      Generate:
      1. Critical stock alerts (next 7 days)
      2. Reorder recommendations
      3. Inter-store transfer suggestions
      4. Substitution preparedness score
    `
  },
  
  // Predictive Insights
  {
    id: 'demandForecast',
    name: 'Demand Forecasting',
    description: 'Predict future demand patterns',
    category: 'predictive',
    inputSchema: ['historical_sales', 'seasonality', 'events', 'weather'],
    aiPromptTemplate: `
      Forecast demand patterns:
      - 7-day and 30-day predictions
      - Seasonal adjustment factors
      - Event impact modeling
      - Weather correlation analysis
      
      Provide:
      1. SKU-level demand forecasts
      2. Confidence intervals
      3. Promotion impact scenarios
      4. Stock level recommendations
    `
  },
  
  {
    id: 'churnRiskAnalysis',
    name: 'Customer Churn Prediction',
    description: 'Identify customers at risk of churning',
    category: 'predictive',
    inputSchema: ['customer_id', 'purchase_frequency', 'recency', 'basket_trend'],
    aiPromptTemplate: `
      Analyze churn risk indicators:
      - Declining purchase frequency
      - Reducing basket values
      - Extended time between visits
      - Product preference shifts
      
      Output:
      1. High-risk customer segments
      2. Churn probability scores
      3. Retention intervention triggers
      4. Win-back campaign targets
    `
  },
  
  {
    id: 'promotionEffectiveness',
    name: 'Promotion ROI Analysis',
    description: 'Measure and optimize promotional effectiveness',
    category: 'sales',
    inputSchema: ['promotion_type', 'discount_rate', 'sales_lift', 'margin_impact'],
    aiPromptTemplate: `
      Evaluate promotion performance:
      - Sales lift vs. margin erosion
      - Incremental vs. pulled-forward demand
      - Category halo effects
      - Customer segment response rates
      
      Calculate:
      1. True ROI per promotion type
      2. Optimal discount thresholds
      3. Promotion fatigue indicators
      4. Next best promotion recommendations
    `
  }
];

// Helper function to get templates by category
export const getTemplatesByCategory = (category: InsightTemplate['category']): InsightTemplate[] => {
  return insightTemplates.filter(template => template.category === category);
};

// Helper function to get template by ID
export const getTemplateById = (id: string): InsightTemplate | undefined => {
  return insightTemplates.find(template => template.id === id);
};

// Helper function to get required data points for a template
export const getRequiredDataPoints = (templateId: string): string[] => {
  const template = getTemplateById(templateId);
  return template?.requiredDataPoints || [];
};