-- Esegui questo script nella SQL Editor del progetto Supabase (Dashboard → SQL Editor)
-- Crea le tabelle per l'app Acquario

-- Pesci dell'acquario
CREATE TABLE IF NOT EXISTS public.fish (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_data TEXT NOT NULL,
  likes INT NOT NULL DEFAULT 0,
  dislikes INT NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL,
  swim_duration REAL NOT NULL,
  swim_delay REAL NOT NULL,
  bob_delay REAL NOT NULL,
  y_position REAL NOT NULL
);

-- Configurazione app (es. fine countdown stagione)
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Permessi: lettura/scrittura pubblica (anon key) per demo; in produzione usa RLS
ALTER TABLE public.fish ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fish_select" ON public.fish FOR SELECT USING (true);
CREATE POLICY "fish_insert" ON public.fish FOR INSERT WITH CHECK (true);
CREATE POLICY "fish_update" ON public.fish FOR UPDATE USING (true);
CREATE POLICY "fish_delete" ON public.fish FOR DELETE USING (true);

CREATE POLICY "app_config_select" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "app_config_insert" ON public.app_config FOR INSERT WITH CHECK (true);
CREATE POLICY "app_config_update" ON public.app_config FOR UPDATE USING (true);
