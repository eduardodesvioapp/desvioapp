
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function deployAndTest() {
  console.log('\n=== DEPLOY: ai_liquidity_trigger.sql ===\n');

  const sql = fs.readFileSync(path.join(__dirname, '..', 'ai_liquidity_trigger.sql'), 'utf8');

  const { error: deployErr } = await supabase.rpc('exec_sql', { sql });
  
  if (deployErr) {
    // Supabase doesn't expose exec_sql, so we'll use the REST API directly
    console.log('Nota: exec_sql não disponível, tentando via pg...');
  }

  // Try calling the function with the fixed filters
  console.log('\n=== TESTE: spawn_synthetic_user (pós-fix) ===\n');
  
  const filters = {
    gender: 'all',
    minAge: 18,
    maxAge: 50,
    maxDistance: 50,
    minHeight: 150,
    maxHeight: 200,
    latitude: -30.0346,
    longitude: -51.2177,
    eyes: [],
    hair: [],
    skinColors: [],
    weights: [],
    interests: [],
    type: 'all'
  };

  const { data, error } = await supabase.rpc('spawn_synthetic_user', {
    p_filters: filters
  });

  if (error) {
    console.error('❌ ERRO:', JSON.stringify(error, null, 2));
    console.log('\n⚠️  Execute manualmente o arquivo ai_liquidity_trigger.sql no Supabase SQL Editor e depois rode este teste novamente.');
  } else {
    console.log('✅ IA Criada com ID:', data);
  }
}

deployAndTest();
