const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log('\n=== REINICIANDO FILA DE CHAT IA ===\n');

  // Resetar todos os itens da fila que falharam ou travaram de volta para 'pending'
  const { data, error } = await supabase
    .from('ai_chat_queue')
    .update({
      status: 'pending',
      retry_count: 0,
      error_message: null
    })
    .in('status', ['failed', 'processing']);

  if (error) {
    console.error('❌ Falha ao reiniciar fila:', error.message);
  } else {
    console.log('✅ Fila reiniciada com sucesso! Todos os itens falhados/processando agora estão pendentes.');
  }
}

main().catch(console.error);
