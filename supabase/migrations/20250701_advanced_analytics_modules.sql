-- Advanced Analytics Extension for Scout Command Center
-- Includes: Saved Queries, AI Insight Templates, and Predictive Metrics

-- 1. Saved Queries Module
CREATE TABLE IF NOT EXISTS public.saved_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- Would reference auth.users(id) in production
  query_name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL, -- stores { filters, dimensions, metrics, orderBy, limit }
  query_type VARCHAR(50) DEFAULT 'custom', -- custom, template, scheduled
  is_public BOOLEAN DEFAULT false,
  tags TEXT[],
  execution_count INTEGER DEFAULT 0,
  avg_execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_run TIMESTAMP WITH TIME ZONE,
  created_by TEXT, -- User email or name
  CONSTRAINT valid_config CHECK (jsonb_typeof(config) = 'object')
);

-- Query execution history
CREATE TABLE IF NOT EXISTS public.query_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_query_id UUID REFERENCES public.saved_queries(id) ON DELETE CASCADE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  execution_time_ms INTEGER,
  row_count INTEGER,
  error_message TEXT,
  executed_by TEXT
);

-- 2. AI Insight Templates
CREATE TABLE IF NOT EXISTS public.ai_insight_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code VARCHAR(100) UNIQUE NOT NULL,
  template_name TEXT NOT NULL,
  category VARCHAR(50) CHECK (category IN ('sales', 'inventory', 'customer', 'pricing', 'substitution', 'forecast')),
  description TEXT,
  business_question TEXT, -- The question this template answers
  default_config JSONB NOT NULL, -- { metrics, dimensions, filters, timeRange }
  recommended_charts TEXT[] DEFAULT '{"bar", "line"}',
  required_dimensions TEXT[], -- Dimensions that must be available
  required_metrics TEXT[], -- Metrics that must be available
  system_prompt TEXT, -- GPT-4 prompt for insight generation
  insight_template TEXT, -- Template for generating human-readable insights
  is_active BOOLEAN DEFAULT true,
  min_data_points INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Generated insights from templates
CREATE TABLE IF NOT EXISTS public.generated_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.ai_insight_templates(id),
  insight_text TEXT NOT NULL,
  supporting_data JSONB,
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  relevance_score FLOAT CHECK (relevance_score >= 0 AND relevance_score <= 1),
  filters_applied JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_starred BOOLEAN DEFAULT false,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT
);

-- 3. Predictive Metrics System
CREATE TABLE IF NOT EXISTS public.predicted_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL, -- e.g. "transaction_count", "revenue", "basket_size"
  scope JSONB NOT NULL, -- { brand_id, region_id, store_id, category_id }
  granularity VARCHAR(20) CHECK (granularity IN ('hourly', 'daily', 'weekly', 'monthly')),
  prediction_date DATE NOT NULL,
  predicted_value NUMERIC(12,2) NOT NULL,
  lower_bound NUMERIC(12,2),
  upper_bound NUMERIC(12,2),
  confidence_level FLOAT DEFAULT 0.95,
  model_name VARCHAR(50) DEFAULT 'prophet',
  model_version TEXT,
  model_params JSONB,
  training_data_points INTEGER,
  mae FLOAT, -- Mean Absolute Error
  mape FLOAT, -- Mean Absolute Percentage Error
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(metric_name, scope, granularity, prediction_date)
);

-- Model performance tracking
CREATE TABLE IF NOT EXISTS public.prediction_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predicted_metric_id UUID REFERENCES public.predicted_metrics(id),
  actual_value NUMERIC(12,2),
  absolute_error NUMERIC(12,2),
  percentage_error FLOAT,
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_saved_queries_user ON public.saved_queries(user_id);
CREATE INDEX idx_saved_queries_public ON public.saved_queries(is_public) WHERE is_public = true;
CREATE INDEX idx_saved_queries_tags ON public.saved_queries USING GIN(tags);
CREATE INDEX idx_query_executions_saved_query ON public.query_executions(saved_query_id);
CREATE INDEX idx_ai_templates_category ON public.ai_insight_templates(category);
CREATE INDEX idx_ai_templates_active ON public.ai_insight_templates(is_active);
CREATE INDEX idx_generated_insights_template ON public.generated_insights(template_id);
CREATE INDEX idx_generated_insights_starred ON public.generated_insights(is_starred);
CREATE INDEX idx_predicted_metrics_scope ON public.predicted_metrics USING GIN(scope);
CREATE INDEX idx_predicted_metrics_date ON public.predicted_metrics(prediction_date);
CREATE INDEX idx_prediction_accuracy_metric ON public.prediction_accuracy(predicted_metric_id);

-- Insert sample AI insight templates
INSERT INTO public.ai_insight_templates (
  template_code, 
  template_name, 
  category, 
  description,
  business_question,
  default_config,
  recommended_charts,
  required_dimensions,
  required_metrics,
  system_prompt,
  insight_template
) VALUES
(
  'price_sensitivity_top5',
  'Top 5 SKUs with Price Sensitivity',
  'pricing',
  'Identifies products where sales volume changes significantly with price changes',
  'Which products are most sensitive to price changes?',
  '{"metrics": ["revenue", "units_sold", "avg_price"], "dimensions": ["sku", "brand"], "timeRange": "last_30_days"}',
  '{"scatter", "line"}',
  '{"sku", "brand"}',
  '{"revenue", "units_sold"}',
  'Analyze the correlation between price changes and sales volume. Focus on products with high elasticity.',
  'The product {{sku}} shows {{elasticity}}% change in volume for every 1% price change.'
),
(
  'brand_substitution_matrix',
  'Brand Substitution Matrix',
  'substitution',
  'Shows which brands customers switch between when products are unavailable',
  'What brands do customers choose as alternatives?',
  '{"metrics": ["substitution_count", "acceptance_rate"], "dimensions": ["original_brand", "substitute_brand"], "timeRange": "last_30_days"}',
  '{"sankey", "heatmap"}',
  '{"brand"}',
  '{"transactions"}',
  'Identify the most common brand substitution patterns and their acceptance rates.',
  'Customers switch from {{original_brand}} to {{substitute_brand}} in {{percentage}}% of stockout cases.'
),
(
  'gender_influenced_requests',
  'Product Requests by Gender',
  'customer',
  'Analyzes how product request patterns differ by customer gender',
  'How do product preferences vary by gender?',
  '{"metrics": ["request_count", "conversion_rate"], "dimensions": ["gender", "category", "request_type"], "timeRange": "last_7_days"}',
  '{"bar", "pie"}',
  '{"gender", "category"}',
  '{"transactions"}',
  'Compare product request patterns between genders, highlighting significant differences.',
  '{{gender}} customers request {{category}} products {{percentage}}% more frequently.'
),
(
  'time_of_day_category_mix',
  'Category Performance by Time of Day',
  'sales',
  'Shows which product categories sell best at different times',
  'What products sell best at what times?',
  '{"metrics": ["revenue", "transaction_count"], "dimensions": ["hour_of_day", "category"], "timeRange": "last_7_days"}',
  '{"heatmap", "area"}',
  '{"category"}',
  '{"revenue", "transactions"}',
  'Identify peak selling times for each product category to optimize inventory and staffing.',
  '{{category}} sales peak at {{peak_hour}} with {{percentage}}% of daily revenue.'
),
(
  'unbranded_conversion_funnel',
  'Unbranded Request Conversion',
  'customer',
  'Tracks how unbranded product requests convert through suggestions',
  'How effectively do we convert unbranded requests?',
  '{"metrics": ["request_count", "suggestion_count", "conversion_count"], "dimensions": ["category", "suggestion_reason"], "timeRange": "last_14_days"}',
  '{"funnel", "bar"}',
  '{"category"}',
  '{"transactions"}',
  'Analyze the conversion funnel from unbranded request to purchase via suggestions.',
  '{{percentage}}% of unbranded {{category}} requests convert after staff suggestions.'
);

-- Function to generate predictions (placeholder - actual implementation would use external ML service)
CREATE OR REPLACE FUNCTION public.generate_metric_predictions(
  p_metric_name TEXT,
  p_scope JSONB,
  p_days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE (
  prediction_date DATE,
  predicted_value NUMERIC,
  lower_bound NUMERIC,
  upper_bound NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is a placeholder function
  -- In production, this would call an external ML service
  -- For now, return mock predictions based on historical averages
  
  RETURN QUERY
  WITH historical_avg AS (
    SELECT 
      AVG(total_amount) as avg_value,
      STDDEV(total_amount) as std_value
    FROM transactions
    WHERE transaction_datetime >= CURRENT_DATE - INTERVAL '30 days'
  )
  SELECT 
    CURRENT_DATE + i as prediction_date,
    avg_value * (1 + (RANDOM() - 0.5) * 0.1) as predicted_value,
    avg_value * 0.9 as lower_bound,
    avg_value * 1.1 as upper_bound
  FROM historical_avg
  CROSS JOIN generate_series(1, p_days_ahead) as i;
END;
$$;

-- RLS Policies
ALTER TABLE public.saved_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insight_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predicted_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_accuracy ENABLE ROW LEVEL SECURITY;

-- Public read access for templates and predictions
CREATE POLICY "Public read access" ON public.ai_insight_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access" ON public.predicted_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.generated_insights FOR SELECT USING (true);

-- User-specific access for saved queries
CREATE POLICY "Users can manage own queries" ON public.saved_queries 
  FOR ALL USING (true); -- In production: auth.uid() = user_id OR is_public = true

CREATE POLICY "Public read for public queries" ON public.saved_queries 
  FOR SELECT USING (is_public = true);

-- Authenticated write access
CREATE POLICY "Authenticated write access" ON public.query_executions 
  FOR ALL USING (true); -- In production: auth.role() = 'authenticated'

CREATE POLICY "Authenticated write access" ON public.generated_insights 
  FOR ALL USING (true);

CREATE POLICY "Authenticated write access" ON public.prediction_accuracy 
  FOR ALL USING (true);

-- Comments
COMMENT ON TABLE public.saved_queries IS 'User-saved query configurations for reuse';
COMMENT ON TABLE public.ai_insight_templates IS 'Pre-built analysis templates with AI prompts';
COMMENT ON TABLE public.predicted_metrics IS 'ML-generated predictions for key metrics';
COMMENT ON COLUMN public.saved_queries.config IS 'JSON containing filters, dimensions, metrics, orderBy, limit';
COMMENT ON COLUMN public.ai_insight_templates.system_prompt IS 'GPT-4 prompt template for generating insights';
COMMENT ON COLUMN public.predicted_metrics.scope IS 'JSON defining the prediction scope (brand_id, region_id, etc.)';