import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadGADMData() {
  try {
    // Create public bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const geoBucket = buckets?.find(b => b.name === 'geo');
    
    if (!geoBucket) {
      console.log('Creating public geo bucket...');
      const { error: createError } = await supabase.storage.createBucket('geo', {
        public: true,
        allowedMimeTypes: ['application/json', 'application/gzip']
      });
      
      if (createError && !createError.message.includes('already exists')) {
        throw createError;
      }
    }

    // Upload the JSON file
    const jsonPath = path.join(__dirname, '../public/data/gadm41_PHL_1.json');
    const jsonFile = fs.readFileSync(jsonPath);
    
    console.log('Uploading gadm41_PHL_1.json...');
    const { error: uploadError } = await supabase.storage
      .from('geo')
      .upload('gadm41_PHL_1.json', jsonFile, {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Upload the gzipped file if it exists
    const gzPath = path.join(__dirname, '../public/data/gadm41_PHL_1.json.gz');
    if (fs.existsSync(gzPath)) {
      const gzFile = fs.readFileSync(gzPath);
      
      console.log('Uploading gadm41_PHL_1.json.gz...');
      const { error: gzUploadError } = await supabase.storage
        .from('geo')
        .upload('gadm41_PHL_1.json.gz', gzFile, {
          contentType: 'application/gzip',
          upsert: true
        });

      if (gzUploadError) throw gzUploadError;
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('geo')
      .getPublicUrl('gadm41_PHL_1.json');

    console.log('✅ Successfully uploaded to Supabase Storage!');
    console.log('📍 Public URL:', publicUrlData.publicUrl);
    
    // Write the URL to a file for the next step
    fs.writeFileSync(
      path.join(__dirname, '../.gadm-url'), 
      publicUrlData.publicUrl
    );

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ Error uploading to Supabase:', error);
    process.exit(1);
  }
}

uploadGADMData();