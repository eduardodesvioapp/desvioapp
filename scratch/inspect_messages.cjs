const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function inspectMessages() {
  console.log('\n=== INSPECIONANDO ÚLTIMAS MENSAGENS DO APP ===\n');

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Erro ao ler mensagens:', error.message);
    return;
  }

  if (messages.length === 0) {
    console.log('Nenhuma mensagem encontrada na tabela public.messages!');
    return;
  }

  for (const msg of messages) {
    const { data: sender } = await supabase
      .from('users')
      .select('name, is_human')
      .eq('id', msg.sender_id)
      .maybeSingle();

    const { data: receiver } = await supabase
      .from('users')
      .select('name, is_human')
      .eq('id', msg.receiver_id)
      .maybeSingle();

    console.log(`\n---------------------------------`);
    console.log(`Msg ID: ${msg.id}`);
    console.log(`Match ID: ${msg.match_id}`);
    console.log(`Criado em: ${msg.created_at}`);
    console.log(`Conteúdo: "${msg.content}"`);
    console.log(`Remetente: ${sender ? `${sender.name} (Humano: ${sender.is_human})` : `Não encontrado (ID: ${msg.sender_id})`}`);
    console.log(`Destinatário: ${receiver ? `${receiver.name} (Humano: ${receiver.is_human})` : `Não encontrado (ID: ${msg.receiver_id})`}`);
  }
}

inspectMessages().catch(console.error);
