const https = require('https');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const sql = `
-- 1. Criar ou substituir a função de cálculo do score
CREATE OR REPLACE FUNCTION public.calculate_profile_score()
RETURNS TRIGGER AS $$
DECLARE score INT := 0;
BEGIN
  -- Dados Básicos (Total: 40)
  IF NEW.name     IS NOT NULL AND NEW.name     != '' THEN score := score + 10; END IF;
  IF NEW.age      IS NOT NULL                         THEN score := score + 10; END IF;
  IF NEW.gender   IS NOT NULL AND NEW.gender   != '' THEN score := score + 10; END IF;
  IF NEW.city     IS NOT NULL AND NEW.city     != '' THEN score := score + 10; END IF;
  
  -- Biografia e Localização (Total: 30)
  IF NEW.bio      IS NOT NULL AND NEW.bio      != '' THEN score := score + 15; END IF;
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN score := score + 15; END IF;
  
  -- Mídia e Confiança (Total: 30)
  IF NEW.profile_image_url IS NOT NULL AND NEW.profile_image_url != '' THEN score := score + 15; END IF;
  IF NEW.verification_status = 'verified' THEN score := score + 15; END IF;
  
  NEW.profile_score := score;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar o trigger
DROP TRIGGER IF EXISTS tr_update_profile_score ON public.users;
CREATE TRIGGER tr_update_profile_score
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.calculate_profile_score();

-- 3. Forçar recálculo para todos os usuários
UPDATE public.users SET name = name;
`;

async function runSQL(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
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
          resolve({ success: true, data: JSON.parse(data) });
        } else {
          resolve({ success: false, status: res.statusCode, error: data });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log('Deploying trigger and function...');
  const res = await runSQL(sql);
  console.log('Result:', JSON.stringify(res, null, 2));
}

run();
