import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_SERVICE_ROLE_KEY não encontrados no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const userNames = [
  'Gabriel Silva', 'Lucas Oliveira', 'Matheus Santos', 'Pedro Costa', 'João Pereira',
  'Rafael Rocha', 'Leonardo Souza', 'Thiago Martins', 'Bruno Alves', 'Victor Ferreira',
  'Maria Eduarda', 'Ana Clara', 'Julia Mendonça', 'Beatriz Lima', 'Fernanda Gomes',
  'Amanda Ribeiro', 'Letícia Carvalho', 'Mariana Pires', 'Larissa Cavalcanti', 'Camila Xavier'
];

const womanBios = [
  'Amante de café e trilhas na natureza.', 'Curto um bom vinho e conversas profundas.', 'Dançar faz minha alma brilhar!',
  'Fotógrafa nas horas vagas, explorando cores.', 'Viciada em séries e maratonas de cinema.', 'Cozinhar é minha terapia favorita.',
  'Yoga e meditação são minha paz.', 'Viajar é minha maior paixão.', 'Arte e cultura me fascinam.',
  'Simplicidade e autenticidade acima de tudo.'
];

const manBios = [
  'Desenvolvedor durante o dia, gamer à noite.', 'Esporte é vida! Procuro alguém pra treinar.', 'Música e tecnologia são meu mundo.',
  'Apaixonado por café e boa conversa.', 'Explorando o mundo, um café por vez.', 'Curto rock, trilhas e cerveja artesanal.',
  'Fotógrafo nas horas vagas.', 'Leitor ávido e sonhador contumaz.', 'Gamer, nerd e orgulhoso disso.',
  'Simplicidade e transparência sempre.'
];

const cities = ['Porto Alegre', 'Canoas', 'Viamão', 'Gravataí', 'Alvorada', 'Novo Hamburgo', 'São Leopoldo', 'Guaíba', 'Cachoeirinha'];
const hairColors = ['Preto', 'Castanho', 'Loiro', 'Ruivo', 'Colorido', 'Grisalho'];
const eyesColors = ['Castanho', 'Azul', 'Verde', 'Preto', 'Mel'];
const skinColors = ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena'];
const weightOptions = ['Magro(a)', 'Normal', 'Gordo(a)'];
const searchOptions = ['Mulheres', 'Homens', 'Todos'];

async function generateMocks() {
  console.log('🚀 Iniciando geração de 20 usuários mock...');

  // 0. Buscar interesses disponíveis
  const { data: interests, error: intError } = await supabase.from('interests').select('id');
  if (intError) {
    console.error('Erro ao buscar interesses:', intError.message);
    return;
  }
  const interestIds = interests.map(i => i.id);

  for (let i = 0; i < userNames.length; i++) {
    const name = userNames[i];
    const email = name.toLowerCase().replace(/ /g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '@desvio.com';
    const password = 'Desv@6939';
    const gender = i < 10 ? 'Homem' : 'Mulher';

    console.log(`\n[${i+1}/20] Criando: ${email}...`);

    // 1. Criar usuário no Auth (via Admin API)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (authError) {
      console.error(`  ❌ Erro no Auth (${email}):`, authError.message);
      continue;
    }

    const userId = authData.user.id;
    console.log(`  ✅ Auth criado (ID: ${userId})`);

    // Definir foto baseada no gênero (RandomUser Portraits para garantir adultos)
    const genderPath = gender === 'Homem' ? 'men' : 'women';
    const photoIndex = i % 50; // Existem 100 fotos de cada no RandomUser
    const profileImageUrl = `https://randomuser.me/api/portraits/${genderPath}/${photoIndex}.jpg`;

    // 2. Criar/Atualizar perfil no Public (via Service Role)
    const { error: publicError } = await supabase.from('users').upsert({
      id: userId,
      name,
      email,
      gender,
      age: Math.floor(Math.random() * 38) + 18,
      bio: gender === 'Mulher' ? womanBios[i % womanBios.length] : manBios[i % manBios.length],
      city: cities[Math.floor(Math.random() * cities.length)],
      search_for: [searchOptions[Math.floor(Math.random() * searchOptions.length)]],
      latitude: -30.0346 + (Math.random() * 0.2 - 0.1),
      longitude: -51.2177 + (Math.random() * 0.2 - 0.1),
      hair_color: hairColors[Math.floor(Math.random() * hairColors.length)],
      eyes_color: eyesColors[Math.floor(Math.random() * eyesColors.length)],
      skin_color: skinColors[Math.floor(Math.random() * skinColors.length)],
      weight: weightOptions[Math.floor(Math.random() * weightOptions.length)],
      height: Math.floor(Math.random() * 40) + 150,
      profile_image_url: profileImageUrl,
      compatibility_embedding: new Array(384).fill(0).map(() => Math.random() * 2 - 1), // Mock embedding
      last_active: new Date().toISOString()
    });

    if (publicError) {
      console.error(`  ❌ Erro no Public (${email}):`, publicError.message);
    } else {
      console.log(`  ✅ Perfil público criado`);
      
      // 2.1 Criar configurações padrão
      await supabase.from('user_settings').upsert({
        user_id: userId,
        invisible_mode: false,
        show_distance: true
      });
      console.log(`  ✅ Configurações criadas`);
    }

    // 3. Adicionar interesses aleatórios
    if (interestIds.length > 0) {
      const numInt = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...interestIds].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, numInt);
      
      const interestRecords = selected.map(id => ({ user_id: userId, interest_id: id }));
      const { error: intInsertError } = await supabase.from('user_interests').insert(interestRecords);
      
      if (intInsertError) {
        console.error(`  ❌ Erro nos interesses:`, intInsertError.message);
      } else {
        console.log(`  ✅ ${numInt} interesses vinculados`);
      }
    }
  }

  console.log('\n✨ Geração concluída!');
}

generateMocks();
