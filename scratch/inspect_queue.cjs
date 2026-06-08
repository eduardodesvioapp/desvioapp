const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function inspectQueue() {
  console.log('\n=== INSPECIONANDO FILA DE CHAT IA ===\n');

  // 1. Verificar total de mensagens na fila por status
  const { data: countData, error: countError } = await supabase
    .from('ai_chat_queue')
    .select('status, id');

  if (countError) {
    console.error('❌ Erro ao ler ai_chat_queue:', countError.message);
    return;
  }

  console.log(`Total de itens na fila: ${countData.length}`);
  const summary = countData.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  console.log('Resumo por status:', summary);

  // 2. Mostrar os últimos 5 itens da fila com mensagens reais
  const { data: queueItems, error: queueError } = await supabase
    .from('ai_chat_queue')
    .select(`
      id,
      status,
      retry_count,
      error_message,
      created_at,
      message_id
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (queueError) {
     console.error('❌ Erro detalhado da fila:', queueError.message);
     return;
  }

  for (const item of queueItems) {
    // Buscar a mensagem relacionada
    const { data: msg } = await supabase
      .from('messages')
      .select('content, sender_id, receiver_id')
      .eq('id', item.message_id)
      .maybeSingle();

    console.log(`\n---------------------------------`);
    console.log(`ID da Fila: ${item.id}`);
    console.log(`Status: ${item.status}`);
    console.log(`Criado em: ${item.created_at}`);
    console.log(`Tentativas: ${item.retry_count}`);
    console.log(`Erro: ${item.error_message || 'Nenhum'}`);
    if (msg) {
      console.log(`Conteúdo da Msg Humana: "${msg.content}"`);
    } else {
      console.log(`⚠️ Mensagem original deletada ou não encontrada!`);
    }
  }
}

inspectQueue().catch(console.error);
