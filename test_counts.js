import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = fs.readFileSync(resolve(__dirname, '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim();
});

const supabase = createClient(
  env['VITE_SUPABASE_URL'],
  env['VITE_SUPABASE_ANON_KEY']
);

async function run() {
  const userId = '4baa20e3-6f58-49e9-8898-f80d3...'; // I will get it from the DB
  const { data: users } = await supabase.from('users').select('id').limit(1);
  if (!users || users.length === 0) return console.log('No users');
  const testUserId = users[0].id;

  const [
    matchesRes,
    likesRes,
    visitsRes,
    userRes
  ] = await Promise.all([
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'accepted').eq('is_read', false).or(`user1_id.eq.${testUserId},user2_id.eq.${testUserId}`),
    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('liked_user_id', testUserId).eq('is_read', false),
    supabase.from('profile_visits').select('*', { count: 'exact', head: true }).eq('visited_id', testUserId).eq('is_read', false),
    supabase.from('users').select('last_active').eq('id', testUserId).single()
  ]);

  console.log('Matches Error:', matchesRes.error);
  console.log('Likes Error:', likesRes.error);
  console.log('Visits Error:', visitsRes.error);
  console.log('User Error:', userRes.error);
}
run();
