import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.error('⚠️ ATENCIÓN: Faltan las variables de entorno de Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY). La aplicación funcionará visualmente pero no guardará datos.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
