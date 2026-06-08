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
  env['VITE_SUPABASE_SERVICE_ROLE_KEY'] // Use service role to bypass RLS and perform update
);

async function run() {
  // Fetch users with score 0
  const { data: users, error: fetchErr } = await supabase
    .from('users')
    .select('id, name, age')
    .eq('profile_score', 0);

  if (fetchErr) {
    console.error('Error fetching users:', fetchErr);
    return;
  }

  console.log(`Found ${users.length} users with profile_score = 0`);

  for (const u of users) {
    // Performing an update triggers the before update trigger public.calculate_profile_score
    const { data, error } = await supabase
      .from('users')
      .update({ age: u.age }) // no-op update to trigger recalculation
      .eq('id', u.id)
      .select('name, profile_score');

    if (error) {
      console.error(`Error updating ${u.name}:`, error);
    } else {
      console.log(`Updated ${u.name}: new score is ${data[0].profile_score}`);
    }
  }
}

run();
