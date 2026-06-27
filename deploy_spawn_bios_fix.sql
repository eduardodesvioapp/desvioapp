-- Deploy: spawn_synthetic_user com bios variadas
-- Execute no Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION public.spawn_synthetic_user(p_filters JSONB)
RETURNS UUID AS $$
DECLARE
  v_new_id UUID := gen_random_uuid();
  v_name TEXT;
  v_age INT;
  v_gender TEXT;
  v_city TEXT;
  v_lat NUMERIC;
  v_lng NUMERIC;
  v_bio TEXT;
  v_avatar TEXT;
  v_personality TEXT;
  v_dist FLOAT;
  v_angle FLOAT;
  v_height INT;
  v_eyes TEXT;
  v_hair TEXT;
  v_skin TEXT;
  v_weight TEXT;
  v_max_dist FLOAT;
  v_img_idx INT;
  v_hair_en TEXT;
  v_skin_en TEXT;
  v_weight_en TEXT;
  v_gender_en TEXT;
  v_img_url TEXT;
  v_storage_path TEXT;
  v_s_url TEXT;
  v_s_key TEXT;
  v_resp extensions.http_response;
BEGIN
  DELETE FROM public.users WHERE is_human = FALSE AND city = COALESCE(p_filters->>'city', 'São Paulo');

  v_gender := COALESCE(p_filters->>'gender', 'Mulher');
  IF v_gender = 'all' THEN v_gender := (ARRAY['Mulher', 'Homem'])[floor(random() * 2 + 1)]; END IF;

  v_age := floor(random() * (COALESCE((p_filters->>'maxAge')::int, 40) - COALESCE((p_filters->>'minAge')::int, 18) + 1) + COALESCE((p_filters->>'minAge')::int, 18));
  v_city := COALESCE(p_filters->>'city', 'São Paulo');
  v_lat := (p_filters->>'latitude')::numeric;
  v_lng := (p_filters->>'longitude')::numeric;
  v_max_dist := COALESCE((p_filters->>'maxDistance')::float, 50);

  IF v_lat IS NULL OR v_lng IS NULL THEN
    SELECT latitude, longitude INTO v_lat, v_lng FROM public.users WHERE id = auth.uid();
  END IF;
  IF v_lat IS NULL THEN v_lat := -30.0346; v_lng := -51.2177; END IF;

  v_dist := (random() * (v_max_dist - 2) + 2);
  v_angle := random() * 2 * 3.14159;
  v_lat := v_lat + (v_dist / 111.32) * cos(v_angle);
  v_lng := v_lng + (v_dist / (111.32 * cos(radians(v_lat)))) * sin(v_angle);

  v_height := floor(random() * (COALESCE((p_filters->>'maxHeight')::int, 200) - COALESCE((p_filters->>'minHeight')::int, 150) + 1) + COALESCE((p_filters->>'minHeight')::int, 150));

  IF p_filters ? 'eyes' AND jsonb_array_length(p_filters->'eyes') > 0 THEN
    v_eyes := (p_filters->'eyes')->>(floor(random() * jsonb_array_length(p_filters->'eyes')))::int;
  ELSE
    v_eyes := (ARRAY['Castanho', 'Azul', 'Verde', 'Preto', 'Mel'])[floor(random() * 5 + 1)];
  END IF;

  IF p_filters ? 'hair' AND jsonb_array_length(p_filters->'hair') > 0 THEN
    v_hair := (p_filters->'hair')->>(floor(random() * jsonb_array_length(p_filters->'hair')))::int;
  ELSE
    v_hair := (ARRAY['Preto', 'Castanho', 'Loiro', 'Ruivo', 'Colorido', 'Grisalho'])[floor(random() * 6 + 1)];
  END IF;

  IF p_filters ? 'skinColors' AND jsonb_array_length(p_filters->'skinColors') > 0 THEN
    v_skin := (p_filters->'skinColors')->>(floor(random() * jsonb_array_length(p_filters->'skinColors')))::int;
  ELSE
    v_skin := (ARRAY['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena'])[floor(random() * 5 + 1)];
  END IF;

  IF p_filters ? 'weights' AND jsonb_array_length(p_filters->'weights') > 0 THEN
    v_weight := (p_filters->'weights')->>(floor(random() * jsonb_array_length(p_filters->'weights')))::int;
  ELSE
    v_weight := (ARRAY['Magro(a)', 'Normal', 'Gordo(a)'])[floor(random() * 3 + 1)];
  END IF;

  IF v_gender = 'Mulher' THEN
    v_name := (ARRAY['Valentina', 'Isadora', 'Sophia', 'Beatriz', 'Camila', 'Heloísa', 'Manuela', 'Laura', 'Alice', 'Lorena'])[floor(random() * 10 + 1)];
  ELSE
    v_name := (ARRAY['Enzo', 'Lorenzo', 'Gabriel', 'Lucas', 'Matheus', 'Thiago', 'Bruno', 'Rafael', 'Daniel', 'André'])[floor(random() * 10 + 1)];
  END IF;

  -- Bio: prompt melhorado + fallback variado por gênero
  v_personality := 'Você é ' || COALESCE(v_name, 'Alguém') || ', ' || COALESCE(v_age::text, '18') || ' anos, ' || COALESCE(v_gender, 'alguém') || '. Atributos: ' || COALESCE(v_eyes, 'Escuros') || ', ' || COALESCE(v_hair, 'Escuro') || ', ' || COALESCE(v_skin, 'Parda') || '. Escreva UMA bio curta (max 80 caracteres) em português para um app de encontros. Foque em paixões, hobbies e o que gosta de fazer. Seja natural e atraente. NUNCA repita a mesma ideia. Varie entre: esportes, culinária, viagens, música, arte, natureza, leitura, tecnologia, café, vinho, pets, fotografia, dança, yoga.';

  BEGIN
    v_bio := public.call_gemini('Crie minha bio.', v_personality);
  EXCEPTION WHEN OTHERS THEN
    v_bio := NULL;
  END;
  IF v_bio IS NULL OR v_bio LIKE 'Erro%' THEN
    IF v_gender = 'Mulher' THEN
      v_bio := (ARRAY[
        'Amante de café e trilhas na natureza.',
        'Curto um bom vinho e conversas profundas.',
        'Dançar faz minha alma brilhar!',
        'Fotógrafa nas horas vagas, explorando cores.',
        'Viciada em séries e maratonas de cinema.',
        'Cozinhar é minha terapia favorita.',
        'Yoga e meditação são minha paz.',
        'Viajar é minha maior paixão.',
        'Arte e cultura me fascinam.',
        'Simplicidade e autenticidade acima de tudo.'
      ])[floor(random() * 10 + 1)];
    ELSE
      v_bio := (ARRAY[
        'Desenvolvedor durante o dia, gamer à noite.',
        'Esporte é vida! Procuro alguém pra treinar.',
        'Música e tecnologia são meu mundo.',
        'Apaixonado por café e boa conversa.',
        'Explorando o mundo, um café por vez.',
        'Curto rock, trilhas e cerveja artesanal.',
        'Fotógrafo nas horas vagas.',
        'Leitor ávido e sonhador contumaz.',
        'Gamer, nerd e orgulhoso disso.',
        'Simplicidade e transparência sempre.'
      ])[floor(random() * 10 + 1)];
    END IF;
  END IF;

  v_hair_en := CASE v_hair WHEN 'Loiro' THEN 'blonde' WHEN 'Preto' THEN 'black' WHEN 'Castanho' THEN 'brown' WHEN 'Ruivo' THEN 'redhead' WHEN 'Grisalho' THEN 'grey' ELSE 'natural' END;
  v_skin_en := CASE v_skin WHEN 'Preta' THEN 'black' WHEN 'Branca' THEN 'white' WHEN 'Parda' THEN 'latino' WHEN 'Amarela' THEN 'asian' WHEN 'Indígena' THEN 'native' ELSE 'natural' END;
  v_weight_en := CASE v_weight WHEN 'Gordo(a)' THEN 'plus-size' WHEN 'Magro(a)' THEN 'thin' ELSE 'average' END;
  v_gender_en := CASE v_gender WHEN 'Mulher' THEN 'women' ELSE 'men' END;

  -- URL fonte com índice único (evita colisão de imagem entre perfis IA)
  v_img_idx := floor(random() * 100);
  WHILE EXISTS (
    SELECT 1 FROM public.users
    WHERE is_human = FALSE
      AND profile_image_url LIKE '%' || v_gender_en || '/' || v_img_idx || '.jpg'
  ) LOOP
    v_img_idx := floor(random() * 100);
  END LOOP;
  v_img_url := 'https://randomuser.me/api/portraits/' || v_gender_en || '/' || v_img_idx || '.jpg';
  v_storage_path := v_new_id::text || '.jpg';
  SELECT key_value INTO v_s_url FROM public.secrets WHERE key_name = 'SUPABASE_URL';
  SELECT key_value INTO v_s_key FROM public.secrets WHERE key_name = 'SUPABASE_SERVICE_KEY';

  BEGIN
    v_resp := extensions.http_get(v_img_url);
    IF v_resp.status = 200 AND v_resp.content IS NOT NULL AND v_s_url IS NOT NULL THEN
      v_resp := extensions.http((
        'POST',
        v_s_url || '/storage/v1/object/avatars/' || v_storage_path,
        ARRAY[
          extensions.http_header('Authorization', 'Bearer ' || v_s_key),
          extensions.http_header('apikey', v_s_key)
        ],
        'image/jpeg',
        v_resp.content::text
      )::extensions.http_request);

      INSERT INTO public.ai_generation_logs (status_code, response_text, target_url, context)
      VALUES (v_resp.status, LEFT(v_resp.content::text, 200), v_s_url || '/storage/v1/object/avatars/' || v_storage_path, 'Upload Storage (v2)');

      IF v_resp.status BETWEEN 200 AND 299 THEN
        v_avatar := v_s_url || '/storage/v1/object/public/avatars/' || v_storage_path;
      ELSE
        v_avatar := v_img_url;
      END IF;
    ELSE
      v_avatar := v_img_url;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_avatar := v_img_url;
  END;

  INSERT INTO public.users (
    id, name, age, gender, city, latitude, longitude, bio, profile_image_url,
    is_human, profile_score, last_active, height, eyes_color, hair_color, skin_color, weight,
    email, ai_config
  ) VALUES (
    v_new_id, v_name, v_age, v_gender, v_city, v_lat, v_lng, v_bio, v_avatar,
    FALSE, 98, NOW(), v_height, v_eyes, v_hair, v_skin, v_weight,
    v_new_id::text || '@desvio.ai',
    jsonb_build_object(
      'model', 'gemini-1.5-flash',
      'personality', 'Você é ' || v_name || ', ' || v_age || ' anos. ' || v_bio || ' Responda de forma natural, simpática e breve. Use linguagem casual do dia a dia.',
      'temperature', 0.8
    )
  );

  BEGIN
    IF p_filters ? 'interests' AND jsonb_typeof(p_filters->'interests') = 'array' AND jsonb_array_length(p_filters->'interests') > 0 THEN
      INSERT INTO public.user_interests (user_id, interest_id)
      SELECT v_new_id, (id)::uuid FROM jsonb_array_elements_text(p_filters->'interests') AS id
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO public.user_interests (user_id, interest_id)
      SELECT v_new_id, id FROM public.interests ORDER BY random() LIMIT 3;
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
