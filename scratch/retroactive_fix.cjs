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
  console.log('\n=== EXECUÇÃO: Correção Retroativa de Mensagens Sem Receiver ===\n');
  
  const sql = `
    -- 1. Popula o receiver_id de mensagens anteriores onde ele é nulo
    UPDATE public.messages m
    SET receiver_id = (
        SELECT 
            CASE 
                WHEN user1_id = m.sender_id THEN user2_id 
                ELSE user1_id 
            END
        FROM public.matches
        WHERE id = m.match_id
    )
    WHERE receiver_id IS NULL;

    -- 2. Coloca na fila de chat as mensagens cujo destinatário é IA e que ainda não foram respondidas
    INSERT INTO public.ai_chat_queue (message_id, match_id)
    SELECT m.id, m.match_id
    FROM public.messages m
    JOIN public.users u ON u.id = m.receiver_id
    WHERE u.is_human = FALSE
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_chat_queue q WHERE q.message_id = m.id
      )
      AND NOT EXISTS (
          SELECT 1 FROM public.messages r 
          WHERE r.match_id = m.match_id 
            AND r.sender_id = m.receiver_id 
            AND r.created_at > m.created_at
      );
  `;

  await runSQL(sql, 'Executando correção retroativa e enfileiramento');
}

main().catch(console.error);
