import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { logUserActivity } from '../utils/activityLogger';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set((state) => {
    const authUser = session?.user || null;

    if (!authUser) {
      return { session: null, user: null };
    }

    const isSameUser = state.user?.id === authUser.id;

    return {
      session,
      user: isSameUser ? { ...authUser, ...state.user } : authUser
    };
  }),
  setLoading: (loading) => set({ loading }),

  // Carrega dados do perfil da tabela `users` e mescla no objeto `user` do store
  fetchUserProfile: async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('users')
      .select('id, name, bio, age, city, gender, profile_score, profile_image_url, hair_color, eyes_color, height, lifestyle, search_for, last_active')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      set((state) => ({
        user: { ...state.user, ...data }
      }));
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session) {
      set({ session: data.session, user: data.session.user });
      await get().fetchUserProfile(data.session.user.id);
      
      // Log de atividade já é tratado pelo onAuthStateChange (evento SIGNED_IN)
    }
    set({ loading: false });
    return { data, error };
  },

  signUp: async (email, password, metadata = {}) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    set({ loading: false });
    return { data, error };
  },

  createUserProfile: async (userId, profileData) => {
    const { error } = await supabase.from('users').insert({ id: userId, ...profileData });
    if (!error) await get().fetchUserProfile(userId);
    return { error };
  },

  signInWithGoogle: async (redirectTo) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) set({ loading: false });
    return { data, error };
  },

  resetPassword: async (email, redirectTo) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { data, error };
  },

  signOut: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    if (!error) set({ user: null, session: null });
    set({ loading: false });
    return { error };
  },

  getProfileProgress: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('profile_score')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return 0;
    return data.profile_score || 0;
  },
}));
