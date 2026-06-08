const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Erro: Env incorreto');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('ai_chat_queue')
    .select('id, status, total_tokens, prompt_tokens, completion_tokens, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching queue:', error);
    return;
  }

  console.log('--- RECENT QUEUE ITEMS ---');
  let nullTokensCount = 0;
  let hasTokensCount = 0;

  data.forEach((item, idx) => {
    const hasTokens = item.total_tokens !== null && item.total_tokens > 0;
    if (hasTokens) hasTokensCount++;
    else nullTokensCount++;

    console.log(`[${idx+1}] ID: ${item.id} | Status: ${item.status} | Created: ${item.created_at} | Tokens: ${item.total_tokens} (P: ${item.prompt_tokens}, C: ${item.completion_tokens})`);
  });

  console.log('\n--- SUMMARY ---');
  console.log(`Items with NULL or 0 tokens: ${nullTokensCount}`);
  console.log(`Items with active tokens: ${hasTokensCount}`);
}

check();
