const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function inspectMatchesTable() {
  console.log('\n=== INSPECIONANDO COLUNAS E VALORES DE PUBLIC.MATCHES ===\n');

  // 1. Mostrar os registros atuais da tabela matches com typing_user_id
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id, status, typing_user_id')
    .limit(5);

  if (error) {
    console.error('❌ Erro ao ler matches:', error.message);
    return;
  }

  console.log('Registros em public.matches:');
  console.log(JSON.stringify(matches, null, 2));
}

inspectMatchesTable().catch(console.error);
