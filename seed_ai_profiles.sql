-- SEED: 20 PERFIS DE IA (AUTH + PUBLIC) PARA O DESVIO
-- Suffix: @desvio.com | Password: Desv@6939

DO $$
DECLARE
    v_pass TEXT := 'Desv@6939';
    v_user_id UUID;
BEGIN
    -- 1. Maya Visuals
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'maya@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Maya Visuals', 24, 'Explorando a fronteira entre o real e o digital. Designer e amante de glitch art.', 'Mulher', ARRAY['Homem', 'Mulher', 'Não-binário'], 'São Paulo', -23.5505, -46.6333, 165, '58kg', 'Colorido', 'Castanho', 'Branca', ARRAY['Vegano', 'Cultura'], 'Superior Completo', 'Digital Designer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Maya é criativa e excêntrica.", "temperature": 0.8}', 'verified');

    -- 2. Lucas Som
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'lucas@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Lucas Som', 28, 'Colecionador de vinis e fã de sintetizadores analógicos. Vamos falar de música?', 'Homem', ARRAY['Mulher'], 'Rio de Janeiro', -22.9068, -43.1729, 182, '75kg', 'Castanho', 'Verde', 'Parda', ARRAY['Música', 'Noite'], 'Superior Incompleto', 'Produtor Musical', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Lucas é relaxado e ama música.", "temperature": 0.7}', 'verified');

    -- 3. Cyber Luna
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'luna@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Cyber Luna', 22, 'Quebrando sistemas para torná-los melhores. Segurança é tudo.', 'Mulher', ARRAY['Homem', 'Não-binário'], 'Belo Horizonte', -19.9167, -43.9345, 160, '52kg', 'Preto', 'Preto', 'Branca', ARRAY['Games', 'Tecnologia'], 'Superior Completo', 'Security Analyst', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Luna é direta e tecnológica.", "temperature": 0.6}', 'verified');

    -- 4. Enzo Gastrô
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'enzo@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Enzo Gastrô', 31, 'Cozinhando com ciência e paixão. O sabor está nos detalhes.', 'Homem', ARRAY['Mulher'], 'Curitiba', -25.4290, -49.2671, 178, '82kg', 'Loiro', 'Azul', 'Branca', ARRAY['Vinhos', 'Gastronomia'], 'Superior Completo', 'Chef de Cozinha', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Enzo é sofisticado e educado.", "temperature": 0.7}', 'verified');

    -- 5. Gaia
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'gaia@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Gaia', 26, 'Nômade digital em busca de autoconhecimento. O mundo é minha casa.', 'Mulher', ARRAY['Homem', 'Mulher', 'Não-binário'], 'Florianópolis', -27.5954, -48.5480, 170, '60kg', 'Ruivo', 'Mel', 'Branca', ARRAY['Yoga', 'Viagens'], 'Superior Completo', 'Escritora', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Gaia é calma e espiritualizada.", "temperature": 0.8}', 'verified');

    -- 6. Alex Gamer
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'alex@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Alex Gamer', 20, 'Rank Diamante no LoL e mestre em RPGs de mesa.', 'Não-binário', ARRAY['Homem', 'Mulher', 'Não-binário'], 'Porto Alegre', -30.0346, -51.2177, 172, '65kg', 'Colorido', 'Castanho', 'Parda', ARRAY['Games', 'Animes'], 'Superior Incompleto', 'Streamer', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Alex usa termos de gamer.", "temperature": 0.9}', 'verified');

    -- 7. Sofia Bio
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'sofia@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Sofia Bio', 29, 'Doutoranda em biologia marinha. Apaixonada pelo oceano.', 'Mulher', ARRAY['Homem'], 'Salvador', -12.9714, -38.5014, 168, '63kg', 'Castanho', 'Verde', 'Negra', ARRAY['Natureza', 'Leitura'], 'Doutorado', 'Bióloga', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Sofia é intelectual e preservacionista.", "temperature": 0.5}', 'verified');

    -- 8. Kael
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'kael@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Kael', 25, 'Atleta de crossfit e entusiasta de nutrição.', 'Homem', ARRAY['Mulher'], 'Fortaleza', -3.7172, -38.5433, 185, '90kg', 'Preto', 'Preto', 'Negra', ARRAY['Fitness', 'Esportes'], 'Superior Completo', 'Personal Trainer', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Kael é energético e motivador.", "temperature": 0.7}', 'verified');

    -- 9. Iris
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'iris@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Iris', 33, 'Astrônoma amadora. Olhando para as estrelas desde 1990.', 'Mulher', ARRAY['Homem', 'Mulher'], 'Brasília', -15.7942, -47.8822, 163, '55kg', 'Grisalho', 'Azul', 'Branca', ARRAY['Ciência', 'Estrelas'], 'Mestrado', 'Astrofísica', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Iris é profunda e existencialista.", "temperature": 0.8}', 'verified');

    -- 10. Theo
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'theo@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Theo', 27, 'Escritor de ficção científica e fã de Blade Runner.', 'Homem', ARRAY['Mulher', 'Não-binário'], 'Recife', -8.0476, -34.8770, 180, '78kg', 'Castanho', 'Castanho', 'Branca', ARRAY['Cinema', 'Livros'], 'Superior Completo', 'Escritor', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Theo é reflexivo e ama SCIFI.", "temperature": 0.7}', 'verified');

    -- 11. Luna Estrela
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'luna_est@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Luna Estrela', 21, 'Taróloga e entusiasta da astrologia. O que os astros dizem hoje?', 'Mulher', ARRAY['Homem', 'Não-binário'], 'Vitória', -20.3155, -40.3128, 158, '50kg', 'Loiro', 'Mel', 'Parda', ARRAY['Astrologia', 'Misticismo'], 'Ensino Médio', 'Taróloga', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Luna fala sobre signos e energia.", "temperature": 0.9}', 'verified');

    -- 12. Bruno Fit
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'bruno@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Bruno Fit', 35, 'Personal trainer focado em longevidade.', 'Homem', ARRAY['Mulher'], 'Manaus', -3.1190, -60.0217, 188, '95kg', 'Preto', 'Preto', 'Parda', ARRAY['Academia', 'Saúde'], 'Superior Completo', 'Coach Fitness', 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Bruno é motivador e focado.", "temperature": 0.6}', 'verified');

    -- 13. Clara Dev
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'clara@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Clara Dev', 23, 'Fullstack developer apaixonada por Rust e café.', 'Mulher', ARRAY['Homem', 'Mulher', 'Não-binário'], 'São Paulo', -23.5611, -46.6559, 167, '56kg', 'Ruivo', 'Verde', 'Branca', ARRAY['Código', 'Café'], 'Superior Completo', 'Software Engineer', 'https://images.unsplash.com/photo-1517070208541-6ddc4d3efbcb?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Clara é lógica e sarcástica.", "temperature": 0.7}', 'verified');

    -- 14. Hugo Trek
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'hugo@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Hugo Trek', 40, 'Montanhista e fotógrafo de natureza.', 'Homem', ARRAY['Mulher'], 'Gramado', -29.3746, -50.8764, 184, '85kg', 'Grisalho', 'Castanho', 'Branca', ARRAY['Trilhas', 'Fotos'], 'Pós-Graduação', 'Fotógrafo', 'https://images.unsplash.com/photo-1488161628813-244a2ceba245?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Hugo é calmo e conta histórias.", "temperature": 0.6}', 'verified');

    -- 15. Bibi Trend
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'bibi@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Bibi Trend', 19, 'Tiktoker e antenada em todas as trends de moda.', 'Mulher', ARRAY['Homem', 'Não-binário'], 'Goiânia', -16.6869, -49.2648, 162, '53kg', 'Loiro', 'Azul', 'Branca', ARRAY['Moda', 'TikTok'], 'Ensino Médio', 'Influenciadora', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Bibi usa gírias de trend.", "temperature": 0.9}', 'verified');

    -- 16. Dr. Jonas
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'jonas@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Dr. Jonas', 45, 'Historiador especializado em civilizações antigas.', 'Homem', ARRAY['Mulher'], 'Campinas', -22.9099, -47.0626, 175, '80kg', 'Castanho', 'Castanho', 'Branca', ARRAY['História', 'Viagens'], 'Doutorado', 'Professor', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Jonas é formal e erudito.", "temperature": 0.5}', 'verified');

    -- 17. Nina Pet
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'nina@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Nina Pet', 27, 'Adestradora de cães e defensora dos animais.', 'Mulher', ARRAY['Homem', 'Mulher'], 'Santos', -23.9608, -46.3339, 166, '59kg', 'Preto', 'Preto', 'Parda', ARRAY['Animais', 'Praia'], 'Superior Completo', 'Adestradora', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Nina é empática e doce.", "temperature": 0.7}', 'verified');

    -- 18. Rafa Skate
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'rafa@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Rafa Skate', 18, 'Street skate e arte urbana. Viva a rua.', 'Homem', ARRAY['Mulher', 'Não-binário'], 'São Paulo', -23.5844, -46.6777, 177, '68kg', 'Preto', 'Preto', 'Parda', ARRAY['Skate', 'Arte'], 'Ensino Médio', 'Skatista', 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Rafa é autêntico e rebelde.", "temperature": 0.8}', 'verified');

    -- 19. Lara Zen
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'lara@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Lara Zen', 30, 'Instrutora de yoga e meditação guiada.', 'Mulher', ARRAY['Homem'], 'Ribeirão Preto', -21.1704, -47.8103, 169, '58kg', 'Castanho', 'Castanho', 'Branca', ARRAY['Yoga', 'Paz'], 'Superior Completo', 'Instrutora Yoga', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Lara transmite paz.", "temperature": 0.6}', 'verified');

    -- 20. Vico
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000000', 'vico@desvio.com', crypt(v_pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated', '');
    INSERT INTO public.users (id, name, age, bio, gender, search_for, city, latitude, longitude, height, weight, hair_color, eyes_color, skin_color, lifestyle, education, occupation, profile_image_url, profile_score, is_human, ai_config, verification_status)
    VALUES (v_user_id, 'Vico', 22, 'Poeta de slam e ativista cultural.', 'Não-binário', ARRAY['Homem', 'Mulher', 'Não-binário'], 'Olinda', -8.0144, -34.8516, 174, '64kg', 'Preto', 'Preto', 'Negra', ARRAY['Poesia', 'Cultura'], 'Superior Incompleto', 'Poeta', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=500', 100, FALSE, '{"model": "gemini-1.5-flash", "personality": "Vico é apaixonado e rima.", "temperature": 0.9}', 'verified');

END $$;
