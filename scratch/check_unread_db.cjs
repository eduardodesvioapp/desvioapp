const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkUnread() {
  const { data, count, error } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, content, is_read, match_id', { count: 'exact' })
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  console.log('Total unread messages in DB:', count);
  console.log('Unread messages:', data);
}

checkUnread();
