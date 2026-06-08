const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_SERVICE_ROLE_KEY não configurados em .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

async function runDiagnostics() {
  console.log('🔍 Iniciando Diagnóstico de Banco de Dados para a Fila de IA e Monetização...\n');

  // Teste 1: Query users table
  console.log('1. Testando SELECT na tabela users...');
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, name, is_admin')
    .limit(3);
  if (usersError) {
    console.error('❌ Erro na tabela users:', usersError);
  } else {
    console.log('✅ Tabela users ok. Retornados:', usersData.length, 'registros.');
  }

  // Teste 2: Query ai_chat_queue
  console.log('\n2. Testando SELECT na tabela ai_chat_queue...');
  const { data: queueData, error: queueError } = await supabase
    .from('ai_chat_queue')
    .select('*')
    .limit(3);
  if (queueError) {
    console.error('❌ Erro na tabela ai_chat_queue:', queueError);
  } else {
    console.log('✅ Tabela ai_chat_queue ok. Retornados:', queueData.length, 'registros.');
    if (queueData.length > 0) {
      console.log('   Colunas disponíveis:', Object.keys(queueData[0]));
    }
  }

  // Teste 3: Query user_balances
  console.log('\n3. Testando SELECT na tabela user_balances...');
  const { data: balancesData, error: balancesError } = await supabase
    .from('user_balances')
    .select('*')
    .limit(3);
  if (balancesError) {
    console.error('❌ Erro na tabela user_balances:', balancesError);
  } else {
    console.log('✅ Tabela user_balances ok. Retornados:', balancesData.length, 'registros.');
    if (balancesData.length > 0) {
      console.log('   Colunas disponíveis:', Object.keys(balancesData[0]));
    }
  }

  // Teste 4: Verificar se a migration do monetization_schema.sql rodou
  console.log('\n4. Verificando colunas de token em ai_chat_queue...');
  const { data: tokenTest, error: tokenError } = await supabase
    .from('ai_chat_queue')
    .select('prompt_tokens, completion_tokens, total_tokens')
    .limit(1);
  if (tokenError) {
    console.error('❌ Colunas de tokens ausentes ou inacessíveis:', tokenError.message);
  } else {
    console.log('✅ Colunas de tokens ok.');
  }
}

runDiagnostics();
