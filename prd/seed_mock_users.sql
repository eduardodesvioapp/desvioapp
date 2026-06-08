-- Updated Seed Mock Users for Desvio
-- Now including profile_image_url for instant header and search visibility

DELETE FROM user_media WHERE user_id IN (SELECT id FROM users WHERE name IN ('Elena', 'Marcus', 'Sienna', 'Julian'));
DELETE FROM users WHERE name IN ('Elena', 'Marcus', 'Sienna', 'Julian');

-- 1. Elena (Architect)
INSERT INTO users (id, name, age, city, gender, bio, profile_score, latitude, longitude, height, hair_color, eyes_color, lifestyle, education, occupation, last_active, profile_image_url)
VALUES (
    'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
    'Elena',
    26,
    'São Paulo',
    'Mulher',
    'Arquiteta apaixonada por design minimalista.',
    100,
    -23.5505,
    -46.6333,
    168,
    'Ruivo',
    'Verde',
    ARRAY['Social Drinker', 'Exercícios diários'],
    'Superior ou mais',
    'Arquiteta',
    now(),
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop'
);

-- 2. Marcus (Creative Director)
INSERT INTO users (id, name, age, city, gender, bio, profile_score, latitude, longitude, height, hair_color, eyes_color, lifestyle, education, occupation, last_active, profile_image_url)
VALUES (
    'm2m2m2m2-m2m2-m2m2-m2m2-m2m2m2m2m2m2',
    'Marcus',
    32,
    'São Paulo',
    'Homem',
    'Diretor Criativo. Curto arte contemporânea e jazz.',
    100,
    -23.5614,
    -46.6559,
    182,
    'Castanho',
    'Castanho',
    ARRAY['Social Drinker'],
    'Superior ou mais',
    'Diretor Criativo',
    now(),
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop'
);

-- 3. Sienna (Visual Artist)
INSERT INTO users (id, name, age, city, gender, bio, profile_score, latitude, longitude, height, hair_color, eyes_color, lifestyle, education, occupation, last_active, profile_image_url)
VALUES (
    's3s3s3s3-s3s3-s3s3-s3s3-s3s3s3s3s3s3',
    'Sienna',
    24,
    'São Paulo',
    'Mulher',
    'Artista Visual. Vejo beleza no caos.',
    100,
    -23.5700,
    -46.6400,
    162,
    'Loiro',
    'Azul',
    ARRAY['Exercícios diários'],
    'Superior ou mais',
    'Artista Visual',
    now(),
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&auto=format&fit=crop'
);

-- 4. Julian (Product Lead)
INSERT INTO users (id, name, age, city, gender, bio, profile_score, latitude, longitude, height, hair_color, eyes_color, lifestyle, education, occupation, last_active, profile_image_url)
VALUES (
    'j4j4j4j4-j4j4-j4j4-j4j4-j4j4j4j4j4j4',
    'Julian',
    29,
    'São Paulo',
    'Homem',
    'Gerente de Produto. Equilíbrio entre lógica e aventura.',
    100,
    -23.5800,
    -46.6200,
    178,
    'Preto',
    'Preto',
    ARRAY['Não fumante'],
    'Superior ou mais',
    'Gerente de Produto',
    now(),
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop'
);

-- Inserir também na galeria para consistência
INSERT INTO user_media (user_id, url, is_profile, is_private)
SELECT id, profile_image_url, true, false FROM users WHERE name IN ('Elena', 'Marcus', 'Sienna', 'Julian');
