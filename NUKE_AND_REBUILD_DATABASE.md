# ☢️ RESET TOTAL E RECONSTRUÇÃO DO BANCO DE DADOS

Este documento contém o procedimento seguro para deletar tudo e recriar o banco de dados do zero.

## ⚠️ AVISO: NÃO USE SQL PARA CRIAR USUÁRIOS
O erro **500 (Internal Server Error)** que você viu acontece porque o Supabase não aceita inserção manual via SQL na tabela `auth.users`. **Siga os passos abaixo na ordem correta.**

---

## 🛠️ Passo a Passo

### 1. Limpeza do Auth (Painel Supabase)
Para evitar conflitos de e-mail, você deve limpar os usuários antigos:
1. No painel do Supabase, vá em **Authentication** > **Users**.
2. Selecione todos e delete.

### 2. Execução do Script de Estrutura (SQL Editor)
Copie e rode este script no seu **SQL Editor**. Ele vai limpar e recriar as tabelas e funções:

```sql
-- =========================================================
-- 1. LIMPEZA TOTAL (AUTH + PUBLIC)
-- =========================================================
DELETE FROM auth.users; -- Limpa todos os logins antigos

DO $$ 
DECLARE r RECORD;
BEGIN
    -- Remove Triggers
    FOR r IN (SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public') LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON ' || quote_ident(r.event_object_table);
    END LOOP;
    -- Remove Funções (Exceto extensões)
    FOR r IN (SELECT proname, oidvectortypes(proargtypes) as params FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e' WHERE n.nspname = 'public' AND d.objid IS NULL) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.params || ') CASCADE';
    END LOOP;
    -- Remove Tabelas
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- =========================================================
-- 2. RECRIAÇÃO DO SCHEMA COMPLETO
-- =========================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text, age int, bio text, gender text, search_for text[], 
  latitude numeric, longitude numeric, travel_mode boolean default false, 
  last_active timestamp with time zone default now(), city text, profile_score int default 0, 
  email text, height int, weight text, hair_color text, eyes_color text, 
  skin_color text, lifestyle text[], education text, occupation text, profile_image_url text,
  compatibility_embedding vector(384)
);

create table user_settings (
  user_id uuid primary key references users(id) on delete cascade,
  invisible_mode boolean default false,
  show_distance boolean default true,
  push_notifications boolean default true,
  created_at timestamp with time zone default now()
);

create table user_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  url text not null,
  is_profile boolean default false,
  is_private boolean default false,
  created_at timestamp with time zone default now()
);

create table interests (id uuid primary key default gen_random_uuid(), name text unique not null);
insert into interests (name) values ('Namoro'), ('Casual'), ('Amizade'), ('Relacionamento sério'), ('Conversas'), ('Outros');

create table user_interests (
  user_id uuid references users(id) on delete cascade,
  interest_id uuid references interests(id) on delete cascade,
  primary key (user_id, interest_id)
);

create table likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  liked_user_id uuid not null references users(id) on delete cascade,
  status text default 'pending', is_read boolean default false, created_at timestamp with time zone default now(),
  unique (user_id, liked_user_id)
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid references users(id) on delete cascade,
  user2_id uuid references users(id) on delete cascade,
  requester_id uuid references users(id) on delete cascade,
  status text default 'accepted', is_read boolean default false, created_at timestamp with time zone default now(),
  unique (user1_id, user2_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  sender_id uuid references users(id) on delete cascade,
  receiver_id uuid references users(id) on delete cascade,
  content text, is_read boolean default false, created_at timestamp with time zone default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text not null, title text not null, content text, link text, is_read boolean default false, created_at timestamp with time zone default now()
);

create table profile_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid references users(id) on delete cascade,
  visited_id uuid references users(id) on delete cascade,
  is_read boolean default false,
  last_visit_at timestamp with time zone default now(),
  unique(visitor_id, visited_id)
);

create table gallery_access_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references users(id) on delete cascade,
  owner_id uuid references users(id) on delete cascade,
  status text default 'pending', -- 'pending', 'approved', 'rejected', 'blocked'
  created_at timestamp with time zone default now(),
  unique(requester_id, owner_id)
);

-- RLS
alter table users enable row level security;
alter table user_settings enable row level security;
alter table user_media enable row level security;
alter table likes enable row level security;
alter table matches enable row level security;
alter table notifications enable row level security;
alter table profile_visits enable row level security;
alter table gallery_access_requests enable row level security;
alter table messages enable row level security;

create policy "public_view" on users for select using (true);
create policy "own_profile" on users for all using (auth.uid() = id);
create policy "own_settings" on user_settings for all using (auth.uid() = user_id);
create policy "own_media" on user_media for all using (auth.uid() = user_id);
create policy "view_media_permitted" on user_media for select using (
  is_private = false OR 
  auth.uid() = user_id OR 
  exists (
    select 1 from gallery_access_requests 
    where requester_id = auth.uid() and owner_id = user_media.user_id and status = 'approved'
  )
);
create policy "own_likes" on likes for all using (auth.uid() = user_id or auth.uid() = liked_user_id);
create policy "own_matches" on matches for all using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "own_notifications" on notifications for all using (auth.uid() = user_id);
create policy "own_profile_visits" on profile_visits for all using (auth.uid() = visitor_id or auth.uid() = visited_id);
create policy "own_gallery_access_requests" on gallery_access_requests for all using (auth.uid() = requester_id or auth.uid() = owner_id);
create policy "own_messages" on messages for all using (
  exists (
    select 1 from matches 
    where matches.id = messages.match_id 
    and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid())
  )
);

-- Gatilhos Automáticos
CREATE OR REPLACE FUNCTION public.handle_new_match_notification()
RETURNS TRIGGER AS $$
DECLARE u1_name text; u2_name text;
BEGIN
  SELECT name INTO u1_name FROM public.users WHERE id = NEW.user1_id;
  SELECT name INTO u2_name FROM public.users WHERE id = NEW.user2_id;
  INSERT INTO public.notifications (user_id, type, title, content, link)
  VALUES (NEW.user1_id, 'match', 'Novo Match!', 'Você deu match com ' || u2_name, '/user/' || NEW.user2_id);
  INSERT INTO public.notifications (user_id, type, title, content, link)
  VALUES (NEW.user2_id, 'match', 'Novo Match!', 'Você deu match com ' || u1_name, '/user/' || NEW.user1_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_new_match_notification AFTER INSERT ON public.matches FOR EACH ROW EXECUTE FUNCTION public.handle_new_match_notification();

CREATE OR REPLACE FUNCTION public.handle_like_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    INSERT INTO public.matches (user1_id, user2_id, requester_id)
    VALUES (LEAST(NEW.user_id, NEW.liked_user_id), GREATEST(NEW.user_id, NEW.liked_user_id), NEW.user_id)
    ON CONFLICT DO NOTHING;
  END IF; RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_like_match AFTER UPDATE OF status ON public.likes FOR EACH ROW EXECUTE FUNCTION public.handle_like_status_change();

-- Gatilho para Notificação de Solicitação de Galeria
CREATE OR REPLACE FUNCTION public.handle_gallery_access_notification()
RETURNS TRIGGER AS $$
DECLARE requester_name text;
BEGIN
  SELECT name INTO requester_name FROM public.users WHERE id = NEW.requester_id;
  INSERT INTO public.notifications (user_id, type, title, content, link)
  VALUES (NEW.owner_id, 'gallery_request', 'Acesso à Galeria', requester_name || ' solicitou acesso à sua galeria privada.', '/user/' || NEW.owner_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_gallery_access_notification AFTER INSERT ON public.gallery_access_requests FOR EACH ROW EXECUTE FUNCTION public.handle_gallery_access_notification();

-- Gatilho para Notificação de Aprovação de Galeria
CREATE OR REPLACE FUNCTION public.handle_gallery_approval_notification()
RETURNS TRIGGER AS $$
DECLARE owner_name text;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    SELECT name INTO owner_name FROM public.users WHERE id = NEW.owner_id;
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (NEW.requester_id, 'gallery_approved', 'Acesso Concedido', owner_name || ' aprovou seu acesso à galeria privada.', '/user/' || NEW.owner_id);
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_gallery_approval_notification AFTER UPDATE OF status ON public.gallery_access_requests FOR EACH ROW EXECUTE FUNCTION public.handle_gallery_approval_notification();

-- =========================================================
-- 3. FUNÇÕES DE BUSCA E GEOLOCALIZAÇÃO
-- =========================================================

-- Função para calcular distância entre dois pontos (Haversine)
CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric AS $$
DECLARE
    dist numeric;
BEGIN
    -- Proteção contra erro de precisão no acos
    dist := 6371 * acos(
        LEAST(1.0, GREATEST(-1.0, 
            cos(radians(lat1)) * cos(radians(lat2)) * 
            cos(radians(lon2) - radians(lon1)) + 
            sin(radians(lat1)) * sin(radians(lat2))
        ))
    );
    RETURN dist;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para obter distância segura respeitando privacidade
CREATE OR REPLACE FUNCTION public.get_safe_distance(target_user_id uuid)
RETURNS numeric AS $$
DECLARE
    v_my_lat numeric; v_my_lon numeric;
    v_target_lat numeric; v_target_lon numeric;
    v_show_distance boolean;
BEGIN
    SELECT show_distance INTO v_show_distance FROM public.user_settings WHERE user_id = target_user_id;
    IF v_show_distance = false THEN RETURN NULL; END IF;

    SELECT latitude, longitude INTO v_my_lat, v_my_lon FROM public.users WHERE id = auth.uid();
    SELECT latitude, longitude INTO v_target_lat, v_target_lon FROM public.users WHERE id = target_user_id;

    IF v_my_lat IS NULL OR v_my_lon IS NULL OR v_target_lat IS NULL OR v_target_lon IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN public.calculate_distance(v_my_lat, v_my_lon, v_target_lat, v_target_lon);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função principal de busca segura
CREATE OR REPLACE FUNCTION public.search_users_safe(
    p_user_id uuid,
    p_min_age int,
    p_max_age int,
    p_max_dist numeric
)
RETURNS TABLE (
    id uuid,
    name text,
    age int,
    gender text,
    profile_image_url text,
    bio text,
    height int,
    eyes_color text,
    hair_color text,
    km_away numeric,
    last_active timestamptz,
    compatibility int
) AS $$
#variable_conflict use_column
DECLARE
    v_lat numeric;
    v_lon numeric;
BEGIN
    -- Pega localização do usuário que está buscando
    SELECT latitude, longitude INTO v_lat, v_lon FROM public.users WHERE id = p_user_id;

    RETURN QUERY
    SELECT 
        u.id, 
        u.name, 
        u.age, 
        u.gender, 
        u.profile_image_url, 
        u.bio, 
        u.height, 
        u.eyes_color, 
        u.hair_color,
        CASE 
            WHEN v_lat IS NULL OR v_lon IS NULL OR u.latitude IS NULL OR u.longitude IS NULL THEN 0
            ELSE calculate_distance(v_lat, v_lon, u.latitude, u.longitude)
        END as km_away,
        u.last_active,
        COALESCE(
          (
            SELECT 
              LEAST(99, 60 + (count(ui1.interest_id) * 10))::int
            FROM public.user_interests ui1
            JOIN public.user_interests ui2 ON ui1.interest_id = ui2.interest_id
            WHERE ui1.user_id = p_user_id AND ui2.user_id = u.id
          ),
          (40 + (u.profile_score / 4))::int
        ) as compatibility
    FROM public.users u
    WHERE u.id != p_user_id
      AND u.age BETWEEN p_min_age AND p_max_age
      AND (
          v_lat IS NULL OR v_lon IS NULL OR u.latitude IS NULL OR u.longitude IS NULL
          OR calculate_distance(v_lat, v_lon, u.latitude, u.longitude) <= p_max_dist
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se um usuário possui fotos na galeria privada
CREATE OR REPLACE FUNCTION public.check_user_has_private_gallery(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  has_private boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_media 
    WHERE user_id = p_user_id 
      AND is_private = true
  ) INTO has_private;
  
  RETURN has_private;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função Inteligente de Like (Ultra-Robusta)
CREATE OR REPLACE FUNCTION public.handle_like(p_target_user_id uuid)
RETURNS text AS $$
DECLARE
    v_my_id uuid;
    v_existing_like public.likes;
BEGIN
    v_my_id := auth.uid();

    -- 1. Tenta encontrar QUALQUER registro de interação entre esses dois usuários
    SELECT * INTO v_existing_like 
    FROM public.likes 
    WHERE (user_id = v_my_id AND liked_user_id = p_target_user_id)
       OR (user_id = p_target_user_id AND liked_user_id = v_my_id)
    LIMIT 1;

    IF v_existing_like.id IS NOT NULL THEN
        -- Já existe uma interação!
        
        IF v_existing_like.user_id = v_my_id THEN
            -- Eu já tinha dado like nela. Não fazemos nada ou confirmamos o 'liked'.
            RETURN 'liked';
        ELSE
            -- Ela já tinha me dado like! Isso é um MATCH.
            UPDATE public.likes 
            SET status = 'accepted' 
            WHERE id = v_existing_like.id;
            RETURN 'match';
        END IF;
    ELSE
        -- Nenhuma interação prévia. Criamos o like inicial.
        INSERT INTO public.likes (user_id, liked_user_id, status)
        VALUES (v_my_id, p_target_user_id, 'pending');
        RETURN 'liked';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- 4. CONFIGURAÇÃO DE STORAGE (BUCKETS + RLS)
-- =========================================================

-- Criar buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS no storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas para evitar erro de duplicata
DROP POLICY IF EXISTS "Upload_Media_Proprio" ON storage.objects;
DROP POLICY IF EXISTS "Manage_Media_Proprio" ON storage.objects;
DROP POLICY IF EXISTS "View_Media_Publico" ON storage.objects;
DROP POLICY IF EXISTS "Upload_Avatar_Proprio" ON storage.objects;
DROP POLICY IF EXISTS "Manage_Avatar_Proprio" ON storage.objects;
DROP POLICY IF EXISTS "View_Avatar_Publico" ON storage.objects;

-- Políticas para o bucket 'media'
CREATE POLICY "Upload_Media_Proprio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Manage_Media_Proprio" ON storage.objects FOR ALL USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "View_Media_Publico" ON storage.objects FOR SELECT USING (bucket_id = 'media');

-- Políticas para o bucket 'avatars'
CREATE POLICY "Upload_Avatar_Proprio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Manage_Avatar_Proprio" ON storage.objects FOR ALL USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "View_Avatar_Publico" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
```

### 3. Criação dos Usuários (Terminal/Node.js)
Agora que o banco está pronto, crie os 20 usuários mockados de forma segura rodando este comando no terminal da pasta do seu projeto:

```bash
node scripts/generate_mocks.js
```

---

## 🏁 Resultado Esperado
1. O SQL vai zerar e recriar o schema perfeitamente.
2. O script Node vai criar os usuários no **Auth** (permitindo login) e no **Public** (preenchendo os perfis).
3. Você poderá logar com qualquer e-mail (ex: `gabriel_silva@desvio.com`) usando a senha `Desv@6939`.
