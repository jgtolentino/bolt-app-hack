# API Keys Setup for POC Testing

## Quick Start

To enable AI features in the Scout Analytics Dashboard, you need to add your API keys.

### Method 1: Environment Variables (Recommended)

Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.example .env.local

# Edit the file and add your keys
```

Add your actual API keys:

```env
# AI Configuration (Required for AI features)
VITE_OPENAI_API_KEY=sk-...your-actual-openai-key
VITE_ANTHROPIC_API_KEY=sk-ant-...your-actual-anthropic-key

# Supabase (Already configured for POC)
VITE_SUPABASE_URL=https://baqlxgwdfjltivlfmsbr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcWx4Z3dkZmpsdGl2bGZtc2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4NTk4OTYsImV4cCI6MjA0NjQzNTg5Nn0.pboVC-YgyH7CrJfh7N5fxJLAaW13ej-lqV-tVvFHF3A
```

### Method 2: Vercel Environment Variables

If deploying to Vercel:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:
   - `VITE_OPENAI_API_KEY` - Your OpenAI API key
   - `VITE_ANTHROPIC_API_KEY` - Your Anthropic API key

### Getting API Keys

#### OpenAI
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Go to [API Keys](https://platform.openai.com/api-keys)
3. Create a new secret key
4. Copy the key starting with `sk-...`

#### Anthropic
1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Go to [API Keys](https://console.anthropic.com/settings/keys)
3. Create a new API key
4. Copy the key starting with `sk-ant-...`

### Testing Your Setup

After adding your keys:

1. Restart the development server:
   ```bash
   npm run dev
   ```

2. Open the dashboard and try the AI Chat feature
3. Ask questions like:
   - "What are the top selling products?"
   - "Show me sales trends for the last week"
   - "Which regions have the highest growth?"

### Troubleshooting

If AI features aren't working:

1. Check the browser console for errors
2. Verify your API keys are correctly set:
   - Open Developer Tools (F12)
   - Check for messages about missing API keys
   
3. Ensure your API keys have sufficient credits/quota

### Security Notes

- Never commit `.env.local` to version control
- Keep your API keys secure and rotate them regularly
- Use environment-specific keys (dev/staging/prod)
- Monitor your API usage to avoid unexpected charges

### Support

For issues with:
- OpenAI API: Check [OpenAI Status](https://status.openai.com)
- Anthropic API: Check [Anthropic Status](https://status.anthropic.com)
- Dashboard: Open an issue in this repository