
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const sql = fs.readFileSync(path.join(__dirname, '..', 'ai_liquidity_trigger.sql'), 'utf8');

async function runSQL(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/pg_query`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const protocol = url.protocol === 'https:' ? require('https') : require('http');
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function deployViaPgRest() {
  console.log('\n=== DEPLOY: ai_liquidity_trigger.sql ===');
  console.log(`Host: ${SUPABASE_URL}\n`);

  // Try the Supabase pg_query endpoint (not always available)
  const result = await runSQL(sql);
  console.log('Status:', result.status);
  console.log('Response:', result.body.substring(0, 500));

  if (result.status === 404) {
    console.log('\n⚠️  O endpoint /rest/v1/rpc/pg_query não está disponível.');
    console.log('\n📋 AÇÃO NECESSÁRIA: Execute o SQL manualmente.');
    console.log('\nPor favor, acesse o SQL Editor do seu Supabase:');
    console.log(`${SUPABASE_URL.replace('services-supa-desvio.', '')}/studio`);
    console.log('\nOu acesse diretamente o EasyPanel e execute o SQL no container do Postgres.');
  }
}

deployViaPgRest();
