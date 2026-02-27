import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY non impostati. Imposta le variabili d'ambiente (es. .env) per usare Supabase."
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as ReturnType<typeof createClient> | null);

export const isSupabaseConfigured = (): boolean => !!supabase;
