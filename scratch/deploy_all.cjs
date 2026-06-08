
/**
 * Deploy automático de scripts SQL via /pg/query endpoint
 * Funciona no Supabase self-hosted (EasyPanel)
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function runSQL(sql, label) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const url = new URL(`${SUPABASE_URL}/pg/query`);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${label} — Sucesso`);
          resolve(true);
        } else {
          console.error(`❌ ${label} — Status ${res.statusCode}: ${data.substring(0, 300)}`);
          resolve(false);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function deployAll() {
  console.log('\n=== DEPLOY COMPLETO: Desvio Database Functions ===\n');

  const scripts = [
    { file: 'ai_response_logic.sql', label: 'Gemini AI API + Responses' },
    { file: 'update_search_compatibility.sql', label: 'search_users_safe + calculate_resonance + calculate_distance' },
    { file: 'ai_liquidity_trigger.sql', label: 'spawn_synthetic_user' },
  ];

  for (const { file, label } of scripts) {
    const sql = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    await runSQL(sql, label);
  }

  console.log('\n=== TESTE: spawn_synthetic_user ===\n');
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  const { data, error } = await supabase.rpc('spawn_synthetic_user', {
    p_filters: {
      gender: 'all', minAge: 18, maxAge: 50, maxDistance: 50,
      minHeight: 150, maxHeight: 200, latitude: -30.0346, longitude: -51.2177,
      eyes: [], hair: [], skinColors: [], weights: [], interests: [], type: 'all'
    }
  });

  if (error) {
    console.error('❌ Spawn erro:', error.message);
  } else {
    console.log('✅ IA criada com ID:', data);
  }
}

deployAll().catch(console.error);
