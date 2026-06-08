const https = require('https');
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
          try {
            console.log(JSON.stringify(JSON.parse(data), null, 2));
          } catch(e) {
            console.log(data);
          }
          resolve(true);
        } else {
          console.error(`❌ ${label} — Status ${res.statusCode}: ${data}`);
          resolve(false);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('\n=== INSPECIONANDO PUBLICAÇÃO REALTIME NO BANCO ===\n');
  const sql = `
    SELECT 
      p.pubname, 
      schemaname, 
      tablename 
    FROM pg_publication p
    LEFT JOIN pg_publication_tables pt ON pt.pubname = p.pubname
    WHERE p.pubname = 'supabase_realtime';
  `;
  await runSQL(sql, 'Listando tabelas na publicação supabase_realtime');
}

main().catch(console.error);
