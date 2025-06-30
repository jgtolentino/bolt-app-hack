import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AITemplate {
  id: string;
  template_code: string;
  template_name: string;
  system_prompt: string;
  default_config: any;
}

interface Brand {
  id: string;
  brand_name: string;
  brand_code: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting weekly AI insights generation...');

    // 1. Get all active AI templates
    const { data: templates, error: templateError } = await supabase
      .from('ai_insight_templates')
      .select('*')
      .eq('is_active', true)
      .in('template_code', [
        'price_sensitivity_top5',
        'brand_substitution_matrix',
        'time_of_day_category_mix'
      ])
      .limit(3);

    if (templateError) throw templateError;

    // 2. Get all active brands
    const { data: brands, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .limit(20); // Process top 20 brands

    if (brandError) throw brandError;

    console.log(`Processing ${brands?.length || 0} brands with ${templates?.length || 0} templates`);

    const insights = [];

    // 3. Loop through each brand and generate insights
    for (const brand of brands || []) {
      for (const template of templates || []) {
        try {
          // Execute query for this brand
          const queryData = await executeTemplateQuery(template, brand);
          
          if (!queryData || queryData.length === 0) {
            console.log(`No data for ${brand.brand_name} - ${template.template_name}`);
            continue;
          }

          // Generate insight using GPT-4
          const insightText = await generateInsight(template, brand, queryData);

          // Save insight
          const insight = {
            template_id: template.id,
            insight_text: insightText,
            supporting_data: queryData.slice(0, 10), // Limit supporting data
            confidence_score: calculateConfidence(queryData),
            relevance_score: 0.8,
            filters_applied: { brand_id: brand.id, brand_name: brand.brand_name },
            generated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            is_starred: false,
            metadata: {
              source: 'automated',
              brand_id: brand.id,
              brand_name: brand.brand_name,
              generation_type: 'weekly_cron'
            }
          };

          insights.push(insight);
        } catch (err) {
          console.error(`Error processing ${brand.brand_name} - ${template.template_name}:`, err);
        }
      }
    }

    // 4. Batch insert all insights
    if (insights.length > 0) {
      const { error: insertError } = await supabase
        .from('generated_insights')
        .insert(insights);

      if (insertError) throw insertError;
    }

    // 5. Send notification summary (optional)
    await sendNotificationSummary(insights);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${insights.length} insights for ${brands?.length || 0} brands`,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in weekly AI insights:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function executeTemplateQuery(template: AITemplate, brand: Brand) {
  // Build query based on template config
  const config = template.default_config;
  
  // Add brand filter
  const filters = [
    ...(config.filters || []),
    { dimension: 'brand', operator: 'eq', value: brand.brand_name }
  ];

  // Execute the actual query
  const { data, error } = await supabase.rpc('get_dynamic_metrics', {
    p_metrics: config.metrics,
    p_dimensions: config.dimensions,
    p_filters: filters,
    p_date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    p_date_to: new Date().toISOString().split('T')[0],
    p_limit: 100
  });

  if (error) throw error;

  // Transform result
  return (data || []).map((row: any) => ({
    ...row.dimension_values,
    ...row.metric_values
  }));
}

async function generateInsight(template: AITemplate, brand: Brand, data: any[]) {
  // If no GPT-4 key, use template-based generation
  if (!openaiApiKey) {
    return generateTemplateBasedInsight(template, brand, data);
  }

  // Prepare context for GPT-4
  const context = {
    brand_name: brand.brand_name,
    template_name: template.template_name,
    data_points: data.length,
    data_sample: data.slice(0, 5),
    date_range: 'Last 30 days',
    key_metrics: calculateKeyMetrics(data, template.default_config.metrics)
  };

  // Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: template.system_prompt || 'You are an expert retail analyst providing actionable insights.'
        },
        {
          role: 'user',
          content: `Analyze the following data for ${brand.brand_name} and provide a concise, actionable insight:
          
          Context: ${JSON.stringify(context, null, 2)}
          
          Provide a 2-3 sentence insight that answers: ${template.business_question}`
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    })
  });

  if (!response.ok) {
    console.error('OpenAI API error:', await response.text());
    return generateTemplateBasedInsight(template, brand, data);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

function generateTemplateBasedInsight(template: AITemplate, brand: Brand, data: any[]) {
  // Fallback template-based generation
  if (!data || data.length === 0) {
    return `No significant data available for ${brand.brand_name} in the analysis period.`;
  }

  const metrics = template.default_config.metrics[0];
  const values = data.map(d => d[metrics]).filter(v => typeof v === 'number');
  
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);

  return `${brand.brand_name} shows ${metrics} averaging ${avg.toFixed(2)} over the past 30 days, with peaks of ${max.toFixed(2)}. ${
    template.template_code === 'price_sensitivity_top5' 
      ? 'Price adjustments may impact volume significantly.'
      : template.template_code === 'brand_substitution_matrix'
      ? 'Customer substitution patterns indicate brand loyalty opportunities.'
      : 'Performance varies by time of day, suggesting optimization opportunities.'
  }`;
}

function calculateConfidence(data: any[]): number {
  if (!data || data.length === 0) return 0.1;
  if (data.length < 10) return 0.5;
  if (data.length < 50) return 0.7;
  return 0.9;
}

function calculateKeyMetrics(data: any[], metrics: string[]) {
  const result: any = {};
  
  for (const metric of metrics) {
    const values = data.map(d => d[metric]).filter(v => typeof v === 'number');
    if (values.length > 0) {
      result[metric] = {
        total: values.reduce((a, b) => a + b, 0),
        average: values.reduce((a, b) => a + b, 0) / values.length,
        max: Math.max(...values),
        min: Math.min(...values),
        count: values.length
      };
    }
  }
  
  return result;
}

async function sendNotificationSummary(insights: any[]) {
  // Group insights by brand
  const brandSummary: Record<string, number> = {};
  
  insights.forEach(insight => {
    const brandName = insight.metadata?.brand_name || 'Unknown';
    brandSummary[brandName] = (brandSummary[brandName] || 0) + 1;
  });

  console.log('Weekly AI Insights Summary:');
  console.log(`Total insights generated: ${insights.length}`);
  console.log('By brand:', brandSummary);

  // In production, send email or Slack notification
  // await sendEmail(...) or await sendSlackMessage(...)
}