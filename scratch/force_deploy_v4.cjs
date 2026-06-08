
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const sql = fs.readFileSync(path.join(__dirname, '..', 'ai_liquidity_trigger.sql'), 'utf8');

async function makeRequest(urlStr, body, headers) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const bodyStr = JSON.stringify(body);
    const req = https.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(bodyStr) },
      rejectUnauthorized: false
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function deploy() {
  console.log(`\n=== DEPLOY via /pg endpoint com service_role ===\n`);

  // The /pg endpoint in self-hosted Supabase typically needs a different auth
  // Try with the service_role key as the pg password
  const result = await makeRequest(
    `${SUPABASE_URL}/pg`,
    { query: sql },
    {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'X-Connection-Encrypted': SERVICE_KEY
    }
  );
  
  console.log('Status:', result.status);
  console.log('Body:', result.body.substring(0, 500));

  if (result.status === 200 || result.status === 201) {
    console.log('\n✅ Deploy bem-sucedido!');
  } else {
    console.log('\n--- Tentando /pg/query ---');
    const result2 = await makeRequest(
      `${SUPABASE_URL}/pg/query`,
      { query: sql },
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY
      }
    );
    console.log('Status:', result2.status);
    console.log('Body:', result2.body.substring(0, 500));
  }
}

deploy().catch(console.error);
