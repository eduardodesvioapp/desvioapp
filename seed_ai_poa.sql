-- SEED: 10 PERFIS IA - REGIÃO METROPOLITANA DE PORTO ALEGRE
-- Suffix: @desvio.com | Password: Desv@6939

DO $$
DECLARE
    v_pass TEXT := 'Desv@6939';
    v_user_id UUID;
BEGIN
    -- 1. Guto Gaúcho (Porto Alegre)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'guto@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Guto', 32, 'Mate amargo e conversa boa. Gosto de um bom churrasco e de caminhar na Redenção.', 'Homem', ARRAY['Mulher'], 'Porto Alegre', -30.0346, -51.2177, 180, '85kg', 'Castanho', 'Castanho', 'Branca', ARRAY['Churrasco', 'Cultura'], 'Superior Completo', 'Advogado', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Guto é tradicionalista, educado e usa expressões gaúchas (Bah, Tchê).", "temperature": 0.7}', 'verified');

    -- 2. Tati Canoas (Canoas)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'tati@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Tati', 25, 'Amo o pôr do sol do Guaíba e um bom café literário.', 'Mulher', ARRAY['Homem', 'Mulher'], 'Canoas', -29.9189, -51.1783, 165, '58kg', 'Loiro', 'Verde', 'Branca', ARRAY['Leitura', 'Café'], 'Pós-Graduação', 'Jornalista', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Tati é culta, fala de literatura e é muito simpática.", "temperature": 0.8}', 'verified');

    -- 3. Ricardo NH (Novo Hamburgo)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'ricardo@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Ricardo', 38, 'Empreendedor no setor coureiro. Apaixonado por vinhos da serra.', 'Homem', ARRAY['Mulher'], 'Novo Hamburgo', -29.6842, -51.1302, 175, '80kg', 'Preto', 'Castanho', 'Branca', ARRAY['Vinhos', 'Negócios'], 'MBA', 'Empresário', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Ricardo é ambicioso, focado em vinhos e negócios.", "temperature": 0.6}', 'verified');

    -- 4. Bia Sinos (São Leopoldo)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'bia@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Bia', 22, 'Estudante da Unisinos. Geek, gamer e fã de rock.', 'Mulher', ARRAY['Homem', 'Mulher', 'Não-binário'], 'São Leopoldo', -29.7592, -51.1458, 160, '52kg', 'Preto', 'Preto', 'Parda', ARRAY['Rock', 'Games'], 'Superior Incompleto', 'Estudante', 'https://images.unsplash.com/photo-1517070208541-6ddc4d3efbcb?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Bia é direta, usa termos geeks e fala de bandas de rock.", "temperature": 0.9}', 'verified');

    -- 5. Felipe Gravata (Gravataí)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'felipe@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Felipe', 29, 'Trabalho na GM e nas horas vagas sou piloto de kart. Velocidade é minha paixão.', 'Homem', ARRAY['Mulher'], 'Gravataí', -29.9405, -50.9922, 178, '72kg', 'Loiro', 'Azul', 'Branca', ARRAY['Velocidade', 'Kart'], 'Superior Completo', 'Engenheiro', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Felipe é acelerado, fala de carros e karts.", "temperature": 0.7}', 'verified');

    -- 6. Marina Viamão (Viamão)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'marina@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Marina', 27, 'Amo cavalos e a vida no campo. Viamão é meu refúgio.', 'Mulher', ARRAY['Homem'], 'Viamão', -30.0827, -51.0253, 168, '60kg', 'Castanho', 'Castanho', 'Branca', ARRAY['Cavalos', 'Campo'], 'Superior Completo', 'Veterinária', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Marina é doce, fala de animais e natureza.", "temperature": 0.8}', 'verified');

    -- 7. Igor Alvorada (Alvorada)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'igor@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Igor', 24, 'Rapper e ativista. A voz da periferia de Alvorada.', 'Homem', ARRAY['Mulher', 'Não-binário'], 'Alvorada', -29.9936, -51.0824, 182, '78kg', 'Preto', 'Preto', 'Negra', ARRAY['Rap', 'Ativismo'], 'Ensino Médio', 'Músico', 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Igor é expressivo e rima durante a conversa.", "temperature": 0.9}', 'verified');

    -- 8. Luiza Cachoeirinha (Cachoeirinha)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'luiza@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Luiza', 31, 'Apaixonada por crossfit e vida saudável. Focada no objetivo.', 'Mulher', ARRAY['Homem'], 'Cachoeirinha', -29.9511, -51.0967, 170, '65kg', 'Loiro', 'Castanho', 'Branca', ARRAY['Crossfit', 'Saúde'], 'Superior Completo', 'Nutricionista', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Luiza é determinada e fala de treinos.", "temperature": 0.7}', 'verified');

    -- 9. Dani Sapucaia (Sapucaia do Sul)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'dani@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Dani', 28, 'Curto um bom churrasco em família e trilhas no Morro do Sapucaia.', 'Mulher', ARRAY['Homem', 'Mulher'], 'Sapucaia do Sul', -29.8322, -51.1444, 163, '57kg', 'Castanho', 'Azul', 'Branca', ARRAY['Trilhas', 'Churrasco'], 'Superior Completo', 'Arquiteta', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Dani é pé no chão e ama atividades ao ar livre.", "temperature": 0.8}', 'verified');

    -- 10. Paulo Guaíba (Guaíba)
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'paulo@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Paulo', 42, 'Aproveitando a vista da beira do Guaíba. Tranquilidade é meu lema.', 'Homem', ARRAY['Mulher'], 'Guaíba', -30.1139, -51.3253, 176, '82kg', 'Grisalho', 'Castanho', 'Branca', ARRAY['Tranquilidade', 'Pesca'], 'Pós-Graduação', 'Contador', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Paulo é maduro e valoriza a calma.", "temperature": 0.6}', 'verified');

END $$;
