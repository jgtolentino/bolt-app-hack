#!/bin/bash

# Fix import paths based on directory structure
echo "Fixing import paths..."

# From src/features/transactions/hooks/ (3 levels deep)
find src/features/transactions/hooks -name "*.ts" -o -name "*.tsx" | while read f; do
  sed -i '' "s|from '\.\./\.\./\.\./lib/supabase'|from '../../../lib/supabase'|g" "$f"
  sed -i '' "s|from '\.\./\.\./\.\./stores/|from '../../../stores/|g" "$f"
  sed -i '' "s|from '\.\./\.\./\.\./utils/|from '../../../utils/|g" "$f"
  sed -i '' "s|from '\.\./\.\./\.\./services/|from '../../../services/|g" "$f"
done

# From src/features/transactions/ (2 levels deep)
find src/features/transactions -maxdepth 1 -name "*.ts" -o -name "*.tsx" | while read f; do
  sed -i '' "s|from '\.\./\.\./lib/supabase'|from '../../lib/supabase'|g" "$f"
  sed -i '' "s|from '\.\./\.\./stores/|from '../../stores/|g" "$f"
  sed -i '' "s|from '\.\./\.\./utils/|from '../../utils/|g" "$f"
  sed -i '' "s|from '\.\./\.\./services/|from '../../services/|g" "$f"
done

# From src/features/filters/ (2 levels deep)
find src/features/filters -name "*.ts" -o -name "*.tsx" | while read f; do
  sed -i '' "s|from '\.\./\.\./lib/supabase'|from '../../lib/supabase'|g" "$f"
  sed -i '' "s|from '\.\./\.\./stores/|from '../../stores/|g" "$f"
  sed -i '' "s|from '\.\./\.\./utils/|from '../../utils/|g" "$f"
  sed -i '' "s|from '\.\./\.\./services/|from '../../services/|g" "$f"
done

# From src/stores, src/utils, src/services (1 level deep)
find src/stores src/utils src/services -name "*.ts" -o -name "*.tsx" | while read f; do
  sed -i '' "s|from '\.\./lib/supabase'|from '../lib/supabase'|g" "$f"
  sed -i '' "s|from '\.\./stores/|from '../stores/|g" "$f"
  sed -i '' "s|from '\.\./utils/|from '../utils/|g" "$f"
  sed -i '' "s|from '\.\./services/|from '../services/|g" "$f"
done

# From src/pages (1 level deep)
find src/pages -name "*.ts" -o -name "*.tsx" | while read f; do
  sed -i '' "s|from '\.\./lib/supabase'|from '../lib/supabase'|g" "$f"
  sed -i '' "s|from '\.\./stores/|from '../stores/|g" "$f"
  sed -i '' "s|from '\.\./utils/|from '../utils/|g" "$f"
  sed -i '' "s|from '\.\./services/|from '../services/|g" "$f"
done

echo "Import paths fixed!"