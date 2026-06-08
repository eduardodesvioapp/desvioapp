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

async function main() {
  console.log('\n=== REMOVENDO CHAVE DO GEMINI DO BANCO ===\n');
  const sql = "DELETE FROM public.secrets WHERE key_name = 'GEMINI_API_KEY';";
  await runSQL(sql, 'Deletando GEMINI_API_KEY de public.secrets');
}

main().catch(console.error);
