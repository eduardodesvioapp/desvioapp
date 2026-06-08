import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = fs.readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
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
  // 1. Get a user ID to search as
  const { data: users } = await supabase.from('users').select('id, name, profile_score, is_human').limit(5);
  if (!users || users.length === 0) return console.log('No users found in database');
  
  // Use Bruno Alves who has score 100 as the searching user, so he is not blocked
  const searchingUser = users.find(u => u.name.includes('Bruno Alves')) || users[0];
  console.log(`Searching as User: ${searchingUser.name} (${searchingUser.id}) - is_human: ${searchingUser.is_human}, score: ${searchingUser.profile_score}`);

  // 2. Call search_users_safe for 'human'
  console.log('\n--- Searching for Human Profiles (p_type = "human") ---');
  const { data: humans, error: humanErr } = await supabase.rpc('search_users_safe', {
    p_user_id: searchingUser.id,
    p_min_age: 18,
    p_max_age: 50,
    p_max_dist: 100,
    p_type: 'human',
    p_gender: 'all'
  });
  if (humanErr) console.error('Error searching humans:', humanErr);
  else console.log(`Found ${humans?.length || 0} humans:`, humans?.map(h => `${h.name} (${h.gender}, score: ${h.profile_score}, is_human: ${h.is_human})`));

  // 3. Call search_users_safe for 'ai'
  console.log('\n--- Searching for AI Profiles (p_type = "ai") ---');
  const { data: ais, error: aiErr } = await supabase.rpc('search_users_safe', {
    p_user_id: searchingUser.id,
    p_min_age: 18,
    p_max_age: 50,
    p_max_dist: 100,
    p_type: 'ai',
    p_gender: 'all'
  });
  if (aiErr) console.error('Error searching AIs:', aiErr);
  else console.log(`Found ${ais?.length || 0} AIs:`, ais?.map(a => `${a.name} (${a.gender}, score: ${a.profile_score}, is_human: ${a.is_human})`));

  // 4. Call search_users_safe for 'all'
  console.log('\n--- Searching for All Profiles (p_type = "all") ---');
  const { data: allUsers, error: allErr } = await supabase.rpc('search_users_safe', {
    p_user_id: searchingUser.id,
    p_min_age: 18,
    p_max_age: 50,
    p_max_dist: 100,
    p_type: 'all',
    p_gender: 'all'
  });
  if (allErr) console.error('Error searching all:', allErr);
  else console.log(`Found ${allUsers?.length || 0} total:`, allUsers?.map(u => `${u.name} (${u.gender}, score: ${u.profile_score}, is_human: ${u.is_human})`));
}

run();
