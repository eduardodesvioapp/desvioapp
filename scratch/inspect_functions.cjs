
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function inspectFunctions() {
  const query = `
    SELECT 
      p.proname as function_name,
      pg_get_function_arguments(p.oid) as arguments
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'search_users_safe';
  `;
  
  const { data: funcData, error: funcError } = await supabase.rpc('exec_sql', { sql: query });
  
  if (funcError) {
    console.error('Error inspecting functions:', funcError);
  } else {
    console.log('Functions found:', JSON.stringify(funcData, null, 2));
  }
}

inspectFunctions();
