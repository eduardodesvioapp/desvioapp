-- =========================================================
-- RENOMEAR TABELA PROFILES PARA USERS
-- =========================================================

ALTER TABLE profiles RENAME TO users;
ALTER INDEX idx_profiles_location RENAME TO idx_users_location;

-- Recriar políticas RLS (as originais não existiam)
DROP POLICY IF EXISTS "profiles are viewable" ON users;
DROP POLICY IF EXISTS "insert own profile" ON users;
DROP POLICY IF EXISTS "update own profile" ON users;

create policy "users are viewable" on users for select using (true);
create policy "insert own user" on users for insert with check (auth.uid() = id);
create policy "update own user" on users for update using (auth.uid() = id) with check (auth.uid() = id);

-- Atualizar função get_feed
create or replace function get_feed(p_user_id uuid)
returns table (
  id uuid,
  name text,
  age int,
  bio text,
  score numeric
)
language sql
as $$
  select
    u.id,
    u.name,
    u.age,
    u.bio,
    (
      coalesce(i.score, 0)
      + (random() * 5)
    ) as score
  from users u
  left join (
    select target_user_id, sum(weight) as score
    from interactions
    where user_id = p_user_id
    group by target_user_id
  ) i on i.target_user_id = u.id
  where u.id != p_user_id
  order by score desc
  limit 30;
$$;