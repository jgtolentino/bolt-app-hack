# Weekly AI Insights Generation

This Supabase Edge Function automatically generates AI-powered insights for each brand on a weekly basis.

## Features

- Runs every Sunday at 3 AM (configurable)
- Processes top 3 AI insight templates per brand
- Uses GPT-4 for natural language generation (with fallback)
- Stores insights in `generated_insights` table
- Optional Slack/email notifications

## Setup

1. **Deploy the function:**
```bash
supabase functions deploy weekly-ai-insights
```

2. **Set environment variables:**
```bash
supabase secrets set OPENAI_API_KEY=sk-your-key
```

3. **Create a cron job in Supabase Dashboard:**
   - Go to Database → Extensions → Enable pg_cron
   - Create a new cron job:

```sql
-- Run every Sunday at 3 AM
SELECT cron.schedule(
  'weekly-ai-insights',
  '0 3 * * 0', -- Cron expression
  $$
  SELECT
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/weekly-ai-insights',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('trigger', 'cron')
    );
  $$
);
```

## Configuration

The function processes these templates by default:
- `price_sensitivity_top5` - Price elasticity analysis
- `brand_substitution_matrix` - Substitution patterns
- `time_of_day_category_mix` - Temporal performance

Modify the template codes in `index.ts` to change which insights are generated.

## Manual Trigger

You can manually trigger the function:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/weekly-ai-insights \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "manual"}'
```

## Monitoring

View logs in Supabase Dashboard under Functions → Logs.

Generated insights appear in the `generated_insights` table with:
- `metadata.source = 'automated'`
- `metadata.generation_type = 'weekly_cron'`