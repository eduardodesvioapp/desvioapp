
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Pega o project ref da URL do Supabase
// VITE_SUPABASE_URL = https://xyzxyz.supabase.co
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectRef = match ? match[1] : null;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!projectRef) {
  console.error('❌ Não foi possível extrair o project ref da URL:', supabaseUrl);
  process.exit(1);
}

const sql = fs.readFileSync(path.join(__dirname, '..', 'ai_liquidity_trigger.sql'), 'utf8');

const body = JSON.stringify({ query: sql });

const options = {
  hostname: `${projectRef}.supabase.co`,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${serviceKey}`,
    'apikey': serviceKey,
    'Content-Length': Buffer.byteLength(body)
  }
};

console.log(`\n=== DEPLOY via Management API (project: ${projectRef}) ===\n`);

// Try using the Supabase database REST directly for DDL
// Actually, Supabase REST API doesn't support DDL queries.
// We need to use the pg library directly.

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, serviceKey);

async function forceDeploy() {
  // Supabase JS client can't run DDL. We need to use the Management API.
  // Let me check if there's a SUPABASE_DB_URL in .env
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (dbUrl) {
    console.log('✅ Database URL encontrada, conectando diretamente via pg...');
    // Use pg to run the SQL
    const { Client } = require('pg');
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    try {
      await client.query(sql);
      console.log('✅ Deploy bem-sucedido!');
    } catch (err) {
      console.error('❌ Erro no deploy:', err.message);
    } finally {
      await client.end();
    }
  } else {
    console.log('⚠️  Sem DATABASE_URL no .env.local');
    console.log('\nAs variáveis disponíveis são:');
    Object.keys(process.env).filter(k => k.includes('SUPA') || k.includes('VITE')).forEach(k => {
      console.log(`  ${k} = ${process.env[k]?.substring(0, 40)}...`);
    });
    console.log('\n📋 SOLUÇÃO MANUAL:');
    console.log('Execute o arquivo ai_liquidity_trigger.sql no SQL Editor do Supabase.');
    console.log(`URL: ${supabaseUrl.replace('.supabase.co', '.supabase.com/project/${projectRef}/sql')}`);
  }
}

forceDeploy();
