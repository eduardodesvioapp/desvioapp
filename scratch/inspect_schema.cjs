
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
  // Check columns of public.users
  const query = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users';
  `;
  
  // Try to use a known RPC or a workaround
  const { data: cols, error: err } = await supabase.from('users').select('*').limit(1);
  
  if (err) {
    console.error('Error selecting from users:', err);
  } else if (cols && cols.length > 0) {
    console.log('Columns found in a record:', Object.keys(cols[0]));
  } else {
    console.log('No users found to inspect columns.');
  }
}

inspectSchema();
