import { createClient } from '@supabase/supabase-js';

// Usamos las llaves directamente para evitar problemas de variables de entorno en Vercel
// Nota: Estas llaves son PÚBLICAS por diseño en Supabase (Anon Key), así que es seguro tenerlas en el frontend.
const supabaseUrl = 'https://shlcgyyttamvpisnmyrq.supabase.co';
const supabaseAnonKey = 'sb_publishable_7_lqlRs23ZSCkuTDnfbnqA_NtknL-3L';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
