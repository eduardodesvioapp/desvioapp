import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// Agora usando a Service Role Key
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_SERVICE_ROLE_KEY in environment variables.');
  console.error('Please add your Service Role Key to your .env.local file and re-run.');
  process.exit(1);
}

// Inicializa o client de admin
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const MOCK_PASSWORD = 'Desv@6939';
const MOCK_EMAIL_SUFFIX = '@desvio.com';
const TOTAL_USERS = 50;

const CITIES = [
  'Canoas', 'Novo Hamburgo', 'São Leopoldo', 'Viamão',
  'Alvorada', 'Cachoeirinha', 'Gravataí', 'Esteio', 'Sapucaia do Sul'
];

const MALE_NAMES = ['João', 'Pedro', 'Lucas', 'Mateus', 'Guilherme', 'Gabriel', 'Rafael', 'Felipe', 'Thiago', 'Marcelo', 'Bruno', 'Caio'];
const FEMALE_NAMES = ['Maria', 'Ana', 'Julia', 'Beatriz', 'Mariana', 'Larissa', 'Camila', 'Letícia', 'Fernanda', 'Amanda', 'Laura', 'Isabela'];
const BIOS = [
  'Adoro viajar e conhecer lugares novos.',
  'Procurando alguém para tomar um café.',
  'Amante de cachorros e natureza.',
  'Gosto de ficar em casa assistindo séries.',
  'Sempre pronto para uma aventura.',
  'Apaixonado por música e arte.',
  'Buscando novas amizades e quem sabe algo mais.',
  'Curto sair para jantar e conversar.',
  'Fitness e vida saudável.',
  'Gamer nas horas vagas.'
];
const LIFESTYLES = ['Ativo', 'Sedentário', 'Fitness', 'Festeiro', 'Caseiro'];
const EDUCATION = ['Ensino Médio', 'Graduação', 'Pós-graduação', 'Mestrado', 'Doutorado'];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomCoordinates() {
  // Porto Alegre region approx: Lat: -30.1 to -29.6, Lng: -51.3 to -50.9
  const lat = -30.1 + Math.random() * 0.5;
  const lng = -51.3 + Math.random() * 0.4;
  return { lat, lng };
}

async function createMockUsers() {
  console.log(`Starting creation of ${TOTAL_USERS} mock users using Admin API...`);
  let successCount = 0;

  for (let i = 1; i <= TOTAL_USERS; i++) {
    const isMale = Math.random() > 0.5;
    const gender = isMale ? 'Homem' : 'Mulher';
    const searchFor = isMale ? ['Mulher'] : ['Homem'];
    const name = getRandomItem(isMale ? MALE_NAMES : FEMALE_NAMES) + ' ' + crypto.randomBytes(2).toString('hex');
    const email = `mock_${i}_${crypto.randomBytes(3).toString('hex')}${MOCK_EMAIL_SUFFIX}`;
    const age = getRandomInt(18, 50);
    const city = getRandomItem(CITIES);
    const { lat, lng } = getRandomCoordinates();
    const profileImageUrl = isMale
      ? `https://randomuser.me/api/portraits/men/${getRandomInt(1, 99)}.jpg`
      : `https://randomuser.me/api/portraits/women/${getRandomInt(1, 99)}.jpg`;

    console.log(`[${i}/${TOTAL_USERS}] Creating admin user: ${email}`);

    try {
      // 1. Sign up as admin (Bypasses email confirm & limits)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: MOCK_PASSWORD,
        email_confirm: true, // Já cria confirmado
      });

      if (authError) {
        console.error(`  Auth Error for ${email}:`, authError.message);
        continue;
      }

      if (!authData.user) {
        console.error(`  No user returned for ${email}`);
        continue;
      }

      const userId = authData.user.id;

      // 2. Insert into profiles (Admin bypasses RLS)
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          name,
          age,
          bio: getRandomItem(BIOS),
          gender,
          search_for: searchFor,
          latitude: lat,
          longitude: lng,
          city,
          height: getRandomInt(150, 190),
          lifestyle: [getRandomItem(LIFESTYLES)],
          education: getRandomItem(EDUCATION),
          profile_image_url: profileImageUrl
        });

      if (profileError) {
        console.error(`  Profile Error for ${email}:`, profileError.message);
      } else {
        // 3. Insert into media (Admin bypasses RLS)
        await supabaseAdmin.from('user_media').insert({
          user_id: userId,
          url: profileImageUrl,
          is_profile: true,
          is_private: false
        });
        
        console.log(`  Success: ${name} (${city}) created.`);
        successCount++;
      }
      
      // Sleep slightly so we don't spam the DB in a tight loop
      await new Promise(res => setTimeout(res, 200));
      
    } catch (err) {
      console.error(`  Unexpected error for ${email}:`, err);
    }
  }

  console.log(`\nFinished! Successfully created ${successCount}/${TOTAL_USERS} users.`);
}

createMockUsers();
