
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function syncSecrets() {
  console.log('\n=== SINCRONIZANDO SECRETS NO BANCO ===\n');

  const secrets = [
    { key_name: 'GEMINI_API_KEY', key_value: process.env.VITE_GEMINI_API_KEY },
    { key_name: 'SUPABASE_URL', key_value: process.env.VITE_SUPABASE_URL },
    { key_name: 'SUPABASE_SERVICE_KEY', key_value: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY }
  ];

  for (const secret of secrets) {
    const { error } = await supabase
      .from('secrets')
      .upsert(secret, { onConflict: 'key_name' });
    
    if (error) {
      console.error(`❌ Erro ao salvar ${secret.key_name}:`, error.message);
    } else {
      console.log(`✅ ${secret.key_name} salva.`);
    }
  }
}

syncSecrets();
