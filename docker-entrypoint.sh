#!/bin/bash
set -euo pipefail

# Secure Docker entrypoint that reads secrets at runtime
# Never logs or echoes secret values

echo "🔐 Configuring application with runtime secrets..."

# Create runtime config for frontend (public values only)
cat > /usr/share/nginx/html/config/runtime-config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL:-}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY:-}",
  VITE_MAPBOX_TOKEN: "${VITE_MAPBOX_TOKEN:-}",
  VITE_APP_VERSION: "${APP_VERSION:-1.0.0}",
  VITE_APP_ENV: "${APP_ENV:-production}"
};
EOF

# Read secrets from Docker secret files if they exist
if [ -f /run/secrets/supabase_url ]; then
  export VITE_SUPABASE_URL=$(cat /run/secrets/supabase_url)
fi

if [ -f /run/secrets/supabase_anon_key ]; then
  export VITE_SUPABASE_ANON_KEY=$(cat /run/secrets/supabase_anon_key)
fi

# Update runtime config with actual values (still public only)
cat > /usr/share/nginx/html/config/runtime-config.js <<EOF
window.__RUNTIME_CONFIG__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL:-}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY:-}",
  VITE_MAPBOX_TOKEN: "${VITE_MAPBOX_TOKEN:-}",
  VITE_APP_VERSION: "${APP_VERSION:-1.0.0}",
  VITE_APP_ENV: "${APP_ENV:-production}"
};
EOF

# Inject runtime config into index.html
if [ -f /usr/share/nginx/html/index.html ]; then
  sed -i 's|</head>|<script src="/config/runtime-config.js"></script></head>|' /usr/share/nginx/html/index.html
fi

echo "✅ Runtime configuration complete"

# Clear sensitive environment variables before starting nginx
unset VITE_SUPABASE_ANON_KEY

# Start nginx
exec "$@"