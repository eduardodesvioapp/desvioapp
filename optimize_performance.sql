-- ==========================================
-- 🚀 OTIMIZAÇÃO DE PERFORMANCE - ÍNDICES
-- ==========================================

-- 1. Ímportante para o contador de Likes (fetchCounts)
CREATE INDEX IF NOT EXISTS idx_likes_liked_user_id_read ON public.likes(liked_user_id, is_read);

-- 2. Importante para o contador de Matches (fetchCounts)
CREATE INDEX IF NOT EXISTS idx_matches_user1_id_read ON public.matches(user1_id, is_read);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id_read ON public.matches(user2_id, is_read);

-- 3. Importante para a nova central de Notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, is_read);

-- 4. Importante para Visitantes
CREATE INDEX IF NOT EXISTS idx_profile_visits_visited_id_read ON public.profile_visits(visited_id, is_read);

-- 5. Importante para Mensagens (última atividade)
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id_created ON public.messages(receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_users_id_last_active ON public.users(id, last_active);

-- 6. Analisar as tabelas para atualizar as estatísticas do planejador de busca
ANALYZE public.users;
ANALYZE public.likes;
ANALYZE public.matches;
ANALYZE public.notifications;
ANALYZE public.profile_visits;
ANALYZE public.messages;
