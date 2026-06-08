
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
  const query = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users'
      AND column_name = 'last_active';
  `;
  
  const { data, error } = await supabase.rpc('exec_sql', { sql: query });
  // Since exec_sql failed before, I'll try to find another way or just assume TIMESTAMPTZ.
  
  // I'll try to select and check the type via JS
  const { data: user } = await supabase.from('users').select('last_active').limit(1);
  if (user && user[0]) {
    console.log('last_active value:', user[0].last_active);
    console.log('Type check:', typeof user[0].last_active);
  }
}

inspectSchema();
