
/**
 * Deploy via Supabase self-hosted admin API
 * Endpoint: POST /pg/query (disponível no Kong gateway do Supabase)
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL; // https://services-supa-desvio.2unk5k.easypanel.host
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const sqlFile = path.join(__dirname, '..', 'ai_liquidity_trigger.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// Supabase self-hosted exposes a pg REST endpoint at /rest/v1/
// We can use a stored procedure workaround or the query endpoint

async function makeRequest(urlStr, body, headers) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const protocol = url.protocol === 'https:' ? https : http;
    const bodyStr = JSON.stringify(body);
    
    const req = protocol.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(bodyStr) }
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
  const baseHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'apikey': SERVICE_KEY
  };

  // Try the Supabase query endpoint
  const endpoints = [
    `${SUPABASE_URL}/rest/v1/rpc/query`,
    `${SUPABASE_URL}/pg`,
    `${SUPABASE_URL}/api/pg`,
  ];

  console.log(`\n=== DEPLOY ai_liquidity_trigger.sql ===`);
  console.log(`Host: ${SUPABASE_URL}\n`);

  for (const endpoint of endpoints) {
    try {
      console.log(`Tentando: ${endpoint}`);
      const result = await makeRequest(endpoint, { query: sql }, baseHeaders);
      console.log(`  Status: ${result.status}`);
      if (result.status < 300) {
        console.log('✅ Deploy bem-sucedido!');
        return;
      }
      console.log(`  Resposta: ${result.body.substring(0, 200)}`);
    } catch (e) {
      console.log(`  Erro de conexão: ${e.message}`);
    }
  }
  
  console.log('\n⚠️  Não foi possível executar SQL remotamente.');
  console.log('\n📋 COPIE E COLE ESTE SQL no Supabase SQL Editor:\n');
  console.log('------- INÍCIO DO SQL -------');
  console.log(sql.substring(0, 300) + '...');
  console.log('------- FIM -------');
  console.log(`\nURL do SQL Editor: ${SUPABASE_URL.replace('services-supa-desvio.', 'studio.')}/sql/new`);
}

deploy();
