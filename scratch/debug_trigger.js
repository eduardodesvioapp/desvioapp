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
  env['VITE_SUPABASE_SERVICE_ROLE_KEY']
);

async function run() {
  const { data, error } = await supabase
    .from('users')
    .select('name, age, gender, city, bio, latitude, longitude, profile_image_url, verification_status, profile_score')
    .eq('name', 'Lucas Oliveira')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Lucas Oliveira properties:');
  console.log('- name:', data.name, typeof data.name);
  console.log('- age:', data.age, typeof data.age);
  console.log('- gender:', data.gender, typeof data.gender);
  console.log('- city:', data.city, typeof data.city);
  console.log('- bio:', data.bio, typeof data.bio);
  console.log('- latitude:', data.latitude, typeof data.latitude);
  console.log('- longitude:', data.longitude, typeof data.longitude);
  console.log('- profile_image_url:', data.profile_image_url, typeof data.profile_image_url);
  console.log('- verification_status:', data.verification_status, typeof data.verification_status);
  console.log('- profile_score:', data.profile_score, typeof data.profile_score);
}

run();
