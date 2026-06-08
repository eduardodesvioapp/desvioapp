
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function testSpawn() {
  console.log('\n=== TESTE DIRETO: spawn_synthetic_user ===\n');

  // Filtros mínimos para testar
  const filters = {
    gender: 'all',
    minAge: 18,
    maxAge: 50,
    maxDistance: 50,
    minHeight: 150,
    maxHeight: 200,
    minCompatibility: 50,
    maxCompatibility: 100,
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
    console.error('❌ ERRO AO SPAWNAR IA:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ IA Criada com ID:', data);

    // Verificar se o usuário foi criado
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, name, age, gender, email, profile_image_url, is_human')
      .eq('id', data)
      .single();
    
    if (userErr) {
      console.error('❌ Erro ao buscar usuário criado:', userErr.message);
    } else {
      console.log('\n📋 Perfil criado:', JSON.stringify(user, null, 2));
    }
  }
}

testSpawn();
