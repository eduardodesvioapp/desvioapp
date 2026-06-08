# Guia de Limpeza e População de Usuários (Mocks)

Este documento contém os scripts necessários para resetar a base de usuários e popular com dados de teste para o projeto **Desvio**.

## ⚠️ AVISO IMPORTANTE
O Supabase protege o esquema `auth`. Deletar usuários diretamente via SQL na tabela `auth.users` é a forma mais eficaz de limpar tudo, mas certifique-se de que não há dados de produção ativos.

---

## 1. Script de Limpeza Total

Execute este comando no **SQL Editor** do Supabase para remover todos os registros de autenticação e perfis públicos (considerando que há um gatilho de sincronização ou chave estrangeira com `ON DELETE CASCADE`).

```sql
-- Inicia uma transação para segurança
BEGIN;

-- 1. Garantir que todas as colunas necessárias existam na tabela public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS age int;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS search_for text[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS latitude float8;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS longitude float8;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hair_color text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS eyes_color text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skin_color text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weight text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS height int;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active timestamptz DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;

-- 2. Limpeza total
-- Remove todos os usuários da autenticação
DELETE FROM auth.users;

-- Garante que a tabela pública esteja limpa
DELETE FROM public.users;

COMMIT;
```

---

## 2. Inserção de 20 Usuários Mock (RECOMENDADO - via Script JS)

Esta é a maneira mais confiável de criar usuários no Supabase, pois utiliza a API oficial de Admin para garantir que a autenticação e os perfis fiquem perfeitamente sincronizados.

### Pré-requisitos
Certifique-se de que o arquivo `.env.local` contém as chaves `VITE_SUPABASE_URL` e `VITE_SUPABASE_SERVICE_ROLE_KEY`.

### Como Executar
1. Instale a dependência necessária:
   ```bash
   npm install dotenv
   ```
2. Execute o script de geração:
   ```bash
   node scripts/generate_mocks.js
   ```

O script irá criar os usuários no Auth, atualizar os perfis no Public e vincular interesses aleatórios automaticamente.

---

## 3. Método Alternativo (via SQL Editor)

Use este método apenas se preferir não rodar scripts locais. Note que este método pode falhar dependendo da versão do seu servidor de autenticação Supabase.

**Senha padrão:** `Desv@6939`

```sql
DO $$
DECLARE
    user_id UUID;
    user_names TEXT[] := ARRAY[
        'Gabriel Silva', 'Lucas Oliveira', 'Matheus Santos', 'Pedro Costa', 'João Pereira',
        'Rafael Rocha', 'Leonardo Souza', 'Thiago Martins', 'Bruno Alves', 'Victor Ferreira',
        'Maria Eduarda', 'Ana Clara', 'Julia Mendonça', 'Beatriz Lima', 'Fernanda Gomes',
        'Amanda Ribeiro', 'Letícia Carvalho', 'Mariana Pires', 'Larissa Cavalcanti', 'Camila Xavier'
    ];
    user_emails TEXT[] := ARRAY[
        'gabriel_silva@desvio.com', 'lucas_oliveira@desvio.com', 'matheus_santos@desvio.com', 'pedro_costa@desvio.com', 'joao_pereira@desvio.com',
        'rafael_rocha@desvio.com', 'leonardo_souza@desvio.com', 'thiago_martins@desvio.com', 'bruno_alves@desvio.com', 'victor_ferreira@desvio.com',
        'maria_eduarda@desvio.com', 'ana_clara@desvio.com', 'julia_mendonca@desvio.com', 'beatriz_lima@desvio.com', 'fernanda_gomes@desvio.com',
        'amanda_ribeiro@desvio.com', 'leticia_carvalho@desvio.com', 'mariana_pires@desvio.com', 'larissa_cavalcanti@desvio.com', 'camila_xavier@desvio.com'
    ];
    user_genders TEXT[] := ARRAY[
        'Homem', 'Homem', 'Homem', 'Homem', 'Homem', 'Homem', 'Homem', 'Homem', 'Homem', 'Homem',
        'Mulher', 'Mulher', 'Mulher', 'Mulher', 'Mulher', 'Mulher', 'Mulher', 'Mulher', 'Mulher', 'Mulher'
    ];
    user_bios TEXT[] := ARRAY[
        'Gosto de trilhas, café e boas conversas.', 'Apaixonado por música, tecnologia e inovação.', 'Sempre em busca de novas aventuras e novos sabores.',
        'Desenvolvedor durante o dia, gamer durante a noite.', 'Amo ler, viajar e conhecer pessoas autênticas.', 'Esporte é vida! Procuro alguém para treinar junto.',
        'Cozinhar é minha terapia. Qual sua comida favorita?', 'Simplicidade e transparência acima de tudo.', 'Viciado em séries e maratonas de cinema.',
        'Explorando o mundo, um café por vez.', 'Amante da natureza e de finais de semana na praia.', 'Arte, cultura e um bom vinho.',
        'Dançar faz minha alma brilhar.', 'Buscando conexões reais em um mundo digital.', 'A vida é curta demais para não sorrir todos os dias.',
        'Yoga, meditação e paz de espírito.', 'Fotografia e viagens são minhas grandes paixões.', 'Curto um bom rock e festivais de música.',
        'Psicologia e comportamento humano me fascinam.', 'Moda, estética e design são meu mundo.'
    ];
    hair_colors TEXT[] := ARRAY['Preto', 'Castanho', 'Loiro', 'Ruivo', 'Colorido', 'Grisalho'];
    eyes_colors TEXT[] := ARRAY['Castanho', 'Azul', 'Verde', 'Preto', 'Mel'];
    skin_colors TEXT[] := ARRAY['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena'];
    weights TEXT[] := ARRAY['Magro(a)', 'Normal', 'Gordo(a)'];
    search_options TEXT[] := ARRAY['Mulheres', 'Homens', 'Todos'];
    cities TEXT[] := ARRAY['Porto Alegre', 'Canoas', 'Viamão', 'Gravataí', 'Alvorada', 'Novo Hamburgo', 'São Leopoldo', 'Guaíba', 'Cachoeirinha'];
    
    password_hash TEXT := crypt('Desv@6939', gen_salt('bf'));
    interest_ids UUID[];
    num_interests INT;
    chosen_interest UUID;
    chosen_city TEXT;
BEGIN
    -- 0. Obter IDs de interesses disponíveis
    SELECT array_agg(id) INTO interest_ids FROM public.interests;

    FOR i IN 1..20 LOOP
        user_id := gen_random_uuid();
        chosen_city := cities[floor(random() * array_length(cities, 1) + 1)::int];

        -- 1. Inserir no auth.users
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at, 
            raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
        )
        VALUES (
            user_id, '00000000-0000-0000-0000-000000000000', user_emails[i], password_hash, now(), 
            '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', user_names[i]), 
            'authenticated', 'authenticated', now(), now()
        );

        -- 2. Inserir no public.users (com localização em POA e cidades vizinhas)
        INSERT INTO public.users (
            id, name, age, bio, city, gender, search_for, 
            latitude, longitude, hair_color, eyes_color, skin_color, 
            weight, height, last_active, email, profile_image_url
        )
        VALUES (
            user_id, 
            user_names[i], 
            floor(random() * 38 + 18)::int, -- Idade entre 18 e 55
            user_bios[i], 
            chosen_city, 
            user_genders[i], 
            ARRAY[search_options[floor(random() * 3 + 1)::int]], -- Preferência aleatória
            -30.0346 + (random() * 0.2 - 0.1), -- Aumentando um pouco a dispersão para cidades vizinhas
            -51.2177 + (random() * 0.2 - 0.1), 
            hair_colors[floor(random() * 6 + 1)::int],
            eyes_colors[floor(random() * 5 + 1)::int],
            skin_colors[floor(random() * 5 + 1)::int],
            weights[floor(random() * 3 + 1)::int],
            floor(random() * 40 + 150)::int, -- Altura entre 150 e 190
            now(),
            user_emails[i],
            'https://i.pravatar.cc/600?u=' || user_emails[i] -- Imagem de perfil mockada
        )
        ON CONFLICT (id) DO NOTHING;

        -- 3. Atribuir de 1 a 3 interesses aleatórios
        IF array_length(interest_ids, 1) > 0 THEN
            num_interests := floor(random() * 3 + 1)::int;
            FOR j IN 1..num_interests LOOP
                chosen_interest := interest_ids[floor(random() * array_length(interest_ids, 1) + 1)::int];
                INSERT INTO public.user_interests (user_id, interest_id)
                VALUES (user_id, chosen_interest)
                ON CONFLICT DO NOTHING;
            END LOOP;
        END IF;

    END LOOP;
END $$;
```

---

## 3. Como usar via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com).
2. Vá em **SQL Editor** na barra lateral esquerda.
3. Clique em **New Query**.
4. Cole o conteúdo do item 1 para limpar ou do item 2 para popular.
5. Clique em **Run**.

---

## 🏗️ Sugestão: Script de Criação Real (JS)
Se você precisar que esses usuários consigam **fazer login**, use o script abaixo em uma função administrativa ou script Node local usando a `service_role_key`:

```javascript
// Exemplo usando Supabase Admin SDK
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('URL', 'SERVICE_ROLE_KEY');

async function createMocks() {
  const users = [
    { email: 'gabriel_silva@desvio.com', password: 'password123', name: 'Gabriel Silva' },
    // ... adicione os outros 19 aqui
  ];

  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      user_metadata: { full_name: user.name },
      email_confirm: true
    });
    if (error) console.error('Erro:', error.message);
    else console.log('Criado:', data.user.email);
  }
}
```
