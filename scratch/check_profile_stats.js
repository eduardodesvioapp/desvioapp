import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Note: We need to go up one directory since we are in scratch/
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
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, is_human, profile_score, gender');
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`Total users found: ${users.length}`);

  const humans = users.filter(u => u.is_human === true);
  const ais = users.filter(u => u.is_human === false);

  console.log(`\nHumans (${humans.length}):`);
  humans.forEach(h => {
    console.log(`- ${h.name} (${h.gender}, score: ${h.profile_score})`);
  });

  console.log(`\nAI Profiles (${ais.length}):`);
  ais.forEach(ai => {
    console.log(`- ${ai.name} (${ai.gender}, score: ${ai.profile_score})`);
  });
}

run();
