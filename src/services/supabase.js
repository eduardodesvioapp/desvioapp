import { createClient } from '@supabase/supabase-js'

const env = (typeof window !== 'undefined' && window.__ENV) || {}
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')
