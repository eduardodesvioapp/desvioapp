const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const GABRIEL_ID = 'adc7a762-a3f9-40ed-9b9c-a193a5e7fa31';

async function checkGabrielUnread() {
  const { data, count, error } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, content, is_read, match_id')
    .eq('receiver_id', GABRIEL_ID)
    .eq('is_read', false);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Gabriel has ${count} unread received messages:`);
  console.log(data);
}

checkGabrielUnread();
