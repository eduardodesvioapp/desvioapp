-- Seed Auth Users for Desvio Mocks
-- Run this in the Supabase SQL Editor to create the authentication accounts
-- Password for all: Desv@6939

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cleanup
DELETE FROM auth.users WHERE email IN (
    'elena@desvio.com', 
    'marcus@desvio.com', 
    'sienna@desvio.com', 
    'julian@desvio.com'
);

-- 1. Elena
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES (
    'e1e1e1e1-e1e1-41e1-81e1-e1e1e1e1e1e1', 
    'elena@desvio.com', 
    crypt('Desv@6939', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"name":"Elena"}', 
    'authenticated', 
    'authenticated'
);

-- 2. Marcus
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES (
    'a2a2a2a2-a2a2-42a2-82a2-a2a2a2a2a2a2', 
    'marcus@desvio.com', 
    crypt('Desv@6939', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"name":"Marcus"}', 
    'authenticated', 
    'authenticated'
);

-- 3. Sienna
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES (
    'b3b3b3b3-b3b3-43b3-83b3-b3b3b3b3b3b3', 
    'sienna@desvio.com', 
    crypt('Desv@6939', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"name":"Sienna"}', 
    'authenticated', 
    'authenticated'
);

-- 4. Julian
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES (
    'c4c4c4c4-c4c4-44c4-84c4-c4c4c4c4c4c4', 
    'julian@desvio.com', 
    crypt('Desv@6939', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"name":"Julian"}', 
    'authenticated', 
    'authenticated'
);
