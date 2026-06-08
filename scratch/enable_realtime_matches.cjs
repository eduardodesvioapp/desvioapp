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
  console.log('\n=== HABILITANDO REALTIME PARA A TABELA MATCHES ===\n');
  
  // No Supabase self-hosted ou gerenciado, podemos adicionar a tabela na publicação supabase_realtime.
  // Se ela já estiver, o comando pode falhar ou avisar, então fazemos de forma segura ou tratamos a resposta.
  const sql = `
    -- Adiciona matches na publicação se já não estiver
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
      ) THEN
        -- Verifica se a tabela matches já está na publicação
        IF NOT EXISTS (
          SELECT 1 
          FROM pg_publication_rel pr
          JOIN pg_class c ON c.oid = pr.prrelid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE pr.prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
            AND c.relname = 'matches'
            AND n.nspname = 'public'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
        END IF;
      END IF;
    END $$;
  `;

  await runSQL(sql, 'Habilitando replicação Realtime para public.matches');
}

main().catch(console.error);
